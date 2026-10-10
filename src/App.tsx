import { useEffect, useMemo, useRef, useState } from 'react';
import { liveQuery } from 'dexie';
import { AppShell, BottomNav, EmptyState, GlassPanel, Money, MoraButton, QuantityStepper, type MoraDestination } from './ui/components';
import { formatArs } from './ui/format';
import { Icon } from './app/icons';
import { ProductArt } from './app/ProductArt';
import { ProductForm, StockForm, History, errorText } from './app/OperationForms';
import { Dialog } from './app/Dialog';
import { catalog, report, stockMap, type Period, type SortOrder } from './app/projections';
import { applyPwaUpdate, setupPwaUpdateNotice } from './app/pwa';
import { businessDate, parseInteger, saleTotal, sum } from './domain/rules';
import { stockAlert } from './domain/stock';
import type { Draft, FormOperation, Product, ProductFields } from './domain/types';
import { LocalDatabase } from './local/database';
import { draftLine, LocalService } from './local/service';

type Snapshot = Awaited<ReturnType<LocalService['snapshot']>>;
type Modal = ({ kind: 'product'; product?: Product } | { kind: 'stock'; product: Product; opening: boolean }) & { initial?: FormOperation } | null;
const sortLabels: Record<SortOrder, string> = { nombre: 'Nombre (A–Z)', precioAsc: 'Menor precio', precioDesc: 'Mayor precio', stock: 'Menor stock' };
function SectionTitle({ title, children, icon }: { title: string; children?: React.ReactNode; icon?: 'box' | 'star' | 'chart' }) { return <div className="m2-section-top"><div className="m2-section-top__name">{icon && <Icon name={icon} size={21}/>}<h2>{title}</h2></div>{children}</div>; }
function ProductLine({ product: p, stock, disabled, onAdd, onOpen }: { product: Product; stock: number; disabled: boolean; onAdd?: () => void; onOpen?: () => void }) {
  const alert = stockAlert(stock, p.objective);
  return <div className={`m2-catalog-row ${alert.needsReplenishment ? 'm2-catalog-row--low' : ''}`}><ProductArt product={p} className="m2-catalog-row__art"/><div className="m2-catalog-row__body"><span className="m2-product-name">{p.name}</span><span className="m2-product-subtitle">{p.variant || 'Unidad individual'}{p.active ? '' : ' · Inactivo'}</span><strong className="m2-row-price">{formatArs(p.price)}</strong><span className="m2-stock-hint">{stock} un. registradas · objetivo {p.objective ?? 'sin definir'}</span></div>{onOpen ? <div className="m2-catalog-row__end"><span className={`m2-stockpill ${alert.needsReplenishment ? 'm2-stockpill--low' : ''}`}>{stock} un.</span><button className="m2-icon-outline" onClick={onOpen} type="button" aria-label={`Ver ${p.name}`}><Icon name="chevron"/></button></div> : <button className="m2-round-add" type="button" aria-label={`Agregar ${p.name}`} disabled={disabled} onClick={onAdd}><Icon name="plus" size={22}/></button>}</div>;
}
export default function App() {
  const [service] = useState(() => new LocalService(new LocalDatabase()));
  const [view, setView] = useState<Snapshot | null>(null), [fatal, setFatal] = useState('');
  const [tab, setTab] = useState<MoraDestination>('inicio'), [stage, setStage] = useState<'pick' | 'cart' | 'pay' | 'history' | 'done'>('pick');
  const [modal, setModal] = useState<Modal>(null), [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [error, setError] = useState('');
  const [category, setCategory] = useState('Todos'), [sort, setSort] = useState<SortOrder>('nombre'), [lowOnly, setLowOnly] = useState(false), [showFilters, setShowFilters] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null), [period, setPeriod] = useState<Period>('Hoy'), [doneId, setDoneId] = useState<string | null>(null);
  const [online, setOnline] = useState(navigator.onLine);
  const lock = useRef(false);
  useEffect(() => { const update = () => setOnline(navigator.onLine); window.addEventListener('online', update); window.addEventListener('offline', update); return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); }; }, []);
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'auto' }); }, [tab, stage]);
  useEffect(() => { if (detailId && !modal) document.querySelector('.m2-product-detail')?.scrollIntoView({ block: 'start', behavior: 'auto' }); }, [detailId, modal, view?.writeIntent?.status]);
  const paymentWrites = useRef<Promise<void>>(Promise.resolve());
  const [receivedInput, setReceivedInput] = useState('');
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
  function navigate(to: MoraDestination) { setDetailId(null); setCategory('Todos'); setLowOnly(false); setTab(to); setStage('pick'); setSearch(''); setModal(null); }
  function savedMessage(operation: FormOperation) {
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
    } else {
      const productId = operation.type === 'ReceivePurchase' ? operation.payload.lines[0].productId : operation.payload.productId;
      const product = view.products.find(p => p.id === productId);
      if (!product) throw new Error('No se encontró el producto.');
      setModal({ kind: 'stock', product, opening: operation.type === 'RecordOpeningStock', initial: operation });
    }
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
  async function beginSale() { await service.activeDraft(); navigate('ventas'); setDoneId(null); }
  if (fatal) return <AppShell><EmptyState title="No se pudieron abrir los registros locales" description={fatal} action={<MoraButton onClick={() => location.reload()}>Volver a intentar</MoraButton>}/><p className="m2-note">Conservá los datos del sitio para revisarlos.</p></AppShell>;
  if (!view) return <AppShell><p role="status">Abriendo registros locales…</p></AppShell>;
  const available = tab === 'productos' ? view.products : view.products.filter(p => p.active);
  const products = catalog(available, stockFor, search, category, lowOnly, sort);
  const categories = ['Todos', ...[...new Set(available.map(p => p.category).filter(Boolean))].sort((a,b) => a.localeCompare(b,'es-AR'))];
  const favorites = view.products.filter(p => p.active && view.favorites.includes(p.id));
  const todayReport = report(view.sales, today, 'Hoy'), currentReport = report(view.sales, today, period);
  const toReplenish = view.products.filter(p => p.active && stockAlert(stockFor(p.id), p.objective).needsReplenishment);
  const detail = view.products.find(p => p.id === detailId), done = view.sales.find(s => s.id === doneId);
  const sealed = !!draft?.submission, canChange = !busy && !!draft && !sealed;
  const writeBlocked = busy || !!view.writeIntent;
  const searchBox = <label className="m2-searchbox"><Icon name="search" size={21}/><span className="sr-only">Buscar producto</span><input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar producto…" autoComplete="off"/></label>;
  const categoryBar = <div className="m2-category-scroll" aria-label="Categorías">{categories.map(name => <button key={name} type="button" className={`m2-pill ${category === name ? 'm2-pill--active' : ''}`} aria-pressed={category === name} onClick={() => setCategory(name)}>{name}</button>)}</div>;
  const filters = showFilters && <div className="m2-filters m2-glass"><label className="m2-filter-label">Ordenar por<select value={sort} onChange={e => setSort(e.target.value as SortOrder)}>{(Object.keys(sortLabels) as SortOrder[]).map(id => <option key={id} value={id}>{sortLabels[id]}</option>)}</select></label><label className="m2-check-row"><input type="checkbox" checked={lowOnly} onChange={e => setLowOnly(e.target.checked)}/> Solo para reponer</label></div>;
  return <AppShell navigation={<BottomNav disabled={busy} value={tab} onNavigate={to => { if (to === 'ventas' && !draft) trigger(beginSale); else navigate(to); }} icons={{ inicio: <Icon name="home"/>, ventas: <Icon name="cart"/>, productos: <Icon name="box"/>, reportes: <Icon name="chart"/> }}/> }>
    <div className="m2-demo-flag" role="status"><span className="m2-demo-flag__dot"/>{online ? 'Guardado en este equipo' : 'Sin conexión · guardado en este equipo'} · Sin sincronización</div>
    {updateAvailable && <div className="m2-update" role="status">Versión nueva disponible. <MoraButton variant="quiet" disabled={busy || modal !== null} onClick={() => trigger(async () => { await paymentWrites.current; await applyPwaUpdate(); })}>Actualizar</MoraButton></div>}
    {message && <p className="m2-operation-success" role="status">{message}</p>}{error && !modal && <p className="m2-operation-error" role="alert">{error}</p>}
    {view.writeIntent && <GlassPanel accent className="m2-glass m2-write-confirmation">
      <SectionTitle title={`${view.writeIntent.command.type === 'ReceivePurchase' ? 'Recepción' : view.writeIntent.command.type === 'RecordOpeningStock' ? 'Stock inicial' : 'Producto'} ${view.writeIntent.status === 'confirmed' ? view.writeIntent.command.type === 'ReceivePurchase' ? 'confirmada' : 'confirmado' : 'pendiente de confirmar'}${view.writeIntent.command.type === 'ReceivePurchase' && view.writeIntent.status === 'confirmed' ? ' en este equipo' : ''}`}/>
      <p className="m2-muted-light">Operación {view.writeIntent.command.id} · {new Date(view.writeIntent.command.registeredAt).toLocaleString('es-AR', { timeZone: 'America/Argentina/Salta' })}</p>
      {view.writeIntent.command.type === 'ReceivePurchase' ? view.writeIntent.command.payload.lines.map(line => <p key={line.id}>{view.products.find(p => p.id === line.productId)?.name ?? line.productId} · {line.quantity} un. · {formatArs(line.totalCost)} · {line.presentation || 'Unidades individuales'}</p>) : view.writeIntent.command.type === 'RecordOpeningStock' ? <p>{view.products.find(p => p.id === writeProductId)?.name} · {view.writeIntent.command.payload.quantity} un. · costo {formatArs(view.writeIntent.command.payload.totalCost)}</p> : (view.writeIntent.command.type === 'CreateProduct' || view.writeIntent.command.type === 'EditProduct') && <p>{view.writeIntent.command.payload.fields.name} · {formatArs(view.writeIntent.command.payload.fields.price)}</p>}
      {view.writeIntent.status === 'confirmed' ? <><p role="status">Ya guardada en este equipo. Sus efectos no se vuelven a aplicar.</p><MoraButton block disabled={busy} onClick={() => trigger(async () => { await service.acknowledgeWrite(view.writeIntent!.command.id); setModal(null); setMessage(''); })}>Cerrar confirmación</MoraButton></> : <><p>Los datos de confirmación están guardados. Reintentá esta misma operación; no cargues otra recepción para reemplazarla.</p><MoraButton block isBusy={busy} onClick={() => trigger(async () => { await service.confirmWrite(view.writeIntent!.command.id); if (view.writeIntent!.command.type !== 'RecordSale') setMessage(savedMessage(view.writeIntent!.command)); })}>Reintentar confirmación</MoraButton><MoraButton block variant="secondary" disabled={busy} onClick={() => trigger(reopenWrite)}>Volver a editar operación pendiente</MoraButton></>}
    </GlassPanel>}
    {!view.writeIntent && modal && <Dialog title={modal.kind === 'product' ? modal.product ? 'Editar producto' : 'Agregar producto' : modal.opening ? 'Stock inicial' : 'Recibir mercadería'} busy={busy} onClose={() => setModal(null)}>
      {modal.kind === 'product' ? <ProductForm key={modal.product?.id ?? 'new'} product={modal.product} initial={modal.initial?.type === 'CreateProduct' || modal.initial?.type === 'EditProduct' ? modal.initial.payload.fields : undefined} busy={busy} onSave={saveProduct} onClose={() => setModal(null)}/> : <StockForm key={`${modal.product.id}:${modal.opening}`} product={modal.product} opening={modal.opening} initial={modal.initial} busy={busy} onSave={saveStock} onClose={() => setModal(null)}/>}
    </Dialog>}
    {tab === 'inicio' && <>
      <header className="m2-head m2-home-head"><div><div className="m2-brand">Mora<span>.</span></div><div className="m2-brand-sub">VINERÍA</div></div><span className="m2-v2-chip">V2 · LOCAL</span></header>
      <div className="m2-home-intro"><p className="m2-date">{new Intl.DateTimeFormat('es-AR',{weekday:'long',day:'numeric',month:'long',timeZone:'America/Argentina/Salta'}).format(new Date())}</p><button className="m2-new-sale" type="button" disabled={busy} onClick={() => trigger(beginSale)}><Icon name="plus" size={17}/> Nueva venta <Icon name="chevron" size={17}/></button></div>
      <GlassPanel accent className="m2-home-hero m2-glass"><button className="m2-card-heading" type="button" onClick={() => navigate('reportes')} aria-label="Ver el detalle de ventas"><span className="m2-icon-well"><Icon name="chart" size={23}/></span><span>Ventas de hoy</span><Icon name="chevron" size={18}/></button><div className="m2-hero-bottom"><div><div className="m2-hero-value"><Money value={todayReport.total} hero/></div><span className="m2-muted-light">{todayReport.sales.length} ventas en efectivo</span></div><span className="m2-demo-tag">LOCAL</span></div></GlassPanel>
      <GlassPanel className="m2-gain-card m2-glass"><div className="m2-icon-well m2-icon-well--subtle"><Icon name="coins" size={22}/></div><div className="m2-gain-card__body"><span className="m2-card-label">Ganancia estimada local</span><strong>{formatArs(todayReport.gain)}</strong><small>{todayReport.coverage} · FIFO local</small></div><button className="m2-card-chevron" type="button" onClick={() => navigate('reportes')} aria-label="Ver reportes de ganancias"><Icon name="chevron" size={19}/></button></GlassPanel>
      <GlassPanel className="m2-replenish-panel m2-glass"><SectionTitle title="Para reponer" icon="box"><button className="m2-text-link" type="button" onClick={() => { navigate('productos'); setLowOnly(true); }}>Ver todos <Icon name="chevron" size={17}/></button></SectionTitle><div className="m2-replenish-list">{toReplenish.slice(0,3).map(p => <button className="m2-replenish-row" key={p.id} type="button" onClick={() => { navigate('productos'); setDetailId(p.id); }}><ProductArt product={p} className="m2-replenish-row__art"/><span className="m2-replenish-row__copy"><strong>{p.name}</strong><span>Objetivo {p.objective} un.</span></span><span className="m2-replenish-row__qty">{stockFor(p.id)} un.</span><Icon name="chevron" size={17}/></button>)}{!toReplenish.length && <p className="m2-muted-light">{view.products.length ? 'Sin productos con stock bajo.' : 'Agregá tu primer producto para empezar.'}</p>}</div></GlassPanel>
      {!view.products.length && <MoraButton block className="m2-start-action" onClick={() => navigate('productos')}>Ir a Productos</MoraButton>}
      <p className="m2-note">Jornada {today} · 08:00–07:59 en Salta. Reposición según objetivo manual, sin conteo físico automático.</p>
      {view.reviews.length > 0 && <GlassPanel className="m2-glass m2-review-panel"><SectionTitle title="Revisión pendiente"/>{view.reviews.map(r => <p key={r.id} className="m2-operation-error">{view.products.find(p => p.id === r.productId)?.name}: {r.detail}</p>)}<p className="m2-note">La conciliación todavía no está disponible. Los registros se conservan.</p></GlassPanel>}
    </>}
    {tab === 'ventas' && stage === 'pick' && <>
      <header className="m2-head m2-pick-head"><div><p className="m2-overline">VENTAS</p><h1>Nueva venta</h1></div><button className="m2-top-action" type="button" onClick={() => setStage('history')} aria-label="Historial de ventas"><Icon name="history" size={24}/></button></header>
      {searchBox}{categoryBar}
      {search.trim() === '' && category === 'Todos' && <section className="m2-favorites-section"><SectionTitle title="Favoritos" icon="star"/><div className="m2-favorites">{favorites.map(p => <div className="m2-favorite-card m2-glass" key={p.id}><ProductArt product={p} className="m2-favorite-card__art"/><button className="m2-favorite-card__plus" type="button" disabled={!canChange} onClick={() => trigger(() => add(p))} aria-label={`Agregar favorito ${p.name}`}><Icon name="plus" size={19}/></button><div className="m2-favorite-card__copy"><strong>{p.name}</strong><span>{p.variant || 'Unidad individual'}</span><b>{formatArs(p.price)}</b></div></div>)}</div>{!favorites.length && <p className="m2-muted-light">Marcá tus favoritos desde la ficha de cada producto.</p>}</section>}
      <section className="m2-all-products"><SectionTitle title={search.trim() ? 'Resultados' : 'Todos los productos'}><button className="m2-sort-link" type="button" aria-expanded={showFilters} onClick={() => setShowFilters(v => !v)}>Ordenar <Icon name="filter" size={21}/></button></SectionTitle>{filters}<div className="m2-sale-products">{products.map(p => <ProductLine key={p.id} product={p} stock={stockFor(p.id)} disabled={!canChange} onAdd={() => trigger(() => add(p))}/>)}{!products.length && <EmptyState title="Sin productos disponibles" description="Agregá un producto desde Productos o probá otra búsqueda." action={<MoraButton onClick={() => navigate('productos')}>Ir a Productos</MoraButton>}/>}</div></section>
      {count > 0 && <><p className="m2-note" role="status">Venta en preparación · Borrador guardado en este equipo{sealed ? ' · Confirmación pendiente: reintentá con los mismos datos' : ''}</p><div className="m2-cart-reserve" aria-hidden="true"/><div className="m2-direct-cart" role="region" aria-label="Resumen del carrito"><button type="button" className="m2-direct-cart__detail" onClick={() => setStage('cart')} aria-label={`Ver carrito: ${count} unidades, total ${formatArs(total)}`}><span className="m2-direct-cart__icon"><Icon name="cart" size={25}/><span className="m2-direct-cart__count">{count}</span></span><span className="m2-direct-cart__total"><small>{lines.length} productos</small><strong>{formatArs(total)}</strong></span></button><button className="m2-direct-cart__pay" disabled={busy} onClick={goToCheckout} type="button">Cobrar <Icon name="chevron" size={20}/></button></div></>}
    </>}
    {tab === 'ventas' && stage === 'cart' && <>
      <header className="m2-head m2-subhead"><button className="m2-back" type="button" onClick={() => setStage('pick')} aria-label="Volver a productos"><Icon name="back"/></button><div className="m2-subhead__titles"><h1>Carrito</h1><span>{count} unidades · {lines.length} productos</span></div><button className="m2-outline-pink" type="button" disabled={!canChange} onClick={() => trigger(() => updateDraft(d => ({ ...d, lines: [] })))}>Vaciar</button></header>
      <GlassPanel className="m2-cart-panel m2-glass">{lines.map(l => <div className="m2-cart-product" key={l.id}><ProductArt product={{ id:l.productId, name:l.name, category:view.products.find(p => p.id === l.productId)?.category ?? '' }} className="m2-cart-product__art"/><div className="m2-cart-product__details"><strong>{l.name}</strong><span>{view.products.find(p => p.id === l.productId)?.variant}</span><small>{formatArs(l.unitPrice)} c/u · Precio del borrador</small><div className="m2-cart-product__controls"><QuantityStepper value={l.quantity} min={0} disabled={!canChange} label={l.name} onChange={q => trigger(() => setQuantity(l.id,q))}/><b>{formatArs(l.quantity*l.unitPrice)}</b></div></div></div>)}{!lines.length && <p className="m2-muted-light">Carrito vacío. Agregá productos para continuar.</p>}</GlassPanel>
      <button type="button" className="m2-add-more" onClick={() => setStage('pick')}><Icon name="plus" size={17}/> Agregar otro producto</button>
      {count > 0 && <div className="m2-cart-checkout m2-glass"><div><span>Total a cobrar</span><strong>{formatArs(total)}</strong></div><MoraButton block disabled={busy} onClick={goToCheckout}>Continuar al cobro <Icon name="arrow" size={20}/></MoraButton></div>}
    </>}
    {tab === 'ventas' && stage === 'pay' && <>
      <header className="m2-head m2-checkout-head"><button className="m2-back m2-back--plain" type="button" onClick={() => setStage('pick')} aria-label="Volver a productos"><Icon name="back" size={26}/></button><div><h1>Cobro</h1><span>Finalizá la venta</span></div></header>
      <GlassPanel className="m2-checkout-total m2-glass" accent><div className="m2-checkout-total__label"><span className="m2-icon-well"><Icon name="cart" size={24}/></span><span>Total a cobrar</span></div><div className="m2-checkout-total__money"><Money value={total} hero/></div><div className="m2-checkout-total__foot"><span>{lines.length} productos · {count} unidades</span><button type="button" onClick={() => setStage('cart')}>Ver detalle <Icon name="chevron" size={17}/></button></div></GlassPanel>
      <GlassPanel className="m2-method-panel m2-glass"><div className="m2-method-heading"><h2>Método de pago</h2><span><Icon name="info" size={17}/> Registro manual</span></div><div className="m2-method-grid">{([{label:'Efectivo',icon:'cash'}, {label:'Transferencia',icon:'bank'}, {label:'Mixto',icon:'split'}, {label:'Fiado',icon:'fiado'}] as const).map((m,i) => <button key={m.label} type="button" disabled={i !== 0} aria-pressed={i === 0} className={`m2-method-choice ${i === 0 ? 'm2-method-choice--selected' : ''}`}><Icon name={m.icon} size={26}/><span>{m.label}</span>{i > 0 && <small>Pendiente</small>}</button>)}</div>
        {sealed ? <p className="m2-muted-light">La confirmación quedó preparada. Reintentá guardar con los mismos datos; no inicies otra venta para reemplazarla.</p> : <div className="m2-cash-box"><label className="m2-field">Efectivo recibido $ (opcional)<input inputMode="numeric" value={receivedInput} disabled={busy} onChange={e => receive(e.target.value)} placeholder="Importe exacto"/><small>Vacío registra cobro exacto. Usá pesos enteros.</small></label><div className="m2-cash-row"><span>Vuelto:</span><strong>{draft?.received == null ? formatArs(0) : draft.received < total ? '—' : formatArs(draft.received-total)}</strong></div></div>}
      </GlassPanel>
      {lines.some(l => l.quantity > stockFor(l.productId)) && <p className="m2-operation-error">Hay unidades sin stock registrado suficiente. Si la venta física ocurrió, se conservará con una revisión pendiente.</p>}
      <div className="m2-cash-confirm-footer"><MoraButton block className="m2-confirm-button" isBusy={busy} disabled={!lines.length || !draft} onClick={() => trigger(checkout)}><Icon name="wallet" size={22}/> Guardar venta en efectivo <Icon name="chevron" size={19}/></MoraButton></div><div className="m2-cart-reserve" aria-hidden="true"/>
      {sealed && draft && <MoraButton block variant="secondary" disabled={busy} onClick={() => trigger(() => service.reopenDraft(draft.id))}>Volver a editar esta venta</MoraButton>}
      <div className="m2-checkout-footnote"><Icon name="info" size={17}/> Registro local durable. No hay verificación bancaria ni sincronización.</div>
    </>}
    {tab === 'ventas' && stage === 'history' && <><header className="m2-head m2-subhead"><button className="m2-back" type="button" onClick={() => setStage('pick')} aria-label="Volver a nueva venta"><Icon name="back"/></button><div className="m2-subhead__titles"><h1>Historial</h1><span>Guardado en este equipo</span></div></header><History sales={view.sales}/></>}
    {tab === 'ventas' && stage === 'done' && <GlassPanel className="m2-finish m2-glass" accent><span className="m2-success-icon"><Icon name="check" size={37}/></span><h1>Venta guardada</h1><p>Confirmada localmente. Todavía no se envía a un servidor.</p>{done && <><Money value={done.total}/><p>{done.lines.reduce((n,l) => n+l.quantity,0)} unidades · Jornada {done.businessDate}</p>{done.reviewIds.length > 0 && <div className="m2-review"><Icon name="alert" size={20}/>Hay stock o costo para revisar.</div>}</>}<MoraButton block disabled={busy} onClick={() => trigger(beginSale)}>Nueva venta</MoraButton><MoraButton variant="secondary" block onClick={() => navigate('inicio')}>Volver a Inicio</MoraButton></GlassPanel>}
    {tab === 'productos' && <>
      <header className="m2-head m2-products-head"><div><h1 className="m2-serif">Productos</h1><span className="m2-products-head__subtitle">Tu catálogo de bebidas y más</span></div><span className="m2-icon-well"><Icon name="box" size={24}/></span></header>
      <div className="m2-products-search">{searchBox}<button className="m2-square-control" type="button" onClick={() => setShowFilters(v => !v)} aria-label="Filtros de productos" aria-expanded={showFilters}><Icon name="filter" size={22}/></button></div>{categoryBar}{filters}
      <div className="m2-catalog-actions"><button className="m2-add-product" type="button" disabled={writeBlocked} onClick={() => setModal({kind:'product'})}><Icon name="plus" size={19}/> Agregar producto</button><button className="m2-scan-product" type="button" disabled aria-label="Escanear código: pendiente" title="Escaneo pendiente"><Icon name="scan" size={21}/><span className="sr-only">Escaneo pendiente</span></button></div>
      <div className="m2-product-catalog" hidden={!!detail}>{products.map(p => <ProductLine key={p.id} product={p} stock={stockFor(p.id)} disabled={writeBlocked} onOpen={() => setDetailId(p.id)}/>)}{!products.length && <EmptyState title="Sin productos" description={view.products.length ? 'Probá otra búsqueda o filtro.' : 'Agregá tu primer producto y después registrá sus unidades físicas o una recepción.'}/>}</div>
      {detail && <GlassPanel className="m2-glass m2-product-detail"><SectionTitle title={detail.name}><button className="m2-text-link" type="button" onClick={() => setDetailId(null)}>Cerrar ficha</button></SectionTitle><p className="m2-muted-light">{detail.variant || 'Unidad individual'} · {detail.category || 'Sin categoría'} · Ilustración, sin foto verificada</p><Money value={detail.price}/><p>{stockFor(detail.id)} un. registradas · objetivo {detail.objective ?? 'sin definir'}</p><div className="m2-product-actions"><MoraButton variant="secondary" disabled={writeBlocked} onClick={() => setModal({kind:'product',product:detail})}>Editar</MoraButton><MoraButton variant="secondary" disabled={busy} aria-pressed={view.favorites.includes(detail.id)} onClick={() => trigger(() => service.toggleFavorite(detail.id))}><Icon name="star" size={17}/>{view.favorites.includes(detail.id) ? 'Quitar favorito' : 'Marcar favorito'}</MoraButton><MoraButton block disabled={writeBlocked} onClick={() => setModal({kind:'stock',product:detail,opening:!view.stockEntries.some(e => e.productId === detail.id)})}>{view.stockEntries.some(e => e.productId === detail.id) ? 'Recibir mercadería' : 'Stock inicial'}</MoraButton>{!view.stockEntries.some(e => e.productId === detail.id) && <MoraButton block variant="secondary" disabled={writeBlocked} onClick={() => setModal({kind:'stock',product:detail,opening:false})}>Registrar compra</MoraButton>}</div><details className="m2-record-detail"><summary>Lotes registrados</summary>{view.lots.filter(l => l.productId === detail.id).map(l => <p key={l.id}>Lote {l.id.slice(0,8)} · {l.available}/{l.quantity} un. disponibles · costo unitario {l.unitCost ? `${l.unitCost.numerator}/${l.unitCost.denominator} ARS (exacto)` : 'desconocido'}</p>)}</details><details className="m2-record-detail"><summary>Recepciones registradas</summary>{view.receipts.filter(r => r.lines.some(l => l.productId === detail.id)).map(r => <p key={r.id}>Recepción {r.id.slice(0,8)} · {new Date(r.registeredAt).toLocaleString('es-AR',{timeZone:'America/Argentina/Salta'})} · {formatArs(r.total)} · Confirmada localmente</p>)}</details><p className="m2-note">Conteo y ajuste físico pendientes. Abrir esta ficha no comprueba stock.</p></GlassPanel>}
    </>}
    {tab === 'reportes' && <>
      <header className="m2-head"><div><h1 className="m2-serif">Reportes</h1><span className="m2-muted-light">Datos guardados en este equipo</span></div><span className="m2-icon-well"><Icon name="chart" size={24}/></span></header>
      <div className="m2-report-ranges">{(['Hoy','Semana','Mes'] as const).map(p => <button key={p} type="button" aria-pressed={period === p} onClick={() => setPeriod(p)}>{p}</button>)}</div><p className="m2-note">{period === 'Semana' ? 'Últimas 7 jornadas' : period === 'Mes' ? 'Mes de la jornada actual' : 'Jornada actual'} · {currentReport.start} a {today} · 08:00–07:59</p>
      <div className="m2-report-metrics"><GlassPanel className="m2-glass"><span className="m2-card-label m2-real-metric-label"><Icon name="chart" size={19}/>Ventas</span><Money value={currentReport.total}/><small className="m2-muted-light">{currentReport.sales.length} ventas en efectivo</small></GlassPanel><GlassPanel className="m2-glass"><span className="m2-card-label m2-real-metric-label"><Icon name="coins" size={19}/>Ganancia estimada</span><Money value={currentReport.gain}/><small className="m2-muted-light">FIFO local · {currentReport.coverage}</small></GlassPanel></div>
      {currentReport.gain === null && <p className="m2-note">Ganancia total no calculable. Subtotal con costo completo: {formatArs(currentReport.knownProfit)}.</p>}
      <GlassPanel className="m2-glass"><SectionTitle title="Ventas por jornada" icon="chart"/>{currentReport.sales.length ? <div className="m2-real-chart" role="img" aria-label={currentReport.days.map(d => `${d.day}: ${formatArs(d.total)}`).join('; ')}>{currentReport.days.map(d => <div key={d.day} title={formatArs(d.total)}><span style={{height:`${Math.max(0, d.total/Math.max(...currentReport.days.map(x => x.total),1)*100)}%`}}/><small>{d.day.slice(8)}</small></div>)}</div> : <p className="m2-muted-light">Sin ventas en este período.</p>}</GlassPanel>
      <GlassPanel className="m2-glass m2-report-top"><SectionTitle title="Más vendidos"/>{currentReport.top.slice(0,5).map((p,i) => <div className="m2-real-top" key={p.id}><span>{i+1}</span><strong>{p.name}</strong><span>{p.units} un.</span></div>)}{!currentReport.top.length && <p className="m2-muted-light">Sin productos vendidos.</p>}</GlassPanel>
      <History sales={currentReport.sales}/><details className="m2-record-detail"><summary>Movimientos de efectivo</summary><p>{formatArs(sum(view.cashEntries.map(e => e.amount)))} de variación registrada en todo el historial.</p><p className="m2-muted-light">No es saldo real de caja: no existe apertura ni conteo.</p>{view.cashEntries.map(e => <p key={e.id}>{e.reason === 'sale' ? 'Venta' : 'Compra recibida'} · {formatArs(e.amount)} · {new Date(e.registeredAt).toLocaleString('es-AR',{timeZone:'America/Argentina/Salta'})}</p>)}</details>
    </>}
    <p className="m2-note">{view.pending} operaciones locales conservadas. Todavía no se envían a ningún servidor.</p>
  </AppShell>;
}
