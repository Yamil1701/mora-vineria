"""Opt-in hosted QA. Requires an external, private synthetic fixture; never commits credentials.
Run MORA_HOSTED_FIXTURE=/private/auth-fixture.json python scripts/hosted-qa.py.
Assertions inspect authoritative snapshots; fixture must contain synthetic run metadata.
"""
import json,os,urllib.request,urllib.error,datetime,concurrent.futures,hashlib,socket,time
from pathlib import Path
p=Path(os.environ['MORA_HOSTED_FIXTURE']);f=json.loads(p.read_text());cfg=json.loads((p.parent/'public-key.json').read_text());assert cfg['url']=='https://dedcvvgiuxpwdzqqdifn.supabase.co'
assert all(u['session']['user']['app_metadata'].get('mora_synthetic_run')==f['run'] for u in f['users'])
results=[]
def req(path,body,headers={}):
 r=urllib.request.Request(cfg['url']+path,data=json.dumps(body).encode(),headers={'apikey':cfg['publishableKey'],'Content-Type':'application/json',**headers})
 try:
  with urllib.request.urlopen(r,timeout=15)as x:return x.status,json.load(x)
 except (TimeoutError,socket.timeout,urllib.error.URLError) as x:
  if not isinstance(x,urllib.error.HTTPError):return 0,{'code':'UNKNOWN','message':'Transport interrupted'}
  try:b=json.load(x)
  except:b={}
  return x.code,b
 except urllib.error.HTTPError as x:
  try:b=json.load(x)
  except:b={}
  return x.code,b
expired=f['users'][0]['session']['access_token']
for u in f['users']:
 if u['session'].get('expires_at',0)>time.time()+120:continue
 status,data=req('/auth/v1/token?grant_type=refresh_token',{'refresh_token':u['session']['refresh_token']});assert status==200,('refresh',status,data.get('msg'));u['session']=data
p.write_text(json.dumps(f));p.chmod(0o600)
def call(action,c,d=0,token=None,key=None,origin='https://127.0.0.1:8443'):
 dev=f['devices'][d];return req('/functions/v1/mora-command',{'action':action,'command':c},{'Authorization':'Bearer '+(token or f['users'][dev['userIndex']]['session']['access_token']),'x-mora-device-key':key or dev['key'],'Origin':origin,**({'x-mora-import':'1'}if c.get('kind')=='import-initial'else{})})
low_call=call
transport_recoveries=[]
def call(action,c,d=0,**options):
 for attempt in range(4):
  status,b=low_call(action,c,d,**options)
  if status not in[0,503]:return status,b
  transport_recoveries.append({'action':action,'status':status,'attempt':attempt+1})
  if action in['submit','review']:
   found_status,found=low_call('result',c,d,**options)
   if found_status==200 and found is not None:return found_status,found
  time.sleep(.25*(attempt+1))
 return status,b

def binding(d=0):
 dev=f['devices'][d];return dict(businessId=f['businesses'][dev['businessIndex']],deviceId=dev['id'])
def read(d=0):
 status,b=call('read',binding(d),d);assert status==200,('read',status,b);return b
at='2026-11-01T12:00:00.000Z'
def command(i,k,payload,d=0,revision=None):
 commands=f.setdefault('commands',{})
 if i in commands:
  c=commands[i];assert c['kind']==k and c['payload']==payload and c['deviceId']==binding(d)['deviceId'];return c
 c=dict(id=i,kind=k,payload=payload,at=at,expectedRevision=read(d)['revision']if revision is None else revision,**binding(d));commands[i]=c;p.write_text(json.dumps(f));return c
def submit(i,k,p,d=0):
 c=command(i,k,p,d);status,b=call('submit',c,d);assert status==200,(i,status,b);assert b['status']=='confirmed';return b

def check(name,fn):
 try: detail=fn();results.append(dict(name=name,status='passed',detail=detail));print('PASS',name,flush=True)
 except Exception as e:results.append(dict(name=name,status='failed',error=str(e)));raise

