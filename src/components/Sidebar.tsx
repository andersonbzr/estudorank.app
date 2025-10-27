// src/components/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, LayoutDashboard, Settings, ShieldCheck } from "lucide-react";
import Image from "next/image";
import clsx from "clsx";

type Props = {
  onNavigate?: () => void;
  isAdmin?: boolean;
  collapsed?: boolean;
};

type Item = { href: string; label: string; icon: React.ComponentType<any> };

export default function Sidebar({ onNavigate, isAdmin, collapsed = false }: Props) {
  const pathname = usePathname();

  const primary: Item[] = [
    { href: "/me", label: "Meu Painel", icon: LayoutDashboard },
    { href: "/ranking", label: "Ranking", icon: Trophy },
    { href: "/config", label: "Configurações", icon: Settings },
  ];

  const admin: Item[] = isAdmin
    ? [{ href: "/admin/courses", label: "Administração", icon: ShieldCheck }]
    : [];

  return (
    <aside className="h-screen sticky top-0 bg-[var(--surface)]/80 backdrop-blur-xl border-r border-white/10 flex flex-col">
      {/* Header / Logo */}
      <div
        className={clsx(
          "h-12 border-b border-white/10 px-3 flex items-center",
          collapsed && "justify-center px-0"
        )}
      >
        <Link
          href="/me"
          className={clsx(
            "flex items-center gap-2 rounded-lg hover:bg-white/5 px-2 py-1 transition",
            collapsed && "justify-center px-1"
          )}
          onClick={onNavigate}
          aria-label="Ir para o painel"
          title="EstudoRank"
        >
          {!collapsed ? (
            <Image
              src="/logo.png"
              alt="EstudoRank"
              width={200}
              height={60}
              priority
              className="h-7 md:h-8 lg:h-9 w-auto object-contain drop-shadow-[0_0_5px_rgba(163,230,53,0.25)]"
            />
          ) : (
            <Image
              src="/logo.col.png"
              alt="ER"
              width={200}
              height={60}
              priority
              className="h-6 w-auto object-contain drop-shadow-[0_0_4px_rgba(163,230,53,0.30)]"
            />
          )}

          {/* {!collapsed && (
            <span className="ml-1 font-semibold text-sm tracking-tight text-white/90">
              Estudo<span className="text-lime-300">Rank</span>
            </span>
          )} */}
        </Link>
      </div>

      {/* Navegação */}
      <nav className={clsx("flex-1 p-2 space-y-2", collapsed && "p-2")}>
        <Section items={primary} collapsed={collapsed} onNavigate={onNavigate} />
        {isAdmin && (
          <>
            {!collapsed && (
              <div className="px-3 pt-2">
                <div className="h-px bg-white/10" />
              </div>
            )}
            <Section
              title={collapsed ? undefined : "Admin"}
              items={admin}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          </>
        )}
      </nav>

      {/* Footer */}
      {!collapsed ? (
        <div className="px-3 py-2 text-xs opacity-60 border-t border-white/10">
          © {new Date().getFullYear()} EstudoRank
        </div>
      ) : (
        <div className="py-2 border-t border-white/10 text-center text-[10px] opacity-50 select-none">
          © {new Date().getFullYear()}
        </div>
      )}
    </aside>
  );
}

/* --------------------------- Subcomponentes --------------------------- */

function Section({
  title,
  items,
  collapsed,
  onNavigate,
}: {
  title?: string;
  items: Item[];
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div className="space-y-2">
      {title && !collapsed && (
        <div className="px-3 pt-1 text-[11px] uppercase tracking-wide text-white/40">
          {title}
        </div>
      )}
      <ul className="space-y-1.5">
        {items.map((it) => (
          <li key={it.href}>
            <NavItem item={it} collapsed={collapsed} onNavigate={onNavigate} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function NavItem({
  item,
  collapsed,
  onNavigate,
}: {
  item: Item;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={clsx(
        "group relative flex items-center gap-2 rounded-xl border transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-lime-400/30",
        collapsed ? "justify-center p-1.5" : "px-2.5 py-1.5",
        active
          ? "bg-white/7 border-white/15 text-lime-200"
          : "bg-white/5 hover:bg-white/10 border-white/10 text-white/85 hover:text-white"
      )}
    >
      <Icon
        size={17}
        className={clsx("transition-transform", active ? "scale-[1.02]" : "group-hover:scale-105")}
        aria-hidden
      />
      {!collapsed && <span className="text-[13px]">{item.label}</span>}

      {collapsed && (
        <span
          className={clsx(
            "pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2",
            "rounded-md bg-black/80 text-white text-xs px-2 py-1",
            "opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0",
            "transition-all whitespace-nowrap z-50"
          )}
          role="tooltip"
        >
          {item.label}
        </span>
      )}
    </Link>
  );
}
