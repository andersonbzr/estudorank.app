"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Trophy,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Shield,
} from "lucide-react";
import Image from "next/image";
import clsx from "clsx";

type Props = {
  onNavigate?: () => void;
  isAdmin?: boolean;
  /** Quando true, renderiza mini-rail (ícones apenas) no desktop */
  collapsed?: boolean;
};

type Item = { href: string; label: string; icon: React.ComponentType<any> };

export default function Sidebar({
  onNavigate,
  isAdmin,
  collapsed = false,
}: Props) {
  const pathname = usePathname();

  const items: Item[] = [
    { href: "/me", label: "Meu Painel", icon: LayoutDashboard },
    { href: "/ranking", label: "Ranking", icon: Trophy },
    { href: "/config", label: "Configurações", icon: Settings },
    { href: "/me/security", label: "Segurança", icon: Shield },
  ];
  if (isAdmin) {
    items.push({
      href: "/admin/courses",
      label: "Administração",
      icon: ShieldCheck,
    });
  }

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
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <NavItem
              key={item.href}
              item={item}
              active={active}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          );
        })}
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

function NavItem({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: Item;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={clsx(
        "group relative flex items-center gap-2 rounded-2xl border transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40",
        collapsed ? "justify-center p-2" : "px-3 py-2",
        active
          ? // ✅ destaque do ativo: “pill” com leve gradiente + glow
            "bg-gradient-to-br from-lime-400/15 to-indigo-500/10 border-white/25 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_8px_24px_-8px_rgba(99,102,241,0.25)] text-lime-200"
          : "bg-white/5 hover:bg-white/10 border-white/10 text-white/85 hover:text-white"
      )}
    >
      {/* Ícone */}
      <Icon
        size={18}
        className={clsx(
          "transition-transform",
          active ? "scale-[1.02]" : "group-hover:scale-105"
        )}
        aria-hidden
      />

      {/* Label (só no modo expandido) */}
      {!collapsed && <span className="text-sm">{item.label}</span>}

      {/* Tooltip custom (apenas no modo colapsado) */}
      {collapsed && (
        <span
          className={clsx(
            "pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2",
            "rounded-md bg-black/80 text-white text-xs px-2 py-1",
            "opacity-0 translate-x-[-4px] group-hover:opacity-100 group-hover:translate-x-0",
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
