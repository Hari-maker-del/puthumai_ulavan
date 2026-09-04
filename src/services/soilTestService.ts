export type SoilTest={id:string;userId:string;fieldId:string;testedAt:string;ph?:number|null;nitrogen?:number|null;phosphorus?:number|null;potassium?:number|null;reportUrl?:string|null};
export function validateSoilTest(x:SoilTest){if(x.ph!=null&&(x.ph<0||x.ph>14))throw new Error('Soil pH must be between 0 and 14.');return x}
