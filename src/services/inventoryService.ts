export type InventoryItem={id:string;userId:string;name:string;category:string;quantity:number;unit:string;batchNumber?:string|null;purchaseCost:number};
export function remainingValue(item:InventoryItem){return Math.max(0,item.quantity)*Math.max(0,item.purchaseCost)}
