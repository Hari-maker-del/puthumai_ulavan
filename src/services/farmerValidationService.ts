export function requiredText(value:unknown,label:string){const v=String(value??'').trim();if(!v)throw new Error(`${label} is required.`);return v}
export function nonNegative(value:unknown,label:string){const n=Number(value);if(!Number.isFinite(n)||n<0)throw new Error(`${label} must be a non-negative number.`);return n}
export function validCoordinates(lat:unknown,lng:unknown){const a=Number(lat),b=Number(lng);if(!Number.isFinite(a)||a<-90||a>90||!Number.isFinite(b)||b<-180||b>180)throw new Error('Invalid location coordinates.');return{lat:a,lng:b}}
export function validDateRange(start:string,end:string){if(start&&end&&new Date(end)<new Date(start))throw new Error('End date cannot be before start date.')}
