export interface ReleaseHealthSnapshot {
  version: string;
  buildTime: string;
  online: boolean;
  checks: Array<{ name: string; ok: boolean; detail: string }>;
}

export function createReleaseHealthSnapshot(version: string, checks: ReleaseHealthSnapshot['checks']): ReleaseHealthSnapshot {
  return {
    version,
    buildTime: new Date().toISOString(),
    online: typeof navigator === 'undefined' ? true : navigator.onLine,
    checks,
  };
}
