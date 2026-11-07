-- Additive device management. An operator designates one existing device per business.
alter table mora_rc.businesses add column device_admitter_id uuid;
alter table mora_rc.businesses add constraint businesses_device_admitter_fk
 foreign key(id,device_admitter_id) references mora_rc.devices(business_id,id);

create table mora_rc.device_pairings (
 code_hash text primary key check(code_hash ~ '^[0-9a-f]{64}$'),
 business_id uuid not null,
 issuer_id uuid not null,
 expires_at timestamptz not null default (now()+interval '5 minutes'),
 canceled_at timestamptz,
 target_id uuid,
 target_proof text check(target_proof ~ '^[0-9a-f]{64}$'),
 target_label text check(length(target_label) between 1 and 80),
 confirmation text check(confirmation ~ '^[0-9]{4}$'),
 approved_at timestamptz,
 claimed_at timestamptz,
 session_ready_at timestamptz,
 foreign key(business_id,issuer_id) references mora_rc.devices(business_id,id)
);
create index device_pairings_issuer on mora_rc.device_pairings(business_id,issuer_id);
alter table mora_rc.device_pairings enable row level security;
revoke all on mora_rc.device_pairings from public,anon,authenticated;
grant select,insert,update on mora_rc.device_pairings to service_role;

-- An Auth session alone cannot read business data or bypass device revocation.
revoke select on mora_rc.businesses,mora_rc.commands,mora_rc.facts from authenticated;

