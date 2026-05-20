-- v24: 本人の pending 会議室予約を RPC 経由で編集/取消

create or replace function public.update_own_pending_booking(
  p_booking_id uuid,
  p_room_id uuid,
  p_start_at timestamptz,
  p_end_at timestamptz,
  p_purpose text
)
returns public.room_bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.room_bookings;
begin
  if p_end_at <= p_start_at then
    raise exception '終了時間は開始時間より後にしてください。';
  end if;

  update public.room_bookings
  set
    room_id = p_room_id,
    start_at = p_start_at,
    end_at = p_end_at,
    purpose = p_purpose
  where id = p_booking_id
    and user_id = auth.uid()
    and status = 'pending'
  returning * into v_booking;

  if v_booking.id is null then
    raise exception '編集対象の予約が見つからないか、編集できません。';
  end if;

  return v_booking;
end;
$$;

create or replace function public.cancel_own_pending_booking(
  p_booking_id uuid
)
returns public.room_bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.room_bookings;
begin
  update public.room_bookings
  set status = 'cancelled'
  where id = p_booking_id
    and user_id = auth.uid()
    and status = 'pending'
  returning * into v_booking;

  if v_booking.id is null then
    raise exception '取消対象の予約が見つからないか、取消できません。';
  end if;

  return v_booking;
end;
$$;

grant execute on function public.update_own_pending_booking(uuid, uuid, timestamptz, timestamptz, text) to authenticated;
grant execute on function public.cancel_own_pending_booking(uuid) to authenticated;
