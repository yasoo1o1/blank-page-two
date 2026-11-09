// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";
import { getVisitorId } from "@/lib/visitor-tracking";

export type ChatConversation = {
  id: string;
  visitor_id: string;
  customer_name: string;
  customer_phone: string;
  last_message_at: string;
  unread_admin: number;
  unread_customer: number;
  initiated_by?: "customer" | "admin";
  created_at: string;
  updated_at: string;
};

export type ChatMessage = {
  id: string;
  conversation_id: string;
  sender: "customer" | "admin";
  content: string;
  created_at: string;
};

const STORAGE_KEY = "arabbank_chat_conversation_v1";

export function getStoredConversationId(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function setStoredConversationId(id: string) {
  localStorage.setItem(STORAGE_KEY, id);
}

export function clearStoredConversation() {
  localStorage.removeItem(STORAGE_KEY);
}

export async function startConversation(name: string, phone: string): Promise<ChatConversation | null> {
  const visitorId = getVisitorId();
  const { data, error } = await supabase
    .from("chat_conversations")
    .insert({
      visitor_id: visitorId,
      customer_name: name.trim(),
      customer_phone: phone.trim(),
    })
    .select()
    .single();
  if (error) {
    console.error("[chat] startConversation:", error);
    return null;
  }
  setStoredConversationId(data.id);
  return data as ChatConversation;
}

/** Find an existing conversation for a visitor (most recent), used by widget to auto-attach to admin-initiated chats. */
export async function findConversationByVisitor(visitorId: string): Promise<ChatConversation | null> {
  const { data, error } = await supabase
    .from("chat_conversations")
    .select("*")
    .eq("visitor_id", visitorId)
    .order("last_message_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("[chat] findConversationByVisitor:", error);
    return null;
  }
  return (data as ChatConversation | null) ?? null;
}

/** Admin-initiated conversation with a visitor (no customer name/phone required). */
export async function startConversationByAdmin(visitorId: string): Promise<ChatConversation | null> {
  // Reuse if one already exists for this visitor
  const existing = await findConversationByVisitor(visitorId);
  if (existing) return existing;
  const { data, error } = await supabase
    .from("chat_conversations")
    .insert({
      visitor_id: visitorId,
      customer_name: "",
      customer_phone: "",
      initiated_by: "admin",
    })
    .select()
    .single();
  if (error) {
    console.error("[chat] startConversationByAdmin:", error);
    return null;
  }
  return data as ChatConversation;
}

export async function getConversation(id: string): Promise<ChatConversation | null> {
  const { data, error } = await supabase
    .from("chat_conversations")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("[chat] getConversation:", error);
    return null;
  }
  return (data as ChatConversation | null) ?? null;
}

export async function listMessages(conversationId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[chat] listMessages:", error);
    return [];
  }
  return (data as ChatMessage[]) || [];
}

export async function sendMessage(
  conversationId: string,
  sender: "customer" | "admin",
  content: string,
): Promise<boolean> {
  const trimmed = content.trim();
  if (!trimmed) return false;
  const { error: msgError } = await supabase
    .from("chat_messages")
    .insert({ conversation_id: conversationId, sender, content: trimmed });
  if (msgError) {
    console.error("[chat] sendMessage:", msgError);
    return false;
  }
  // Bump conversation last_message_at + unread counter for the OTHER side.
  // Read current count then increment (no atomic increment without RPC).
  const { data: conv } = await supabase
    .from("chat_conversations")
    .select("unread_admin, unread_customer")
    .eq("id", conversationId)
    .maybeSingle();
  if (sender === "customer") {
    await supabase
      .from("chat_conversations")
      .update({
        last_message_at: new Date().toISOString(),
        unread_admin: (conv?.unread_admin ?? 0) + 1,
      })
      .eq("id", conversationId);
  } else {
    await supabase
      .from("chat_conversations")
      .update({
        last_message_at: new Date().toISOString(),
        unread_customer: (conv?.unread_customer ?? 0) + 1,
      })
      .eq("id", conversationId);
  }
  return true;
}

export async function markRead(conversationId: string, side: "customer" | "admin") {
  if (side === "customer") {
    await supabase.from("chat_conversations").update({ unread_customer: 0 }).eq("id", conversationId);
  } else {
    await supabase.from("chat_conversations").update({ unread_admin: 0 }).eq("id", conversationId);
  }
}

export async function listConversations(): Promise<ChatConversation[]> {
  const { data, error } = await supabase
    .from("chat_conversations")
    .select("*")
    .order("last_message_at", { ascending: false });
  if (error) {
    console.error("[chat] listConversations:", error);
    return [];
  }
  return (data as ChatConversation[]) || [];
}

export async function deleteConversation(id: string) {
  await supabase.from("chat_conversations").delete().eq("id", id);
}
