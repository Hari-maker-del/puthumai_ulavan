export function summarizeExpenses(rows:Array<{amount?:unknown;category?:unknown}>){const byCategory:Record<string,number>={};let total=0;for(const r of rows){const n=Number(r.amount);if(!Number.isFinite(n)||n<0)continue;total+=n;const c=String(r.category??'Other');byCategory[c]=(byCategory[c]??0)+n}return{total,byCategory}}
export function costPerAcre(total:number,acres:number){return acres>0?total/acres:null}
export function projectedProfit(revenue:number|null,cost:number){return revenue==null?null:revenue-cost}
