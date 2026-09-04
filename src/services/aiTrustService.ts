export type AiSource='farmer-data'|'live-source'|'generated';
export function trustLabel(source:AiSource){if(source==='farmer-data')return'Based on your saved farm data.';if(source==='live-source')return'Based on live data from the configured source.';return'AI-generated guidance. Verify important decisions with an agricultural professional or official source.'}
export function noGuess(message:string,liveRequired:boolean){return liveRequired&&/unavailable|not configured|failed|timeout/i.test(message)?'Live information is unavailable right now. I will not invent a value.':message}
