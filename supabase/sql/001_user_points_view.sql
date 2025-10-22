-- supabase/sql/001_user_points_view.sql
-- Aggregated points per user with profile name
create or replace view public.user_points_view as
select
  p.id as user_id,
  p.name as name,
  coalesce(sum(g.points), 0) as total_points,
  count(distinct date_trunc('week', g.created_at)) as weeks_count
from public.profiles p
left join public.progress g
  on g.user_id = p.id
group by p.id, p.name;
