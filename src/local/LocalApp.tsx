import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { liveQuery } from 'dexie';
import { AppShell, BottomNav, CartFooter, EmptyState, GlassPanel, MetricCard, MoraButton, ProductRow, QuantityStepper, type MoraDestination } from '../ui/components';
import { formatArs } from '../ui/format';
import { Icon } from '../app/icons';
import { applyPwaUpdate, setupPwaUpdateNotice } from '../app/pwa';
import { addCost, businessDate, parseInteger, profit, rational, roundCost, saleTotal, sum } from '../domain/rules';
import type { Command, Draft, Product, ProductFields, Sale } from '../domain/types';
import { LocalDatabase } from './database';
import { draftLine, LocalService } from './service';
import './local.css';

type Snapshot = Awaited<ReturnType<LocalService['snapshot']>>;
type Modal = { kind: 'product'; product?: Product } | { kind: 'stock'; product: Product; opening: boolean } | null;
function errorText(error: unknown): string {
  if (error instanceof Error && error.name === 'QuotaExceededError') return 'No queda espacio en este equipo. La operación no se guardó. Conservá esta pantalla y liberá espacio sin borrar los datos del sitio.';
  return error instanceof Error ? error.message : 'No se pudo guardar. Tus datos anteriores se conservan.';
}
function PanelHeading({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="m2-section-top"><h2>{title}</h2>{children}</div>;
}
function ProductForm({ product, busy, onSave, onClose }: { product?: Product; busy: boolean; onSave: (fields: ProductFields) => Promise<void>; onClose: () => void }) {
  const [name, setName] = useState(product?.name ?? ''), [variant, setVariant] = useState(product?.variant ?? '');
  const [category, setCategory] = useState(product?.category ?? ''), [price, setPrice] = useState(String(product?.price ?? ''));
  const [objective, setObjective] = useState(product?.objective == null ? '' : String(product.objective));
  const [active, setActive] = useState(product?.active ?? true), [error, setError] = useState('');
  async function submit(e: FormEvent) {
    e.preventDefault(); setError('');
    try { await onSave({ name, variant, category, price: parseInteger(price, 'Precio'), objective: objective.trim() ? parseInteger(objective, 'Objetivo') : null, active }); }
    catch (e) { setError(errorText(e)); }
  }
  return <GlassPanel className="local-form"><PanelHeading title={product ? 'Editar producto' : 'Agregar producto'}><MoraButton variant="quiet" onClick={onClose} disabled={busy}>Cerrar</MoraButton></PanelHeading>
    <form onSubmit={submit}>
      <label className="m2-field">Nombre<input required maxLength={120} value={name} onChange={e => setName(e.target.value)} autoFocus /></label>
      <label className="m2-field">Presentación / variante<input maxLength={120} value={variant} onChange={e => setVariant(e.target.value)} placeholder="Ej. botella 355 ml" /></label>
      <label className="m2-field">Categoría (opcional)<input maxLength={120} value={category} onChange={e => setCategory(e.target.value)} /></label>
      <div className="local-grid"><label className="m2-field">Precio $<input required inputMode="numeric" value={price} onChange={e => setPrice(e.target.value)} /></label><label className="m2-field">Objetivo de unidades<input inputMode="numeric" value={objective} onChange={e => setObjective(e.target.value)} placeholder="Opcional" /></label></div>
      {product && <label className="local-check"><input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Disponible para nuevas ventas</label>}
      {error && <p role="alert" className="local-error">{error}</p>}
      <MoraButton block type="submit" isBusy={busy}>Guardar producto</MoraButton>
    </form>
  </GlassPanel>;
}
function StockForm({ product, opening, busy, onSave, onClose }: { product: Product; opening: boolean; busy: boolean; onSave: (quantity: number, totalCost: number | null, presentation: string, costReason: string) => Promise<void>; onClose: () => void }) {
  const [quantity, setQuantity] = useState(''), [cost, setCost] = useState(''), [known, setKnown] = useState(true), [presentation, setPresentation] = useState('');
  const [costReason, setCostReason] = useState('');
  const [confirmed, setConfirmed] = useState(false), [error, setError] = useState('');
  async function submit(e: FormEvent) {
    e.preventDefault(); setError('');
    try {
      if (!confirmed) throw new Error('Confirmá las unidades físicas y, si es una compra, el pago realizado.');
      await onSave(parseInteger(quantity, 'Unidades', true), known ? parseInteger(cost, 'Costo total') : null, presentation, costReason);
    } catch (e) { setError(errorText(e)); }
  }
  return <GlassPanel className="local-form"><PanelHeading title={opening ? 'Stock inicial' : 'Recibir mercadería'}><MoraButton variant="quiet" onClick={onClose} disabled={busy}>Cerrar</MoraButton></PanelHeading>
    <h3>{product.name}</h3><p className="mv-muted">{opening ? 'Anotá las unidades que hay físicamente. Esta apertura no registra una compra ni descuenta dinero.' : 'Registrá solo lo recibido y pagado ahora en efectivo. Una entrega parcial se guarda por separado.'}</p>
    <form onSubmit={submit}>
      <label className="m2-field">Unidades individuales<input required inputMode="numeric" value={quantity} onChange={e => setQuantity(e.target.value)} /></label>
      {!opening && <label className="m2-field">Presentación de compra (opcional)<input maxLength={120} value={presentation} onChange={e => setPresentation(e.target.value)} placeholder="Ej. 2 fardos de 8 = 16 unidades" /></label>}
      {opening && <label className="local-check"><input type="checkbox" checked={known} onChange={e => setKnown(e.target.checked)} /> Conozco el costo real de estas unidades</label>}
      {known && <label className="m2-field">Costo total de estas unidades $<input required inputMode="numeric" value={cost} onChange={e => setCost(e.target.value)} /><small>Ingresá el total, no el precio de venta ni un costo unitario redondeado.</small></label>}
      {known && cost.trim() === '0' && <label className="m2-field">Motivo del costo cero<input required maxLength={120} value={costReason} onChange={e => setCostReason(e.target.value)} placeholder="Ej. unidades recibidas sin cargo" /></label>}
      <label className="local-check"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} /> {opening ? 'Comprobé las unidades físicas' : 'Recibí estas unidades y pagué este total en efectivo'}</label>
      {error && <p role="alert" className="local-error">{error}</p>}
      <MoraButton block type="submit" isBusy={busy}>{opening ? 'Guardar stock inicial' : 'Guardar recepción y pago'}</MoraButton>
    </form>
  </GlassPanel>;
}
function History({ sales }: { sales: Sale[] }) {
  return <GlassPanel><PanelHeading title="Historial local" />{!sales.length && <p className="mv-muted">Todavía no hay ventas.</p>}
    {[...sales].reverse().map(s => <details className="local-history" key={s.id}><summary><span>Venta · {new Date(s.registeredAt).toLocaleString('es-AR', { timeZone: 'America/Argentina/Salta' })}</span><strong>{formatArs(s.total)}</strong></summary>
      <p className="mv-muted">Guardada en este equipo · Efectivo · Jornada {s.businessDate}</p>
      <p>Recibido: {formatArs(s.received)} · Vuelto: {formatArs(s.change)}</p>
      {s.lines.map(l => <div className="local-history-line" key={l.id}><strong>{l.quantity} × {l.name} · {formatArs(l.unitPrice)}</strong><span>Costo: {l.cost ? formatArs(roundCost(l.cost)) : 'No calculable'}</span><span>{l.missingUnits > 0 ? `${l.missingUnits} unidades sin lote` : 'Asignación local FIFO'}</span><ul>{l.allocations.map(a => <li key={a.lotId}>{a.units} un. del lote {a.lotId.slice(0, 8)} · {a.cost ? formatArs(roundCost(a.cost)) : 'Costo desconocido'}</li>)}</ul></div>)}
      <p>Ganancia estimada local: {s.cost ? formatArs(roundCost(profit(s.total, s.cost))) : 'No calculable'}</p>
      {s.reviewIds.length > 0 && <p className="local-error">Revisión pendiente de stock o costo.</p>}
    </details>)}
  </GlassPanel>;
}
export default function LocalApp() {
  const [service] = useState(() => new LocalService(new LocalDatabase()));
  const [view, setView] = useState<Snapshot | null>(null), [fatal, setFatal] = useState('');
  const [tab, setTab] = useState<MoraDestination>('inicio'), [stage, setStage] = useState<'pick' | 'pay'>('pick');
  const [modal, setModal] = useState<Modal>(null), [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [error, setError] = useState('');
  const lock = useRef(false), retryCommand = useRef<Command | null>(null);
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
  const stockFor = (id: string) => sum(view?.stockEntries.filter(e => e.productId === id).map(e => e.delta) ?? []);
  const products = view?.products.filter(p => (tab === 'productos' || p.active) && `${p.name} ${p.variant} ${p.category}`.toLocaleLowerCase('es-AR').includes(search.toLocaleLowerCase('es-AR'))) ?? [];
  const salesToday = view?.sales.filter(s => s.businessDate === today) ?? [];
  const totalToday = sum(salesToday.map(s => s.total));
  const costedToday = salesToday.filter(s => s.cost !== null);
  const knownProfit = costedToday.reduce((n, s) => addCost(n, profit(s.total, s.cost!)), rational(0n));
  async function updateDraft(update: (d: Draft) => Draft) {
    if (!draft) throw new Error('Todavía no se abrió el borrador.');
    await service.saveDraft(update(draft));
  }
  async function add(p: Product) {
    await updateDraft(d => {
      const existing = d.lines.find(l => l.productId === p.id);
      return { ...d, lines: existing ? d.lines.map(l => l.id === existing.id ? { ...l, quantity: l.quantity + 1 } : l) : [...d.lines, draftLine(p)] };
    });
  }
  function navigate(to: MoraDestination) { setTab(to); setStage('pick'); setSearch(''); setModal(null); retryCommand.current = null; }
  async function saveProduct(fields: ProductFields) {
    await run(async () => {
      const p = modal?.kind === 'product' ? modal.product : undefined;
      const op = p ? { type: 'EditProduct' as const, payload: { productId: p.id, expectedVersion: p.version, fields } } : { type: 'CreateProduct' as const, payload: { productId: crypto.randomUUID(), fields } };
      // Retain a prepared attempt on storage failure. Editing the input starts a new command.
      const saved = retryCommand.current;
      const same = saved && (saved.type === 'CreateProduct' || saved.type === 'EditProduct') && JSON.stringify(saved.payload.fields) === JSON.stringify(fields);
      const command = same ? saved : await service.prepare(op); retryCommand.current = command;
      await service.execute(command); retryCommand.current = null; setModal(null); setMessage('Producto guardado en este equipo.');
    });
  }
  async function saveStock(quantity: number, totalCost: number | null, presentation: string, costReason: string) {
    await run(async () => {
      if (modal?.kind !== 'stock') return;
      const op = modal.opening ? { type: 'RecordOpeningStock' as const, payload: { productId: modal.product.id, quantity, totalCost, costReason } }
        : { type: 'ReceivePurchase' as const, payload: { receiptId: crypto.randomUUID(), lines: [{ id: crypto.randomUUID(), productId: modal.product.id, quantity, totalCost: totalCost!, presentation, costReason }] } };
      const prior = retryCommand.current;
      const same = prior?.type === 'RecordOpeningStock' ? prior.payload.quantity === quantity && prior.payload.totalCost === totalCost && prior.payload.costReason === costReason
        : prior?.type === 'ReceivePurchase' && prior.payload.lines[0].quantity === quantity && prior.payload.lines[0].totalCost === totalCost && prior.payload.lines[0].presentation === presentation && prior.payload.lines[0].costReason === costReason;
      const c = same ? prior! : await service.prepare(op); retryCommand.current = c;
      await service.execute(c); retryCommand.current = null; setModal(null); setMessage('Unidades y costo guardados en este equipo.');
    });
  }
  if (fatal) return <AppShell><EmptyState title="No se pudieron abrir los registros locales" description={fatal} action={<MoraButton onClick={() => location.reload()}>Volver a intentar</MoraButton>} /><p className="m2-note">No borres los datos del sitio. La demo no lee estos registros.</p></AppShell>;
  if (!view) return <AppShell><p role="status">Abriendo registros locales…</p></AppShell>;
  return <AppShell navigation={<BottomNav value={tab} onNavigate={navigate} icons={{ inicio: <Icon name="home" />, ventas: <Icon name="receipt" />, productos: <Icon name="box" />, reportes: <Icon name="chart" /> }} />}>
    <div className="local-banner" role="note"><strong>Modo local · Registros aislados</strong><span>Guardado en este equipo · Sin sincronización</span><a href={import.meta.env.BASE_URL}>Volver a la demo</a></div>
    {updateAvailable && <p className="m2-update" role="status">Versión nueva disponible. <MoraButton variant="quiet" disabled={busy || modal !== null} onClick={() => trigger(async () => { await paymentWrites.current; await applyPwaUpdate(); })}>Actualizar</MoraButton></p>}
    <header className="m2-page-header"><h1>{tab === 'inicio' ? 'Mora Vinería' : tab === 'ventas' ? stage === 'pay' ? 'Cobro en efectivo' : 'Nueva venta' : tab === 'productos' ? 'Productos' : 'Reportes locales'}</h1></header>
    <p className="m2-note">{view.pending} operaciones locales conservadas. Todavía no se envían a ningún servidor.</p>
    {message && <p className="local-success" role="status">{message}</p>}{error && <p className="local-error" role="alert">{error}</p>}
    {modal?.kind === 'product' && <ProductForm key={modal.product?.id ?? 'new'} product={modal.product} busy={busy} onSave={saveProduct} onClose={() => { setModal(null); retryCommand.current = null; }} />}
    {modal?.kind === 'stock' && <StockForm key={`${modal.product.id}:${modal.opening}`} product={modal.product} opening={modal.opening} busy={busy} onSave={saveStock} onClose={() => { setModal(null); retryCommand.current = null; }} />}
    {!modal && (tab === 'inicio' || tab === 'reportes') && <>
      <p className="mv-muted">Resumen de hoy · {today}</p>
      <MetricCard label="Ventas de hoy" value={totalToday} hero helper={`${salesToday.length} ventas en efectivo guardadas aquí`} />
      <MetricCard label="Ganancia estimada local" value={salesToday.length === costedToday.length ? roundCost(knownProfit) : null} helper={salesToday.length === costedToday.length ? 'FIFO local. Aún no confirmado por servidor.' : `${costedToday.length} de ${salesToday.length} ventas con costo completo. Subtotal conocido: ${formatArs(roundCost(knownProfit))}.`} />
      <GlassPanel><PanelHeading title="Para reponer" />{view.products.filter(p => p.active && p.objective !== null && stockFor(p.id) < p.objective).map(p => <p key={p.id}>{p.name}: {stockFor(p.id)} un. registradas · objetivo {p.objective} un.</p>)}<p className="mv-muted">Referencia contra el objetivo manual; no es un umbral de stock bajo ni un conteo físico.</p></GlassPanel>
      {tab === 'inicio' && <MoraButton block onClick={() => navigate('ventas')}>Nueva venta</MoraButton>}
      <GlassPanel><PanelHeading title="Movimientos de efectivo" /><p>{formatArs(sum(view.cashEntries.map(e => e.amount)))} de variación registrada.</p><p className="mv-muted">No es el saldo real de caja: aún no se registró una apertura ni un conteo.</p></GlassPanel>
      {view.reviews.length > 0 && <GlassPanel><PanelHeading title="Revisión pendiente" />{view.reviews.map(r => <p className="local-error" key={r.id}>{view.products.find(p => p.id === r.productId)?.name}: {r.detail}</p>)}<p className="mv-muted">Las diferencias se conservan. El flujo de conciliación se incorporará en otra etapa.</p></GlassPanel>}
      <History sales={tab === 'reportes' ? view.sales : salesToday} />
    </>}
    {!modal && tab === 'productos' && <>
      <MoraButton block onClick={() => { setModal({ kind: 'product' }); retryCommand.current = null; }}>Agregar producto</MoraButton>
      <label className="m2-field">Buscar producto<input value={search} onChange={e => setSearch(e.target.value)} type="search" /></label>
      {!products.length && <EmptyState title="Sin productos" description="Este espacio empieza vacío. Agregá un producto y después registrá sus unidades físicas o una recepción." />}
      {products.map(p => <GlassPanel key={p.id}><ProductRow name={p.name} detail={`${p.variant || 'Unidad individual'}${p.category ? ` · ${p.category}` : ''}${p.active ? '' : ' · Inactivo'}`} price={p.price} /><p className="mv-muted">{stockFor(p.id)} un. registradas · objetivo {p.objective ?? 'sin definir'}</p>
        <div className="local-actions"><MoraButton variant="secondary" onClick={() => setModal({ kind: 'product', product: p })}>Editar</MoraButton><MoraButton variant="secondary" onClick={() => setModal({ kind: 'stock', product: p, opening: !view.stockEntries.some(e => e.productId === p.id) })}>{view.stockEntries.some(e => e.productId === p.id) ? 'Recibir mercadería' : 'Stock inicial'}</MoraButton>{!view.stockEntries.some(e => e.productId === p.id) && <MoraButton variant="quiet" onClick={() => setModal({ kind: 'stock', product: p, opening: false })}>Registrar compra</MoraButton>}</div>
        <details className="local-history"><summary>Lotes registrados</summary>{view.lots.filter(l => l.productId === p.id).map(l => <p key={l.id}>Lote {l.id.slice(0, 8)} · {l.available}/{l.quantity} un. disponibles · costo unitario {l.unitCost ? `${l.unitCost.numerator}/${l.unitCost.denominator} ARS (exacto)` : 'desconocido'}</p>)}</details>
      </GlassPanel>)}
    </>}
    {!modal && tab === 'ventas' && stage === 'pick' && <>
      <label className="m2-field">Buscar producto<input type="search" value={search} onChange={e => setSearch(e.target.value)} /></label>
      {!products.length && <EmptyState title="Sin productos disponibles" description="Agregá un producto desde Productos. Los artículos desactivados no se ofrecen para una nueva venta." action={<MoraButton onClick={() => navigate('productos')}>Ir a Productos</MoraButton>} />}
      <GlassPanel>{products.map(p => <div key={p.id} className="local-catalog"><ProductRow name={p.name} detail={`${p.variant || 'Unidad individual'} · ${stockFor(p.id)} un. registradas`} price={p.price} onAdd={!busy && draft && !draft.submission ? () => trigger(() => add(p)) : undefined} /></div>)}</GlassPanel>
      {lines.length > 0 && <GlassPanel><PanelHeading title="Venta en preparación" />{lines.map(l => <div className="local-cart-line" key={l.id}><strong>{l.name}</strong><span>{formatArs(l.unitPrice)} por unidad</span><QuantityStepper label={l.name} value={l.quantity} min={0} onChange={quantity => { if (!busy && !draft?.submission) trigger(() => updateDraft(d => ({ ...d, lines: quantity === 0 ? d.lines.filter(a => a.id !== l.id) : d.lines.map(a => a.id === l.id ? { ...a, quantity } : a) }))); }} /></div>)}<p className="mv-muted">Cantidades y precios quedan guardados como borrador en este equipo.</p></GlassPanel>}
      <CartFooter total={total} count={count} disabled={busy || !draft} onCheckout={() => { setReceivedInput(draft?.received == null ? '' : String(draft.received)); paymentWrites.current = Promise.resolve(); setStage('pay'); }} />
    </>}
    {!modal && tab === 'ventas' && stage === 'pay' && <GlassPanel accent><PanelHeading title="Total a cobrar"><MoraButton variant="quiet" onClick={() => setStage('pick')}>Volver</MoraButton></PanelHeading><p className="local-total">{formatArs(total)}</p><p>Efectivo · {count} unidades</p>
      {draft?.submission ? <p className="mv-muted">La confirmación quedó preparada. Reintentá guardar con los mismos datos o volvé a editar si aún no se guardó.</p> : <label className="m2-field">Efectivo recibido $ (opcional)<input inputMode="numeric" value={receivedInput} disabled={busy} onChange={e => {
        const input = e.target.value;
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
      }} /><small>Si lo dejás vacío se registra cobro exacto; no se inventa el importe entregado.</small></label>}
      <p>Vuelto: {draft?.received == null || draft.received < total ? '—' : formatArs(draft.received - total)}</p>
      {lines.some(l => l.quantity > stockFor(l.productId)) && <p className="local-error">Hay unidades sin stock registrado suficiente. Si la venta física ocurrió, se conservará con una revisión pendiente.</p>}
      <MoraButton block isBusy={busy} disabled={!lines.length || !draft} onClick={() => trigger(async () => { if (!draft) return; await paymentWrites.current; const result = await service.checkoutDraft(draft.id); setStage('pick'); setMessage(result.reviewIds.length ? 'Venta guardada en este equipo. Hay stock o costo para revisar.' : 'Venta guardada en este equipo.'); try { await service.activeDraft(); } catch (e) { throw new Error(`La venta ya quedó guardada. No se pudo abrir una nueva venta: ${errorText(e)}`); } })}>Guardar venta en efectivo</MoraButton>
      {draft?.submission && <MoraButton block variant="secondary" disabled={busy} onClick={() => trigger(() => service.reopenDraft(draft.id))}>Volver a editar esta venta</MoraButton>}
      <p className="m2-note">El cobro es un registro manual. No hay banco, sincronización ni autorización multi-dispositivo.</p>
    </GlassPanel>}
  </AppShell>;
}
