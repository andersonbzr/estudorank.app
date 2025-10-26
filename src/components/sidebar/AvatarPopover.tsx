"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Monitor, Settings, Download, ChevronRight, Check, Plus, LogOut, Shield } from "lucide-react";

type Account = { id: string; name: string; email: string; avatarUrl?: string | null; active?: boolean };
type User = { name: string; handle?: string | null; email?: string | null; avatarUrl?: string | null };

function initials(name: string) {
  const parts = (name || "").trim().split(/\s+/);
  const a = parts[0]?.[0] ?? "";
  const b = parts.length > 1 ? parts.at(-1)?.[0] ?? "" : parts[0]?.[1] ?? "";
  return (a + b).toUpperCase();
}

export default function AvatarPopover({
  user,
  community,
  accounts = [],
  onSwitchAccount,
  onSignOut,
  placement = "right",
}: {
  user: User;
  community?: { name: string; handle: string; href?: string; avatarUrl?: string | null };
  accounts?: Account[];
  onSwitchAccount?: (id: string) => void;
  onSignOut?: () => void;
  placement?: "right" | "left";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const PanelItem = ({
    href,
    icon: Icon,
    label,
  }: {
    href?: string;
    icon: any;
    label: string;
  }) => {
    const Comp = href ? Link : "button";
    const props: any = href ? { href } : {};
    return (
      <Comp
        {...props}
        className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10"
      >
        <Icon className="h-5 w-5 text-white/70" />
        <span className="text-sm text-white/90">{label}</span>
        <ChevronRight className="ml-auto h-4 w-4 text-white/50" />
      </Comp>
    );
  };

  return (
    <div className="relative" ref={ref}>
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative h-10 w-10 overflow-hidden rounded-full ring-1 ring-white/10 hover:ring-white/20"
        aria-label="Abrir menu de conta"
      >
        {user.avatarUrl ? (
          <Image src={user.avatarUrl} alt={user.name} fill className="object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center bg-white/10 text-sm font-semibold text-white/90">
            {initials(user.name)}
          </div>
        )}
      </button>

      {/* Popover */}
      {open && (
        <div
          className={[
            "absolute z-50 w-[320px] rounded-2xl border border-white/10",
            "bg-[color-mix(in_oklab,rgb(15_20_26)_88%,transparent)]",
            "backdrop-blur-xl p-3 shadow-[0_20px_60px_rgba(0,0,0,.45)]",
            placement === "right" ? "left-0 ml-2" : "right-0 mr-2",
            "top-12",
          ].join(" ")}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-1">
            <div className="relative h-12 w-12 overflow-hidden rounded-full ring-1 ring-white/10">
              {user.avatarUrl ? (
                <Image src={user.avatarUrl} alt={user.name} fill className="object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center bg-white/10 text-sm font-semibold text-white/90">
                  {initials(user.name)}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-white">{user.name}</div>
              {user.handle && <div className="truncate text-xs text-white/60">@{user.handle}</div>}
              {user.email && <div className="truncate text-xs text-white/50">{user.email}</div>}
            </div>
            <Link
              href="/me/profile"
              className="ml-auto rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-xs text-white/80 hover:bg-white/15"
            >
              Editar
            </Link>
          </div>

          <div className="my-3 border-t border-white/10" />

          {/* Items */}
          <div className="space-y-2">
            <PanelItem href="/me/theme" icon={Monitor} label="Tema" />
            <PanelItem href="/settings" icon={Settings} label="Configurações" />
            <PanelItem href="/download" icon={Download} label="Baixar app para desktop" />
          </div>

          {community && (
            <>
              <div className="mt-4 px-1 text-xs font-medium uppercase tracking-wide text-white/50">
                Seu perfil da comunidade
              </div>
              <Link
                href={community.href ?? "#"}
                className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-2 hover:bg-white/10"
              >
                <div className="relative h-9 w-9 overflow-hidden rounded-full ring-1 ring-white/10">
                  {community.avatarUrl ? (
                    <Image src={community.avatarUrl} alt={community.name} fill className="object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-white/10 text-xs font-semibold text-white/90">
                      {initials(community.name)}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm text-white/90">{community.name}</div>
                  <div className="truncate text-xs text-white/60">@{community.handle}</div>
                </div>
                <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/70">
                  <Shield className="h-3 w-3" /> Admin
                </span>
              </Link>
            </>
          )}

          {/* Troca de conta */}
          {accounts.length > 0 && (
            <>
              <div className="mt-4 px-1 text-xs font-medium uppercase tracking-wide text-white/50">
                Trocar conta
              </div>
              <div className="mt-2 space-y-1">
                {accounts.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => onSwitchAccount?.(acc.id)}
                    className={[
                      "flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-2 text-left hover:bg-white/10",
                      acc.active ? "ring-1 ring-white/15" : "",
                    ].join(" ")}
                  >
                    <div className="relative h-8 w-8 overflow-hidden rounded-full ring-1 ring-white/10">
                      {acc.avatarUrl ? (
                        <Image src={acc.avatarUrl} alt={acc.name} fill className="object-cover" />
                      ) : (
                        <div className="grid h-full w-full place-items-center bg-white/10 text-[10px] font-semibold text-white/90">
                          {initials(acc.name)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm text-white/90">{acc.name}</div>
                      <div className="truncate text-xs text-white/60">{acc.email}</div>
                    </div>
                    {acc.active && <Check className="ml-auto h-4 w-4 text-white/70" />}
                  </button>
                ))}
                <Link
                  href="/auth/add-account"
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-2 hover:bg-white/10"
                >
                  <Plus className="h-4 w-4 text-white/70" />
                  <span className="text-sm text-white/90">Adicionar conta</span>
                </Link>
              </div>
            </>
          )}

          <div className="my-3 border-t border-white/10" />

          <button
            onClick={() => onSignOut?.()}
            className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10"
          >
            <LogOut className="h-5 w-5 text-white/70" />
            <span className="text-sm text-white/90">Sair</span>
          </button>
        </div>
      )}
    </div>
  );
}
