-- Explicit review changes the commit precondition, never the sealed original intent.
create function public.mora_rc_commit_reviewed(p_business uuid,p_device uuid,p_actor uuid,p_request jsonb,p_digest text,p_next jsonb,p_response jsonb,p_basis bigint) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare current_revision bigint;prior jsonb;entry record;item record;
begin
  perform mora_rc.assert_actor(p_business,p_device,p_actor);
  -- Serialize all facts of one business; different businesses use different rows.
  select revision into strict current_revision from mora_rc.businesses where id=p_business for update;
  prior:=public.mora_rc_lookup(p_business,p_device,p_actor,p_request);
  if prior is not null then return prior;end if;
  if p_basis is null or p_basis<>current_revision or p_basis<(p_request->>'expectedRevision')::bigint then
    raise exception using errcode='40001',message='Business changed; preserve physical evidence for review';
  end if;
  if p_response->>'status' is distinct from 'confirmed' or (p_response->>'revision')::bigint<>current_revision+1
     or p_response->>'kind' is distinct from p_request->>'kind' or p_response->>'at' is distinct from p_request->>'at'
     or p_response->>'id' is distinct from p_request->>'id' or p_response->'payload' is distinct from p_request->'payload'
     or p_response->>'businessId' is distinct from p_business::text or p_response->>'deviceId' is distinct from p_device::text
     or jsonb_typeof(p_next) is distinct from 'object' then
    raise exception using errcode='22023',message='Invalid server confirmation';
  end if;
  update mora_rc.businesses set revision=current_revision+1,snapshot=p_next,updated_at=now() where id=p_business;
  insert into mora_rc.commands(business_id,id,device_id,user_id,request,digest,response,revision)
    values(p_business,p_request->>'id',p_device,p_actor,p_request,p_digest,p_response,current_revision+1);
  delete from mora_rc.facts where business_id=p_business;
  for entry in select key,value from jsonb_each(p_next) where key in ('products','sales','lots','receipts','purchaseOrders','supplierLists','supplierAliases','priceReviews','ledger','referenceLog','checks','operations','stockOpenings','stockReviews','stockResolutions','debts','debtPayments','saleCorrections','inventoryAdjustments','receiptPayments','debtAdjustments','monthlyGoals') loop
    for item in select value,ordinality from jsonb_array_elements(entry.value) with ordinality loop
      insert into mora_rc.facts values(p_business,entry.key,item.ordinality-1,item.value);
    end loop;
  end loop;
  return p_response;
end $$;
revoke all on function public.mora_rc_commit_reviewed(uuid,uuid,uuid,jsonb,text,jsonb,jsonb,bigint) from public,anon,authenticated;
grant execute on function public.mora_rc_commit_reviewed(uuid,uuid,uuid,jsonb,text,jsonb,jsonb,bigint) to service_role;
-- Read only three session columns; do not modify Auth data or expose the auth schema.
grant select(id,user_id,not_after) on auth.sessions to service_role;
create function public.mora_rc_session_valid(p_actor uuid,p_session uuid) returns boolean
language sql security invoker set search_path='' as $$
 select exists(select 1 from auth.sessions where id=p_session and user_id=p_actor and (not_after is null or not_after>now()));
$$;
revoke all on function public.mora_rc_session_valid(uuid,uuid) from public,anon,authenticated;
grant execute on function public.mora_rc_session_valid(uuid,uuid) to service_role;
