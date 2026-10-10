import { useState, type FormEvent, type ReactNode } from 'react';
import { GlassPanel, MoraButton } from '../ui/components';
import { formatArs } from '../ui/format';
import { parseInteger, profit, roundCost } from '../domain/rules';
import type { FormOperation, Product, ProductFields, Sale } from '../domain/types';
export function errorText(error: unknown): string {
  if (error instanceof Error && error.name === 'VersionError') return 'Estos registros requieren una versión más nueva de la aplicación. Volvé a esa versión; no borres los datos del sitio.';
  if (error instanceof Error && error.name === 'QuotaExceededError') return 'No queda espacio en este equipo. La operación no se guardó. Conservá esta pantalla y liberá espacio sin borrar los datos del sitio.';
  return error instanceof Error ? error.message : 'No se pudo guardar. Tus datos anteriores se conservan.';
}
function PanelHeading({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="m2-section-top"><h2>{title}</h2>{children}</div>;
}
export function ProductForm({ product, initial, busy, onSave, onClose }: { product?: Product; initial?: ProductFields; busy: boolean; onSave: (fields: ProductFields) => Promise<void>; onClose: () => void }) {
  const fields = initial ?? product;
  const [name, setName] = useState(fields?.name ?? ''), [variant, setVariant] = useState(fields?.variant ?? '');
  const [category, setCategory] = useState(fields?.category ?? ''), [price, setPrice] = useState(String(fields?.price ?? ''));
  const [objective, setObjective] = useState(fields?.objective == null ? '' : String(fields.objective));
  const [active, setActive] = useState(fields?.active ?? true), [error, setError] = useState('');
  async function submit(e: FormEvent) {
    e.preventDefault(); setError('');
    try { await onSave({ name, variant, category, price: parseInteger(price, 'Precio'), objective: objective.trim() ? parseInteger(objective, 'Objetivo') : null, active }); }
    catch (e) { setError(errorText(e)); }
  }
  return <GlassPanel className="m2-operation-form"><PanelHeading title={product ? 'Editar producto' : 'Agregar producto'}><MoraButton variant="quiet" onClick={onClose} disabled={busy}>Cerrar</MoraButton></PanelHeading>
    <form onSubmit={submit}><fieldset disabled={busy}>
      <label className="m2-field">Nombre<input required maxLength={120} value={name} onChange={e => setName(e.target.value)} autoFocus /></label>
      <label className="m2-field">Presentación / variante<input maxLength={120} value={variant} onChange={e => setVariant(e.target.value)} placeholder="Ej. botella 355 ml" /></label>
      <label className="m2-field">Categoría (opcional)<input maxLength={120} value={category} onChange={e => setCategory(e.target.value)} /></label>
      <div className="m2-operation-grid"><label className="m2-field">Precio $<input required inputMode="numeric" value={price} onChange={e => setPrice(e.target.value)} /></label><label className="m2-field">Objetivo de unidades<input inputMode="numeric" value={objective} onChange={e => setObjective(e.target.value)} placeholder="Opcional" /></label></div>
      {product && <label className="m2-operation-check"><input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Disponible para nuevas ventas</label>}
      {error && <p role="alert" className="m2-operation-error">{error}</p>}
      <MoraButton block type="submit" isBusy={busy}>Guardar producto</MoraButton>
    </fieldset></form>
  </GlassPanel>;
}
export function StockForm({ product, opening, initial, busy, onSave, onClose }: { product: Product; opening: boolean; initial?: FormOperation; busy: boolean; onSave: (quantity: number, totalCost: number | null, presentation: string, costReason: string) => Promise<void>; onClose: () => void }) {
  const data = initial?.type === 'ReceivePurchase' ? initial.payload.lines[0] : initial?.type === 'RecordOpeningStock' ? initial.payload : undefined;
  const [quantity, setQuantity] = useState(data ? String(data.quantity) : ''), [cost, setCost] = useState(data?.totalCost == null ? '' : String(data.totalCost)), [known, setKnown] = useState(data?.totalCost !== null), [presentation, setPresentation] = useState(initial?.type === 'ReceivePurchase' ? initial.payload.lines[0].presentation : '');
  const [costReason, setCostReason] = useState(data?.costReason ?? '');
  const [confirmed, setConfirmed] = useState(false), [error, setError] = useState('');
  async function submit(e: FormEvent) {
    e.preventDefault(); setError('');
    try {
      if (!confirmed) throw new Error('Confirmá las unidades físicas y, si es una compra, el pago realizado.');
      await onSave(parseInteger(quantity, 'Unidades', true), known ? parseInteger(cost, 'Costo total') : null, presentation, costReason);
    } catch (e) { setError(errorText(e)); }
  }
  return <GlassPanel className="m2-operation-form"><PanelHeading title={opening ? 'Stock inicial' : 'Recibir mercadería'}><MoraButton variant="quiet" onClick={onClose} disabled={busy}>Cerrar</MoraButton></PanelHeading>
    <h3>{product.name}</h3><p className="mv-muted">{opening ? 'Anotá las unidades que hay físicamente. Esta apertura no registra una compra ni descuenta dinero.' : 'Registrá solo lo recibido y pagado ahora en efectivo. Una entrega parcial se guarda por separado.'}</p>
    <form onSubmit={submit}><fieldset disabled={busy}>
      <label className="m2-field">Unidades individuales<input required inputMode="numeric" value={quantity} onChange={e => setQuantity(e.target.value)} /></label>
      {!opening && <label className="m2-field">Presentación de compra (opcional)<input maxLength={120} value={presentation} onChange={e => setPresentation(e.target.value)} placeholder="Ej. 2 fardos de 8 = 16 unidades" /></label>}
      {opening && <label className="m2-operation-check"><input type="checkbox" checked={known} onChange={e => setKnown(e.target.checked)} /> Conozco el costo real de estas unidades</label>}
      {known && <label className="m2-field">Costo total de estas unidades $<input required inputMode="numeric" value={cost} onChange={e => setCost(e.target.value)} /><small>Ingresá el total, no el precio de venta ni un costo unitario redondeado.</small></label>}
      {known && cost.trim() === '0' && <label className="m2-field">Motivo del costo cero<input required maxLength={120} value={costReason} onChange={e => setCostReason(e.target.value)} placeholder="Ej. unidades recibidas sin cargo" /></label>}
      <label className="m2-operation-check"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} /> {opening ? 'Comprobé las unidades físicas' : 'Recibí estas unidades y pagué este total en efectivo'}</label>
      {error && <p role="alert" className="m2-operation-error">{error}</p>}
      <MoraButton block type="submit" isBusy={busy}>{opening ? 'Guardar stock inicial' : 'Guardar recepción y pago'}</MoraButton>
    </fieldset></form>
  </GlassPanel>;
}
export function History({ sales }: { sales: Sale[] }) {
  return <GlassPanel><PanelHeading title="Historial local" />{!sales.length && <p className="mv-muted">Todavía no hay ventas.</p>}
    {[...sales].sort((a,b) => b.registeredAt.localeCompare(a.registeredAt) || b.id.localeCompare(a.id)).map(s => <details className="m2-operation-history" key={s.id}><summary><span>Venta · {new Date(s.registeredAt).toLocaleString('es-AR', { timeZone: 'America/Argentina/Salta' })}</span><strong>{formatArs(s.total)}</strong></summary>
      <p className="mv-muted">Guardada en este equipo · Efectivo · Jornada {s.businessDate}</p>
      <p>Recibido: {formatArs(s.received)} · Vuelto: {formatArs(s.change)}</p>
      {s.lines.map(l => <div className="m2-operation-history-line" key={l.id}><strong>{l.quantity} × {l.name} · {formatArs(l.unitPrice)}</strong><span>Costo: {l.cost ? formatArs(roundCost(l.cost)) : 'No calculable'}</span><span>{l.missingUnits > 0 ? `${l.missingUnits} unidades sin lote` : 'Asignación local FIFO'}</span><ul>{l.allocations.map(a => <li key={a.lotId}>{a.units} un. del lote {a.lotId.slice(0, 8)} · {a.cost ? formatArs(roundCost(a.cost)) : 'Costo desconocido'}</li>)}</ul></div>)}
      <p>Ganancia estimada local: {s.cost ? formatArs(roundCost(profit(s.total, s.cost))) : 'No calculable'}</p>
      {s.reviewIds.length > 0 && <p className="m2-operation-error">Revisión pendiente de stock o costo.</p>}
    </details>)}
  </GlassPanel>;
}