def security():
 for token in ['not-a-jwt',expired]:assert call('read',binding(),token=token)[0]==401
 assert call('read',binding(),key='f'*64)[0]==403
 assert call('read',dict(businessId=f['businesses'][1],deviceId=f['devices'][0]['id']))[0]==403
 assert call('read',binding(),token=f['users'][2]['session']['access_token'])[0]==403
 assert call('read',binding(),origin='https://untrusted.example')[0]==403
 # Browser identities cannot call privileged RPCs or change shared rows.
 h={'Authorization':'Bearer '+f['users'][0]['session']['access_token']}
 assert req('/rest/v1/rpc/mora_rc_read',{'p_business':f['businesses'][0],'p_device':f['devices'][0]['id'],'p_actor':f['created'][0]['id']},h)[0]in[401,403,404]
 return {'authenticNonanonymousJWTs':3,'invalidAndExpiredRejected':True,'foreignBusinessAndUserRejected':True,'deviceProofAndOriginRequired':True}

def commercial():
 assert read()['revision']==0,'Use a fresh isolated run for a repeat. Existing synthetic results are preserved.'
 product=dict(name='QA Botella',variety='Descartable',cat='Otros',volume='750',volumeUnit='ml',price='3500',target='10',barcode='',model='bottle',photo='')
 submit('qa_product','product-write',product)
 submit('qa_product2','product-write',{**product,'name':'QA Sin costo','price':'4000'})
 submit('qa_open','opening',{'items':[{'productId':'qa_product','qty':12,'totalCost':17500},{'productId':'qa_product2','qty':3,'totalCost':None}]})
 submit('qa_sale','sale',{'items':[{'id':'qa_product','qty':3,'price':3500,'catalogPriceAtAdd':3500}],'method':'mixed','cashShare':'3000','received':5000,'creditAmount':5000,'customer':'QA DESCARTABLE','transferAccount':'brubank','transferVerified':False})
 s=read()['snapshot'];assert len(s['sales'])==1 and s['products'][0]['stock']==9 and s['lots'][0]['remaining']==9 and s['debts'][0]['amount']==5000 and len(s['ledger'])==1
 assert s['lots'][1]['totalCost']is None
 submit('qa_verify','verify-transfer',{'saleNumber':'001','partId':'1'})
 return {'sales':1,'stock':9,'debt':5000,'fifoNumerator':s['sales'][0]['items'][0]['costFraction']['n']}

def retries():
 c=command('qa_100','debt-payment',{'debtId':'debt_qa_sale','amount':2000,'method':'cash'})
 with concurrent.futures.ThreadPoolExecutor(max_workers=12)as pool:r=list(pool.map(lambda _:call('submit',c),range(100)))
 assert all(status==200 and b==r[0][1]for status,b in r),[(status,b)for status,b in r if status!=200][:2]
 assert len(read()['snapshot']['debtPayments'])==1
 assert call('submit',{**c,'payload':{**c['payload'],'amount':1000}})[0]in[409,422]
 c_race=command('qa_retry_race','movement',{'kind':'expense','amount':1,'account':'cash','note':'QA carrera de mismo ID'})
 with concurrent.futures.ThreadPoolExecutor(max_workers=12)as pool:race=list(pool.map(lambda _:call('submit',c_race),range(100)))
 assert all(status==200 and b==race[0][1]for status,b in race),[(status,b)for status,b in race if status!=200][:2]
 assert len([x for x in read()['snapshot']['ledger']if x['source']=='manual:qa_retry_race'])==1
 # Simulate discarding an actual committed HTTP response and recovering from a new request.
 c2=command('qa_lost','movement',{'kind':'expense','amount':100,'account':'cash','note':'QA respuesta descartada'})
 assert call('submit',c2)[0]==200
 status,b=call('result',c2);assert status==200 and b['status']=='confirmed';assert call('submit',c2)[1]==b
 assert len([x for x in read()['snapshot']['ledger']if x['source']=='manual:qa_lost'])==1
 return {'actualRequests':100,'payments':1,'duplicateChangedContentRejected':True,'lostResponseLookup':True}

