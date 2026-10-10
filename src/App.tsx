import { useEffect, useMemo, useState } from 'react';
import { AppShell, BottomNav, GlassPanel, Money, MoraButton, QuantityStepper, formatArs, type MoraDestination } from './ui';
import { Icon } from './app/icons';
import { ProductArt } from './app/ProductArt';
import { demoProducts, demoStartingSales, type DemoProduct, type DemoSale, type PaymentMethod, type ProductCategory } from './app/demo-data';
import { cartCount, cartTotal, currentStock, demoSalesTotal, getCartLines, needsReplenishment, parseWholePesos, updateQuantity, type Cart } from './app/demo-state';
import { applyPwaUpdate, setupPwaUpdateNotice } from './app/pwa';

const categories = ['Todos', 'Cervezas', 'Gaseosas', 'Vinos', 'Energizantes', 'Aperitivos'] as const;
type Stage = 'pick' | 'cart' | 'checkout' | 'history' | 'done';
type SortOrder = 'nombre' | 'precioAsc' | 'precioDesc' | 'stock';
type Bank = 'Brubank' | 'Mercado Pago' | 'Naranja X';
const favorites = ['trapiche', 'corona', 'fernet', 'coca'];
const banks: Bank[] = ['Brubank', 'Mercado Pago', 'Naranja X'];
const methods: { id: PaymentMethod; label: string; icon: 'cash' | 'bank' | 'split' | 'fiado' }[] = [
  { id: 'efectivo', label: 'Efectivo', icon: 'cash' },
  { id: 'transferencia', label: 'Transferencia', icon: 'bank' },
  { id: 'mixto', label: 'Mixto', icon: 'split' },
  { id: 'fiado', label: 'Fiado', icon: 'fiado' },
];
const newProductDefaults = { name: '', category: 'Gaseosas' as ProductCategory, price: '', stock: '', objective: '' };

