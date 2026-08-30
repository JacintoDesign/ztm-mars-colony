import { supabase } from '../lib/supabase';
import { Building, BuildingType } from '../simulation/types';

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
}

export class ColonyService {
  /**
   * Loads an existing colony for the authenticated user, or creates one if it's the first sign-in.
   * Per CONTRACT.md: A new colony starts with oxygen 50, power 50, ore 0, oreReserve 500, no buildings.
   * Never creates a second colony and never resets an existing one.
   */
  public async loadOrCreateColony(userId: string): Promise<ColonyData> {
    // 1. Ensure user row exists in marscolony_users
    const { error: userUpsertError } = await supabase
      .from('marscolony_users')
      .upsert({ id: userId, best_sols_survived: 0 }, { onConflict: 'id' });

    if (userUpsertError) {
      console.warn('Note on marscolony_users upsert:', userUpsertError.message);
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
      // Existing colony found - use it without resetting
      colony = existingColonies[0] as ColonyRecord;
    } else {
      // First sign-in: create exactly one fresh colony with contract starting values
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
        // If a race condition occurred, retry fetching existing
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

    // 3. Load all placed buildings for this colony
    const { data: buildingsData, error: fetchBuildingsError } = await supabase
      .from('marscolony_buildings')
      .select('*')
      .eq('colony_id', colony.id)
      .order('created_at', { ascending: true });

    if (fetchBuildingsError) {
      console.error('Error fetching buildings:', fetchBuildingsError.message);
    }

    const buildings: Building[] = (buildingsData || []).map((b) => ({
      id: b.id,
      type: b.type as BuildingType,
      x: b.x,
      y: b.y,
    }));

    return {
      colony,
      buildings,
    };
  }

  /**
   * Persists a placed building to the database and deducts the building cost from the colony.
   */
  public async placeBuilding(
    colonyId: string,
    userId: string,
    buildingType: BuildingType,
    x: number,
    y: number,
    cost: { power: number; ore: number },
    currentColonyState: { power: number; ore: number }
  ): Promise<Building> {
    // 1. Insert building record into marscolony_buildings
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
      throw new Error(`Failed to place building in database: ${insertError.message}`);
    }

    // 2. Deduct cost from colony record
    const updatedPower = Math.max(0, currentColonyState.power - cost.power);
    const updatedOre = Math.max(0, currentColonyState.ore - cost.ore);

    const { error: updateError } = await supabase
      .from('marscolony_colonies')
      .update({
        power: updatedPower,
        ore: updatedOre,
        updated_at: new Date().toISOString(),
      })
      .eq('id', colonyId)
      .eq('owner', userId);

    if (updateError) {
      console.warn('Warning: Failed to update colony resource deduction:', updateError.message);
    }

    return {
      id: buildingRecord.id,
      type: buildingRecord.type as BuildingType,
      x: buildingRecord.x,
      y: buildingRecord.y,
    };
  }
}

export const colonyService = new ColonyService();
