drop policy if exists "parking_permits_insert_own" on public.parking_permits;
create policy "parking_permits_insert_own"
on public.parking_permits for insert
to authenticated
with check (
  user_id = auth.uid()
  and status = 'pending'
  and exists (
    select 1 from public.parking_spaces
    where parking_spaces.id = parking_permits.space_id
      and parking_spaces.is_active = true
      and parking_spaces.is_available = true
  )
);
