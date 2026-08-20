export function requireEnv(name:string):string{const value=String(import.meta.env[name]??'').trim();if(!value)throw new Error(`${name} is not configured for this deployment.`);return value}
export function isRealDataMode(){return !import.meta.env.DEV||import.meta.env.VITE_USE_MOCK!=='true'}
