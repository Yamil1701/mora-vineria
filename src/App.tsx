import { useEffect, useMemo, useRef, useState } from 'react';
import { liveQuery } from 'dexie';
import { AppShell, BottomNav, EmptyState, GlassPanel, Money, MoraButton, QuantityStepper, ScreenHeader, type MoraDestination } from './ui/components';
import { formatArs } from './ui/format';
import { Icon } from './app/icons';
import { ProductArt } from './app/ProductArt';
import { ProductForm, StockForm, History, errorText } from './app/OperationForms';
import { Dialog } from './app/Dialog';
import { MovementForm, MovementDetails, type MovementKind } from './app/MovementForms';
import { ReplenishmentScreen, ReceiptForm } from './app/Replenishment';
import { MoreScreen, InventoryScreen, CashScreen } from './app/BusinessScreens';
import { useNavigation, screenLabels, type Screen, type Stage } from './app/navigation';
import { BackupPanel } from './app/BackupPanel';
import { MovementSummary } from './app/MovementSummary';
import { catalog, report, movementReport, stockMap, type Period, type SortOrder } from './app/projections';
import { applyPwaUpdate, setupPwaUpdateNotice } from './app/pwa';
import { businessDate, parseInteger, roundCost, saleTotal, sum } from './domain/rules';
import { stockAlert } from './domain/stock';
import type { Draft, FormOperation, Product, ProductFields } from './domain/types';
import { LocalDatabase } from './local/database';
import { draftLine, LocalService } from './local/service';

