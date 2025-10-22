// src/components/chat/ChatDock.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { SendHorizonal, MessageSquareText } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";

/** Estrutura esperada da tabela:
 * table: messages
 * columns:
 *  - id: uuid (pk)
 *  - user_id: uuid (fk -> auth.users.id)
 *  - channel: text
 *  - content: text
 *  - created_at: timestamp with time zone default now()
 */
type DbMessage = {
  id: string;
  user_id: string;
  channel: string;
  content: string;
  created_at: string;
};

type Profile = {
  id: string;
  full_name: string | null;
  name?: string | null;
};

type Props = {
  /** Canal de chat. Ex.: "ranking-global" */
  channel: string;
  /** Altura mínima (opcional) */
  minHeight?: number;
};

export default function ChatDock({ channel, minHeight = 520 }: Props) {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [me, setMe] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const [messages, setMessages] = useState<DbMessage[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // formatador de hora (HH:mm)
  const fmt = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      }),
    []
  );

  // Carrega usuário atual + últimas mensagens
  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      setMe(u.user?.id ?? null);

      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("channel", channel)
        .order("created_at", { ascending: true })
        .limit(200);

      const list = (data as DbMessage[]) || [];
      setMessages(list);

      // Prefetch nomes de perfis
      const ids = Array.from(new Set(list.map((m) => m.user_id)));
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

      // foca input na primeira carga
      setTimeout(() => inputRef.current?.focus(), 60);
    })();
  }, [channel, supabase]);

  // Realtime: novas mensagens do canal
  useEffect(() => {
    const ch = supabase
      .channel(`chat:${channel}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `channel=eq.${channel}`,
        },
        async (payload) => {
          const m = payload.new as DbMessage;
          setMessages((cur) => [...cur, m]);

          // se não houver nome em cache, busca e salva
          if (!names[m.user_id]) {
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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
    // importante: NÃO colocar 'names' nas deps para evitar re-subscrever
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, supabase]);

  // Scroll para o fim quando mensagens mudarem
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    const content = text.trim();
    if (!content || !me) return;
    if (content.length > 800) return; // proteção simples

    setSending(true);
    try {
      // otimista (opcional)
      const optimistic: DbMessage = {
        id: crypto.randomUUID(),
        user_id: me,
        content,
        channel,
        created_at: new Date().toISOString(),
      };
      setMessages((cur) => [...cur, optimistic]);
      setText("");

      const { error } = await supabase.from("messages").insert({
        user_id: me,
        channel,
        content,
      });
      if (error) {
        // rollback: remove a última se falhar
        setMessages((cur) => cur.filter((m) => m.id !== optimistic.id));
        setText(content); // devolve o texto
      }
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

  return (
    <div
      className="rounded-2xl border border-white/10 bg-[var(--surface)]/70 backdrop-blur-md shadow-xl overflow-hidden flex flex-col"
      style={{ minHeight }}
      aria-label="Chat do Ranking"
    >
      {/* Header */}
      <div className="h-11 px-3 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="inline-flex w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
          <span className="font-medium text-sm">Chat do Ranking</span>
        </div>
        <div className="text-[11px] opacity-70 flex items-center gap-1">
          <MessageSquareText size={14} aria-hidden="true" />
          {messages.length}
        </div>
      </div>

      {/* Lista de mensagens */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto p-3 space-y-1.5"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.map((m, i) => {
          const mine = m.user_id === me;
          const name =
            names[m.user_id] ??
            (mine ? "Você" : `Usuário ${m.user_id.slice(0, 4)}`);
          const prev = messages[i - 1];
          const sameAsPrev = prev && prev.user_id === m.user_id;
          const time = fmt.format(new Date(m.created_at));

          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              {/* avatar pequeno para outros (apenas se diferente da mensagem anterior) */}
              {!mine && !sameAsPrev && (
                <div className="mr-2 mt-5 flex-shrink-0">
                  <div className="w-6 h-6 rounded-full bg-white/10 grid place-items-center text-[11px]">
                    {name?.[0]?.toUpperCase() || "U"}
                  </div>
                </div>
              )}

              {/* container da mensagem + hora */}
              <div className="max-w-full flex flex-col items-start">
                {/* nome acima quando não é meu e quando muda de autor */}
                {!mine && !sameAsPrev && (
                  <div className="text-[11px] font-medium mb-1 ml-1 opacity-60">
                    {name}
                  </div>
                )}

                {/* bolha estilo iMessage (mais compacta) */}
                <div
                  className={[
                    // largura máxima da bolha (mobile maior, desktop menor)
                    "max-w-[100%] md:max-w-[100%]",
                    // paddings e tipografia mais compactos
                    "px-3 py-1.5 rounded-2xl text-[13px] leading-snug",
                    "shadow-[0_1px_3px_rgba(0,0,0,0.25)]",
                    mine
                      ? "self-end bg-gradient-to-r from-[#A3E635]/90 to-[#84CC16]/80 text-black rounded-br-sm"
                      : "self-start bg-gradient-to-r from-white/10 to-white/5 text-white rounded-bl-sm",
                  ].join(" ")}
                >
                  <div className="whitespace-pre-line break-words">{m.content}</div>
                </div>

                {/* Horário FORA da bolha, alinhado ao lado correto */}
                <div
                  className={`text-[10px] mt-[2px] ${
                    mine ? "self-end pr-1 text-white/40" : "self-start pl-1 text-white/40"
                  }`}
                >
                  {time}
                </div>
              </div>
            </div>
          );
        })}

        {messages.length === 0 && (
          <div className="h-full w-full grid place-items-center text-sm opacity-70">
            Nenhuma mensagem ainda — diga um oi 👋
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="h-14 border-top border-white/10 px-2 sm:px-3 flex items-center gap-2">
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
          <SendHorizonal size={16} aria-hidden="true" />
          <span className="text-sm">Enviar</span>
        </button>
      </div>
    </div>
  );
}
