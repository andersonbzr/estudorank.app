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
  /** Quando true, renderiza mini-rail (ícones apenas) no desktop */
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
      {/* Header */}
      <div
        className={clsx(
          "h-14 border-b border-white/10 px-4 flex items-center gap-2",
          collapsed && "justify-center px-0"
        )}
      >
        <Link
          href="/"
          className={clsx(
            "flex items-center gap-2 transition-transform hover:scale-[1.02]",
            collapsed && "justify-center"
          )}
          onClick={onNavigate}
          aria-label="Ir para a página inicial"
        >
          <Image
            src="/logo.png"
            alt="EstudoRank"
            width={collapsed ? 22 : 28}
            height={collapsed ? 22 : 28}
            className="rounded-sm drop-shadow-[0_0_6px_rgba(163,230,53,0.30)]"
            priority
          />
          {!collapsed && (
            <span className="font-semibold tracking-tight">EstudoRank</span>
          )}
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
        <div className="px-3 py-3 text-xs opacity-60 border-t border-white/10">
          © {new Date().getFullYear()} EstudoRank
        </div>
      ) : (
        <div className="py-3 border-t border-white/10 text-center text-[10px] opacity-50 select-none">
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
        <div className="px-3 pt-2 text-[11px] uppercase tracking-wide text-white/40">
          {title}
        </div>
      )}
      <ul className="space-y-2">
        {items.map((it) => (
          <li key={it.href}>
            <NavItem
              item={it}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
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
        "group relative flex items-center gap-2 rounded-2xl border transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-lime-400/30",
        collapsed ? "justify-center p-2" : "px-3 py-2",
        active
          ? "bg-white/7 border-white/15 text-lime-200 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
          : "bg-white/5 hover:bg-white/10 border-white/10 text-white/85 hover:text-white"
      )}
    >
      <Icon
        size={18}
        className={clsx("transition-transform", active ? "scale-[1.02]" : "group-hover:scale-105")}
        aria-hidden
      />
      {!collapsed && <span className="text-sm">{item.label}</span>}

      {/* Tooltip no modo colapsado */}
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
