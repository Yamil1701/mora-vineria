"""Package the candidate, documentation and synthetic evidence; never deploy."""
from pathlib import Path
from datetime import datetime,timezone
import hashlib,json,os,zipfile,subprocess
root=Path.cwd();output=root/'artifacts'/'Mora-RC2-integracion-2026-11-01.zip';output.parent.mkdir(exist_ok=True);files={}
def add(path,name):
 if path.is_file():files[name]=path.read_bytes()
def git(*args):return subprocess.check_output(['git',*args],text=True).strip()
for folder,prefix in [('docs','documentacion'),('verificacion/rc1','evidencias/antecedentes-rc1'),('verificacion/rc2','evidencias/verificadas-rc2')]:
 for f in sorted((root/folder).rglob('*')):
  if f.is_file():add(f,prefix+'/'+str(f.relative_to(root/folder)))
for f in sorted((root/'artifacts').rglob('*')):
 if f.is_file()and f.suffix!='.zip'and not f.name.endswith('.zip.sha256'):add(f,'evidencias/ejecucion/'+str(f.relative_to(root/'artifacts')))
add(root/'docs/rc2/INSTRUCCIONES.md','INSTRUCCIONES.md')
historical=Path(os.environ.get('MORA_HISTORICAL_ZIP','/nonexistent'))
if historical.is_file():add(historical,'antecedentes/'+historical.name)
state={'recordedAt':datetime.now(timezone.utc).isoformat(),'head':git('rev-parse','HEAD'),'eventSha':os.environ.get('GITHUB_SHA'),'sourceBranch':os.environ.get('GITHUB_HEAD_REF')or git('branch','--show-current'),'tree':git('rev-parse','HEAD^{tree}'),'remoteHead':os.environ.get('MORA_REMOTE_HEAD'),'workingTreeDirty':bool(git('status','--porcelain')),'runId':os.environ.get('GITHUB_RUN_ID'),'nodeOutcome':os.environ.get('MORA_NODE_OUTCOME'),'browserOutcome':os.environ.get('MORA_BROWSER_OUTCOME'),'productionAuthorized':False,'physicalQA':'58 cases pending; no user approval','hostedSupabase':'development deployed and exercised; consult hosted evidence per case','previewForPhone':'not deployed','historicalZipIncluded':historical.is_file(),'historicalZipLibrary':'https://chatgpt.com/library?file_id=libfile_9368bb69d8b88191a50ada720b8b001a&account_id=personal','artifactRetentionDays':90}
technical=root/'docs/rc2/estado-final.json'
if technical.exists():state['technicalStatus']=json.loads(technical.read_text())
state['hostedExecutionSource']='Real Work evidence; the optional hosted Actions job is not credited when skipped'
for name,path in [('currentBrowser','artifacts/browser/results.json'),('hostedAPI','verificacion/rc2/hosted-results.json'),('hostedBrowser','verificacion/rc2/hosted-browser/results.json')]:
 p=root/path
 if p.exists():state[name]=json.loads(p.read_text())
files['FUENTE.md']=('Fuente única y recuperable: https://github.com/Yamil1701/mora-vineria\nPR de desarrollo: https://github.com/Yamil1701/mora-vineria/pull/14\nDirectorio: sites-next/\nCommit de esta entrega: '+str(state.get('remoteHead') or state['head'])+'\nÁrbol: '+state['tree']+'\nNo se duplica el repositorio dentro de este paquete documental.\n').encode()
files['estado-final.json']=(json.dumps(state,ensure_ascii=False,indent=2)+'\n').encode()
files['LEEME.md']=('Mora RC2: candidata de desarrollo, sin autorización productiva. Empezá por INSTRUCCIONES.md y documentacion/rc2/00-resumen-ejecutivo.md. Los documentos RC1 y v26-v29 son antecedentes. El estado más reciente está en RC2 y estado-final.json; una prueba preparada o una simulación no equivale a una prueba alojada o física. No hay cuentas, sesiones, códigos privados ni claves de servidor en este paquete.\n').encode()
import re
for name,data in files.items():
 if name.endswith(('.json','.md','.txt','.js','.ts','.py','.mjs','.sql','.yml')):
  text=data.decode('utf8',errors='replace')
  assert not re.search(r'sb_secret_[A-Za-z0-9]{20,}',text),name
  assert not re.search(r'eyJ[A-Za-z0-9_-]{30,}\.[A-Za-z0-9_-]{20,}\.',text),name
  assert not any(k in text for k in ['"access_token": "eyJ','"refresh_token": "','"deviceKey": "']),name
inventory=[{'path':n,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}for n,b in sorted(files.items())];files['INVENTARIO-SHA256.json']=(json.dumps(inventory,ensure_ascii=False,indent=2)+'\n').encode()
with zipfile.ZipFile(output,'w',zipfile.ZIP_DEFLATED,compresslevel=6)as z:
 for name,data in sorted(files.items()):z.writestr(name,data)
with zipfile.ZipFile(output)as z:assert z.testzip()is None;assert len(z.namelist())==len(files);assert 'INSTRUCCIONES.md'in z.namelist()
sha=hashlib.sha256(output.read_bytes()).hexdigest();output.with_suffix('.zip.sha256').write_text(sha+'  '+output.name+'\n');print(json.dumps({'package':output.name,'files':len(files),'bytes':output.stat().st_size,'sha256':sha,'zipValidated':True}))
