export function makeIdempotencyKey(scope:string,parts:string[]){return `${scope}:${parts.map(p=>p.trim().toLowerCase()).join('|')}`}