const sortLabels: Record<SortOrder, string> = {
  nombre: 'Nombre (A–Z)', precioAsc: 'Menor precio', precioDesc: 'Mayor precio', stock: 'Menor stock',
};
function dateLabel(): string {
  return new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
}
function getSortedProducts(products: readonly DemoProduct[], sort: SortOrder, sales: readonly DemoSale[]): DemoProduct[] {
  return [...products].sort((a, b) => {
    if (sort === 'precioAsc') return a.price - b.price;
    if (sort === 'precioDesc') return b.price - a.price;
    if (sort === 'stock') return currentStock(a, sales) - currentStock(b, sales);
    return a.name.localeCompare(b.name, 'es-AR');
  });
}
function StockPill({ product, sales }: { product: DemoProduct; sales: readonly DemoSale[] }) {
  const units = currentStock(product, sales);
  const low = needsReplenishment(product, sales);
  return <span className={`m2-stockpill ${low ? 'm2-stockpill--low' : ''}`} aria-label={`${units} unidades registradas, objetivo ${product.objective}`}>
    {units} un.
  </span>;
}
function SectionTitle({ icon, title, right }: { icon?: 'star' | 'box' | 'chart' | 'coins'; title: string; right?: React.ReactNode }) {
  return <div className="m2-section-top"><div className="m2-section-top__name">{icon && <Icon name={icon} size={21} />}<h2>{title}</h2></div>{right}</div>;
}
function ChevronLink({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="m2-text-link">{children}<Icon name="chevron" size={17}/></button>;
}
function DemoNote({ children }: { children: React.ReactNode }) {
  return <p className="m2-note">{children}</p>;
}
function ProductLine({ product, sales, onAdd, showCheck = false, onCheck }: {
  product: DemoProduct;
  sales: readonly DemoSale[];
  onAdd?: () => void;
  showCheck?: boolean;
  onCheck?: () => void;
}) {
  return <div className={`m2-catalog-row ${needsReplenishment(product, sales) ? 'm2-catalog-row--low' : ''}`}>
    <ProductArt product={product} className="m2-catalog-row__art" />
    <div className="m2-catalog-row__body">
      <span className="m2-product-name">{product.name}</span>
      <span className="m2-product-subtitle">{product.detail}</span>
      <strong className="m2-row-price">{formatArs(product.price)}</strong>
      {showCheck && <span className="m2-stock-hint">Stock registrado · objetivo {product.objective} un.</span>}
    </div>
    {showCheck ? <div className="m2-catalog-row__end"><StockPill product={product} sales={sales}/><button className="m2-icon-outline" type="button" onClick={onCheck} aria-label={`Comprobar stock de ${product.name}`}><Icon name="chart" size={19}/></button><span className="m2-mini-action">Comprobar</span></div>
      : <button type="button" className="m2-round-add" aria-label={`Agregar ${product.name}`} onClick={onAdd}><Icon name="plus" size={22}/></button>}
  </div>;
}

/** UI-only demonstration. Changes exist in RAM exclusively; no Dexie, Supabase or banking calls. */
export default function App() {
  const [tab, setTab] = useState<MoraDestination>('inicio');
  const [stage, setStage] = useState<Stage>('pick');
  const [products, setProducts] = useState<DemoProduct[]>([...demoProducts]);
  const [cart, setCart] = useState<Cart>({});
  const [sales, setSales] = useState<DemoSale[]>([...demoStartingSales]);
  const [search, setSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [category, setCategory] = useState<string>('Todos');
  const [productCategory, setProductCategory] = useState<string>('Todos');
  const [sort, setSort] = useState<SortOrder>('nombre');
  const [showFilters, setShowFilters] = useState(false);
  const [lowOnly, setLowOnly] = useState(false);
  const [categoryScrolled, setCategoryScrolled] = useState(false);
  const [allFavorites, setAllFavorites] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>('efectivo');
  const [bank, setBank] = useState<Bank>('Brubank');
  const [received, setReceived] = useState('');
  const [cashPart, setCashPart] = useState('');
  const [transferVerified, setTransferVerified] = useState(false);
  const [fiadoName, setFiadoName] = useState('');
  const [cashExpanded, setCashExpanded] = useState(false);
  const [needsReview, setNeedsReview] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [newProduct, setNewProduct] = useState(newProductDefaults);
  const [reportRange, setReportRange] = useState<'Hoy' | 'Semana' | 'Mes'>('Hoy');

  useEffect(() => {
    const handler = () => setUpdateAvailable(true);
    window.addEventListener('mora:app-update', handler);
    setupPwaUpdateNotice();
    return () => window.removeEventListener('mora:app-update', handler);
  }, []);
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'auto' }); setCategoryScrolled(false); }, [tab, stage]);
  useEffect(() => {
    if (tab !== 'ventas' || stage !== 'pick') return;
    const onScroll = () => setCategoryScrolled(window.scrollY > 150);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [tab, stage]);

  const lines = useMemo(() => getCartLines(cart, products), [cart, products]);
  const total = useMemo(() => cartTotal(cart, products), [cart, products]);
  const count = useMemo(() => cartCount(cart, products), [cart, products]);
  const currentSales = useMemo(() => demoSalesTotal(sales), [sales]);
  const toReplenish = useMemo(() => products.filter(p => needsReplenishment(p, sales)).sort((a,b) => currentStock(a,sales)/Math.max(a.objective,1) - currentStock(b,sales)/Math.max(b.objective,1)), [products, sales]);
  const filtered = useMemo(() => getSortedProducts(products.filter(p =>
    (category === 'Todos' || p.category === category) &&
    `${p.name} ${p.detail}`.toLocaleLowerCase('es-AR').includes(search.trim().toLocaleLowerCase('es-AR')) &&
    (!lowOnly || needsReplenishment(p, sales))), sort, sales), [products, sales, category, search, lowOnly, sort]);
  const catalog = useMemo(() => getSortedProducts(products.filter(p =>
    (productCategory === 'Todos' || p.category === productCategory) &&
    `${p.name} ${p.detail}`.toLocaleLowerCase('es-AR').includes(productSearch.trim().toLocaleLowerCase('es-AR')) &&
    (!lowOnly || needsReplenishment(p, sales))), sort, sales), [products, sales, productCategory, productSearch, lowOnly, sort]);
  const favoriteProducts = products.filter(p => favorites.includes(p.id));

  const changeTab = (next: MoraDestination) => { setTab(next); if (next === 'ventas') setStage('pick'); setShowFilters(false); };
  const beginSale = () => { setTab('ventas'); setStage('pick'); setSearch(''); setCategory('Todos'); setShowFilters(false); };
  const adjust = (id: string, qty: number) => setCart(prev => updateQuantity(prev, id, qty));
  const resetPayment = () => { setReceived(''); setCashPart(''); setTransferVerified(false); setFiadoName(''); setMethod('efectivo'); setBank('Brubank'); setCashExpanded(false); };
  const goToCheckout = () => { if (count === 0) return; resetPayment(); setTab('ventas'); setStage('checkout'); };

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
      id: `sim-${sales.length + 1}`, total, createdAt: new Date().toISOString(), method,
      items: Object.fromEntries(lines.map(line => [line.product.id, line.quantity])),
    };
    setSales(prev => [...prev, sale]); setCart({}); setNeedsReview(review); setStage('done');
  };
  const addDemoProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const price = parseWholePesos(newProduct.price);
    const stock = parseWholePesos(newProduct.stock);
    const objective = parseWholePesos(newProduct.objective);
    if (!newProduct.name.trim() || price === null || price <= 0 || stock === null || objective === null || objective < 1) return;
    const newEntry: DemoProduct = {
      id: `demo-added-${Date.now()}`, name: newProduct.name.trim(), category: newProduct.category,
      detail: `${newProduct.category} · Agregado en esta demo`, price, stock, objective, glyph: '•',
    };
    setProducts(prev => [...prev, newEntry]); setNewProduct(newProductDefaults); setFormOpen(false);
    setProductSearch(''); setProductCategory('Todos'); setLowOnly(false);
    setNotice('Producto agregado únicamente a esta demostración. Se pierde al recargar.');
  };
  const navIcons = {
    inicio: <Icon name="home" size={23} />, ventas: <Icon name="cart" size={23} />,
    productos: <Icon name="box" size={23} />, reportes: <Icon name="chart" size={23} />,
  } as const;

  return <AppShell navigation={<BottomNav value={tab} onNavigate={changeTab} icons={navIcons}/> }>
    <div className="m2-demo-flag" role="note"><span className="m2-demo-flag__dot"/> DEMOSTRACIÓN · Datos ficticios · Sin guardado real</div>
    {updateAvailable && <div className="m2-update" role="status">Versión nueva disponible. <button type="button" onClick={() => { void applyPwaUpdate(); }}>Actualizar cuando quieras</button></div>}

    {tab === 'inicio' && <>
      <header className="m2-head m2-home-head"><div><div className="m2-brand">Mora<span>.</span></div><div className="m2-brand-sub">VINERÍA</div></div><span className="m2-v2-chip">V2 · DEMO</span></header>
      <div className="m2-home-intro"><p className="m2-date">{dateLabel()}</p><button className="m2-new-sale" onClick={beginSale} type="button"><Icon name="plus" size={17}/> Nueva venta <Icon name="chevron" size={17}/></button></div>
      <GlassPanel accent className="m2-home-hero m2-glass">
        <button className="m2-card-heading" type="button" onClick={() => changeTab('reportes')} aria-label="Ver el detalle de ventas">
          <span className="m2-icon-well"><Icon name="chart" size={23}/></span><span>Ventas de hoy</span><Icon name="chevron" size={18}/>
        </button>
        <div className="m2-hero-bottom"><div><div className="m2-hero-value"><Money value={currentSales} hero/></div><span className="m2-muted-light">{sales.length} ventas simuladas</span></div><span className="m2-demo-tag">EJEMPLO</span></div>
      </GlassPanel>
      <GlassPanel className="m2-gain-card m2-glass">
        <div className="m2-icon-well m2-icon-well--subtle"><Icon name="coins" size={22}/></div>
        <div className="m2-gain-card__body"><span className="m2-card-label">Ganancia estimada</span><strong>—</strong><small>Sin costos FIFO reconciliados</small></div>
        <button className="m2-card-chevron" type="button" onClick={() => changeTab('reportes')} aria-label="Ver reportes de ganancias"><Icon name="chevron" size={19}/></button>
      </GlassPanel>
      <GlassPanel className="m2-replenish-panel m2-glass">
        <SectionTitle icon="box" title="Para reponer" right={<ChevronLink onClick={() => { changeTab('productos'); setProductSearch(''); setProductCategory('Todos'); setLowOnly(true); }}>Ver todos</ChevronLink>} />
        <div className="m2-replenish-list">
          {toReplenish.slice(0,3).map(p => <button className="m2-replenish-row" key={p.id} onClick={() => { changeTab('productos'); setProductSearch(p.name); }} type="button">
            <ProductArt product={p} className="m2-replenish-row__art"/><span className="m2-replenish-row__copy"><strong>{p.name}</strong><span>Quedan pocas unidades</span></span><span className="m2-replenish-row__qty">{currentStock(p,sales)} un.</span><Icon name="chevron" size={17}/>
          </button>)}
          {toReplenish.length === 0 && <p className="m2-muted-light">Sin productos para reponer en la demostración.</p>}
        </div>
      </GlassPanel>
      <DemoNote>Los importes y el inventario de esta pantalla son ejemplos. No representan movimientos de Mora.</DemoNote>
    </>}

    {tab === 'ventas' && stage === 'pick' && <>
      <header className="m2-head m2-pick-head"><div><p className="m2-overline">VENTAS</p><h1>Nueva venta</h1></div><button className="m2-top-action" type="button" onClick={() => setStage('history')} aria-label="Historial de ventas"><Icon name="history" size={24}/></button></header>
      <label className="m2-searchbox"><Icon name="search" size={21}/><span className="sr-only">Buscar productos</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar producto…" autoComplete="off"/></label>
      {!categoryScrolled && <div className="m2-category-scroll" aria-label="Categorías de venta">{categories.map(name => <button key={name} type="button" className={`m2-pill ${category === name ? 'm2-pill--active' : ''}`} aria-pressed={category === name} onClick={() => setCategory(name)}>{name}</button>)}</div>}
      {search.trim() === '' && category === 'Todos' && <section className="m2-favorites-section">
        <SectionTitle icon="star" title="Favoritos" right={<ChevronLink onClick={() => setAllFavorites(v => !v)}>{allFavorites ? 'Ver menos' : 'Ver todos'}</ChevronLink>}/>
        <div className={`m2-favorites ${allFavorites ? 'm2-favorites--wrap' : ''}`}>
          {favoriteProducts.map(p => <div className="m2-favorite-card m2-glass" key={p.id}>
            <ProductArt product={p} className="m2-favorite-card__art"/>
            <button className="m2-favorite-card__plus" type="button" onClick={() => adjust(p.id,(cart[p.id]??0)+1)} aria-label={`Agregar ${p.name}`}><Icon name="plus" size={19}/></button>
            <div className="m2-favorite-card__copy"><strong>{p.name}</strong><span>{p.detail.split('·')[0].trim()}</span><b>{formatArs(p.price)}</b></div>
          </div>)}
        </div>
      </section>}
      <section className="m2-all-products">
        <SectionTitle title={search.trim() ? 'Resultados' : 'Todos los productos'} right={<button className="m2-sort-link" onClick={() => setShowFilters(v => !v)} type="button" aria-expanded={showFilters}><span>Ordenar</span><Icon name="filter" size={21}/></button>}/>
        {showFilters && <div className="m2-filters m2-glass"><label className="m2-filter-label">Ordenar por<select value={sort} onChange={e => setSort(e.target.value as SortOrder)}>{(Object.keys(sortLabels) as SortOrder[]).map(id=><option key={id} value={id}>{sortLabels[id]}</option>)}</select></label><label className="m2-check-row"><input type="checkbox" checked={lowOnly} onChange={e=>setLowOnly(e.target.checked)}/> Solo para reponer</label></div>}
        <div className="m2-sale-products">{filtered.length ? filtered.map(p => <ProductLine key={p.id} product={p} sales={sales} onAdd={() => adjust(p.id, (cart[p.id]??0)+1)}/>) : <GlassPanel><strong>Sin resultados</strong><p className="m2-muted-light">Probá otro nombre o categoría.</p></GlassPanel>}</div>
      </section>
      {count > 0 && <div className="m2-cart-reserve" aria-hidden="true"/>}
      {count > 0 && <div className="m2-direct-cart" role="region" aria-label="Resumen del carrito"><button type="button" className="m2-direct-cart__detail" onClick={()=>setStage('cart')} aria-label={`Ver carrito: ${count} unidades, total ${formatArs(total)}`}><span className="m2-direct-cart__icon"><Icon name="cart" size={25}/><span className="m2-direct-cart__count">{count}</span></span><span className="m2-direct-cart__total"><small>{lines.length} {lines.length === 1 ? 'producto' : 'productos'}</small><strong>{formatArs(total)}</strong></span></button><button className="m2-direct-cart__pay" onClick={goToCheckout} type="button">Cobrar <Icon name="chevron" size={20}/></button></div>}
    </>}

    {tab === 'ventas' && stage === 'cart' && <>
      <header className="m2-head m2-subhead"><button type="button" className="m2-back" onClick={() => setStage('pick')} aria-label="Volver a productos"><Icon name="back"/></button><div className="m2-subhead__titles"><h1>Carrito</h1><span>{count} {count === 1 ? 'unidad' : 'unidades'} · {lines.length} productos</span></div><button type="button" className="m2-outline-pink" onClick={() => setCart({})}>Vaciar</button></header>
      <GlassPanel className="m2-cart-panel m2-glass">{lines.length > 0 ? lines.map(({product, quantity, lineTotal}) => <div className="m2-cart-product" key={product.id}>
        <ProductArt product={product} className="m2-cart-product__art"/>
        <div className="m2-cart-product__details"><strong>{product.name}</strong><span>{product.detail}</span><small>{formatArs(product.price)} c/u</small><div className="m2-cart-product__controls"><QuantityStepper value={quantity} min={0} onChange={q => adjust(product.id,q)} label={product.name}/><b>{formatArs(lineTotal)}</b></div></div>
      </div>) : <div className="m2-empty"><Icon name="cart" size={36}/><strong>Carrito vacío</strong><p>Agregá productos para continuar.</p></div>}</GlassPanel>
      <button type="button" className="m2-add-more" onClick={() => setStage('pick')}><Icon name="plus" size={17}/> Agregar otro producto</button>
      {count > 0 && <div className="m2-cart-checkout m2-glass"><div><span>Total a cobrar</span><strong>{formatArs(total)}</strong></div><MoraButton block onClick={goToCheckout}>Continuar al cobro <Icon name="arrow" size={20}/></MoraButton></div>}
    </>}

    {tab === 'ventas' && stage === 'checkout' && <>
      <header className="m2-head m2-checkout-head"><button className="m2-back m2-back--plain" type="button" onClick={() => setStage('pick')} aria-label="Volver a productos"><Icon name="back" size={26}/></button><div><h1>Cobro</h1><span>Finalizá la venta</span></div></header>
      <GlassPanel className="m2-checkout-total m2-glass" accent>
        <div className="m2-checkout-total__label"><span className="m2-icon-well"><Icon name="cart" size={24}/></span><span>Total a cobrar</span></div>
        <div className="m2-checkout-total__money"><Money value={total} hero/></div>
        <div className="m2-checkout-total__foot"><span>{lines.length} productos · {count} unidades</span><button type="button" onClick={() => setStage('cart')}>Ver detalle <Icon name="chevron" size={17}/></button></div>
      </GlassPanel>
      <GlassPanel className="m2-method-panel m2-glass"><div className="m2-method-heading"><h2>Método de pago</h2><span><Icon name="info" size={17}/> Elegí cómo cobrar</span></div><div className="m2-method-grid">{methods.map(m => <button className={`m2-method-choice ${method === m.id ? 'm2-method-choice--selected' : ''}`} key={m.id} type="button" aria-pressed={method === m.id} onClick={() => {setMethod(m.id);setTransferVerified(false);}}><Icon name={m.icon} size={26}/><span>{m.label}</span></button>)}</div>
        {(method === 'transferencia' || method === 'mixto') && <div className="m2-transfer-box"><div className="m2-transfer-top"><h3>Cuenta de destino</h3><span className="m2-demo-subtle">Sin datos bancarios reales</span></div><div className="m2-bank-choices">{banks.map(b=><button key={b} type="button" aria-pressed={bank === b} className={`m2-bank-pill ${bank === b?'m2-bank-pill--on':''}`} onClick={()=>{setBank(b);setTransferVerified(false);}}><span className="m2-bank-symbol" aria-hidden="true">{b === 'Brubank' ? 'b' : b === 'Mercado Pago' ? 'MP' : 'NX'}</span>{b}</button>)}</div><div className="m2-verification"><div className="m2-verification__row"><span className="m2-verify-icon"><Icon name={transferVerified?'check':'clock'} size={24}/></span><div><strong>{transferVerified?'Verificación manual indicada':'Esperando verificación'}</strong><small>{bank === 'Brubank'?'Comprobá la acreditación en Brubank.':`Comprobá el movimiento de Mora en ${bank}.`}</small></div></div><button type="button" className={`m2-verify-button ${transferVerified?'m2-verify-button--checked':''}`} aria-pressed={transferVerified} onClick={()=>setTransferVerified(v=>!v)}><Icon name="check" size={19}/>{transferVerified?'Verificación indicada · Cambiar':'Ya verifiqué la transferencia'}</button></div></div>}
        {method === 'efectivo' && <div className="m2-cash-box"><label className="m2-field"><span>Dinero recibido <span className="m2-optional">opcional</span></span><input type="text" inputMode="numeric" value={received} onChange={e=>setReceived(e.target.value)} placeholder="Importe exacto"/></label><div className="m2-cash-row"><span>Vuelto</span><strong>{cashReceived !== null && cashReceived >= total ? formatArs(cashReceived-total) : 'Revisá el importe'}</strong></div></div>}
        {method === 'mixto' && <div className="m2-cash-box"><label className="m2-field"><span>Parte en efectivo</span><input type="text" inputMode="numeric" value={cashPart} onChange={e=>setCashPart(e.target.value)} placeholder="Ejemplo: 5000"/></label><div className="m2-cash-row"><span>Parte transferida</span><strong>{mixedCash !== null && mixedCash >= 0 && mixedCash <= total ? formatArs(total-mixedCash) : '—'}</strong></div></div>}
        {method === 'fiado' && <div className="m2-cash-box"><label className="m2-field"><span>Nombre del cliente</span><input value={fiadoName} onChange={e=>setFiadoName(e.target.value)} placeholder="A quién se le fía" maxLength={80}/></label><p className="m2-inline-explainer">Se registra como deuda, no como dinero cobrado.</p></div>}
      </GlassPanel>
      {method === 'transferencia' && <button className="m2-optional-row" type="button" aria-expanded={cashExpanded} onClick={()=>setCashExpanded(v=>!v)}><Icon name="cash" size={22}/> Detalle de efectivo <span>{cashExpanded?'Ocultar':'Inactivo'}</span><Icon name="chevron" size={18}/></button>}
      {method === 'transferencia' && cashExpanded && <GlassPanel flat><p className="m2-inline-explainer">Esta venta se cobra completamente por transferencia. Para dividir el pago, elegí «Mixto».</p></GlassPanel>}
      <MoraButton block className="m2-confirm-button" onClick={finishDemoSale} disabled={!canCheckout}><Icon name="wallet" size={22}/> Registrar venta de prueba <Icon name="chevron" size={19}/></MoraButton>
      <div className="m2-checkout-footnote"><Icon name="info" size={17}/> Simulación solamente. No acredita dinero, no se guarda ni se sincroniza.</div>
    </>}

    {tab === 'ventas' && stage === 'history' && <>
      <header className="m2-head m2-subhead"><button type="button" className="m2-back" onClick={() => setStage('pick')} aria-label="Volver a nueva venta"><Icon name="back"/></button><div className="m2-subhead__titles"><h1>Historial</h1><span>Registros de prueba · Solo esta sesión</span></div></header>
      <GlassPanel className="m2-history-panel m2-glass">{[...sales].reverse().map((s,i)=><div className="m2-history-row" key={s.id}><span className="m2-icon-well"><Icon name="receipt" size={21}/></span><div><strong>Venta de ejemplo #{sales.length-i}</strong><small>{s.method} · {s.createdAt==='demo'?'Dato ficticio':new Date(s.createdAt).toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'})}</small></div><b>{formatArs(s.total)}</b></div>)}</GlassPanel>
    </>}

    {tab === 'ventas' && stage === 'done' && <GlassPanel className="m2-finish m2-glass" accent><span className="m2-success-icon"><Icon name="check" size={37}/></span><h1>Venta simulada</h1><p>Registrada solo en esta sesión de prueba. Al recargar se pierde; no hay datos reales ni sincronización.</p>{needsReview && <div className="m2-review"><Icon name="alert" size={20}/>Se vendieron más unidades de las registradas: revisar el stock físico.</div>}<MoraButton block onClick={beginSale}>Nueva venta</MoraButton><MoraButton variant="secondary" block onClick={()=>changeTab('inicio')}>Volver a Inicio</MoraButton></GlassPanel>}

    {tab === 'productos' && <>
      <header className="m2-head m2-products-head"><div><h1 className="m2-serif">Productos</h1><span className="m2-products-head__subtitle">Tu catálogo de bebidas y más</span></div><span className="m2-icon-well"><Icon name="box" size={24}/></span></header>
      <div className="m2-products-search"><label className="m2-searchbox"><Icon name="search" size={21}/><span className="sr-only">Buscar productos del catálogo</span><input value={productSearch} onChange={e=>setProductSearch(e.target.value)} placeholder="Buscar productos…" autoComplete="off"/></label><button className={`m2-square-control ${showFilters?'m2-square-control--active':''}`} type="button" onClick={()=>setShowFilters(v=>!v)} aria-label="Filtros de productos" aria-expanded={showFilters}><Icon name="filter" size={22}/></button></div>
      <div className="m2-category-scroll m2-category-scroll--products" aria-label="Categorías del catálogo">{categories.map(name=><button key={name} type="button" className={`m2-pill ${productCategory===name?'m2-pill--active':''}`} aria-pressed={productCategory===name} onClick={()=>setProductCategory(name)}>{name}</button>)}</div>
      {showFilters && <div className="m2-filters m2-glass"><label className="m2-filter-label">Ordenar por<select value={sort} onChange={e=>setSort(e.target.value as SortOrder)}>{(Object.keys(sortLabels) as SortOrder[]).map(id=><option key={id} value={id}>{sortLabels[id]}</option>)}</select></label><label className="m2-check-row"><input type="checkbox" checked={lowOnly} onChange={e=>setLowOnly(e.target.checked)}/> Solo productos para reponer</label></div>}
      <div className="m2-catalog-actions"><button type="button" className="m2-add-product" onClick={()=>setFormOpen(true)}><Icon name="plus" size={19}/> Agregar producto <Icon name="chevron" size={19}/></button><button type="button" className="m2-scan-product" onClick={()=>setNotice('El lector de códigos todavía no está implementado en esta demo.')} aria-label="Escanear código de producto"><Icon name="scan" size={23}/></button></div>
      <section className="m2-product-catalog"><div className="m2-section-top"><h2>{lowOnly?'Para reponer':'Todos los productos'}</h2><span className="m2-count-muted">{catalog.length} productos</span></div>{catalog.length ? catalog.map(p=><ProductLine key={p.id} product={p} sales={sales} showCheck onCheck={()=>setNotice(`Stock de ejemplo de ${p.name}: ${currentStock(p,sales)} unidades. El conteo real se implementará con persistencia.`)}/>) : <GlassPanel><strong>Sin productos</strong><p className="m2-muted-light">Cambiá los filtros o agregá un producto de demostración.</p></GlassPanel>}</section>
    </>}

    {tab === 'reportes' && <>
      <header className="m2-head m2-report-head"><div><p className="m2-overline">ANÁLISIS · DEMO</p><h1 className="m2-serif">Reportes</h1></div><span className="m2-icon-well"><Icon name="chart" size={23}/></span></header>
      <div className="m2-report-ranges" role="group" aria-label="Período del reporte">{(['Hoy','Semana','Mes'] as const).map(v=><button key={v} type="button" aria-pressed={reportRange===v} onClick={()=>setReportRange(v)}>{v}</button>)}</div>
      <div className="m2-report-metrics"><GlassPanel className="m2-report-metric m2-glass"><div><span className="m2-report-icon"><Icon name="chart" size={19}/></span><span>Ventas</span></div><strong>{reportRange==='Hoy'?formatArs(currentSales):'—'}</strong><small>{reportRange==='Hoy'?`${sales.length} registros de ejemplo`:'Sin datos de este período'}</small></GlassPanel><GlassPanel className="m2-report-metric m2-glass"><div><span className="m2-report-icon"><Icon name="coins" size={19}/></span><span>Ganancia estimada</span></div><strong>—</strong><small>Costeo FIFO pendiente</small></GlassPanel></div>
      <GlassPanel className="m2-report-chart m2-glass"><SectionTitle icon="chart" title="Ventas registradas" right={<span className="m2-demo-tag">EJEMPLO</span>}/>{reportRange==='Hoy'?<><div className="m2-chart-graphic" role="img" aria-label="Gráfico de barras basado en los importes de ventas de esta demostración">{sales.map(s=><div className="m2-bar-wrap" key={s.id}><span className="m2-bar-wrap__value">{Math.round(s.total/1000)}k</span><span className="m2-bar" style={{height:`${Math.max(10,Math.round(s.total/Math.max(...sales.map(a=>a.total),1)*100))}%`}}/></div>)}</div><span className="m2-chart-caption">Cada barra representa una venta ficticia. No son datos por hora.</span></>:<p className="m2-muted-light">Todavía no existen reportes históricos por {reportRange.toLowerCase()}.</p>}</GlassPanel>
      <GlassPanel className="m2-report-details m2-glass"><SectionTitle icon="box" title="Más vendidos"/><div className="m2-empty-report"><Icon name="info" size={21}/><p>Los registros iniciales no incluyen detalle de productos. Este listado aparecerá cuando haya ventas con artículos identificados.</p></div></GlassPanel>
    </>}

    {formOpen && <div className="m2-dialog-layer" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setFormOpen(false);}}><section className="m2-dialog m2-glass" role="dialog" aria-modal="true" aria-labelledby="product-add-title"><div className="m2-dialog__head"><div><h2 id="product-add-title">Agregar producto</h2><p>Solo a esta demostración</p></div><button type="button" className="m2-back" aria-label="Cerrar" onClick={()=>setFormOpen(false)}><Icon name="close"/></button></div><form onSubmit={addDemoProduct} className="m2-dialog__form"><label className="m2-field"><span>Nombre</span><input required maxLength={70} value={newProduct.name} onChange={e=>setNewProduct(p=>({...p,name:e.target.value}))} placeholder="Ej. Agua 500 ml"/></label><label className="m2-field"><span>Categoría</span><select value={newProduct.category} onChange={e=>setNewProduct(p=>({...p,category:e.target.value as ProductCategory}))}>{categories.filter(c=>c!=='Todos').map(c=><option key={c} value={c}>{c}</option>)}</select></label><div className="m2-dialog__pair"><label className="m2-field"><span>Precio $</span><input required type="text" inputMode="numeric" placeholder="3500" value={newProduct.price} onChange={e=>setNewProduct(p=>({...p,price:e.target.value}))}/></label><label className="m2-field"><span>Unidades</span><input required type="text" inputMode="numeric" placeholder="10" value={newProduct.stock} onChange={e=>setNewProduct(p=>({...p,stock:e.target.value}))}/></label></div><label className="m2-field"><span>Objetivo de unidades</span><input required type="text" inputMode="numeric" placeholder="24" value={newProduct.objective} onChange={e=>setNewProduct(p=>({...p,objective:e.target.value}))}/></label><MoraButton type="submit" block>Agregar a la demo</MoraButton></form></section></div>}
    {notice && <div className="m2-notice" role="status"><span>{notice}</span><button type="button" aria-label="Cerrar aviso" onClick={()=>setNotice(null)}><Icon name="close" size={19}/></button></div>}
  </AppShell>;
}
