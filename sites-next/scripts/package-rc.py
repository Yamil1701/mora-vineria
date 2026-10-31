"""Package documentation and synthetic CI evidence without publishing an application."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib, json, os, zipfile
root=Path.cwd()
output=root/'artifacts'/'Mora-RC1-cierre-tecnico-2026-10-31.zip'
output.parent.mkdir(exist_ok=True)
files={}
def add(path,name):
    if path.is_file(): files[name]=path.read_bytes()
for f in sorted((root/'docs').rglob('*')):
    if f.is_file(): add(f,'documentacion/'+str(f.relative_to(root/'docs')))
for f in sorted((root/'verificacion'/'rc1').rglob('*')):
    if f.is_file(): add(f,'evidencias/previas-rc1/'+str(f.relative_to(root/'verificacion'/'rc1')))
for f in sorted((root/'artifacts').rglob('*')):
    if f.is_file() and f!=output: add(f,'evidencias/'+str(f.relative_to(root/'artifacts')))
add(root/'docs/rc1/INSTRUCCIONES.md','INSTRUCCIONES.md')
add(root/'README.md','README-fuente.md')
add(root/'backend/README.md','documentacion/Supabase-README.md')
for f in sorted((root/'backend').rglob('*.sql')): add(f,'preparacion-sql/'+str(f.relative_to(root/'backend')))
for name,source in [('integrated-tests.txt','current-node-tests.txt'),('browser-qa.txt','current-browser-qa.txt')]:
    add(root/'artifacts'/source,'evidencias/'+name)
state={
 'recordedAt':datetime.now(timezone.utc).isoformat(),
 'head':os.environ.get('GITHUB_SHA'),
 'runId':os.environ.get('GITHUB_RUN_ID'),
 'runAttempt':os.environ.get('GITHUB_RUN_ATTEMPT'),
 'nodeOutcome':os.environ.get('MORA_NODE_OUTCOME'),
 'browserOutcome':os.environ.get('MORA_BROWSER_OUTCOME'),
 'productionAuthorized':False,'physicalQA':'45 cases pending',
 'hostedSupabase':'not configured or tested',
 'localWorkEnvironment':'unavailable during final packaging',
 'artifactRetentionDays':90,
 'priorReviewedCodeHead':'2a5e70ba8c2a9082e11d0cb642742dedd0f496f6',
 'priorNativePDFReview':'3 A4 pages visually inspected locally; later CI PDFs are separately generated and not re-inspected physically'
}
results=root/'artifacts/browser/results.json'
if results.exists():
    state['browserResults']=json.loads(results.read_text())
pdf=root/'artifacts/browser/Mora-informe-mensual-QA-A4.pdf'
if pdf.exists():
    assert pdf.read_bytes().startswith(b'%PDF-')
    state['currentPDF']={'bytes':pdf.stat().st_size,'sha256':hashlib.sha256(pdf.read_bytes()).hexdigest(),'nativeChromiumPrint':True,'physicalQA':'pending'}
files['estado-final.json']=(json.dumps(state,ensure_ascii=False,indent=2)+'\n').encode()
files['ANTECEDENTES.md']=('Paquete completo v26-v29, conservado aparte:\nhttps://chatgpt.com/library?file_id=libfile_9368bb69d8b88191a50ada720b8b001a&account_id=personal\n\nLa auditoría crítica y los contratos del repositorio están incluidos. El ZIP histórico completo se descarga aparte; no se pudo incorporar su binario al caer el entorno local.\n').encode()
files['LEEME.md']=('Mora RC1: documentación y evidencia sintética. Empezá por INSTRUCCIONES.md y documentacion/rc1/10-cierre-entorno-y-ci.md.\n\nLeé estado-final.json para conocer el SHA y resultados de ESTA ejecución. Las evidencias previas se separan en evidencias/previas-rc1/. El SQL es preparación sin aplicar. No hay publicación, fusión ni Supabase alojado. QA físico pendiente.\n').encode()
inventory=[{'path':name,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()} for name,data in sorted(files.items())]
files['INVENTARIO-SHA256.json']=(json.dumps(inventory,ensure_ascii=False,indent=2)+'\n').encode()
with zipfile.ZipFile(output,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for name,data in sorted(files.items()): z.writestr(name,data)
with zipfile.ZipFile(output) as z:
    assert z.testzip() is None
    assert len(z.namelist())==len(files)
    assert 'INSTRUCCIONES.md' in z.namelist()
print(json.dumps({'package':output.name,'files':len(files),'bytes':output.stat().st_size,'sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'zipValidated':True}))
