drop policy if exists "survey_responses_insert_own" on public.survey_responses;
create policy "survey_responses_insert_own"
on public.survey_responses for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.surveys
    where surveys.id = survey_responses.survey_id
      and surveys.is_open = true
      and (surveys.closes_at is null or surveys.closes_at > now())
  )
);

drop policy if exists "survey_responses_update_own" on public.survey_responses;
create policy "survey_responses_update_own"
on public.survey_responses for update
to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.surveys
    where surveys.id = survey_responses.survey_id
      and surveys.is_open = true
      and (surveys.closes_at is null or surveys.closes_at > now())
  )
);

drop policy if exists "safety_checkins_insert_own" on public.safety_checkins;
create policy "safety_checkins_insert_own"
on public.safety_checkins for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.safety_events
    where safety_events.id = safety_checkins.event_id
      and safety_events.status = 'active'
  )
);

drop policy if exists "safety_checkins_update_own" on public.safety_checkins;
create policy "safety_checkins_update_own"
on public.safety_checkins for update
to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.safety_events
    where safety_events.id = safety_checkins.event_id
      and safety_events.status = 'active'
  )
);
