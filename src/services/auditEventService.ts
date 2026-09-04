export type AuditAction='farm.created'|'field.created'|'crop.updated'|'expense.created'|'security.login'|'security.logout';
export function makeAuditEvent(action:AuditAction,resourceId?:string){return{action,resourceId:resourceId??null,occurredAt:new Date().toISOString()}}