def concurrency():
 revision=read()['revision'];one=command('qa_parallel_a','debt-payment',{'debtId':'debt_qa_sale','amount':2000,'method':'cash'},0,revision);two=command('qa_parallel_b','debt-payment',one['payload'],1,revision)
 with concurrent.futures.ThreadPoolExecutor(max_workers=2)as pool:a,b=list(pool.map(lambda pair:call('submit',*pair),[(one,0),(two,1)]))
 assert sorted([a[0],b[0]])==[200,409],(a,b)
 s=read()['snapshot'];assert sum(x['amount']for x in s['debtPayments'])==4000
 loser,device=(one,0)if a[0]!=200 else(two,1)
 assert call('review',{**loser,'reviewRevision':read()['revision']},device)[0]==422
 assert sum(x['amount']for x in read()['snapshot']['debtPayments'])==4000
 # Two physical sales: one revision conflict, then explicit review preserves original ID/date.
 rev=read()['revision'];sales=[command('qa_two_sale_'+str(n),'sale',{'items':[{'id':'qa_product','qty':1,'price':3500,'catalogPriceAtAdd':3500}],'method':'cash','received':3500},n,rev)for n in[0,1]]
 with concurrent.futures.ThreadPoolExecutor(max_workers=2)as pool:r=list(pool.map(lambda n:call('submit',sales[n],n),[0,1]))
 assert sorted(x[0]for x in r)==[200,409],r
 n=next(n for n,x in enumerate(r)if x[0]==409);status,b=call('review',{**sales[n],'reviewRevision':read()['revision']},n);assert status==200,(status,b)
 s=read()['snapshot'];assert len(s['sales'])==3 and s['products'][0]['stock']==7
 return {'independentDevices':2,'debtPaid':4000,'overpaymentReviewRejected':True,'physicalSalesPersisted':3,'stock':7}

def modules():
 submit('qa_loss','inventory-adjustment',{'productId':'qa_product','expectedStock':7,'counted':6,'reason':'Rotura QA','reasonKind':'loss','totalCost':None})
 submit('qa_pp','purchase-presentation',{'productId':'qa_product','config':{'supplier':'QA','presentation':'Caja','unitsPerPack':6,'packCost':12000}})
 submit('qa_order','order-create',{'supplier':'QA','note':'Pedido sintético','items':[{'productId':'qa_product','qty':6}]})
 submit('qa_sent','order-sent',{'orderId':'qa_order'})
 submit('qa_receive','receive',{'orderId':'qa_order','supplier':'QA','note':'Parcial','items':[{'productId':'qa_product','qty':2,'lineCost':4000}],'paid':False,'account':'cash'})
 submit('qa_receipt_pay','receipt-payment',{'receiptId':'qa_receive','amount':1000,'account':'cash','paidConfirmed':True})
 submit('qa_receipt_rest','receipt-payment',{'receiptId':'qa_receive','amount':3000,'account':'brubank','paidConfirmed':True})
 submit('qa_close_order','order-close',{'orderId':'qa_order'})
 submit('qa_correction','sale-correction',{'saleId':'qa_sale','expectedRevision':0,'type':'commercial','reason':'Precio QA','items':[{'id':'qa_product','qty':3,'price':4000}],'discount':0,'settlement':'debt','customer':'QA DESCARTABLE','account':'cash','occurredConfirmed':False})
 submit('qa_account','sale-correction',{'saleId':'qa_sale','expectedRevision':1,'type':'account','reason':'Cuenta QA','partId':'0','account':'mp','occurredConfirmed':True})
 submit('qa_goal','monthly-goal',{'month':'2026-11','amount':50000})
 submit('qa_reference','reference',{'account':'cash','amount':20000})
 submit('qa_check','check',{'account':'cash','amount':20000})
 for kind in ['contribution','withdrawal','move']:
  submit('qa_'+kind,'movement',{'kind':kind,'amount':100,'account':'cash',**({'to':'brubank'}if kind=='move'else{'toAccount':'brubank'}),'note':'QA '+kind})
 submit('qa_inactive','product-active',{'productId':'qa_product2','active':False})
 submit('qa_active','product-active',{'productId':'qa_product2','active':True})
 s=read()['snapshot'];assert len(s['sales'])==3 and s['products'][0]['stock']==8 and len(s['receipts'])==1 and len(s['receiptPayments'])==2 and len(s['saleCorrections'])==2 and len(s['monthlyGoals'])==1 and len(s['checks'])==1
 before=read();bad=command('qa_bad','movement',{'kind':'expense','amount':-1,'account':'cash','note':'QA'})
 assert call('submit',bad)[0]==422 and read()==before
 return {'revision':before['revision'],'sales':3,'stock':8,'receipts':1,'payments':2,'corrections':2,'rollbackUnchanged':True}
