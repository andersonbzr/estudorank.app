"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function ChangePasswordPage() {
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");

  const handleChange = async () => {
    if (newPwd !== confirm) {
      setMsg("As senhas não coincidem.");
      return;
    }

    const supabase = supabaseBrowser();

    // Tenta reautenticar usando a senha antiga (opcional para confirmar identidade)
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: (await supabase.auth.getUser()).data.user?.email!,
      password: oldPwd,
    });
    if (signInErr) {
      setMsg("Senha atual incorreta.");
      return;
    }

    // Atualiza a senha
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    if (error) {
      setMsg("Erro ao atualizar senha: " + error.message);
    } else {
      setMsg("Senha alterada com sucesso!");
      setOldPwd(""); setNewPwd(""); setConfirm("");
    }
  };

  return (
    <div className="max-w-sm mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Alterar senha</h1>
      <input type="password" placeholder="Senha atual" value={oldPwd}
        onChange={e => setOldPwd(e.target.value)} className="input" />
      <input type="password" placeholder="Nova senha" value={newPwd}
        onChange={e => setNewPwd(e.target.value)} className="input" />
      <input type="password" placeholder="Confirmar nova senha" value={confirm}
        onChange={e => setConfirm(e.target.value)} className="input" />
      <button onClick={handleChange} className="btn w-full">Salvar nova senha</button>
      <p className="text-sm text-center text-green-400">{msg}</p>
    </div>
  );
}
