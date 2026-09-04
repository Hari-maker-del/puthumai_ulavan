export function taskStatus(dueAt:string,now=new Date()){const d=new Date(dueAt);if(d<now)return'overdue';const days=(d.getTime()-now.getTime())/86400000;return days<=1?'today':days<=7?'this_week':'upcoming';}
export function expectedYieldDelta(actual:number|null,expected:number|null){if(actual==null||expected==null||expected===0)return null;return ((actual-expected)/expected)*100;}
