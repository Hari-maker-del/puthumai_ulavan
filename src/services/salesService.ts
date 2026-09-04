export type SaleRecord={id:string;userId:string;cropId?:string|null;buyerName:string;quantity:number;unit:string;unitPrice:number;soldAt:string;contractDate?:string|null};
export function saleRevenue(s:SaleRecord){return Math.max(0,s.quantity)*Math.max(0,s.unitPrice)}
