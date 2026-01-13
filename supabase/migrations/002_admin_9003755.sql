-- Promote user with email to admin; create profile if missing
do $$
declare
  u_id uuid;
begin
  select id into u_id from auth.users where email = '9003755@qq.com';
  if u_id is not null then
    insert into public.profiles (id, email, name, role, disabled)
    select u.id, u.email, coalesce(u.raw_user_meta_data->>'name',''), 'admin', false
    from auth.users u
    where u.id = u_id
      and not exists (select 1 from public.profiles p where p.id = u_id);

    update public.profiles set role = 'admin', disabled = false, updated_at = now()
    where id = u_id;
  end if;
end $$;

