# Segurança & Boas Práticas

- **NUNCA** commitar `.env*` (use `.env.example` com chaves fictícias).
- Mantenha `RLS` ativada no Supabase e políticas como em `supabase/sql/010_rls_policies.sql`.
- Endpoints críticos (ex.: exclusão de conta) exigem **reauth** (header `x-reauth-token`).
- A Service Role deve ser usada **apenas no servidor**.
- Use a view `user_points_view` para ranking eficiente. SQL em `supabase/sql/001_user_points_view.sql`.
