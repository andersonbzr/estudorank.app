import "./globals.css";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import ToastProvider from "@/components/Toast";
import ThemeHydrator from "@/components/ThemeHydrator";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  variable: "--font-plusjakarta",
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "EstudoRank",
  description: "Plataforma gamificada de estudos",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Aplica a classe light/dark antes de hidratar (evita flash) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function () {
  try {
    var t = localStorage.getItem('theme') || 'system';
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var mode = (t === 'system') ? (prefersDark ? 'dark' : 'light') : t;
    var cls = document.documentElement.classList;
    cls.remove('light','dark');
    cls.add(mode);
  } catch (e) {}
})();
            `,
          }}
        />
      </head>
      <body
        className={`${plusJakarta.variable} ${inter.variable} min-h-screen antialiased`}
        style={{
          backgroundColor: "rgb(var(--bg))",
          color: "rgb(var(--text))",
          fontFamily:
            "var(--font-plusjakarta), var(--font-inter), system-ui, sans-serif",
        }}
      >
        <ThemeHydrator />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
