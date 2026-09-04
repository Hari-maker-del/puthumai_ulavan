const KEY='puthumai.search.recent';
export function recentSearches():string[]{try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return[]}}
export function rememberSearch(q:string){const v=q.trim();if(!v)return;localStorage.setItem(KEY,JSON.stringify([v,...recentSearches().filter(x=>x!==v)].slice(0,8)))}