type Snapshot = Awaited<ReturnType<LocalService['snapshot']>>;
type Modal = ({kind:'receipt'} | { kind:'movement'; movementKind:MovementKind } | { kind: 'product'; product?: Product } | { kind: 'stock'; product: Product; opening: boolean }) & { initial?: FormOperation } | null;
const sortLabels: Record<SortOrder, string> = { nombre: 'Nombre (A–Z)', precioAsc: 'Menor precio', precioDesc: 'Mayor precio', stock: 'Menor stock' };
function SectionTitle({ title, children, icon }: { title: string; children?: React.ReactNode; icon?: 'box' | 'star' | 'chart' }) { return <div className="m2-section-top"><div className="m2-section-top__name">{icon && <Icon name={icon} size={21}/>}<h2>{title}</h2></div>{children}</div>; }
function ProductLine({ product: p, stock, disabled, onAdd, onOpen }: { product: Product; stock: number; disabled: boolean; onAdd?: () => void; onOpen?: () => void }) {
  const alert = stockAlert(stock, p.objective);
  return <div className={`m2-catalog-row ${alert.needsReplenishment ? 'm2-catalog-row--low' : ''}`}><ProductArt product={p} className="m2-catalog-row__art"/><div className="m2-catalog-row__body"><span className="m2-product-name">{p.name}</span><span className="m2-product-subtitle">{p.variant || 'Unidad individual'}{p.active ? '' : ' · Inactivo'}</span><strong className="m2-row-price">{formatArs(p.price)}</strong>{!onOpen && <span className="m2-stock-hint">Stock registrado: {stock} un.</span>}</div>{onOpen ? <div className="m2-catalog-row__end"><span className={`m2-stockpill ${alert.needsReplenishment ? 'm2-stockpill--low' : ''}`}>{stock} un.</span><button className="m2-icon-outline" onClick={onOpen} type="button" aria-label={`Ver ${p.name}`}><Icon name="chevron"/></button></div> : <button className="m2-round-add" type="button" aria-label={`Agregar ${p.name}`} disabled={disabled} onClick={onAdd}><Icon name="plus" size={22}/></button>}</div>;
}
export default function App() {
  const [service] = useState(() => new LocalService(new LocalDatabase()));
  const [view, setView] = useState<Snapshot | null>(null), [fatal, setFatal] = useState('');
  const nav = useNavigation();
  useEffect(()=>{
    const viewport=window.visualViewport;
    if(!viewport)return;
    const update=()=>document.documentElement.style.setProperty('--mv-keyboard-inset',`${Math.max(0,window.innerHeight-viewport.height-viewport.offsetTop)}px`);
    viewport.addEventListener('resize',update);viewport.addEventListener('scroll',update);update();
    return()=>{viewport.removeEventListener('resize',update);viewport.removeEventListener('scroll',update);document.documentElement.style.removeProperty('--mv-keyboard-inset');};
  },[]);
  const {screen:tab,stage,search,category,sort,lowOnly,showFilters,detailId,period}=nav.route;
  const setStage=(stage:Stage)=>nav.step({stage});
  const setSearch=(search:string)=>nav.patch({search});
  const setCategory=(category:string)=>nav.patch({category});
  const setSort=(sort:SortOrder)=>nav.patch({sort});
  const setLowOnly=(lowOnly:boolean)=>nav.patch({lowOnly});
  const setShowFilters=(value:boolean|((v:boolean)=>boolean))=>nav.patch({showFilters:typeof value==='function'?value(showFilters):value});
  const setDetailId=(detailId:string|null)=>detailId?nav.step({detailId}):nav.back();
  const setPeriod=(period:Period)=>nav.patch({period});
  const [modal, setModal] = useState<Modal>(null);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [error, setError] = useState('');
  const [doneId, setDoneId] = useState<string | null>(null);
  const [online, setOnline] = useState(navigator.onLine);
  const lock = useRef(false);
  useEffect(() => { const update = () => setOnline(navigator.onLine); window.addEventListener('online', update); window.addEventListener('offline', update); return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); }; }, []);
  useEffect(() => { if (detailId && !modal) document.querySelector('.m2-product-detail')?.scrollIntoView({ block: 'start', behavior: 'auto' }); }, [detailId, modal, view?.writeIntent?.status]);
  const paymentWrites = useRef<Promise<void>>(Promise.resolve());
  const [receivedInput, setReceivedInput] = useState('');
  const paymentLoaded=useRef(false);
  useEffect(()=>{if(stage!=='pay'){paymentLoaded.current=false;return;} if(view&&!paymentLoaded.current){setReceivedInput(String(view.drafts.find(d=>!d.consumedBy)?.received??''));paymentLoaded.current=true;}},[stage,view]);
  const [backupOpen, setBackupOpen] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [today, setToday] = useState(() => businessDate(new Date().toISOString()));
  useEffect(() => {
    let cancelled = false;
    const notice = () => setUpdateAvailable(true);
    window.addEventListener('mora:app-update', notice);
    setupPwaUpdateNotice();
    const sub = liveQuery(() => service.snapshot()).subscribe({ next: value => { if (!cancelled) setView(value); }, error: e => { if (!cancelled) setFatal(errorText(e)); } });
    void service.initialize().then(() => service.activeDraft()).catch(e => { if (!cancelled) setFatal(errorText(e)); });
    const timer = window.setInterval(() => setToday(businessDate(new Date().toISOString())), 30000);
    return () => { cancelled = true; sub.unsubscribe(); window.clearInterval(timer); window.removeEventListener('mora:app-update', notice); };
  }, [service]);
  async function run(action: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(''); setMessage('');
    try { await action(); } catch (e) { setError(errorText(e)); throw e; }
    finally { lock.current = false; setBusy(false); }
  }
  function trigger(action: () => Promise<void>) { void run(action).catch(() => {}); }
  const draft = view?.drafts.find(d => !d.consumedBy), lines = draft?.lines ?? [];
  const total = saleTotal(lines), count = sum(lines.map(l => l.quantity));
  const stocks = useMemo(() => stockMap(view?.stockEntries ?? []), [view?.stockEntries]);
  const stockFor = (id: string) => stocks.get(id) ?? 0;
  async function updateDraft(update: (d: Draft) => Draft) {
    if (!draft) throw new Error('Todavía no se abrió el borrador.');
    const current = await service.db.drafts.get(draft.id);
    if (!current || current.version !== draft.version) throw new Error('La venta cambió en otra pantalla. Revisá las cantidades.');
    await service.saveDraft(update(current));
  }
  async function add(p: Product) {
    await updateDraft(d => {
      const existing = d.lines.find(l => l.productId === p.id);
      return { ...d, lines: existing ? d.lines.map(l => l.id === existing.id ? { ...l, quantity: l.quantity + 1 } : l) : [...d.lines, draftLine(p)] };
    });
  }
  function navigate(to: Screen) { nav.go(to); setModal(null); setMessage(''); setError(''); }
  function savedMessage(operation: FormOperation) {
    if(['RecordExpense','RecordContribution','RecordStockCount'].includes(operation.type)) return 'Movimiento guardado en este equipo.';
    return operation.type === 'CreateProduct' || operation.type === 'EditProduct' ? 'Producto guardado en este equipo.' : 'Unidades y costo guardados en este equipo.';
  }
  async function submitWrite(operation: FormOperation) {
    const intent = await service.sealWrite(operation);
    setModal(null); // durable card now owns recovery, including uncertain UI outcomes
    if (operation.type === 'CreateProduct') setDetailId(operation.payload.productId);
    await service.confirmWrite(intent.command.id);
    setMessage(savedMessage(operation));
  }
  async function saveProduct(fields: ProductFields) {
    await run(async () => {
      const p = modal?.kind === 'product' ? modal.product : undefined;
      await submitWrite(p ? { type: 'EditProduct', payload: { productId: p.id, expectedVersion: p.version, fields } }
        : { type: 'CreateProduct', payload: { productId: crypto.randomUUID(), fields } });
    });
  }
  async function saveStock(quantity: number, totalCost: number | null, presentation: string, costReason: string) {
    await run(async () => {
      if (modal?.kind !== 'stock') return;
      await submitWrite(modal.opening ? { type: 'RecordOpeningStock', payload: { productId: modal.product.id, quantity, totalCost, costReason } }
        : { type: 'ReceivePurchase', payload: { receiptId: crypto.randomUUID(), lines: [{ id: crypto.randomUUID(), productId: modal.product.id, quantity, totalCost: totalCost!, presentation, costReason }] } });
    });
  }
  async function reopenWrite() {
    if (!view?.writeIntent) return;
    const operation = await service.reopenWrite(view.writeIntent.command.id);
    if (operation.type === 'CreateProduct') setModal({ kind: 'product', initial: operation });
    else if (operation.type === 'EditProduct') {
      const product = view.products.find(p => p.id === operation.payload.productId);
      if (!product) throw new Error('No se encontró el producto.');
      setModal({ kind: 'product', product, initial: operation });
    } else if(operation.type==='ReceivePurchase') {
      navigate('reposicion'); setModal({kind:'receipt',initial:operation});
    } else if(operation.type==='RecordOpeningStock') {
      const productId = operation.payload.productId;
      const product = view.products.find(p => p.id === productId);
      if (!product) throw new Error('No se encontró el producto.');
      setModal({ kind: 'stock', product, opening: operation.type === 'RecordOpeningStock', initial: operation });
    }
    if(operation.type==='RecordExpense'||operation.type==='RecordContribution'||operation.type==='RecordStockCount'){navigate(operation.type==='RecordStockCount'?'inventario':'caja');setModal({kind:'movement',movementKind:operation.type==='RecordExpense'?'expense':operation.type==='RecordContribution'?'contribution':'count',initial:operation});}
    setMessage('La operación no estaba guardada. Revisá los datos antes de volver a confirmar.');
  }
  const writeProductId = view?.writeIntent && 'productId' in view.writeIntent.command.payload ? view.writeIntent.command.payload.productId : null;
  async function setQuantity(lineId: string, quantity: number) { await updateDraft(d => ({ ...d, lines: quantity === 0 ? d.lines.filter(l => l.id !== lineId) : d.lines.map(l => l.id === lineId ? { ...l, quantity } : l) })); }
  function goToCheckout() { setReceivedInput(draft?.received == null ? '' : String(draft.received)); setStage('pay'); }
  function receive(input: string) {
    if (input !== '' && !/^\d+$/.test(input)) { setError('Usá pesos enteros sin puntos ni comas.'); return; }
    setReceivedInput(input);
    if (!draft) return;
    const draftId = draft.id;
    paymentWrites.current = paymentWrites.current.catch(() => {}).then(async () => {
      const current = await service.db.drafts.get(draftId);
      if (!current) throw new Error('No se encontró el borrador.');
      await service.saveDraft({ ...current, received: input === '' ? null : parseInteger(input, 'Recibido') });
    });
    void paymentWrites.current.catch(e => setError(errorText(e)));
  }
  async function checkout() {
    if (!draft) return;
    await paymentWrites.current;
    const result = await service.checkoutDraft(draft.id);
    setDoneId(result.entityId); setStage('done');
    setMessage(result.reviewIds.length ? 'Venta guardada en este equipo. Hay stock o costo para revisar.' : 'Venta guardada en este equipo.');
  }
  async function beginSale() { await service.activeDraft(); navigate('nueva-venta'); setDoneId(null); }
  if (fatal) return <AppShell><EmptyState title="No se pudieron abrir los registros locales" description={fatal} action={<MoraButton onClick={() => location.reload()}>Volver a intentar</MoraButton>}/><p className="m2-note">Conservá los datos del sitio para revisarlos.</p></AppShell>;
  if (!view) return <AppShell><p role="status">Abriendo registros locales…</p></AppShell>;
  const available = tab === 'productos' ? view.products : view.products.filter(p => p.active);
  const products = catalog(available, stockFor, search, category, lowOnly, sort);
  const categories = ['Todos', ...[...new Set(available.map(p => p.category).filter(Boolean))].sort((a,b) => a.localeCompare(b,'es-AR'))];
  const favorites = view.products.filter(p => p.active && view.favorites.includes(p.id));
  const todayReport = report(view.sales, today, 'Hoy'), currentReport = report(view.sales, today, period);
  const periodMovements=movementReport(view.sales,view.cashEntries,view.stockCounts,today,period);
  const toReplenish = view.products.filter(p => p.active && stockAlert(stockFor(p.id), p.objective).needsReplenishment);
  const detail = view.products.find(p => p.id === detailId), done = view.sales.find(s => s.id === doneId);
  const sealed = !!draft?.submission, canChange = !busy && !!draft && !sealed;
  const writeBlocked = busy || !!view.writeIntent;
  const searchBox = <label className="m2-searchbox"><Icon name="search" size={21}/><span className="sr-only">Buscar producto</span><input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar producto…" autoComplete="off"/></label>;
  const categoryBar = <div className="m2-category-scroll" aria-label="Categorías">{categories.map(name => <button key={name} type="button" className={`m2-pill ${category === name ? 'm2-pill--active' : ''}`} aria-pressed={category === name} onClick={() => setCategory(name)}>{name}</button>)}</div>;
  const filters = showFilters && <div className="m2-filters m2-glass"><label className="m2-filter-label">Ordenar por<select value={sort} onChange={e => setSort(e.target.value as SortOrder)}>{(Object.keys(sortLabels) as SortOrder[]).map(id => <option key={id} value={id}>{sortLabels[id]}</option>)}</select></label><label className="m2-check-row"><input type="checkbox" checked={lowOnly} onChange={e => setLowOnly(e.target.checked)}/> Solo para reponer</label></div>;
  const activeTab:MoraDestination = tab==='inicio'||tab==='ventas'||tab==='caja'?tab:'mas';
  const title=tab==='nueva-venta'?({pick:'Nueva venta',cart:'Carrito',pay:'Cobro',done:'Comprobante'}[stage]):detail?detail.name:screenLabels[tab];
  return <AppShell navigation={tab!=='nueva-venta' && <BottomNav disabled={busy} value={activeTab} onNewSale={()=>trigger(beginSale)} onNavigate={to=>{nav.root(to);setMessage('');setError('');}} icons={{inicio:<Icon name="home"/>,ventas:<Icon name="receipt"/>,caja:<Icon name="wallet"/>,mas:<Icon name="more"/>}}/>}>
    <ScreenHeader title={title} disabled={busy} onBack={nav.route.parent?nav.back:undefined} backLabel={nav.route.parent?`Volver a ${screenLabels[nav.route.parent.screen]}`:undefined} onSettings={tab!=='nueva-venta'&&tab!=='configuracion'?()=>navigate('configuracion'):undefined}/>

    {!online && <div className="m2-demo-flag" role="status"><span className="m2-demo-flag__dot"/>Sin conexión · guardado en este equipo · Sin sincronización</div>}
    {updateAvailable && <div className="m2-update" role="status">Versión nueva disponible. <MoraButton variant="quiet" disabled={busy || modal !== null || backupOpen} onClick={() => trigger(async () => { await paymentWrites.current; await applyPwaUpdate(); })}>Actualizar</MoraButton></div>}
    {message && <p className="m2-operation-success" role="status">{message}</p>}{error && !modal && <p className="m2-operation-error" role="alert">{error}</p>}
    {view.writeIntent && <GlassPanel accent className="m2-glass m2-write-confirmation">
      <SectionTitle title={`${view.writeIntent.command.type === 'ReceivePurchase' ? 'Recepción' : view.writeIntent.command.type === 'RecordOpeningStock' ? 'Stock inicial' : ['RecordExpense','RecordContribution','RecordStockCount'].includes(view.writeIntent.command.type) ? 'Movimiento' : 'Producto'} ${view.writeIntent.status === 'confirmed' ? view.writeIntent.command.type === 'ReceivePurchase' ? 'confirmada' : 'confirmado' : 'pendiente de confirmar'}${view.writeIntent.command.type === 'ReceivePurchase' && view.writeIntent.status === 'confirmed' ? ' en este equipo' : ''}`}/>
      <details><summary>Información del registro</summary><p className="mv-technical-id">{view.writeIntent.command.id}</p></details>
      {view.writeIntent.command.type === 'ReceivePurchase' ? view.writeIntent.command.payload.lines.map(line => <p key={line.id}>{view.products.find(p => p.id === line.productId)?.name ?? line.productId} · {line.quantity} un. · {formatArs(line.totalCost)} · {line.presentation || 'Unidades individuales'}</p>) : view.writeIntent.command.type === 'RecordOpeningStock' ? <p>{view.products.find(p => p.id === writeProductId)?.name} · {view.writeIntent.command.payload.quantity} un. · costo {formatArs(view.writeIntent.command.payload.totalCost)}</p> : (view.writeIntent.command.type === 'CreateProduct' || view.writeIntent.command.type === 'EditProduct') && <p>{view.writeIntent.command.payload.fields.name} · {formatArs(view.writeIntent.command.payload.fields.price)}</p>}
      {view.writeIntent.command.type!=='RecordSale'&&<MovementDetails operation={view.writeIntent.command}/>}
      {view.writeIntent.status === 'confirmed' ? <><p role="status">Ya guardada en este equipo. Sus efectos no se vuelven a aplicar.</p><MoraButton block disabled={busy} onClick={() => trigger(async () => { await service.acknowledgeWrite(view.writeIntent!.command.id); setModal(null); setMessage(''); })}>Cerrar confirmación</MoraButton></> : <><p>Los datos de confirmación están guardados. Reintentá esta misma operación; no cargues otra operación para reemplazarla.</p><MoraButton block isBusy={busy} onClick={() => trigger(async () => { await service.confirmWrite(view.writeIntent!.command.id); if (view.writeIntent!.command.type !== 'RecordSale') setMessage(savedMessage(view.writeIntent!.command)); })}>Reintentar confirmación</MoraButton><MoraButton block variant="secondary" disabled={busy} onClick={() => trigger(reopenWrite)}>Volver a editar operación pendiente</MoraButton></>}
    </GlassPanel>}
    {backupOpen && <BackupPanel service={service} onClose={() => setBackupOpen(false)} onBusy={setBusy} beforeExport={async () => { await paymentWrites.current; }}/>}
    {!view.writeIntent && modal && <Dialog title={modal.kind==='receipt'?'Recibir mercadería':modal.kind==='movement'?'Registrar movimiento':modal.kind === 'product' ? modal.product ? 'Editar producto' : 'Agregar producto' : modal.opening ? 'Stock inicial' : 'Recibir mercadería'} busy={busy} onClose={() => setModal(null)}>
      {modal.kind==='receipt'?<ReceiptForm products={view.products} initial={modal.initial} busy={busy} onSave={o=>run(()=>submitWrite(o))} onClose={()=>setModal(null)}/>:modal.kind==='movement'?<MovementForm kind={modal.movementKind} initial={modal.initial} products={view.products} service={service} busy={busy} onSave={o=>run(()=>submitWrite(o))} onClose={()=>setModal(null)}/>:modal.kind === 'product' ? <ProductForm key={modal.product?.id ?? 'new'} product={modal.product} initial={modal.initial?.type === 'CreateProduct' || modal.initial?.type === 'EditProduct' ? modal.initial.payload.fields : undefined} busy={busy} onSave={saveProduct} onClose={() => setModal(null)}/> : <StockForm key={`${modal.product.id}:${modal.opening}`} product={modal.product} opening={modal.opening} initial={modal.initial} busy={busy} onSave={saveStock} onClose={() => setModal(null)}/>}
    </Dialog>}
    {tab === 'inicio' && <>
      <div className="m2-home-intro"><p className="m2-date">{new Intl.DateTimeFormat('es-AR',{weekday:'long',day:'numeric',month:'long',timeZone:'America/Argentina/Salta'}).format(new Date())}</p></div>
      <GlassPanel accent className="m2-home-hero m2-glass"><button className="m2-card-heading" type="button" onClick={() => navigate('reportes')} aria-label="Ver el detalle de ventas"><span className="m2-icon-well"><Icon name="chart" size={23}/></span><span>Ventas de hoy</span><Icon name="chevron" size={18}/></button><div className="m2-hero-bottom"><div><div className="m2-hero-value"><Money value={todayReport.total} hero/></div><span className="m2-muted-light">{todayReport.sales.length} ventas en efectivo</span></div></div></GlassPanel>
      <GlassPanel className="m2-gain-card m2-glass"><div className="m2-icon-well m2-icon-well--subtle"><Icon name="coins" size={22}/></div><div className="m2-gain-card__body"><span className="m2-card-label">Ganancia estimada</span><strong>{formatArs(todayReport.gain)}</strong><small>{todayReport.gain === null ? 'Hay costos sin determinar' : 'Según los costos de compra registrados'}</small></div><button className="m2-card-chevron" type="button" onClick={() => navigate('reportes')} aria-label="Ver reportes de ganancias"><Icon name="chevron" size={19}/></button></GlassPanel>
      <GlassPanel className="m2-replenish-panel m2-glass"><SectionTitle title="Para reponer" icon="box"><button className="m2-text-link" type="button" onClick={() => { nav.go('inventario',{lowOnly:true}); }}>Ver todos <Icon name="chevron" size={17}/></button></SectionTitle><div className="m2-replenish-list">{toReplenish.slice(0,3).map(p => <button className="m2-replenish-row" key={p.id} type="button" onClick={() => { nav.go('productos',{detailId:p.id}); }}><ProductArt product={p} className="m2-replenish-row__art"/><span className="m2-replenish-row__copy"><strong>{p.name}</strong><span>Objetivo {p.objective} un.</span></span><span className="m2-replenish-row__qty">{stockFor(p.id)} un.</span><Icon name="chevron" size={17}/></button>)}{!toReplenish.length && <p className="m2-muted-light">{view.products.length ? 'Sin productos con stock bajo.' : 'Agregá tu primer producto para empezar.'}</p>}</div></GlassPanel>
      {!view.products.length && <MoraButton block className="m2-start-action" onClick={() => navigate('productos')}>Ir a Productos</MoraButton>}
      <div className="mv-home-links"><MoraButton variant="secondary" onClick={()=>navigate('caja')}>Ver Caja</MoraButton><MoraButton variant="quiet" onClick={()=>navigate('reportes')}>Ver Reportes</MoraButton></div>
      {view.reviews.length > 0 && <GlassPanel className="m2-glass m2-review-panel"><SectionTitle title="Revisión pendiente"/>{view.reviews.map(r => <p key={r.id} className="m2-operation-error">{view.products.find(p => p.id === r.productId)?.name}: {r.detail}</p>)}<p className="m2-note">La conciliación todavía no está disponible. Los registros se conservan.</p></GlassPanel>}
    </>}
    {tab === 'nueva-venta' && stage === 'pick' && <>
      {searchBox}{categoryBar}
      {search.trim() === '' && category === 'Todos' && <section className="m2-favorites-section"><SectionTitle title="Favoritos" icon="star"/><div className="m2-favorites">{favorites.map(p => <div className="m2-favorite-card m2-glass" key={p.id}><ProductArt product={p} className="m2-favorite-card__art"/><button className="m2-favorite-card__plus" type="button" disabled={!canChange} onClick={() => trigger(() => add(p))} aria-label={`Agregar favorito ${p.name}`}><Icon name="plus" size={19}/></button><div className="m2-favorite-card__copy"><strong>{p.name}</strong><span>{p.variant || 'Unidad individual'}</span><b>{formatArs(p.price)}</b></div></div>)}</div>{!favorites.length && <p className="m2-muted-light">Marcá tus favoritos desde la ficha de cada producto.</p>}</section>}
      <section className="m2-all-products"><SectionTitle title={search.trim() ? 'Resultados' : 'Todos los productos'}><button className="m2-sort-link" type="button" aria-expanded={showFilters} onClick={() => setShowFilters(v => !v)}>Ordenar <Icon name="filter" size={21}/></button></SectionTitle>{filters}<div className="m2-sale-products">{products.map(p => <ProductLine key={p.id} product={p} stock={stockFor(p.id)} disabled={!canChange} onAdd={() => trigger(() => add(p))}/>)}{!products.length && <EmptyState title="Sin productos disponibles" description="Agregá un producto desde Productos o probá otra búsqueda." action={<MoraButton onClick={() => navigate('productos')}>Ir a Productos</MoraButton>}/>}</div></section>
      {count > 0 && <><p className="m2-note" role="status">Venta en preparación · Borrador guardado en este equipo{sealed ? ' · Confirmación pendiente: reintentá con los mismos datos' : ''}</p><div className="m2-cart-reserve" aria-hidden="true"/><div className="m2-direct-cart" role="region" aria-label="Resumen del carrito"><button type="button" className="m2-direct-cart__detail" onClick={() => setStage('cart')} aria-label={`Ver carrito: ${count} unidades, total ${formatArs(total)}`}><span className="m2-direct-cart__icon"><Icon name="cart" size={25}/><span className="m2-direct-cart__count">{count}</span></span><span className="m2-direct-cart__total"><small>{lines.length} productos</small><strong>{formatArs(total)}</strong></span></button><button className="m2-direct-cart__pay" disabled={busy} onClick={goToCheckout} type="button">Cobrar <Icon name="chevron" size={20}/></button></div></>}
    </>}
    {tab === 'nueva-venta' && stage === 'cart' && <>
      <MoraButton variant="quiet" disabled={!canChange||!lines.length} onClick={()=>trigger(()=>updateDraft(d=>({...d,lines:[],received:null})))}>Vaciar carrito</MoraButton><GlassPanel className="m2-cart-panel m2-glass">{lines.map(l => <div className="m2-cart-product" key={l.id}><ProductArt product={{ id:l.productId, name:l.name, category:view.products.find(p => p.id === l.productId)?.category ?? '' }} className="m2-cart-product__art"/><div className="m2-cart-product__details"><strong>{l.name}</strong><span>{view.products.find(p => p.id === l.productId)?.variant}</span><small>{formatArs(l.unitPrice)} c/u · Precio del borrador</small><div className="m2-cart-product__controls"><QuantityStepper value={l.quantity} min={0} disabled={!canChange} label={l.name} onChange={q => trigger(() => setQuantity(l.id,q))}/><b>{formatArs(l.quantity*l.unitPrice)}</b></div></div></div>)}{!lines.length && <p className="m2-muted-light">Carrito vacío. Agregá productos para continuar.</p>}</GlassPanel>
      <button type="button" className="m2-add-more" onClick={() => setStage('pick')}><Icon name="plus" size={17}/> Agregar otro producto</button>
      {count > 0 && <div className="m2-cart-checkout m2-glass"><div><span>Total a cobrar</span><strong>{formatArs(total)}</strong></div><MoraButton block disabled={busy} onClick={goToCheckout}>Continuar al cobro <Icon name="arrow" size={20}/></MoraButton></div>}
    </>}
    {tab === 'nueva-venta' && stage === 'pay' && <>
      <GlassPanel className="m2-checkout-total m2-glass" accent><div className="m2-checkout-total__label"><span className="m2-icon-well"><Icon name="cart" size={24}/></span><span>Total a cobrar</span></div><div className="m2-checkout-total__money"><Money value={total} hero/></div><div className="m2-checkout-total__foot"><span>{lines.length} productos · {count} unidades</span><button type="button" onClick={() => setStage('cart')}>Ver detalle <Icon name="chevron" size={17}/></button></div></GlassPanel>
      <GlassPanel className="m2-method-panel m2-glass"><div className="m2-method-heading"><h2>Método de pago</h2><span><Icon name="info" size={17}/> Registro manual</span></div><div className="m2-method-grid">{([{label:'Efectivo',icon:'cash'}] as const).map((m,i) => <button key={m.label} type="button" disabled={i !== 0} aria-pressed={i === 0} className={`m2-method-choice ${i === 0 ? 'm2-method-choice--selected' : ''}`}><Icon name={m.icon} size={26}/><span>{m.label}</span>{i > 0 && <small>Pendiente</small>}</button>)}</div>
        {sealed ? <p className="m2-muted-light">La confirmación quedó preparada. Reintentá guardar con los mismos datos; no inicies otra venta para reemplazarla.</p> : <div className="m2-cash-box"><label className="m2-field">Efectivo recibido $ (opcional)<input inputMode="numeric" value={receivedInput} disabled={busy} onChange={e => receive(e.target.value)} placeholder="Importe exacto"/><small>Vacío registra cobro exacto. Usá pesos enteros.</small></label><div className="m2-cash-row"><span>Vuelto:</span><strong>{draft?.received == null ? formatArs(0) : draft.received < total ? '—' : formatArs(draft.received-total)}</strong></div></div>}
      </GlassPanel>
      {lines.some(l => l.quantity > stockFor(l.productId)) && <p className="m2-operation-error">Hay unidades sin stock registrado suficiente. Si la venta física ocurrió, se conservará con una revisión pendiente.</p>}
      <div className="m2-cash-confirm-footer"><MoraButton block className="m2-confirm-button" isBusy={busy} disabled={!lines.length || !draft} onClick={() => trigger(checkout)}><Icon name="wallet" size={22}/> Guardar venta en efectivo <Icon name="chevron" size={19}/></MoraButton></div><div className="m2-cart-reserve" aria-hidden="true"/>
      {sealed && draft && <MoraButton block variant="secondary" disabled={busy} onClick={() => trigger(() => service.reopenDraft(draft.id))}>Volver a editar esta venta</MoraButton>}
      <div className="m2-checkout-footnote"><Icon name="info" size={17}/> Registro local durable. No hay verificación bancaria ni sincronización.</div>
    </>}
    {tab === 'ventas' && <><p className="m2-muted-light">Historial de ventas guardadas en este equipo.</p>{count>0&&<MoraButton variant="secondary" block onClick={()=>trigger(beginSale)}>Retomar venta · {count} unidades</MoraButton>}<History sales={view.sales}/></>}
    {tab === 'nueva-venta' && stage === 'done' && <GlassPanel className="m2-finish m2-glass" accent><span className="m2-success-icon"><Icon name="check" size={37}/></span><h2>Venta guardada</h2><p>Guardada en este equipo.</p>{done && <><Money value={done.total}/><p>{done.lines.reduce((n,l) => n+l.quantity,0)} unidades · Jornada {done.businessDate}</p>{done.reviewIds.length > 0 && <div className="m2-review"><Icon name="alert" size={20}/>Hay stock o costo para revisar.</div>}</>}<MoraButton block disabled={busy} onClick={() => trigger(beginSale)}>Nueva venta</MoraButton><MoraButton variant="secondary" block onClick={() => navigate('inicio')}>Volver a Inicio</MoraButton></GlassPanel>}
    {tab === 'productos' && <>
      <div className="m2-products-search">{searchBox}<button className="m2-square-control" type="button" onClick={() => setShowFilters(v => !v)} aria-label="Filtros de productos" aria-expanded={showFilters}><Icon name="filter" size={22}/></button></div>{categoryBar}{filters}
      <div className="m2-catalog-actions"><button className="m2-add-product" type="button" disabled={writeBlocked} onClick={() => setModal({kind:'product'})}><Icon name="plus" size={19}/> Agregar producto</button></div>
      <div className="m2-product-catalog" hidden={!!detail}>{products.map(p => <ProductLine key={p.id} product={p} stock={stockFor(p.id)} disabled={writeBlocked} onOpen={() => setDetailId(p.id)}/>)}{!products.length && <EmptyState title="Sin productos" description={view.products.length ? 'Probá otra búsqueda o filtro.' : 'Agregá tu primer producto y después registrá sus unidades físicas o una recepción.'}/>}</div>
      {detail && <GlassPanel className="m2-glass m2-product-detail"><SectionTitle title={detail.name}><button className="m2-text-link" type="button" onClick={() => setDetailId(null)}>Cerrar ficha</button></SectionTitle><p className="m2-muted-light">{detail.variant || 'Unidad individual'} · {detail.category || 'Sin categoría'} </p><Money value={detail.price}/><p>{stockFor(detail.id)} un. registradas · objetivo {detail.objective ?? 'sin definir'}</p><div className="m2-product-actions"><MoraButton variant="secondary" disabled={writeBlocked} onClick={() => setModal({kind:'product',product:detail})}>Editar</MoraButton><MoraButton variant="secondary" disabled={busy} aria-pressed={view.favorites.includes(detail.id)} onClick={() => trigger(() => service.toggleFavorite(detail.id))}><Icon name="star" size={17}/>{view.favorites.includes(detail.id) ? 'Quitar favorito' : 'Marcar favorito'}</MoraButton><MoraButton block disabled={writeBlocked} onClick={() => view.stockEntries.some(e=>e.productId===detail.id)?(navigate('reposicion'),setModal({kind:'receipt'})):setModal({kind:'stock',product:detail,opening:true})}>{view.stockEntries.some(e => e.productId === detail.id) ? 'Recibir mercadería' : 'Stock inicial'}</MoraButton>{!view.stockEntries.some(e => e.productId === detail.id) && <MoraButton block variant="secondary" disabled={writeBlocked} onClick={() => (navigate('reposicion'),setModal({kind:'receipt'}))}>Registrar compra</MoraButton>}</div><MoraButton block variant="quiet" onClick={()=>navigate('inventario')}>Ver Inventario</MoraButton><details className="m2-product-technical"><summary>Historial de mercadería y costos</summary><details className="m2-record-detail"><summary>Lotes registrados</summary>{view.lots.filter(l => l.productId === detail.id).map(l => <p key={l.id}>Lote {l.id.slice(0,8)} · {l.available}/{l.quantity} un. disponibles · costo unitario aproximado {l.unitCost ? formatArs(roundCost(l.unitCost)) : 'desconocido'}</p>)}</details><details className="m2-record-detail"><summary>Recepciones registradas</summary>{view.receipts.filter(r => r.lines.some(l => l.productId === detail.id)).map(r => <p key={r.id}>Recepción {r.id.slice(0,8)} · {new Date(r.registeredAt).toLocaleString('es-AR',{timeZone:'America/Argentina/Salta'})} · {formatArs(r.total)} · Confirmada localmente</p>)}</details></details><p className="m2-note">El stock es el registrado. El conteo físico se guarda desde Inventario.</p></GlassPanel>}
    </>}
    {tab === 'reportes' && <>
      <div className="m2-report-ranges">{(['Hoy','Semana','Mes'] as const).map(p => <button key={p} type="button" aria-pressed={period === p} onClick={() => setPeriod(p)}>{p}</button>)}</div><p className="m2-report-period">{period === 'Semana' ? 'Últimos 7 días de venta' : period === 'Mes' ? 'Mes en curso' : 'Desde las 08:00 · hasta mañana 07:59'}</p>
      <div className="m2-report-metrics"><GlassPanel className="m2-glass"><span className="m2-card-label m2-real-metric-label"><Icon name="chart" size={19}/>Ventas</span><Money value={currentReport.total}/><small className="m2-muted-light">{currentReport.sales.length} ventas en efectivo</small></GlassPanel><GlassPanel className="m2-glass"><span className="m2-card-label m2-real-metric-label"><Icon name="coins" size={19}/>Ganancia estimada</span><Money value={currentReport.gain}/><small className="m2-muted-light">{currentReport.coverage}</small></GlassPanel></div>
      {currentReport.gain === null && <p className="m2-note">Ganancia total no calculable. Subtotal con costo completo: {formatArs(currentReport.knownProfit)}.</p>}
      <GlassPanel className="m2-glass"><SectionTitle title="Ventas por jornada" icon="chart"/>{currentReport.sales.length ? <div className="m2-real-chart" role="img" aria-label={currentReport.days.map(d => `${d.day}: ${formatArs(d.total)}`).join('; ')}>{currentReport.days.map(d => <div key={d.day} title={formatArs(d.total)}><span style={{height:`${Math.max(0, d.total/Math.max(...currentReport.days.map(x => x.total),1)*100)}%`}}/><small>{d.day.slice(8)}</small></div>)}</div> : <p className="m2-muted-light">Sin ventas en este período.</p>}</GlassPanel>
      <GlassPanel className="m2-glass m2-report-top"><SectionTitle title="Más vendidos"/>{currentReport.top.slice(0,5).map((p,i) => <div className="m2-real-top" key={p.id}><span>{i+1}</span><strong>{p.name}</strong><span>{p.units} un.</span></div>)}{!currentReport.top.length && <p className="m2-muted-light">Sin productos vendidos.</p>}</GlassPanel>
      <details className="m2-report-disclosure"><summary><span>Dinero y mercadería</span><span>Ver desglose</span></summary><MovementSummary summary={periodMovements}/><MoraButton variant="secondary" block disabled={busy} onClick={()=>navigate('caja')}>Ver historial de movimientos</MoraButton></details>
      <details className="m2-report-disclosure"><summary><span>Historial de ventas</span><span>Ver detalle</span></summary><History sales={currentReport.sales}/></details>
    </>}
    {tab==='reposicion'&&<ReplenishmentScreen view={view} blocked={writeBlocked} onReceive={()=>setModal({kind:'receipt'})}/>}
    {tab==='mas'&&<MoreScreen onOpen={navigate}/>}
    {tab==='inventario'&&<InventoryScreen view={view} stockFor={stockFor} blocked={writeBlocked} query={search} onQuery={setSearch} low={lowOnly} onLow={setLowOnly} onProduct={p=>nav.go('productos',{detailId:p.id})} onCount={p=>setModal({kind:'movement',movementKind:'count',initial:{type:'RecordStockCount',payload:{countId:crypto.randomUUID(),productId:p.id,expectedStock:stockFor(p.id),expectedStockCommandId:null,counted:stockFor(p.id)<0?0:stockFor(p.id),reason:'',note:''}}})}/>}
    {tab==='caja'&&<CashScreen view={view} today={today} blocked={writeBlocked} onOpen={kind=>setModal({kind:'movement',movementKind:kind})} onSale={()=>navigate('ventas')} onReceipt={()=>navigate('reposicion')}/>}
    {tab==='configuracion'&&<><GlassPanel><h2>Datos y respaldo</h2><p className="m2-muted-light">Los registros se guardan en este dispositivo. Guardá una copia JSON para recuperarlos o trasladarlos a otro navegador vacío.</p><MoraButton block disabled={busy} onClick={()=>setBackupOpen(true)}>Backup y restauración</MoraButton></GlassPanel><dl className="mv-summary-list"><dt>Aplicación</dt><dd>Mora Vinería 2.0</dd><dt>Conexión</dt><dd>{online?'Con conexión':'Sin conexión'}</dd><dt>Almacenamiento</dt><dd>En este dispositivo</dd></dl></>}
    <p className="m2-local-footer"><span>Guardado en este equipo · Sin sincronización</span><span> · Conservá una copia JSON de tus datos.</span></p>
  </AppShell>;
}
