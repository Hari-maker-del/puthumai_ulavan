/** Client-side Gemini gateway. The API key stays server-side. */
import type { ChatMessage } from '@/services/types';
import { supabase } from '@/lib/supabase';

export interface GeminiSession { sendMessage: (text: string) => Promise<string>; }
export interface GeminiRequestOptions { fastMode?: boolean; }

async function callGemini(body: Record<string, unknown>): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Please sign in again to use Uzhavan AI.');
  const response = await fetch('/api/gemini', { method:'POST', headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`}, body:JSON.stringify(body) });
  let payload:{text?:string;error?:string}={}; try{payload=await response.json();}catch{}
  if(!response.ok) throw new Error(payload.error||'The AI service could not complete this request.');
  return payload.text||'(No response from Gemini)';
}
function buildHistory(seedMessages:ChatMessage[]):{role:'user'|'model';text:string}[]{return seedMessages.flatMap(m=>m.role==='user'?[{role:'user' as const,text:m.text}]:m.role==='assistant'?[{role:'model' as const,text:m.text}]:[]);}
export function createGeminiSession(seedMessages:ChatMessage[]=[],farmerMemoryContext?:string,preferredLanguage?:string):GeminiSession{
 let history=buildHistory(seedMessages),busy=false;
 return {sendMessage:async(text)=>{if(busy)throw new Error('The previous AI request is still processing. Please wait a moment.');busy=true;try{const response=await callGemini({mode:'chat',prompt:text,history,farmerMemoryContext,preferredLanguage});history=[...history,{role:'user',text},{role:'model',text:response}].slice(-30);return response;}finally{busy=false;}}};
}
export async function askGeminiWithImage(prompt:string,imageDataUri:string):Promise<string>{return callGemini({mode:'image',prompt,imageDataUri});}
export async function askGemini(prompt:string,farmerMemoryContext?:string,preferredLanguage?:string,options:GeminiRequestOptions={}):Promise<string>{return callGemini({mode:'chat',prompt,history:[],farmerMemoryContext,preferredLanguage,fastMode:Boolean(options.fastMode)});}
