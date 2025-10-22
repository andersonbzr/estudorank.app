import ChangePasswordForm from "@/components/auth/ChangePasswordForm";
import AuthGuard from "@/components/auth/AuthGuard";
import AppShell from "@/components/shell/AppShell";

export default function SecurityPage() {
  return (
    <AuthGuard>
      <AppShell>
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold mb-4">Segurança</h1>
          <p className="text-sm opacity-70 mb-6">
            Atualize sua senha. Por segurança, pediremos sua senha atual para confirmar.
          </p>
          <ChangePasswordForm />
        </div>
      </AppShell>
    </AuthGuard>
  );
}