create function public.mora_rc_manage_devices(
 p_business uuid,p_device uuid,p_actor uuid,p_credential text,p_action text,p_args jsonb
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare
 principal uuid;
 pairing mora_rc.device_pairings;
begin
 select device_admitter_id into principal from mora_rc.businesses where id=p_business for no key update;
 perform public.mora_rc_device_access(p_business,p_device,p_actor,p_credential);
 if p_action='list' and principal is distinct from p_device then
  return jsonb_build_object('canAdmit',false);
 end if;
 if principal is distinct from p_device then
  raise exception using errcode='42501',message='Only the designated device can admit others';
 end if;
 if p_action='list' then
  return jsonb_build_object('canAdmit',true,'devices',coalesce((
   select jsonb_agg(jsonb_build_object('id',d.id,'label',d.label,'principal',d.id=principal) order by d.id=principal desc,d.label,d.id)
   from mora_rc.devices d where d.business_id=p_business and d.revoked_at is null
  ),'[]'::jsonb));
 end if;
 if p_action='revoke' then
  if (p_args->>'targetId')::uuid=principal then
   raise exception using errcode='42501',message='The designated device cannot revoke itself';
  end if;
  update mora_rc.devices set revoked_at=now()
   where business_id=p_business and id=(p_args->>'targetId')::uuid and revoked_at is null;
  return jsonb_build_object('ok',true);
 end if;
 if p_action='issue' then
  update mora_rc.device_pairings set canceled_at=now()
   where business_id=p_business and expires_at>now() and canceled_at is null and claimed_at is null;
  insert into mora_rc.device_pairings(code_hash,business_id,issuer_id)
   values(p_args->>'codeHash',p_business,p_device) returning * into pairing;
  return jsonb_build_object('expiresAt',pairing.expires_at);
 end if;
 if p_action not in ('status','approve','cancel') then
  raise exception using errcode='22023',message='Invalid device action';
 end if;
 select * into pairing from mora_rc.device_pairings
  where code_hash=p_args->>'codeHash' and business_id=p_business and issuer_id=p_device for update;
 if not found or pairing.expires_at<=now() or pairing.canceled_at is not null then
  return jsonb_build_object('state','expired');
 end if;
 if pairing.session_ready_at is not null then
  return jsonb_build_object('state','linked','label',pairing.target_label);
 end if;
 if p_action='cancel' and pairing.claimed_at is null then
  update mora_rc.device_pairings set canceled_at=now() where code_hash=pairing.code_hash;
  return jsonb_build_object('state','expired');
 end if;
 if pairing.target_id is null then
  return jsonb_build_object('state','waiting');
 end if;
 if p_action='approve' then
  update mora_rc.device_pairings set approved_at=coalesce(approved_at,now()) where code_hash=pairing.code_hash;
  pairing.approved_at:=now();
 end if;
 return jsonb_build_object('state',case when pairing.approved_at is null then 'requested' else 'approved' end,
  'label',pairing.target_label,'confirmation',pairing.confirmation);
end $$;
revoke all on function public.mora_rc_manage_devices(uuid,uuid,uuid,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.mora_rc_manage_devices(uuid,uuid,uuid,text,text,jsonb) to service_role;

create function public.mora_rc_pair_device(
 p_code text,p_target uuid,p_proof text,p_action text,p_label text,p_confirmation text
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare
 pairing mora_rc.device_pairings;
 business uuid;
 principal uuid;
 actor uuid;
begin
 if p_target is null or p_proof is null or p_proof !~ '^[0-9a-f]{64}$' or p_action not in ('request','status','claim','complete') then
  raise exception using errcode='22023',message='Invalid device request';
 end if;
 select business_id into business from mora_rc.device_pairings where code_hash=p_code;
 if not found then return jsonb_build_object('state','expired'); end if;
 select device_admitter_id into principal from mora_rc.businesses where id=business for no key update;
 select * into pairing from mora_rc.device_pairings where code_hash=p_code for update;
 if not found or pairing.expires_at<=now() or pairing.canceled_at is not null or principal is distinct from pairing.issuer_id then
  return jsonb_build_object('state','expired');
 end if;
 select user_id into actor from mora_rc.devices where business_id=business and id=principal and revoked_at is null;
 if not found
  or not exists(select 1 from mora_rc.memberships where business_id=business and user_id=actor and revoked_at is null for share)
  or not exists(select 1 from mora_rc.devices where business_id=business and id=principal and user_id=actor and revoked_at is null for share) then
  return jsonb_build_object('state','expired');
 end if;
 if pairing.target_id is null and p_action='request' then
  if p_label is null or length(p_label) not between 1 and 80 or p_confirmation is null or p_confirmation !~ '^[0-9]{4}$' then
   raise exception using errcode='22023',message='Invalid device name';
  end if;
  update mora_rc.device_pairings set target_id=p_target,target_proof=p_proof,target_label=p_label,confirmation=p_confirmation
   where code_hash=p_code returning * into pairing;
 end if;
 if pairing.target_id is distinct from p_target or pairing.target_proof is distinct from p_proof then
  return jsonb_build_object('state','expired');
 end if;
 if pairing.approved_at is null then
  return jsonb_build_object('state','requested','confirmation',pairing.confirmation);
 end if;
 if p_action='complete' and pairing.claimed_at is not null then
  perform public.mora_rc_device_access(business,p_target,actor,p_proof);
  update mora_rc.device_pairings set session_ready_at=coalesce(session_ready_at,now()) where code_hash=p_code;
  return jsonb_build_object('state','linked');
 end if;
 if p_action<>'claim' then return jsonb_build_object('state','approved'); end if;
 if pairing.claimed_at is null then
  insert into mora_rc.devices(business_id,id,user_id,credential_hash,label)
   values(business,p_target,actor,p_proof,pairing.target_label);
  update mora_rc.device_pairings set claimed_at=now() where code_hash=p_code;
 else
  perform public.mora_rc_device_access(business,p_target,actor,p_proof);
 end if;
 return jsonb_build_object('state','linked','businessId',business,'deviceId',p_target,'userId',actor);
end $$;
revoke all on function public.mora_rc_pair_device(text,uuid,text,text,text,text) from public,anon,authenticated;
grant execute on function public.mora_rc_pair_device(text,uuid,text,text,text,text) to service_role;
