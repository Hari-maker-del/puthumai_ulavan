import { supabase } from '@/lib/supabase';

export interface AIConversationMessage {
  id: string;
  user_id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  message: string;
  context?: Record<string, unknown> | null;
  created_at: string;
}

export interface AIConversationSummary {
  conversation_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

function toSummary(rows: AIConversationMessage[]): AIConversationSummary[] {
  const groups = new Map<string, AIConversationSummary>();
  for (const row of rows) {
    const current = groups.get(row.conversation_id);
    const title = current?.title || (row.role === 'user' ? row.message.slice(0, 60) : 'Farm conversation');
    const createdAt = current?.created_at && current.created_at < row.created_at ? current.created_at : row.created_at;
    const updatedAt = current?.updated_at && current.updated_at > row.created_at ? current.updated_at : row.created_at;
    groups.set(row.conversation_id, {
      conversation_id: row.conversation_id,
      title: title || 'Farm conversation',
      created_at: createdAt,
      updated_at: updatedAt,
      message_count: (current?.message_count ?? 0) + 1,
    });
  }
  return Array.from(groups.values()).sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function getConversationSummaries(userId: string): Promise<AIConversationSummary[]> {
  const { data, error } = await supabase
    .from('ai_conversations')
    .select('id,user_id,conversation_id,role,message,context,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) throw new Error(error.message);
  return toSummary((data ?? []) as AIConversationMessage[]);
}

export async function getConversation(userId: string, conversationId: string): Promise<AIConversationMessage[]> {
  const { data, error } = await supabase
    .from('ai_conversations')
    .select('id,user_id,conversation_id,role,message,context,created_at')
    .eq('user_id', userId)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as AIConversationMessage[];
}

export async function saveConversationMessage(
  userId: string,
  conversationId: string,
  role: 'user' | 'assistant',
  message: string,
  context?: Record<string, unknown>,
): Promise<AIConversationMessage> {
  const { data, error } = await supabase
    .from('ai_conversations')
    .insert({ user_id: userId, conversation_id: conversationId, role, message, context: context ?? null })
    .select('id,user_id,conversation_id,role,message,context,created_at')
    .single();

  if (error) throw new Error(error.message);
  return data as AIConversationMessage;
}

export async function deleteConversation(userId: string, conversationId: string): Promise<void> {
  const { error } = await supabase
    .from('ai_conversations')
    .delete()
    .eq('user_id', userId)
    .eq('conversation_id', conversationId);

  if (error) throw new Error(error.message);
}
