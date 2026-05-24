revoke execute on function public.update_own_pending_booking(uuid, uuid, timestamptz, timestamptz, text) from public;
revoke execute on function public.cancel_own_pending_booking(uuid) from public;

grant execute on function public.update_own_pending_booking(uuid, uuid, timestamptz, timestamptz, text) to authenticated;
grant execute on function public.cancel_own_pending_booking(uuid) to authenticated;
