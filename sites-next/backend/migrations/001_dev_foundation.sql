-- DEVELOPMENT CANDIDATE ONLY. Never applied by this task.
-- Set mora.dev_approved='isolated-mora-dev' deliberately in a new disposable DB.
-- This migration supports monthly-goal only; business command parity is unfinished.
begin;
do $$begin
 if current_setting('mora.dev_approved',true) is distinct from 'isolated-mora-dev' then
  raise exception 'Explicit isolated Mora development environment required';
 end if;
end$$;
create schema mora_dev;
revoke all on schema mora_dev from public,anon,authenticated;
create table mora_dev.businesses(id uuid primary key, name text not null, revision bigint not null default 0 check(revision>=0));
create table mora_dev.members(business_id uuid references mora_dev.businesses(id), user_id uuid not null, primary key(business_id,user_id));
create table mora_dev.devices(business_id uuid references mora_dev.businesses(id), id uuid not null, user_id uuid not null, revoked_at timestamptz, primary key(business_id,id));
create table mora_dev.commands(business_id uuid references mora_dev.businesses(id),id text not null check(id ~ '^[a-zA-Z0-9_-]{1,80}$'), device_id uuid not null,kind text not null,payload jsonb not null,expected_revision bigint not null,result jsonb not null,at timestamptz not null default now(),primary key(business_id,id),foreign key(business_id,device_id) references mora_dev.devices(business_id,id));
create table mora_dev.goals(business_id uuid references mora_dev.businesses(id), command_id text not null,month date not null check(extract(day from month)=1),amount bigint check(amount>0),at timestamptz not null default now(),primary key(business_id,command_id),foreign key(business_id,command_id) references mora_dev.commands(business_id,id) deferrable initially deferred);
create table mora_dev.migration_batches(business_id uuid references mora_dev.businesses(id),source_namespace uuid not null,source_digest text not null,source_schema integer not null,manifest jsonb not null,status text not null check(status in ('staged','reviewed')),primary key(business_id,source_namespace,source_digest));
create table mora_dev.origin_ids(business_id uuid references mora_dev.businesses(id),source_namespace uuid not null,entity text not null,source_id text not null,target_id uuid not null,primary key(business_id,source_namespace,entity,source_id),unique(business_id,entity,target_id));
-- Future normalized entities are specified in docs/entregas-3-4/contrato-operaciones.md.
-- Do not import real snapshots into these preparation tables.
create function mora_dev.member_of(p_business uuid) returns boolean language sql stable security definer set search_path='' as $$select auth.uid() is not null and exists(select 1 from mora_dev.members m where m.business_id=p_business and m.user_id=auth.uid())$$;
revoke all on function mora_dev.member_of(uuid) from public,anon,authenticated;
grant usage on schema mora_dev to authenticated;
grant execute on function mora_dev.member_of(uuid) to authenticated;
do $$declare t text;begin
 foreach t in array array['businesses','members','devices','commands','goals','migration_batches','origin_ids'] loop
  execute format('alter table mora_dev.%I enable row level security',t);
  execute format('alter table mora_dev.%I force row level security',t);
 end loop;
end$$;
create policy member_read_business on mora_dev.businesses for select to authenticated using(mora_dev.member_of(id));
create policy member_read_commands on mora_dev.commands for select to authenticated using(mora_dev.member_of(business_id));
create policy member_read_goals on mora_dev.goals for select to authenticated using(mora_dev.member_of(business_id));
grant select on mora_dev.businesses,mora_dev.commands,mora_dev.goals to authenticated;
-- No direct write grants. Business provisioning and membership require an operator.
create function public.mora_dev_command_result(p_business uuid,p_id text) returns jsonb language plpgsql security definer set search_path='' as $$declare v jsonb;begin
 if not mora_dev.member_of(p_business) then raise exception 'Not authorized' using errcode='42501';end if;
 select result into v from mora_dev.commands where business_id=p_business and id=p_id;return v;
end$$;
create function public.mora_dev_apply_goal(p_business uuid,p_device uuid,p_id text,p_expected bigint,p_kind text,p_payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_revision bigint;v_existing mora_dev.commands%rowtype;v_result jsonb;v_month date;v_amount bigint;
begin
 if not mora_dev.member_of(p_business) or not exists(select 1 from mora_dev.devices where business_id=p_business and id=p_device and user_id=auth.uid() and revoked_at is null) then raise exception 'Not authorized' using errcode='42501';end if;
 -- Serialize the business revision and debt/lot-equivalent commands on one row.
 select revision into v_revision from mora_dev.businesses where id=p_business for update;
 select * into v_existing from mora_dev.commands where business_id=p_business and id=p_id;
 if found then
  if v_existing.kind is distinct from p_kind or v_existing.payload is distinct from p_payload or v_existing.expected_revision is distinct from p_expected or v_existing.device_id is distinct from p_device then raise exception 'Operation identity reused with different content' using errcode='22023';end if;
  return v_existing.result;
 end if;
 if v_revision<>p_expected then raise exception 'Revision conflict; preserve local physical evidence' using errcode='40001';end if;
 if p_kind<>'monthly-goal' then raise exception 'Business command not implemented in remote development candidate' using errcode='0A000';end if;
 if p_payload->>'month' !~ '^\d{4}-(0[1-9]|1[0-2])$' then raise exception 'Invalid month';end if;
 v_month=(p_payload->>'month'||'-01')::date;
 if not(p_payload ? 'amount') then raise exception 'Amount missing';end if;
 v_amount=(p_payload->>'amount')::bigint;
 if v_amount is not null and v_amount<=0 then raise exception 'Invalid goal';end if;
 v_result=jsonb_build_object('id',p_id,'businessId',p_business,'deviceId',p_device,'kind',p_kind,'payload',p_payload,'expectedRevision',p_expected,'status','confirmed','revision',v_revision+1,'month',p_payload->>'month','amount',v_amount);
 insert into mora_dev.commands(business_id,id,device_id,kind,payload,expected_revision,result) values(p_business,p_id,p_device,p_kind,p_payload,p_expected,v_result);
 insert into mora_dev.goals(business_id,command_id,month,amount) values(p_business,p_id,v_month,v_amount);
 update mora_dev.businesses set revision=revision+1 where id=p_business;
 return v_result;
end$$;
revoke all on function public.mora_dev_command_result(uuid,text) from public,anon;
revoke all on function public.mora_dev_apply_goal(uuid,uuid,text,bigint,text,jsonb) from public,anon;
grant execute on function public.mora_dev_command_result(uuid,text) to authenticated;
grant execute on function public.mora_dev_apply_goal(uuid,uuid,text,bigint,text,jsonb) to authenticated;
commit;
