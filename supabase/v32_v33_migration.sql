create or replace function public.validate_parking_procedure_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_permit public.parking_permits;
begin
  select * into v_permit
  from public.parking_permits
  where id = new.permit_id;

  if v_permit.id is null then
    raise exception '対象の駐車利用が見つかりません。' using errcode = '23514';
  end if;

  if new.requester_id <> v_permit.user_id
     and not app_private.has_role(array['board_member', 'admin']::public.app_role[]) then
    raise exception '本人の駐車利用のみ手続きできます。' using errcode = '23514';
  end if;

  if v_permit.status <> 'active' then
    raise exception '利用中の駐車許可のみ手続きできます。' using errcode = '23514';
  end if;

  if new.kind = 'return_notice' and new.requested_return_date < current_date + 14 then
    raise exception '返還届は14日以上前に提出してください。' using errcode = '23514';
  end if;

  return new;
end;
$$;

drop policy if exists "parking_procedure_requests_insert_own" on public.parking_procedure_requests;
create policy "parking_procedure_requests_insert_own"
on public.parking_procedure_requests for insert
to authenticated
with check (
  status = 'pending'
  and (
    requester_id = auth.uid()
    or app_private.has_role(array['board_member', 'admin']::public.app_role[])
  )
);
