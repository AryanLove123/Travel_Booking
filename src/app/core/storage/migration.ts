export type MigrationStep = (data: unknown) => unknown;

export type MigrationRegistry = Record<string, Record<number, MigrationStep>>;

/** The migrations shipped with this build. Empty while we are still on schema v1. */
export const MIGRATIONS: MigrationRegistry = {};

export interface VersionedPayload {
  v: number;
  data: unknown;
}

export type MigrationOutcome =
  | { status: 'current' }
  | { status: 'migrated'; payload: VersionedPayload }
  | { status: 'newer' }
  | { status: 'failed'; reason: string };


export function migrateEnvelope(
    key: string,
    payload: VersionedPayload,
    targetVersion: number,
    registry: MigrationRegistry,
): MigrationOutcome{
    if(payload.v == targetVersion) return {status: 'current'};
    if(payload.v > targetVersion || payload.v < 1 || !Number.isInteger(payload.v)) return {status: 'newer'};

    let data = payload.data;

    try{
        for(let from = payload.v; from < targetVersion; from++){
            const step = registry[key]?.[from];
            if(step) data = step(data);
        }
    } catch(error){
        return {status: 'failed', reason: error instanceof Error? error.message : String(error)};
    }

    return {status: 'migrated', payload: {v: targetVersion, data}};
}