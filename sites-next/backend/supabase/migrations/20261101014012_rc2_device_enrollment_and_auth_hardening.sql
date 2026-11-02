-- Incremental RC2 migration. RC1 must already exist; preserve all rows and legacy archive.
do $$begin if to_regclass('mora_rc.businesses') is null then raise exception 'Mora RC1 must already be installed'; end if;end$$;
alter table mora_rc.devices add column credential_hash text check(credential_hash ~ '^[0-9a-f]{64}$');
alter table mora_rc.devices add column label text not null default 'Dispositivo Mora' check(length(label) between 1 and 80);
create index commands_device_fk on mora_rc.commands(business_id,device_id);
create index commands_user_fk on mora_rc.commands(business_id,user_id);
create index devices_user_fk on mora_rc.devices(business_id,user_id);
create table mora_rc.enrollments(
 code_hash text primary key check(code_hash ~ '^[0-9a-f]{64}$'),
 business_id uuid not null,
 user_id uuid not null,
 expires_at timestamptz not null,
 used_device uuid,
 used_at timestamptz,
 foreign key(business_id,user_id) references mora_rc.memberships(business_id,user_id),
 foreign key(business_id,used_device) references mora_rc.devices(business_id,id),
 check((used_device is null)=(used_at is null))
);
alter table mora_rc.enrollments enable row level security;
revoke all on mora_rc.enrollments from public,anon,authenticated;
grant select,update on mora_rc.enrollments to service_role;
grant insert on mora_rc.devices to service_role;
-- Device proof is independent of Auth and checked on every read/result/write.
create function public.mora_rc_device_access(p_business uuid,p_device uuid,p_actor uuid,p_credential text) returns boolean
language plpgsql security invoker set search_path='' as $$
begin
 perform mora_rc.assert_actor(p_business,p_device,p_actor);
 if not exists(select 1 from mora_rc.devices where business_id=p_business and id=p_device and user_id=p_actor and credential_hash=p_credential and credential_hash is not null) then
  raise exception using errcode='42501',message='Device credential not authorized';
 end if;
 return true;
end$$;
revoke all on function public.mora_rc_device_access(uuid,uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.mora_rc_device_access(uuid,uuid,uuid,text) to service_role;
create function public.mora_rc_enroll(p_actor uuid,p_code text,p_device uuid,p_credential text,p_label text) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare e mora_rc.enrollments;
begin
 if p_actor is null or p_device is null or p_credential is null or p_credential !~ '^[0-9a-f]{64}$' or length(p_label) not between 1 and 80 then
  raise exception using errcode='22023',message='Invalid enrollment';
 end if;
 select * into e from mora_rc.enrollments where code_hash=p_code and user_id=p_actor for update;
 if not found or e.expires_at<=now() then raise exception using errcode='42501',message='Enrollment unavailable';end if;
 if not exists(select 1 from mora_rc.memberships where business_id=e.business_id and user_id=p_actor and revoked_at is null for share) then
  raise exception using errcode='42501',message='Membership unavailable';end if;
 if e.used_device is not null then
  if e.used_device<>p_device then raise exception using errcode='42501',message='Enrollment already used';end if;
  perform public.mora_rc_device_access(e.business_id,p_device,p_actor,p_credential);
 else
  insert into mora_rc.devices(business_id,id,user_id,credential_hash,label) values(e.business_id,p_device,p_actor,p_credential,p_label);
  update mora_rc.enrollments set used_device=p_device,used_at=now() where code_hash=p_code;
 end if;
 return jsonb_build_object('businessId',e.business_id,'deviceId',p_device,'userId',p_actor);
end$$;
revoke all on function public.mora_rc_enroll(uuid,text,uuid,text,text) from public,anon,authenticated;
grant execute on function public.mora_rc_enroll(uuid,text,uuid,text,text) to service_role;
-- Normal Auth users must also be members. Anonymous identities never inherit these policies.
alter policy own_membership on mora_rc.memberships using(user_id=(select auth.uid()) and revoked_at is null and ((select auth.jwt())->>'is_anonymous')::boolean is false);
alter policy visible_business on mora_rc.businesses using(((select auth.jwt())->>'is_anonymous')::boolean is false and exists(select 1 from mora_rc.memberships m where m.business_id=businesses.id and m.user_id=(select auth.uid()) and m.revoked_at is null));
alter policy own_devices on mora_rc.devices using(((select auth.jwt())->>'is_anonymous')::boolean is false and user_id=(select auth.uid()) and revoked_at is null and exists(select 1 from mora_rc.memberships m where m.business_id=devices.business_id and m.user_id=(select auth.uid()) and m.revoked_at is null));
alter policy visible_commands on mora_rc.commands using(((select auth.jwt())->>'is_anonymous')::boolean is false and exists(select 1 from mora_rc.memberships m where m.business_id=commands.business_id and m.user_id=(select auth.uid()) and m.revoked_at is null));
alter policy visible_facts on mora_rc.facts using(((select auth.jwt())->>'is_anonymous')::boolean is false and exists(select 1 from mora_rc.memberships m where m.business_id=facts.business_id and m.user_id=(select auth.uid()) and m.revoked_at is null));
