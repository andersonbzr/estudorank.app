// src/app/settings/page.tsx
import ThemeSelect from "@/components/settings/ThemeSelect";

export default function SettingsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <section className="card p-4">
        <h2 className="text-lg font-semibold mb-3">Preferências</h2>
        <ThemeSelect />
      </section>
    </div>
  );
}
