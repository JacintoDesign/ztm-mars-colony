import { supabase } from '../lib/supabase';
import {
  Building,
  BuildingType,
  Colonist,
  ColonyState,
  Rover,
  OreDeposit,
  PendingArrival,
  BatteryCell,
  MiningSite,
  Asteroid,
} from '../simulation/types';
import { applyTicks } from '../simulation/tick';
import { CONTRACT_RULES } from '../simulation/contract-rules';
import { SeededPRNG, generateInitialSeed } from '../simulation/prng';
import { generateOreDistribution } from '../simulation/ore-generator';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface ColonyRecord {
  id: string;
  owner: string;
  oxygen: number;
  power: number;
  food?: number;
  ore: number;
  electronics?: number;
  seed?: number;
  battery_cells?: BatteryCell[];
  mining_sites?: MiningSite[];
  active_asteroid?: Asteroid | null;
  pending_arrivals?: PendingArrival[];
  tick: number;
  last_tick_at: string;
  status: 'active' | 'game_over';
  created_at: string;
  updated_at: string;
}

export interface ColonyData {
  colony: ColonyRecord;
  buildings: Building[];
  colonists: Colonist[];
  rovers: Rover[];
  oreDeposits: OreDeposit[];
  bestSolsSurvived: number;
}

export class ColonyService {
  /**
   * Loads an existing colony for the authenticated user, or creates one if it's the first sign-in.
   * Performs authoritative offline catch-up (capped at 28,800 ticks).
   */
  public async loadOrCreateColony(userId: string): Promise<ColonyData> {
    // 1. Fetch user account profile (best_sols_survived)
    let bestSolsSurvived = 0;
    const { data: userProfile } = await supabase
      .from('marscolony_users')
      .select('best_sols_survived')
      .eq('id', userId)
      .maybeSingle();

    if (userProfile) {
      bestSolsSurvived = userProfile.best_sols_survived ?? 0;
    } else {
      await supabase
        .from('marscolony_users')
        .upsert({ id: userId, best_sols_survived: 0 }, { onConflict: 'id' });
    }

    // 2. Check for existing colony owned by this user
    const { data: existingColonies, error: fetchColonyError } = await supabase
      .from('marscolony_colonies')
      .select('*')
      .eq('owner', userId)
      .limit(1);

    if (fetchColonyError) {
      throw new Error(`Failed to query colony: ${fetchColonyError.message}`);
    }

    let colony: ColonyRecord;
    let isNewColony = false;

    if (existingColonies && existingColonies.length > 0) {
      colony = existingColonies[0] as ColonyRecord;
    } else {
      // First sign-in: generate fresh seed and 500-ore distribution
      const initialSeed = generateInitialSeed();
      const prng = new SeededPRNG(initialSeed);
      const { oreDeposits: generatedDeposits, miningSites: generatedMiningSites } = generateOreDistribution(prng);

      isNewColony = true;
      const { data: newColony, error: createColonyError } = await supabase
        .from('marscolony_colonies')
        .insert({
          owner: userId,
          oxygen: 50,
          power: 50,
          food: 50,
          ore: 0,
          electronics: 0,
          seed: initialSeed,
          battery_cells: [],
          mining_sites: generatedMiningSites,
          active_asteroid: null,
          pending_arrivals: [],
          tick: 0,
          status: 'active',
          last_tick_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createColonyError) {
        const { data: retryColonies } = await supabase
          .from('marscolony_colonies')
          .select('*')
          .eq('owner', userId)
          .limit(1);

        if (retryColonies && retryColonies.length > 0) {
          colony = retryColonies[0] as ColonyRecord;
        } else {
          throw new Error(`Failed to initialize colony: ${createColonyError.message}`);
        }
      } else {
        colony = newColony as ColonyRecord;
      }

      // Insert initial ore deposits
      if (isNewColony && generatedDeposits.length > 0) {
        const depositRows = generatedDeposits.map((d) => ({
          colony_id: colony.id,
          owner: userId,
          x: d.x,
          y: d.y,
          remaining: d.remaining,
        }));
        await supabase.from('marscolony_ore_deposits').insert(depositRows);
      }
    }

    // 3. Load all placed buildings
    const { data: buildingsData } = await supabase
      .from('marscolony_buildings')
      .select('*')
      .eq('colony_id', colony.id)
      .order('created_at', { ascending: true });

    const buildings: Building[] = (buildingsData || []).map((b) => ({
      id: b.id,
      type: b.type as BuildingType,
      x: b.x,
      y: b.y,
      condition: b.condition ?? 'operational',
      repairProgress: b.repair_progress ?? 0,
      digProgress: b.dig_progress ?? 0,
    }));

    // 4. Load colonists
    const { data: colonistsData } = await supabase
      .from('marscolony_colonists')
      .select('*')
      .eq('colony_id', colony.id);

    let colonists: Colonist[] = (colonistsData || []).map((c) => ({
      id: c.id,
      x: c.x,
      y: c.y,
      health: c.health,
      age: c.age ?? 0,
      lifespan: c.lifespan ?? 15000,
      destination: c.destination,
      destinationType: c.destination_type ?? 'habitat',
      targetEntityId: null,
      route: c.route || [],
    }));

    // 5. Load rovers
    const { data: roversData } = await supabase
      .from('marscolony_rovers')
      .select('*')
      .eq('colony_id', colony.id);

    let rovers: Rover[] = (roversData || []).map((r) => ({
      id: r.id,
      garageX: r.garage_x,
      garageY: r.garage_y,
      x: r.x,
      y: r.y,
      state: r.state,
      power: r.power,
      cargo: r.cargo,
      destination: r.destination,
      onSiteTicksRemaining: 0,
      route: r.route || [],
    }));

    // 6. Load ore deposits
    const { data: depositsData } = await supabase
      .from('marscolony_ore_deposits')
      .select('*')
      .eq('colony_id', colony.id);

    let oreDeposits: OreDeposit[] = (depositsData || []).map((d) => ({
      id: d.id,
      x: d.x,
      y: d.y,
      remaining: d.remaining,
    }));

    // If existing colony had no ore deposits generated yet, generate them now
    if (oreDeposits.length === 0) {
      const seed = colony.seed ?? generateInitialSeed();
      const prng = new SeededPRNG(seed);
      const generated = generateOreDistribution(prng);
      oreDeposits = generated.oreDeposits;
      colony.mining_sites = generated.miningSites;
      colony.seed = seed;
    }

    // 7. Authoritative Catch-up computation on load
    if (colony.status === 'active' && colony.last_tick_at) {
      const lastTickTime = new Date(colony.last_tick_at).getTime();
      const now = Date.now();
      const elapsedSeconds = Math.max(0, Math.floor((now - lastTickTime) / 1000));
      const ticksToApply = Math.min(elapsedSeconds, CONTRACT_RULES.maxCatchUpTicks);

      if (ticksToApply > 0) {
        const initialState: ColonyState = {
          colonyId: colony.id,
          tick: colony.tick,
          oxygen: colony.oxygen,
          power: colony.power,
          food: colony.food ?? 50,
          ore: colony.ore,
          electronics: colony.electronics ?? 0,
          seed: colony.seed ?? 133742,
          oreDeposits,
          buildings,
          colonists,
          pendingArrivals: colony.pending_arrivals ?? [],
          rovers,
          batteryCells: colony.battery_cells ?? [],
          miningSites: colony.mining_sites ?? [],
          activeAsteroid: colony.active_asteroid ?? null,
          signedInAccount: userId,
          colonyOwner: userId,
          status: colony.status,
          bestSolsSurvived,
          lastAppliedTick: colony.last_tick_at,
        };

        const caughtUpState = applyTicks(initialState, ticksToApply);

        // Update local records
        colony.oxygen = caughtUpState.oxygen;
        colony.power = caughtUpState.power;
        colony.food = caughtUpState.food;
        colony.ore = caughtUpState.ore;
        colony.electronics = caughtUpState.electronics;
        colony.seed = caughtUpState.seed;
        colony.battery_cells = caughtUpState.batteryCells;
        colony.pending_arrivals = caughtUpState.pendingArrivals;
        colony.active_asteroid = caughtUpState.activeAsteroid;
        colony.tick = caughtUpState.tick;
        colony.status = caughtUpState.status;
        colony.last_tick_at = new Date().toISOString();
        colonists = caughtUpState.colonists;
        rovers = caughtUpState.rovers;
        oreDeposits = caughtUpState.oreDeposits;
        bestSolsSurvived = caughtUpState.bestSolsSurvived;

        await this.syncColonyState(caughtUpState, userId);
      }
    }

    return {
      colony,
      buildings,
      colonists,
      rovers,
      oreDeposits,
      bestSolsSurvived,
    };
  }

  /**
   * Persists a placed building to the database.
   */
  public async placeBuilding(
    colonyId: string,
    userId: string,
    buildingType: BuildingType,
    x: number,
    y: number,
    _cost: { power: number; ore: number },
    currentColonyState: ColonyState
  ): Promise<Building> {
    const { data: buildingRecord, error: insertError } = await supabase
      .from('marscolony_buildings')
      .insert({
        colony_id: colonyId,
        owner: userId,
        type: buildingType,
        x,
        y,
        condition: 'operational',
        repair_progress: 0,
        dig_progress: 0,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to place building: ${insertError.message}`);
    }

    // If placed garage, insert 2 rovers
    if (buildingType === 'garage') {
      const roverRows = [
        {
          colony_id: colonyId,
          owner: userId,
          garage_x: x,
          garage_y: y,
          x,
          y,
          state: 'idle_at_base',
          power: 100,
          cargo: null,
          destination: null,
          route: [],
        },
        {
          colony_id: colonyId,
          owner: userId,
          garage_x: x,
          garage_y: y,
          x,
          y,
          state: 'idle_at_base',
          power: 100,
          cargo: null,
          destination: null,
          route: [],
        },
      ];
      await supabase.from('marscolony_rovers').insert(roverRows);
    }

    // Deduct cost and update colony
    await supabase
      .from('marscolony_colonies')
      .update({
        power: Math.max(0, currentColonyState.power),
        ore: Math.max(0, currentColonyState.ore),
        last_tick_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', colonyId)
      .eq('owner', userId);

    return {
      id: buildingRecord.id,
      type: buildingRecord.type as BuildingType,
      x: buildingRecord.x,
      y: buildingRecord.y,
      condition: 'operational',
      repairProgress: 0,
      digProgress: 0,
    };
  }

  /**
   * Synchronizes authoritative simulation state to Supabase.
   */
  public async syncColonyState(state: ColonyState, userId: string): Promise<void> {
    if (!state.colonyId) return;

    // 1. Update colony table
    await supabase
      .from('marscolony_colonies')
      .update({
        oxygen: state.oxygen,
        power: state.power,
        food: state.food,
        ore: state.ore,
        electronics: state.electronics,
        seed: state.seed,
        battery_cells: state.batteryCells,
        mining_sites: state.miningSites,
        active_asteroid: state.activeAsteroid,
        pending_arrivals: state.pendingArrivals,
        tick: state.tick,
        status: state.status,
        last_tick_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', state.colonyId)
      .eq('owner', userId);

    // 2. Sync buildings conditions
    for (const b of state.buildings) {
      if (b.id && !b.id.startsWith('bld-')) {
        await supabase
          .from('marscolony_buildings')
          .update({
            condition: b.condition,
            repair_progress: b.repairProgress,
            dig_progress: b.digProgress,
          })
          .eq('id', b.id);
      }
    }

    // 3. Sync colonists in database
    await supabase
      .from('marscolony_colonists')
      .delete()
      .eq('colony_id', state.colonyId);

    if (state.colonists.length > 0) {
      const rows = state.colonists.map((c) => ({
        colony_id: state.colonyId,
        owner: userId,
        x: c.x,
        y: c.y,
        health: c.health,
        age: c.age,
        lifespan: c.lifespan,
        destination: c.destination,
        destination_type: c.destinationType,
        route: c.route || [],
      }));

      await supabase.from('marscolony_colonists').insert(rows);
    }

    // 4. Sync rovers in database
    await supabase
      .from('marscolony_rovers')
      .delete()
      .eq('colony_id', state.colonyId);

    if (state.rovers.length > 0) {
      const roverRows = state.rovers.map((r) => ({
        colony_id: state.colonyId,
        owner: userId,
        garage_x: r.garageX,
        garage_y: r.garageY,
        x: r.x,
        y: r.y,
        state: r.state,
        power: r.power,
        cargo: r.cargo,
        destination: r.destination,
        route: r.route || [],
      }));
      await supabase.from('marscolony_rovers').insert(roverRows);
    }

    // 5. Update best_sols_survived on game over
    if (state.status === 'game_over') {
      const solsSurvived = Math.floor(state.tick / 1000);
      const { data: userRow } = await supabase
        .from('marscolony_users')
        .select('best_sols_survived')
        .eq('id', userId)
        .maybeSingle();

      const currentBest = userRow?.best_sols_survived ?? 0;
      if (solsSurvived > currentBest) {
        await supabase
          .from('marscolony_users')
          .update({ best_sols_survived: solsSurvived })
          .eq('id', userId);
      }
    }
  }

  /**
   * Restarts a colony from game_over state.
   */
  public async restartColony(colonyId: string, userId: string): Promise<void> {
    const initialSeed = generateInitialSeed();
    const prng = new SeededPRNG(initialSeed);
    const { oreDeposits, miningSites } = generateOreDistribution(prng);

    await supabase.from('marscolony_buildings').delete().eq('colony_id', colonyId);
    await supabase.from('marscolony_colonists').delete().eq('colony_id', colonyId);
    await supabase.from('marscolony_rovers').delete().eq('colony_id', colonyId);
    await supabase.from('marscolony_ore_deposits').delete().eq('colony_id', colonyId);

    // Insert new ore deposits
    const depositRows = oreDeposits.map((d) => ({
      colony_id: colonyId,
      owner: userId,
      x: d.x,
      y: d.y,
      remaining: d.remaining,
    }));
    await supabase.from('marscolony_ore_deposits').insert(depositRows);

    // Reset colony row
    await supabase
      .from('marscolony_colonies')
      .update({
        oxygen: 50,
        power: 50,
        food: 50,
        ore: 0,
        electronics: 0,
        seed: initialSeed,
        battery_cells: [],
        mining_sites: miningSites,
        active_asteroid: null,
        pending_arrivals: [],
        tick: 0,
        status: 'active',
        last_tick_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', colonyId)
      .eq('owner', userId);
  }

  public subscribeToColony(colonyId: string, onUpdate: (payload: any) => void): RealtimeChannel {
    return supabase
      .channel(`colony-${colonyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'marscolony_colonies',
          filter: `id=eq.${colonyId}`,
        },
        (payload) => {
          onUpdate(payload);
        }
      )
      .subscribe();
  }
}

export const colonyService = new ColonyService();
