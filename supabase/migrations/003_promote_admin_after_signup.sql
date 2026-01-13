-- Promote 9003755@qq.com to admin (idempotent)
update public.profiles
set role = 'admin', disabled = false, updated_at = now()
where email = '9003755@qq.com';

