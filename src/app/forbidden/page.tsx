export default function ForbiddenPage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="bg-[var(--surface)] p-8 rounded-2xl border border-white/10 text-center">
        <h1 className="text-2xl font-semibold">Acesso negado</h1>
        <p className="mt-2 opacity-80">Você não tem permissão para acessar esta área.</p>
      </div>
    </main>
  );
}
