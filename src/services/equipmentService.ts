export type EquipmentRecord={id:string;userId:string;name:string;type:string;lastServiceAt?:string|null;nextServiceAt?:string|null;fuelUsed?:number|null;notes?:string|null};
export function equipmentNeedsService(e:EquipmentRecord,now=new Date()){return !!e.nextServiceAt&&new Date(e.nextServiceAt)<=now}
