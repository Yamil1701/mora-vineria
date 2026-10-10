import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { formatArs, formatUnits } from './format';
import './theme.css';

type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger';
export type MoraTab = { id: string; label: string; count?: number };
export type MoraDestination = 'inicio' | 'ventas' | 'productos' | 'reportes';

export function AppShell({ children, navigation }: { children: ReactNode; navigation?: ReactNode }) {
  return <div className="mv-shell"><main className={`mv-shell__content${navigation ? ' mv-shell__content--with-nav' : ''}`}>{children}</main>{navigation}</div>;
}

export function GlassPanel({ children, accent = false, flat = false, className = '', ...rest }: HTMLAttributes<HTMLElement> & { accent?: boolean; flat?: boolean }) {
  return <section className={`mv-panel${accent ? ' mv-panel--accent' : ''}${flat ? ' mv-panel--flat' : ''} ${className}`.trim()} {...rest}>{children}</section>;
}

export function MoraButton({ variant = 'primary', block = false, isBusy = false, children, type = 'button', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; block?: boolean; isBusy?: boolean }) {
  const { disabled, className = '', ...buttonProps } = rest;
  return <button {...buttonProps} type={type} className={`mv-button mv-button--${variant}${block ? ' mv-button--block' : ''} ${className}`.trim()} aria-busy={isBusy || undefined} disabled={Boolean(disabled || isBusy)}>{children}</button>;
}

/** Buttons with aria-pressed, not WAI-ARIA tabs, to avoid incomplete keyboard tablist behavior. */
export function SegmentedTabs({ tabs, value, onChange, label }: { tabs: readonly MoraTab[]; value: string; onChange: (next: string) => void; label: string }) {
  return <div className="mv-tab-strip" role="group" aria-label={label}>{tabs.map(tab => <button key={tab.id} type="button" className="mv-tab" aria-pressed={value === tab.id} onClick={() => onChange(tab.id)}>{tab.label}{tab.count != null ? ` (${tab.count})` : ''}</button>)}</div>;
}

const navLabels: Record<MoraDestination, string> = { inicio: 'Inicio', ventas: 'Ventas', productos: 'Productos', reportes: 'Reportes' };
export function BottomNav({ value, onNavigate, icons, disabled = false }: { disabled?: boolean; value: MoraDestination; onNavigate: (to: MoraDestination) => void; icons?: Partial<Record<MoraDestination, ReactNode>> }) {
  return <nav className="mv-bottom-nav" aria-label="Navegación principal">{(Object.keys(navLabels) as MoraDestination[]).map(id => <button className="mv-nav__item" key={id} type="button" disabled={disabled} aria-label={navLabels[id]} aria-current={value === id ? 'page' : undefined} onClick={() => onNavigate(id)}><span className="mv-nav__icon" aria-hidden="true">{icons?.[id] ?? '•'}</span><span>{navLabels[id]}</span></button>)}</nav>;
}

export function Money({ value, hero = false }: { value: number | null | undefined; hero?: boolean }) {
  return <span className={`mv-amount${hero ? ' mv-amount--hero' : ''}`}>{formatArs(value)}</span>;
}
export function MetricCard({ label, value, helper, hero = false }: { label: string; value: number | null; helper?: ReactNode; hero?: boolean }) {
  return <GlassPanel><div className="mv-muted">{label}</div><div style={{ marginTop: 8 }}><Money value={value} hero={hero} /></div>{helper && <div className="mv-muted" style={{ marginTop: 8, fontSize: 13 }}>{helper}</div>}</GlassPanel>;
}

export type StockView = { current: number | null; objective: number | null; status: 'ok' | 'low' | 'critical' | 'unknown' };
export function StockBadge({ stock }: { stock: StockView }) {
  const labels = { ok: 'Stock disponible', low: 'Stock bajo', critical: 'Stock crítico', unknown: 'Stock sin comprobar' } as const;
  const variants = { ok: 'neutral', low: 'warning', critical: 'danger', unknown: 'neutral' } as const;
  return <span className={`mv-badge mv-badge--${variants[stock.status]}`}>{labels[stock.status]}{stock.current != null ? ` · ${formatUnits(stock.current)}` : ''}</span>;
}

