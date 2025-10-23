// src/components/chat/ChatDock.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { SendHorizontal, MessageSquareText } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

type DbMessage = {
  id: string;
  user_id: string | null;
  channel: string;
  content: string;
  created_at: string;
  client_msg_id?: string | null;
};

type Profile = {
  id: string;
  full_name: string | null;
  name?: string | null;
};

type Props = {
  channel: string;                     // ex.: "ranking-global"
  height?: string;                     // ex.: "clamp(420px,70vh,720px)"
};

export default function ChatDock({
  channel,
  height = "clamp(420px, 70vh, 720px)",
}: Props) {
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [me, setMe] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<DbMessage[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});

  // Dedupe
  const seenIds = useRef<Set<string>>(new Set());
  const seenClientIds = useRef<Set<string>>(new Set());

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fmt = useMemo(
    () => new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }),
    []
  );

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  /* -------- carga inicial -------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id ?? null;
      if (!cancelled) setMe(uid);

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("channel", channel)
        .order("created_at", { ascending: true })
        .limit(200);

      if (error) {
        console.error("[ChatDock] load error:", error);
        return;
      }

      const list = (data as DbMessage[]) || [];
      for (const m of list) {
        if (m?.id) seenIds.current.add(String(m.id));
        if (m?.client_msg_id) seenClientIds.current.add(String(m.client_msg_id));
      }

      if (!cancelled) {
        setMessages(list);

        // nomes
        const ids = Array.from(new Set(list.map((m) => m.user_id).filter(Boolean))) as string[];
        if (ids.length) {
          const { data: profs } = await supabase
            .from("profiles")
            .select("id, full_name, name")
            .in("id", ids);

          const map: Record<string, string> = {};
          (profs as Profile[] | null)?.forEach((p) => {
            map[p.id] =
              (p.full_name && p.full_name.trim()) ||
              (p.name && p.name.trim()) ||
              "Usuário";
          });
          setNames(map);
        }

        setTimeout(() => inputRef.current?.focus(), 60);
        setTimeout(() => scrollToBottom("auto"), 0); // desce na 1a carga
      }
    })();
    return () => { cancelled = true; };
  }, [channel, supabase, scrollToBottom]);

  /* -------- realtime sempre com auto-scroll -------- */
  useEffect(() => {
    const ch = supabase
      .channel(`chat:${channel}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `channel=eq.${channel}` },
        async (payload) => {
          const m = payload.new as DbMessage;

          // dedupe
          if (m?.id && seenIds.current.has(String(m.id))) return;
          if (m?.client_msg_id && seenClientIds.current.has(String(m.client_msg_id))) return;
          if (m?.id) seenIds.current.add(String(m.id));
          if (m?.client_msg_id) seenClientIds.current.add(String(m.client_msg_id));

          setMessages((cur) => [...cur, m]);

          // nome do autor se faltando
          if (m.user_id && !names[m.user_id]) {
            const { data: p } = await supabase
              .from("profiles")
              .select("id, full_name, name")
              .eq("id", m.user_id)
              .single();
            if (p) {
              setNames((old) => ({
                ...old,
                [p.id]:
                  (p.full_name && p.full_name.trim()) ||
                  (p.name && p.name.trim()) ||
                  "Usuário",
              }));
            }
          }

          // 👇 sempre desce quando chega nova mensagem (estilo WhatsApp auto)
          setTimeout(() => scrollToBottom("smooth"), 0);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, supabase, names, scrollToBottom]);

  /* -------- desce sempre que o array cresce -------- */
  useEffect(() => {
    scrollToBottom("smooth");
  }, [messages.length, scrollToBottom]);

  /* -------- enviar -------- */
  async function send() {
    const content = text.trim();
    if (!content || !me) return;
    if (content.length > 800) return;

    setSending(true);
    const clientId = crypto.randomUUID();
    try {
      setText("");

      const { data, error } = await supabase
        .from("messages")
        .insert({
          user_id: me,
          channel,
          content,
          client_msg_id: clientId, // comente se não tiver a coluna
        })
        .select("*")
        .single();

      if (error) {
        console.error("[ChatDock] insert error:", error);
        setText(content);
        return;
      }

      if (data?.id) seenIds.current.add(String(data.id));
      if (clientId) seenClientIds.current.add(clientId);

      const row = data as DbMessage;
      setMessages((cur) => [...cur, row]);
      setTimeout(() => scrollToBottom("smooth"), 0);
    } catch (err) {
      console.error("[ChatDock] unexpected send error:", err);
      setText(content);
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!sending) send();
    }
  }

  /* -------- animação das mensagens -------- */
  const itemVariants = {
    hidden: { opacity: 0, y: 6, filter: "blur(2px)" },
    show:   { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.16, ease: "easeOut" } },
    exit:   { opacity: 0, y: -6, filter: "blur(2px)", transition: { duration: 0.12, ease: "easeIn" } },
  };

  return (
    <div
      className="relative rounded-2xl border border-white/10 bg-[var(--surface)]/70 backdrop-blur-md shadow-xl overflow-hidden flex flex-col min-h-0"
      style={{ height }}
      aria-label="Chat do Ranking"
    >
      {/* Header */}
      <div className="h-11 px-3 flex items-center justify-between border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="inline-flex w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
          <span className="font-medium text-sm">Chat do Ranking</span>
        </div>
        <div className="text-[11px] opacity-70 flex items-center gap-1">
          <MessageSquareText size={14} aria-hidden="true" />
          {messages.length}
        </div>
      </div>

      {/* Lista (scroll invisível) */}
      <div
        ref={listRef}
        className="flex-1 min-h-0 overflow-y-auto p-3 space-y-1.5 no-scrollbar"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        <AnimatePresence initial={false}>
          {messages.map((m, i) => {
            const mine = m.user_id === me;
            const name =
              (m.user_id && names[m.user_id]) ||
              (mine ? "Você" : m.user_id ? `Usuário ${m.user_id.slice(0, 4)}` : "Usuário");
            const prev = messages[i - 1];
            const sameAsPrev = prev && prev.user_id === m.user_id;
            const time = fmt.format(new Date(m.created_at));

            return (
              <motion.div
                key={m.id}
                variants={itemVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                layout
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                {!mine && !sameAsPrev && (
                  <div className="mr-2 mt-5 flex-shrink-0">
                    <div className="w-6 h-6 rounded-full bg-white/10 grid place-items-center text-[11px]">
                      {(name?.[0] || "U").toUpperCase()}
                    </div>
                  </div>
                )}

                <div className="max-w-full flex flex-col items-start">
                  {!mine && !sameAsPrev && (
                    <motion.div layout className="text-[11px] font-medium mb-1 ml-1 opacity-60">
                      {name}
                    </motion.div>
                  )}

                  <motion.div
                    layout
                    className={[
                      "max-w-[100%] md:max-w-[100%]",
                      "px-3 py-1.5 rounded-2xl text-[13px] leading-snug",
                      "shadow-[0_1px_3px_rgba(0,0,0,0.25)]",
                      mine
                        ? "self-end bg-gradient-to-r from-[#A3E635]/90 to-[#84CC16]/80 text-black rounded-br-sm"
                        : "self-start bg-gradient-to-r from-white/10 to-white/5 text-white rounded-bl-sm",
                    ].join(" ")}
                  >
                    <div className="whitespace-pre-line break-words">{m.content}</div>
                  </motion.div>

                  <motion.div
                    layout
                    className={`text-[10px] mt-[2px] ${
                      mine ? "self-end pr-1 text-white/40" : "self-start pl-1 text-white/40"
                    }`}
                  >
                    {time}
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Composer */}
      <div className="h-14 border-t border-white/10 px-2 sm:px-3 flex items-center gap-2 flex-shrink-0">
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Escreva uma mensagem…"
          className="flex-1 h-9 px-3 rounded-full bg-white/5 border border-white/10 outline-none focus:ring-2 focus:ring-white/20 text-[13px] placeholder:opacity-60"
          maxLength={800}
          aria-label="Escreva uma mensagem"
        />
        <button
          type="button"
          onClick={send}
          disabled={!text.trim() || sending}
          className="h-9 min-w-[84px] inline-flex items-center justify-center gap-2 rounded-full px-3 bg-white/10 hover:bg-white/20 disabled:opacity-60 transition"
        >
          <SendHorizontal size={16} aria-hidden="true" />
          <span className="text-sm">Enviar</span>
        </button>
      </div>
    </div>
  );
}
