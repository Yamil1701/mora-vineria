import { useEffect, useMemo, useState } from 'react';
import {
  AppShell, BottomNav, CartFooter, EmptyState, GlassPanel, Money,
  MoraButton, QuantityStepper, SegmentedTabs, formatArs,
  type MoraDestination,
} from './ui';
import { Icon } from './app/icons';
import { demoProducts, demoStartingSales, type DemoSale, type PaymentMethod } from './app/demo-data';
import {
  cartCount, cartTotal, currentStock, demoSalesTotal, getCartLines,
  needsReplenishment, parseWholePesos, updateQuantity, type Cart,
} from './app/demo-state';
import { applyPwaUpdate, setupPwaUpdateNotice } from './app/pwa';

const categoryNames = ['Todos', 'Cervezas', 'Gaseosas', 'Vinos', 'Energizantes', 'Aperitivos'] as const;
type Stage = 'pick' | 'cart' | 'checkout' | 'done';

function dateLabel() {
  return new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
}

/** This entire application is a throwaway in-memory preview. No remote or local business writes. */
export default function App() {
  const [tab, setTab] = useState<MoraDestination>('inicio');
  const [stage, setStage] = useState<Stage>('pick');
  const [cart, setCart] = useState<Cart>({});
  const [sales, setSales] = useState<DemoSale[]>([...demoStartingSales]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('Todos');
  const [method, setMethod] = useState<PaymentMethod>('efectivo');
  const [received, setReceived] = useState('');
  const [cashPart, setCashPart] = useState('');
  const [transferVerified, setTransferVerified] = useState(false);
  const [fiadoName, setFiadoName] = useState('');
  const [needsReview, setNeedsReview] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const handler = () => setUpdateAvailable(true);
    window.addEventListener('mora:app-update', handler);
    setupPwaUpdateNotice();
    return () => window.removeEventListener('mora:app-update', handler);
  }, []);

  const lines = useMemo(() => getCartLines(cart, demoProducts), [cart]);
  const total = useMemo(() => cartTotal(cart, demoProducts), [cart]);
  const count = useMemo(() => cartCount(cart, demoProducts), [cart]);
  const currentSales = useMemo(() => demoSalesTotal(sales), [sales]);
  const toReplenish = useMemo(() => demoProducts.filter(p => needsReplenishment(p, sales)), [sales]);
  const visible = useMemo(() => demoProducts.filter(p =>
    (category === 'Todos' || p.category === category) &&
    `${p.name} ${p.detail}`.toLocaleLowerCase('es-AR').includes(search.trim().toLocaleLowerCase('es-AR')),
  ), [category, search]);

  const changeTab = (next: MoraDestination) => {
    setTab(next);
    if (next === 'ventas') setStage('pick');
  };
  const beginSale = () => { setTab('ventas'); setStage('pick'); setSearch(''); setCategory('Todos'); };
  const adjust = (id: string, qty: number) => setCart(prev => updateQuantity(prev, id, qty));
  const resetPayment = () => { setReceived(''); setCashPart(''); setTransferVerified(false); setFiadoName(''); setMethod('efectivo'); };
  const goToCheckout = () => { resetPayment(); setStage('checkout'); };

  const cashReceived = received.trim() === '' ? total : parseWholePesos(received);
  const mixedCash = parseWholePesos(cashPart);
  const canCheckout = count > 0 && (
    (method === 'efectivo' && cashReceived !== null && cashReceived >= total) ||
    (method === 'transferencia' && transferVerified) ||
    (method === 'mixto' && mixedCash !== null && mixedCash > 0 && mixedCash < total && transferVerified) ||
    (method === 'fiado' && fiadoName.trim().length >= 2)
  );

  const finishDemoSale = () => {
    if (!canCheckout) return;
    const review = lines.some(line => currentStock(line.product, sales) < line.quantity);
    const sale: DemoSale = {
      id: `sim-${sales.length + 1}`,
      total,
      createdAt: new Date().toISOString(),
      method,
      items: Object.fromEntries(lines.map(line => [line.product.id, line.quantity])),
    };
    setSales(prev => [...prev, sale]);
    setCart({});
    setNeedsReview(review);
    setStage('done');
  };

  const navIcons = {
    inicio: <Icon name="home" size={23} />,
    ventas: <Icon name="cart" size={23} />,
    productos: <Icon name="box" size={23} />,
    reportes: <Icon name="chart" size={23} />,
  } as const;

  return (
    <AppShell navigation={<BottomNav value={tab} onNavigate={changeTab} icons={navIcons} />}>
      <div className="m2-banner" role="note"><span className="m2-banner__dot" /> Modo demostración · Datos ficticios · No se guardan</div>
      {updateAvailable && <div className="m2-update" role="status">Hay una nueva versión disponible. <button type="button" onClick={() => { void applyPwaUpdate(); }}>Actualizar cuando quieras</button></div>}

      {tab === 'inicio' && <>
        <header className="m2-head m2-head--home"><div><div className="m2-brand">Mora<span>.</span></div><div className="m2-brand-sub">VINERÍA</div></div><span className="m2-head__eyebrow">V2 · DEMO</span></header>
        <p className="m2-date">{dateLabel()}</p>
        <GlassPanel accent className="m2-hero">
          <span className="m2-caption">Ventas de hoy <span className="m2-demo-mini">ejemplo</span></span>
          <div className="m2-hero__amount"><Money value={currentSales} hero /></div>
          <div className="m2-hero__footer"><div><span className="m2-caption">Ganancia estimada</span><strong>—</strong><small>FIFO todavía no conectado</small></div><div><span className="m2-caption">Ventas registradas</span><strong>{sales.length}</strong><small>Solo en esta demostración</small></div></div>
        </GlassPanel>
        <div className="m2-action-zone"><MoraButton block onClick={beginSale}><Icon name="cart" /> Nueva venta <Icon name="arrow" /></MoraButton></div>
        <section className="m2-section" aria-labelledby="replenishment-title">
          <div className="m2-section__head"><h2 id="replenishment-title">Para reponer</h2><span className="m2-count">{toReplenish.length}</span></div>
          <GlassPanel flat className="m2-simple-list">
            {toReplenish.slice(0, 4).map(p => <div className="m2-list-row" key={p.id}><span className="m2-mini-product" aria-hidden="true">{p.glyph}</span><span>{p.name}</span><strong>{currentStock(p, sales)} un.</strong></div>)}
            <button className="m2-inline-link" onClick={() => changeTab('productos')} type="button">Ver productos <Icon name="arrow" size={16}/></button>
          </GlassPanel>
        </section>
        <div className="m2-note">Esta vista usa datos inventados para validar el diseño. No está vinculada a la caja, al stock real ni a Supabase.</div>
      </>}

      {tab === 'ventas' && stage === 'pick' && <>
        <header className="m2-head"><div><p className="m2-overline">VENTAS</p><h1>Nueva venta</h1></div><span className="m2-icon-sub"><Icon name="cart" /></span></header>
        <label className="m2-search"><Icon name="search" size={20}/><span className="sr-only">Buscar producto</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar producto…" autoComplete="off" /></label>
        <div className="m2-filter-scroll" aria-label="Filtrar por categoría">{categoryNames.map(name => <button key={name} type="button" className={category === name ? 'm2-chip m2-chip--active' : 'm2-chip'} onClick={() => setCategory(name)} aria-pressed={category === name}>{name}</button>)}</div>
        <div className="m2-section__head"><h2>Productos</h2><span className="m2-muted">{visible.length} disponibles en demo</span></div>
        <GlassPanel flat className="m2-product-list">
          {visible.length ? visible.map(p => <div className="m2-product" key={p.id}><div className="m2-product__pic" aria-hidden="true">{p.glyph}</div><div className="m2-product__text"><b>{p.name}</b><small>{p.detail}</small><strong>{formatArs(p.price)}</strong><span className="m2-product__stock">Stock de ejemplo: {currentStock(p, sales)} un.</span></div><button type="button" className="m2-add" onClick={() => adjust(p.id, (cart[p.id] ?? 0) + 1)} aria-label={`Agregar ${p.name}`}>+</button></div>) : <EmptyState title="Sin resultados" description="Probá otro nombre o categoría." />}
        </GlassPanel>
        <div className="m2-sticky-cart"><div className="mv-cart-footer"><div className="mv-cart-footer__summary"><span className="mv-muted">{count} {count === 1 ? 'unidad' : 'unidades'}</span><span className="mv-cart-footer__amount">{formatArs(total)}</span></div><MoraButton block disabled={count === 0} onClick={() => setStage('cart')}>Ver carrito <Icon name="arrow" /></MoraButton></div></div>
      </>}

      {tab === 'ventas' && stage === 'cart' && <>
        <header className="m2-head"><button className="m2-back" type="button" onClick={() => setStage('pick')} aria-label="Volver a productos"><Icon name="back" /></button><div><h1>Carrito</h1><p className="m2-muted">{count} unidades · {lines.length} productos</p></div><button className="m2-clear" type="button" onClick={() => setCart({})}>Vaciar</button></header>
        <GlassPanel flat className="m2-cart-list">
          {lines.map(({product,quantity,lineTotal}) => <div className="m2-cart-item" key={product.id}><div className="m2-product__pic" aria-hidden="true">{product.glyph}</div><div className="m2-cart-item__body"><b>{product.name}</b><small>{product.detail}</small><div className="m2-cart-item__bottom"><span className="m2-muted">{formatArs(product.price)} c/u</span><strong>{formatArs(lineTotal)}</strong></div><QuantityStepper value={quantity} min={0} onChange={qty => adjust(product.id, qty)} label={product.name}/></div></div>)}
          {lines.length === 0 && <EmptyState title="Carrito vacío" description="Agregá productos para continuar." action={<MoraButton onClick={() => setStage('pick')}>Buscar productos</MoraButton>}/>} 
        </GlassPanel>
        <button className="m2-inline-add" type="button" onClick={() => setStage('pick')}>+ Agregar otro producto</button>
        <div className="m2-sticky-cart"><CartFooter total={total} count={count} disabled={count === 0} onCheckout={goToCheckout}/></div>
      </>}

      {tab === 'ventas' && stage === 'checkout' && <>
        <header className="m2-head"><button className="m2-back" type="button" onClick={() => setStage('cart')} aria-label="Volver al carrito"><Icon name="back" /></button><h1>Cobro de prueba</h1></header>
        <GlassPanel accent className="m2-pay-total"><span className="m2-caption">Total a cobrar</span><Money value={total} hero /></GlassPanel>
        <div className="m2-pay-method"><SegmentedTabs label="Forma de cobro" value={method} onChange={next => { setMethod(next as PaymentMethod); setTransferVerified(false); }} tabs={[{id:'efectivo',label:'Efectivo'},{id:'transferencia',label:'Transferencia'},{id:'mixto',label:'Mixto'},{id:'fiado',label:'Fiado'}]}/></div>
        {method === 'efectivo' && <GlassPanel><label className="mv-field"><span className="mv-field__label">Recibido en efectivo (opcional)</span><input className="mv-input" type="text" inputMode="numeric" value={received} onChange={e => setReceived(e.target.value)} placeholder="Importe exacto" /></label><div className="m2-calculation"><span>Vuelto</span><strong>{cashReceived !== null && cashReceived >= total ? formatArs(cashReceived - total) : 'Revisar importe'}</strong></div></GlassPanel>}
        {method === 'transferencia' && <GlassPanel><p className="m2-method-label">Cuenta que recibe: <strong>Brubank (ejemplo)</strong></p><p className="m2-muted">Comprobá la acreditación en el banco antes de entregar el pedido.</p><label className="m2-checkbox"><input type="checkbox" checked={transferVerified} onChange={e => setTransferVerified(e.target.checked)} /><span>Verifiqué la transferencia manualmente</span></label></GlassPanel>}
        {method === 'mixto' && <GlassPanel><label className="mv-field"><span className="mv-field__label">Parte recibida en efectivo</span><input className="mv-input" type="text" inputMode="numeric" value={cashPart} onChange={e => setCashPart(e.target.value)} placeholder="Ejemplo: 5000" /></label><div className="m2-calculation"><span>Parte transferida a Brubank</span><strong>{mixedCash !== null && mixedCash >= 0 && mixedCash <= total ? formatArs(total - mixedCash) : '—'}</strong></div><label className="m2-checkbox"><input type="checkbox" checked={transferVerified} onChange={e => setTransferVerified(e.target.checked)} /><span>Comprobé la parte transferida</span></label></GlassPanel>}
        {method === 'fiado' && <GlassPanel><label className="mv-field"><span className="mv-field__label">Nombre de quien debe</span><input className="mv-input" value={fiadoName} onChange={e => setFiadoName(e.target.value)} placeholder="Nombre del cliente" maxLength={80} /></label><p className="m2-muted">Sin vencimiento ni límite automático: decide la persona que atiende.</p></GlassPanel>}
        <p className="m2-note">Este cobro es una simulación. No se conecta al banco ni se registra en el negocio.</p>
        <MoraButton block disabled={!canCheckout} onClick={finishDemoSale}>Registrar venta de prueba <Icon name="arrow" /></MoraButton>
      </>}

      {tab === 'ventas' && stage === 'done' && <>
        <GlassPanel accent className="m2-finish"><Icon name="check" size={50}/><h1>Venta simulada</h1><p>Se registró solamente en la memoria de esta sesión. No hay datos reales ni sincronización.</p>{needsReview && <div className="m2-review"><Icon name="alert" size={20}/>Revisar stock: se vendieron más unidades que las indicadas en la demostración.</div>}<MoraButton block onClick={beginSale}>Nueva venta</MoraButton><MoraButton variant="secondary" block onClick={() => changeTab('inicio')}>Volver al inicio</MoraButton></GlassPanel>
      </>}

      {tab === 'productos' && <>
        <header className="m2-head"><div><p className="m2-overline">CATÁLOGO · DEMO</p><h1>Productos</h1></div></header>
        <GlassPanel flat className="m2-product-list">{demoProducts.map(p => <div key={p.id} className="m2-product"><span className="m2-product__pic" aria-hidden="true">{p.glyph}</span><div className="m2-product__text"><b>{p.name}</b><small>{p.category}</small><strong>{formatArs(p.price)}</strong><span className="m2-product__stock">{currentStock(p,sales)} / {p.objective} unidades objetivo</span></div></div>)}</GlassPanel>
        <p className="m2-note">La gestión real de productos y los lotes FIFO se incorporarán después de validar esta interfaz.</p>
      </>}

      {tab === 'reportes' && <>
        <header className="m2-head"><div><p className="m2-overline">ANÁLISIS · DEMO</p><h1>Reportes</h1></div></header>
        <GlassPanel accent className="m2-hero"><span className="m2-caption">Ventas simuladas</span><div className="m2-hero__amount"><Money value={currentSales} hero /></div><div className="m2-hero__footer"><div><span className="m2-caption">Registros de ejemplo</span><strong>{sales.length}</strong></div><div><span className="m2-caption">Ganancia FIFO</span><strong>—</strong><small>Sin costeo todavía</small></div></div></GlassPanel>
        <EmptyState title="Los reportes reales vendrán después" description="Primero probamos navegación, lectura y cobro. Los reportes reales necesitan ventas y lotes reconciliados en Supabase." />
      </>}
    </AppShell>
  );
}
