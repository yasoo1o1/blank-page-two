import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Send, Phone, User as UserIcon, Trash2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  type ChatConversation,
  type ChatMessage,
  deleteConversation,
  listConversations,
  listMessages,
  markRead,
  sendMessage,
} from "@/lib/chat";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ChatPanel = () => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [showList, setShowList] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const refresh = async () => setConversations(await listConversations());

  // Initial load + realtime for conversation list
  useEffect(() => {
    refresh();
    const channel = supabase
      .channel("admin-chat-conversations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_conversations" },
        () => refresh(),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload: { new: ChatMessage }) => {
          const msg = payload.new as ChatMessage;
          if (msg.sender === "customer" && msg.conversation_id !== activeId) {
            toast.success("رسالة جديدة من عميل");
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  // Load messages + subscribe when active conversation changes
  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    (async () => {
      setMessages(await listMessages(activeId));
      await markRead(activeId, "admin");
    })();
    const channel = supabase
      .channel(`admin-chat-${activeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${activeId}`,
        },
        (payload: { new: ChatMessage }) => {
          const msg = payload.new as ChatMessage;
          setMessages((prev) =>
            prev.find((m) => m.id === msg.id) ? prev : [...prev, msg],
          );
          if (msg.sender === "customer") markRead(activeId, "admin");
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) || null,
    [conversations, activeId],
  );

  const handleSend = async () => {
    if (!activeId || !draft.trim()) return;
    const text = draft;
    setDraft("");
    const ok = await sendMessage(activeId, "admin", text);
    if (!ok) {
      setDraft(text);
      toast.error("تعذّر إرسال الرسالة");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("حذف هذه المحادثة نهائياً؟")) return;
    await deleteConversation(id);
    if (activeId === id) setActiveId(null);
    await refresh();
    toast.success("تم حذف المحادثة");
  };

  const totalUnread = conversations.reduce((s, c) => s + (c.unread_admin || 0), 0);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/60 bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 text-brand-blue">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-brand-blue to-[hsl(205_78%_26%)] text-white">
            <MessageCircle className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <h2 className="text-[14px] font-extrabold">دردشة العملاء</h2>
            <div className="text-[11px] text-muted-foreground">
              تحديث لحظي · {conversations.length} محادثة
            </div>
          </div>
        </div>
        {totalUnread > 0 && (
          <div className="rounded-full bg-red-500 px-2.5 py-0.5 text-[11px] font-extrabold text-white">
            {totalUnread} غير مقروءة
          </div>
        )}
      </div>

      <div className="grid h-[600px] grid-cols-1 md:grid-cols-[280px_1fr]">
        {/* List */}
        <aside
          className={cn(
            "border-l border-border bg-muted/20 md:block",
            showList || !activeId ? "block" : "hidden",
          )}
        >
          <div className="h-full overflow-y-auto">
            {conversations.length === 0 && (
              <div className="px-4 py-10 text-center text-[12.5px] text-muted-foreground">
                لا توجد محادثات بعد.
              </div>
            )}
            {conversations.map((c) => {
              const isActive = c.id === activeId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setActiveId(c.id);
                    setShowList(false);
                  }}
                  className={cn(
                    "group flex w-full items-start gap-2 border-b border-border/50 px-3 py-3 text-right transition-colors",
                    isActive ? "bg-brand-blue/10" : "hover:bg-white",
                  )}
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-blue/15 to-violet-300/40 text-[12px] font-extrabold text-brand-blue">
                    {c.customer_name.slice(0, 1)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[13px] font-extrabold text-brand-blue">
                        {c.customer_name}
                      </span>
                      {c.unread_admin > 0 && (
                        <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-extrabold text-white">
                          {c.unread_admin}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground" dir="ltr">
                      <Phone className="h-3 w-3" />
                      {c.customer_phone}
                    </div>
                    <div className="mt-0.5 text-[10.5px] text-muted-foreground">
                      {new Date(c.last_message_at).toLocaleString("ar-SA", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Conversation */}
        <section
          className={cn(
            "flex flex-col",
            showList && !activeId ? "hidden md:flex" : "flex",
          )}
        >
          {!active ? (
            <div className="grid flex-1 place-items-center px-4 text-center text-[12.5px] text-muted-foreground">
              اختر محادثة من القائمة لعرض الرسائل.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2 border-b border-border bg-white px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setActiveId(null);
                    setShowList(true);
                  }}
                  className="grid h-8 w-8 place-items-center rounded-lg text-brand-blue hover:bg-muted/50 md:hidden"
                  aria-label="رجوع"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-blue/15 to-violet-300/40 text-[12px] font-extrabold text-brand-blue">
                    {active.customer_name.slice(0, 1)}
                  </div>
                  <div className="min-w-0 leading-tight">
                    <div className="flex items-center gap-1.5 truncate text-[13.5px] font-extrabold text-brand-blue">
                      <UserIcon className="h-3.5 w-3.5" />
                      {active.customer_name}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground" dir="ltr">
                      <Phone className="h-3 w-3" />
                      {active.customer_phone}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(active.id)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-destructive hover:bg-destructive/10"
                  aria-label="حذف"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div ref={scrollRef} className="flex-1 space-y-2.5 overflow-y-auto bg-[hsl(210_40%_97%)] p-3">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      "flex",
                      m.sender === "admin" ? "justify-end" : "justify-start",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[75%] rounded-2xl px-3 py-2 text-[13px] leading-6 shadow-sm",
                        m.sender === "admin"
                          ? "rounded-br-sm bg-gradient-to-l from-brand-blue to-[hsl(205_78%_26%)] text-white"
                          : "rounded-bl-sm bg-white text-brand-blue ring-1 ring-border/60",
                      )}
                    >
                      <div className="whitespace-pre-wrap break-words">{m.content}</div>
                      <div
                        className={cn(
                          "mt-1 text-[10px]",
                          m.sender === "admin" ? "text-white/70" : "text-muted-foreground",
                        )}
                        dir="ltr"
                      >
                        {new Date(m.created_at).toLocaleTimeString("ar-SA", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-end gap-2 border-t border-border bg-white p-2.5">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value.slice(0, 1000))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  rows={1}
                  placeholder="اكتب الرد..."
                  className="max-h-28 min-h-[42px] flex-1 resize-none rounded-xl border border-[hsl(214_25%_88%)] bg-white px-3 py-2 text-[13.5px] text-brand-blue outline-none focus:border-brand-blue"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!draft.trim()}
                  aria-label="إرسال"
                  className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-blue to-[hsl(205_78%_26%)] text-white shadow-soft hover:brightness-110 disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default ChatPanel;
