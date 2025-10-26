"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Settings,
  Monitor,
  Download,
  ChevronRight,
  LogOut,
  Check,
  Plus,
  Shield,
} from "lucide-react";
import { useState } from "react";

type Account = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  active?: boolean;
};

type Props = {
  user: {
    name: string;
    handle?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
  };
  community?: {
    name: string;
    handle: string;
    avatarUrl?: string | null;
    href?: string;
  };
  accounts?: Account[];
  onSwitchAccount?: (id: string) => void;
  onSignOut?: () => void;
};

export default function AccountSidebar({
  user,
  community,
  accounts = [],
  onSwitchAccount,
  onSignOut,
}: Props) {
  const pathname = usePathname();
  const [open] = useState(true); // pronto pra colapsar, se quiser

  const Item = ({
    href,
    icon: Icon,
    children,
    trailing,
    activeMatch,
  }: {
    href?: string;
    icon: any;
    children: React.ReactNode;
    trailing?: React.ReactNode;
    activeMatch?: string | RegExp;
  }) => {
    const isActive =
      activeMatch &&
      (typeof activeMatch === "string"
        ? pathname?.startsWith(activeMatch)
        : activeMatch.test(pathname ?? ""));

    const Comp = href ? Link : "button";
    const props: any = href
      ? { href }
      : { type: "button", onClick: () => {} };

    return (
      <Comp
        {...props}
        className={[
          "group flex w-full items-center gap-3 rounded-xl px-3 py-2",
          "border border-white/5 bg-white/[0.02]",
          "hover:bg-white/[0.06] transition",
          isActive ? "ring-1 ring-white/10 bg-white/[0.06]" : "",
        ].join(" ")}
      >
        <Icon className="h-5 w-5 text-white/70 group-hover:text-white/90" />
        <span className="text-sm text-white/90">{children}</span>
        <span className="ml-auto text-white/40">{trailing}</span>
      </Comp>
    );
  };

  const Divider = () => <div className="my-2 border-t border-white/10" />;

  return (
    <aside
      className={[
        "relative",
        "h-[calc(100vh-16px)]",
        "w-[300px]",
        "rounded-2xl",
        "border border-white/10",
        "bg-[color-mix(in_oklab,rgba(var(--surface),1)_88%,transparent)]",
        "backdrop-blur-xl",
        "shadow-[0_8px_30px_rgba(0,0,0,.35)]",
        "p-3",
      ].join(" ")}
    >
      {/* Cabeçalho / Avatar */}
      <div className="flex items-center gap-3 px-2 py-1.5">
        <div className="relative h-12 w-12 overflow-hidden rounded-full ring-1 ring-white/10">
          {user.avatarUrl ? (
            <Image src={user.avatarUrl} alt={user.name} fill className="object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center bg-white/10 text-lg font-semibold">
              {initials(user.name)}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-white">{user.name}</div>
          {user.handle && (
            <div className="truncate text-xs text-white/60">@{user.handle}</div>
          )}
          {user.email && (
            <div className="truncate text-xs text-white/50">{user.email}</div>
          )}
        </div>
        <Link
          href="/me/profile"
          className="ml-auto rounded-lg border border-white/10 bg-white/[0.06] px-2 py-1 text-xs text-white/80 hover:bg-white/15"
        >
          Editar
        </Link>
      </div>

      <Divider />

      {/* Ações principais */}
      <div className="space-y-2">
        <Item href="/me/theme" icon={Monitor} trailing={<ChevronRight className="h-4 w-4" />}>
          Tema
        </Item>
        <Item href="/settings" icon={Settings} trailing={<ChevronRight className="h-4 w-4" />} activeMatch={"/settings"}>
          Configurações
        </Item>
        <Item href="/download" icon={Download}>
          Baixar app para desktop
        </Item>
      </div>

      {/* Comunidade */}
      {community && (
        <>
          <div className="mt-4 px-2 text-xs font-medium uppercase tracking-wide text-white/50">
            Seu perfil da comunidade
          </div>
          <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.02] p-2">
            <Link
              href={community.href ?? "#"}
              className="flex items-center gap-3 rounded-lg p-2 hover:bg-white/[0.06]"
            >
              <div className="relative h-9 w-9 overflow-hidden rounded-full ring-1 ring-white/10">
                {community.avatarUrl ? (
                  <Image
                    src={community.avatarUrl}
                    alt={community.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-white/10 text-sm font-semibold">
                    {initials(community.name)}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm text-white/90">{community.name}</div>
                <div className="truncate text-xs text-white/60">@{community.handle}</div>
              </div>
            </Link>
          </div>
        </>
      )}

      {/* Trocar conta */}
      {accounts.length > 0 && (
        <>
          <div className="mt-4 px-2 text-xs font-medium uppercase tracking-wide text-white/50">
            Trocar conta
          </div>
          <div className="mt-2 space-y-1">
            {accounts.map((acc) => (
              <button
                key={acc.id}
                onClick={() => onSwitchAccount?.(acc.id)}
                className={[
                  "flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-2 text-left hover:bg-white/[0.06]",
                  acc.active ? "ring-1 ring-white/15" : "",
                ].join(" ")}
              >
                <div className="relative h-8 w-8 overflow-hidden rounded-full ring-1 ring-white/10">
                  {acc.avatarUrl ? (
                    <Image alt={acc.name} src={acc.avatarUrl} fill className="object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-white/10 text-xs font-semibold">
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
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-2 hover:bg-white/[0.06]"
            >
              <Plus className="h-4 w-4 text-white/70" />
              <span className="text-sm text-white/90">Adicionar conta</span>
            </Link>
          </div>
        </>
      )}

      <div className="mt-auto" />

      {/* Rodapé / Sair */}
      <Divider />
      <button
        type="button"
        onClick={() => onSignOut?.()}
        className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 hover:bg-white/[0.06]"
      >
        <LogOut className="h-5 w-5 text-white/70" />
        <span className="text-sm text-white/90">Sair</span>
      </button>

      {/* Selo Admin (opcional) */}
      <div className="absolute right-3 top-3">
        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.06] px-2 py-1 text-[10px] uppercase tracking-wide text-white/70">
          <Shield className="h-3 w-3" />
          Admin
        </span>
      </div>
    </aside>
  );
}

function initials(name: string) {
  const t = (name || "").trim();
  if (!t) return "U";
  const parts = t.split(/\s+/);
  const a = parts[0]?.[0] ?? "";
  const b = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : parts[0]?.[1] ?? "";
  return (a + b).toUpperCase();
}
