// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

// ✅ default import (sem chaves)
import ToastProvider from "@/components/Toast";

export const metadata: Metadata = {
  title: "EstudoRank",
  description: "Plataforma de ranking e progresso em estudo — tema escuro fixo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-black text-white min-h-screen antialiased selection:bg-lime-400/20 selection:text-lime-300">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