def additional_families():
 submit('qa_supplier_list','supplier-list',{'supplier':'QA Mayorista','source':'QA Botella 12000'})
 row=next(x for x in read()['snapshot']['supplierLists']if x['id']=='qa_supplier_list')['rows'][0]
 submit('qa_supplier_row','supplier-row',{'listId':'qa_supplier_list','rowId':row['id'],'values':{'productId':'qa_product','presentation':'Caja','unitsPerPack':6,'packCost':12000,'finalPrice':4000}})
 submit('qa_supplier_prices','supplier-prices',{'listId':'qa_supplier_list','selectedRowIds':[row['id']]})
 product=next(x for x in read()['snapshot']['products']if x['id']=='qa_product')
 submit('qa_adopt','adopt-price',{'receiptId':'qa_receive','productId':'qa_product','expectedPriceVersion':product.get('priceVersion',0)})
 submit('qa_unknown','sale',{'items':[{'id':'qa_product2','qty':4,'price':4000,'catalogPriceAtAdd':4000}],'method':'cash','received':16000,'shortageAccepted':True,'acceptanceVersion':2,'shortageAcknowledgements':[{'id':'qa_product2','qty':4,'stock':3,'missing':1}]})
 sale=next(x for x in read()['snapshot']['sales']if x['id']=='qa_unknown');assert sale['items'][0]['unknownQty']==4 and sale['items'][0]['costFraction']is None
 submit('qa_stock_resolution','resolve-stock',{'reviewId':'qa_unknown_review_0','evidence':'Comprobante sintético de costo y unidad omitida','stockDelta':1,'totalCost':8000})
 submit('qa_ambiguous','correction-review',{'saleId':'qa_sale','reason':'Devolución sin evidencia suficiente','requested':{'refund':'needs review'}})
 snapshot=read()['snapshot'];assert next(x for x in snapshot['products']if x['id']=='qa_product2')['stock']==0;assert next(x for x in snapshot['sales']if x['id']=='qa_unknown')==sale;assert snapshot['saleCorrections'][-1]['status']=='review'
 product=next(x for x in snapshot['products']if x['id']=='qa_product')
 submit('qa_edit_product','product-write',{'id':product['id'],'expectedPriceVersion':product.get('priceVersion',0),'name':'QA Botella editada','variety':product['variety'],'cat':product['cat'],'volume':'750','volumeUnit':'ml','price':str(product['price']),'target':'15','barcode':'','model':'bottle','photo':''})
 return {'supplierLists':1,'aliases':len(snapshot['supplierAliases']),'priceReviews':len(snapshot['priceReviews']),'unknownUnitsPreserved':4,'stockResolution':1,'ambiguousCorrectionPending':True,'productEdit':True}

