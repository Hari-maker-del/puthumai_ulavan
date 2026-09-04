export interface VersionedRecord {
  id: string;
  updatedAt: string;
  [key: string]: unknown;
}

export function chooseLatestRecord<T extends VersionedRecord>(local: T, remote: T): T {
  const localTime = Date.parse(local.updatedAt);
  const remoteTime = Date.parse(remote.updatedAt);
  if (Number.isNaN(localTime)) return remote;
  if (Number.isNaN(remoteTime)) return local;
  return remoteTime >= localTime ? remote : local;
}

export function recordsConflict(local: VersionedRecord, remote: VersionedRecord): boolean {
  return local.id === remote.id && local.updatedAt !== remote.updatedAt;
}
