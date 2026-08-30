import { supabase } from '../lib/supabase';
import { Building, BuildingType, Colonist, ColonyState } from '../simulation/types';
import { applyTicks } from '../simulation/tick';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface ColonyRecord {
  id: string;
  owner: string;
  oxygen: number;
  power: number;
  ore: number;
  ore_reserve: number;
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
  bestSolsSurvived: number;
}

export class ColonyService {
  /**
   * Loads an existing colony for the authenticated user, or creates one if it's the first sign-in.
   * Performs authoritative offline catch-up (capped at 10,000 ticks).
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
      // Upsert profile if missing
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

    if (existingColonies && existingColonies.length > 0) {
      colony = existingColonies[0] as ColonyRecord;
    } else {
      // First sign-in: create exactly one fresh colony with starting contract values
      const { data: newColony, error: createColonyError } = await supabase
        .from('marscolony_colonies')
        .insert({
          owner: userId,
          oxygen: 50,
          power: 50,
          ore: 0,
          ore_reserve: 500,
          tick: 0,
          status: 'active',
          last_tick_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createColonyError) {
        // Fallback in case of race condition
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
      destination: c.destination,
      route: c.route || [],
    }));

    // 5. Authoritative Catch-up computation on load
    if (colony.status === 'active' && colony.last_tick_at) {
      const lastTickTime = new Date(colony.last_tick_at).getTime();
      const now = Date.now();
      const elapsedSeconds = Math.max(0, Math.floor((now - lastTickTime) / 1000));
      const ticksToApply = Math.min(elapsedSeconds, 10000); // Cap at 10,000 ticks

      if (ticksToApply > 0) {
        const initialState: ColonyState = {
          colonyId: colony.id,
          tick: colony.tick,
          oxygen: colony.oxygen,
          power: colony.power,
          ore: colony.ore,
          oreReserve: colony.ore_reserve,
          signedInAccount: userId,
          colonyOwner: userId,
          buildings,
          colonists,
          status: colony.status,
          bestSolsSurvived,
          lastAppliedTick: colony.last_tick_at,
        };

        const caughtUpState = applyTicks(initialState, ticksToApply);

        // Update local object references
        colony.oxygen = caughtUpState.oxygen;
        colony.power = caughtUpState.power;
        colony.ore = caughtUpState.ore;
        colony.ore_reserve = caughtUpState.oreReserve;
        colony.tick = caughtUpState.tick;
        colony.status = caughtUpState.status;
        colony.last_tick_at = new Date().toISOString();
        colonists = caughtUpState.colonists;
        bestSolsSurvived = caughtUpState.bestSolsSurvived;

        // Persist authoritative catch-up result
        await this.syncColonyState(caughtUpState, userId);
      }
    }

    return {
      colony,
      buildings,
      colonists,
      bestSolsSurvived,
    };
  }

  /**
   * Persists a placed building to the database and deducts resource costs.
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
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to place building: ${insertError.message}`);
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
        ore: state.ore,
        ore_reserve: state.oreReserve,
        tick: state.tick,
        status: state.status,
        last_tick_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', state.colonyId)
      .eq('owner', userId);

    // 2. Sync colonists
    // Delete colonists no longer living
    const currentColonistIds = state.colonists.map((c) => c.id);
    if (currentColonistIds.length === 0) {
      await supabase
        .from('marscolony_colonists')
        .delete()
        .eq('colony_id', state.colonyId);
    } else {
      // Upsert living colonists
      for (const colonist of state.colonists) {
        await supabase
          .from('marscolony_colonists')
          .upsert({
            id: colonist.id.startsWith('col-') ? undefined : colonist.id,
            colony_id: state.colonyId,
            owner: userId,
            x: colonist.x,
            y: colonist.y,
            health: colonist.health,
            destination: colonist.destination,
            route: colonist.route,
          });
      }
    }

    // 3. If game_over occurred, update best_sols_survived if beaten
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
   * Resets oxygen (50), power (50), ore (0), reserve (500), clears buildings and colonists.
   * best_sols_survived is untouched.
   */
  public async restartColony(colonyId: string, userId: string): Promise<void> {
    // 1. Delete all placed buildings for this colony
    await supabase
      .from('marscolony_buildings')
      .delete()
      .eq('colony_id', colonyId)
      .eq('owner', userId);

    // 2. Delete all colonists
    await supabase
      .from('marscolony_colonists')
      .delete()
      .eq('colony_id', colonyId)
      .eq('owner', userId);

    // 3. Reset colony row to starting values
    const { error: resetColonyError } = await supabase
      .from('marscolony_colonies')
      .update({
        oxygen: 50,
        power: 50,
        ore: 0,
        ore_reserve: 500,
        tick: 0,
        status: 'active',
        last_tick_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', colonyId)
      .eq('owner', userId);

    if (resetColonyError) {
      throw new Error(`Failed to reset colony: ${resetColonyError.message}`);
    }
  }

  /**
   * Subscribes to realtime updates on this colony so multiple tabs stay in sync.
   */
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
