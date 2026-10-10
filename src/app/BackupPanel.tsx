import { useEffect, useRef, useState } from 'react';
import { GlassPanel, MoraButton } from '../ui/components';
import { Dialog } from './Dialog';
import { errorText } from './OperationForms';
import { LocalService } from '../local/service';
import { backupFilename, backupSummary, canRestore, exportBackup, MAX_BACKUP_BYTES, parseBackup, restoreBackup, type Backup } from '../local/backup';

export function BackupPanel({ service, onClose, beforeExport, onBusy }: { service: LocalService; onClose: () => void; beforeExport: () => Promise<void>; onBusy: (busy: boolean) => void }) {
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
  const [download,setDownload]=useState<{url:string;name:string}|null>(null),[preview,setPreview]=useState<Backup|null>(null),[empty,setEmpty]=useState(false),[confirmed,setConfirmed]=useState(false);
  const url=useRef<string|null>(null), lock=useRef(false);
  useEffect(()=>()=>{if(url.current) URL.revokeObjectURL(url.current);},[]);
  async function run(action:()=>Promise<void>) {
    if(lock.current) return; lock.current=true; setBusy(true); onBusy(true); setError(''); setMessage('');
    try { await action(); } catch(e) { setError(errorText(e)); } finally { lock.current=false; setBusy(false); onBusy(false); }
  }
  async function prepare() {
    await beforeExport(); const b=await exportBackup(service.db);
    if(url.current) URL.revokeObjectURL(url.current);
    url.current=URL.createObjectURL(new Blob([JSON.stringify(b,null,2)],{type:'application/json'}));
    setDownload({url:url.current,name:backupFilename(b)}); setMessage('Respaldo preparado. Tocá Descargar JSON y verificá que el archivo quede en Descargas o Archivos.');
  }
  async function importFile(file:File) {
    setPreview(null); setConfirmed(false); setEmpty(false);
    if(file.size>MAX_BACKUP_BYTES) throw new Error('El archivo supera el límite de 20 MB.');
    const b=await parseBackup(await file.text()); const vacant=await canRestore(service.db);
    setPreview(b); setEmpty(vacant);
  }
  const summary=preview ? backupSummary(preview) : null;
  return <Dialog title="Backup y restauración" busy={busy} onClose={onClose}>
    <div className="m2-backup-panel">
      <header className="m2-section-top"><h2>Backup y restauración</h2><MoraButton variant="quiet" disabled={busy} onClick={onClose}>Cerrar</MoraButton></header>
      <p className="m2-muted-light">Guardá tus datos en un archivo y recuperalos en un equipo vacío. Funciona sin internet. Importar un archivo no sincroniza teléfonos.</p>
      {error && <p className="m2-operation-error" role="alert">{error}</p>}{message && <p className="m2-operation-success" role="status">{message}</p>}
      <GlassPanel className="m2-glass">
        <h3>Guardar una copia</h3><p className="m2-muted-light">Incluye productos, ventas, stock, costos, borradores y operaciones pendientes. El archivo contiene información del negocio sin contraseña; guardalo en un lugar seguro fuera de este navegador.</p>
        <MoraButton block isBusy={busy} onClick={()=>void run(prepare)}>Preparar respaldo</MoraButton>
        {download && <><a className="mv-button mv-button--secondary mv-button--block m2-backup-download" href={download.url} download={download.name} aria-disabled={busy} onClick={e=>{if(busy)e.preventDefault();}}>Descargar JSON</a><p className="m2-note">{download.name} · Copia del momento en que la preparaste. Prepará otra si registraste cambios.</p></>}
      </GlassPanel>
      <GlassPanel className="m2-glass">
        <h3>Recuperar desde un archivo</h3><p className="m2-muted-light">Primero verificaremos todo el respaldo. Solo se admite un espacio vacío; tus registros actuales nunca se reemplazan.</p>
        <label className="m2-field">Elegir respaldo JSON<input type="file" accept=".json,application/json" disabled={busy} onChange={e=>{const file=e.target.files?.[0]; e.target.value=''; if(file)void run(()=>importFile(file));}}/></label>
        {preview && summary && <div className="m2-backup-preview" role="region" aria-label="Vista previa del respaldo">
          <h3>Respaldo verificado</h3><p>Creado: {new Date(preview.createdAt).toLocaleString('es-AR')}</p>
          <dl><dt>Productos</dt><dd>{summary.products}</dd><dt>Ventas</dt><dd>{summary.sales}</dd><dt>Movimientos de stock y efectivo</dt><dd>{summary.movements}</dd><dt>Gastos y aportes</dt><dd>{preview.data.movements.length}</dd><dt>Conteos de stock</dt><dd>{preview.data.stockCounts.length}</dd><dt>Recepciones</dt><dd>{summary.receipts}</dd><dt>Revisiones pendientes</dt><dd>{summary.reviews}</dd><dt>Borradores abiertos</dt><dd>{summary.drafts}</dd><dt>Confirmaciones conservadas</dt><dd>{summary.confirmations}</dd></dl>
          <p className="m2-note">Formato {preview.formatVersion} · Base local V2, esquema {preview.schemaVersion}. La integridad coincide; esto no certifica quién creó el archivo. Solo importá copias de confianza. Los pendientes conservan sus IDs y no se envían a ningún servidor.</p>
          {!empty ? <p className="m2-operation-error" role="alert">Este equipo ya tiene datos o una operación pendiente. Descargá su respaldo y usá otro navegador o perfil vacío. No se reemplazó ningún registro.</p> : <><label className="m2-check-row"><input type="checkbox" checked={confirmed} disabled={busy} onChange={e=>setConfirmed(e.target.checked)}/> Confirmo recuperar este respaldo en este espacio vacío.</label><MoraButton block disabled={!confirmed||busy} onClick={()=>void run(async()=>{await restoreBackup(service.db,preview,confirmed); if(url.current) { URL.revokeObjectURL(url.current); url.current=null; } setDownload(null); setPreview(null); setConfirmed(false); setMessage('Datos recuperados en este equipo. Podés cerrar esta ventana y revisar productos, ventas y stock.');})}>Restaurar respaldo</MoraButton></>}
        </div>}
      </GlassPanel>
      <p className="m2-note">Conservá el archivo original. Si seguís usando dos copias del negocio, sus cambios serán independientes: no hay mezcla ni sincronización.</p>
    </div>
  </Dialog>;
}
