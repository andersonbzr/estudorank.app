// src/app/me/MeClient.tsx
"use client";

import { useToast } from "@/components/Toast";

type Props = { initialData?: any };

export default function MeClient({ initialData }: Props) {
  const { toast } = useToast(); // ✅ aqui pode

  return (
    <div>
      <h1 className="text-lg font-semibold mb-4">Meu Painel</h1>
      <button
        className="btn btn-primary"
        onClick={() => toast({ title: "Olá!", description: "Exemplo de toast." })}
      >
        Testar toast
      </button>
      {/* renderize o resto do conteúdo da página aqui */}
    </div>
  );
}