def distinct_sessions_and_returns():
 assert f['users'][0]['session']['access_token']!=f['users'][1]['session']['access_token']
 before=read()['snapshot'];revision=read()['revision']
 commands=[command('qa_sessions_a','movement',{'kind':'contribution','amount':100,'account':'cash','note':'QA sesión A'},0,revision),command('qa_sessions_b','movement',{'kind':'expense','amount':10,'account':'cash','note':'QA sesión B'},2,revision)]
 with concurrent.futures.ThreadPoolExecutor(max_workers=2)as pool:r=list(pool.map(lambda n:call('submit',commands[n],[0,2][n]),[0,1]))
 assert sorted(x[0]for x in r)==[200,409],r
 loser=next(n for n,x in enumerate(r)if x[0]==409);status,b=call('review',{**commands[loser],'reviewRevision':read()['revision']},[0,2][loser]);assert status==200,(status,b)
 snapshot=read()['snapshot'];movements=[x for x in snapshot['ledger']if x['source']in['manual:qa_sessions_a','manual:qa_sessions_b']];assert len(movements)==2 and sum(l['amount']for m in movements for l in m['legs'])==90;assert snapshot['sales']==before['sales'] and snapshot['lots']==before['lots']
 submit('qa_return_product','product-write',{'name':'QA devolución','variety':'Descartable','cat':'Otros','volume':'750','volumeUnit':'ml','price':'3500','target':'4','barcode':'','model':'bottle','photo':''})
 submit('qa_return_open','opening',{'items':[{'productId':'qa_return_product','qty':4,'totalCost':8000}]})
 submit('qa_return_sale','sale',{'items':[{'id':'qa_return_product','qty':2,'price':3500,'catalogPriceAtAdd':3500}],'method':'cash','received':7000})
 original=next(x for x in read()['snapshot']['sales']if x['id']=='qa_return_sale')
 answer=submit('qa_quantity_return','sale-correction',{'saleId':'qa_return_sale','expectedRevision':0,'type':'commercial','reason':'Una unidad devuelta realmente, QA sintético','items':[{'id':'qa_return_product','qty':1,'price':3500}],'discount':0,'settlement':'paid','account':'cash','occurredConfirmed':True});assert answer['result']['status']=='applied'
 submit('qa_money_refund','sale-correction',{'saleId':'qa_return_sale','expectedRevision':1,'type':'money','reason':'Devolución de dinero realmente efectuada, QA','amount':1000,'direction':'refund','account':'cash','occurredConfirmed':True})
 snapshot=read()['snapshot'];assert next(x for x in snapshot['sales']if x['id']=='qa_return_sale')==original;assert next(x for x in snapshot['products']if x['id']=='qa_return_product')['stock']==3;returned=next(x for x in snapshot['lots']if x.get('correctionId')=='qa_quantity_return');assert returned['qty']==1 and returned['unitCost']==2000
 assert sum(l['amount']for x in snapshot['ledger']if x['source']in['correction:qa_quantity_return','correction:qa_money_refund']for l in x['legs'])==-4500
 c=command('qa_snapshot_ignored','monthly-goal',{'month':'2027-01','amount':1});status,b=call('submit',{**c,'userId':f['created'][2]['id'],'snapshot':{'products':[]}});assert status==200,(status,b);assert len(read()['snapshot']['products'])==len(snapshot['products']) and 'userId'not in b
 return {'distinctAuthenticUsers':2,'moneyNet':90,'returnedUnits':1,'returnCost':2000,'realRefunds':4500,'originalSaleUnchanged':True,'browserSnapshotIgnored':True}

cases=[('hosted-auth-and-isolation',security),('hosted-products-opening-sale-fifo',commercial),('hosted-100-retries-and-lost-response',retries),('hosted-independent-device-concurrency-and-reviewed-sale',concurrency),('hosted-inventory-purchases-corrections-cash-goals',modules),('hosted-supplier-prices-unknown-cost-review-and-product-edit',additional_families),('hosted-distinct-sessions-quantity-return-refund-and-forged-snapshot',distinct_sessions_and_returns)]
out=Path(os.environ.get('MORA_HOSTED_OUTPUT','artifacts/hosted-results.json'))
start=int(os.environ.get('MORA_HOSTED_START','0'))
if start and out.exists():results=[r for r in json.loads(out.read_text())['results']if r['status']=='passed']
try:
 for name,fn in cases[start:]:check(name,fn)
finally:
 out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps({'environment':'mora-isolated-dev','project':'dedcvvgiuxpwdzqqdifn','run':f['run'],'transportRecoveries':transport_recoveries,'results':results},indent=2))