export function ProductRow({ name, detail, imageUrl, price, stock, onAdd }: { name: string; detail: string; imageUrl?: string; price: number; stock?: StockView; onAdd?: () => void }) {
  return <div className="mv-product-row">{imageUrl ? <img className="mv-product-row__image" src={imageUrl} alt="" loading="lazy" /> : <div className="mv-product-row__image mv-product-row__image-placeholder" aria-hidden="true">Sin foto</div>}<div className="mv-product-row__detail"><span className="mv-product-row__title">{name}</span><span className="mv-product-row__meta">{detail}</span><span className="mv-product-row__price">{formatArs(price)}</span>{stock && <div style={{ marginTop: 7 }}><StockBadge stock={stock} /></div>}</div>{onAdd && <button className="mv-product-row__action" type="button" onClick={onAdd} aria-label={`Agregar ${name}`}>+</button>}</div>;
}

export function QuantityStepper({ value, min = 1, max, onChange, label, disabled = false }: { disabled?: boolean; value: number; min?: number; max?: number; onChange: (value: number) => void; label: string }) {
  return <div className="mv-stepper" aria-label={label}><button type="button" aria-label={`Quitar una unidad de ${label}`} disabled={disabled || value <= min} onClick={() => onChange(value - 1)}>−</button><output aria-label={`${value} unidades`}>{value}</output><button type="button" aria-label={`Agregar una unidad de ${label}`} disabled={disabled || (max != null && value >= max)} onClick={() => onChange(value + 1)}>+</button></div>;
}

export type SyncView = 'synced' | 'pending' | 'offline' | 'attention';
const syncText: Record<SyncView, string> = {
  synced: 'Todo sincronizado', pending: 'Cambios pendientes de enviar',
  offline: 'Sin conexión · guardado en este dispositivo', attention: 'Hay una diferencia que revisar',
};
export function SyncStatus({ status, pendingCount }: { status: SyncView; pendingCount?: number }) {
  const color = status === 'synced' ? 'success' : status === 'attention' ? 'danger' : status === 'pending' ? 'warning' : 'neutral';
  return <span className={`mv-badge mv-badge--${color}`} role="status">{syncText[status]}{status === 'pending' && pendingCount != null ? ` (${pendingCount})` : ''}</span>;
}

/** Actual can be displayed only after user-provided count; null means no actual count exists. */
export function CashBalance({ expected, actual, actualAsOf, onRegister }: { expected: number | null; actual: number | null; actualAsOf?: string; onRegister: () => void }) {
  const hasActual = actual != null && actualAsOf != null && expected != null;
  const difference = hasActual ? actual - expected : null;
  return <GlassPanel accent><div className="mv-row"><div><div className="mv-muted">Dinero en caja (contado)</div><Money value={actualAsOf ? actual : null} /></div><MoraButton onClick={onRegister}>Registrar</MoraButton></div><div className="mv-cash-pair" style={{ marginTop: 17 }}><div><span className="mv-muted">Debería haber</span><strong>{formatArs(expected)}</strong></div><div><span className="mv-muted">Diferencia</span><strong style={{ color: difference === null ? undefined : difference === 0 ? 'var(--mv-success)' : 'var(--mv-danger)' }}>{formatArs(difference)}</strong></div></div>{actualAsOf && <div className="mv-muted" style={{ marginTop: 12, fontSize: 12 }}>Contado: {actualAsOf}</div>}</GlassPanel>;
}

export function CartFooter({ total, count, onCheckout, disabled = false }: { total: number; count: number; onCheckout: () => void; disabled?: boolean }) {
  return <div className="mv-cart-footer"><div className="mv-cart-footer__summary"><span className="mv-muted">{count} {count === 1 ? 'unidad' : 'unidades'}</span><span className="mv-cart-footer__amount">{formatArs(total)}</span></div><MoraButton block disabled={disabled || count === 0} onClick={onCheckout}>Cobrar</MoraButton></div>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <GlassPanel flat><h2 className="mv-heading-small" style={{ margin: 0 }}>{title}</h2><p className="mv-muted" style={{ marginBlock: 8, fontSize: 14 }}>{description}</p>{action}</GlassPanel>;
}
