export type FarmTask={id:string;userId:string;title:string;dueAt:string;status:'planned'|'in_progress'|'completed'|'cancelled';fieldId?:string|null;assignee?:string|null};
export function isOverdue(task:FarmTask,now=new Date()){return task.status!=='completed'&&task.status!=='cancelled'&&new Date(task.dueAt)<now}
