-- Optional column: partner portal / admin overview bucket (school vs org vs Miradi).
-- Run in Supabase SQL Editor after `public.organisations` exists.

begin;

do $$
begin
  if to_regclass('public.organisations') is null then
    return;
  end if;
  execute $ddl$
    alter table public.organisations
      add column if not exists overview_type text null
  $ddl$;
  begin
    alter table public.organisations
      add constraint organisations_overview_type_check
      check (overview_type is null or overview_type in ('SCHOOL', 'ORGANISATION', 'MIRADI'));
  exception
    when duplicate_object then null;
  end;
  execute $c$
    comment on column public.organisations.overview_type is
      'Optional: SCHOOL | ORGANISATION | MIRADI. Frontend maps to org portal copy (e.g. attendance card).'
  $c$;
end;
$$;

commit;
