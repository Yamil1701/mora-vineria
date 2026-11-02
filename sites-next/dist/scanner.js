// Camera reading is local. No images or product data leave the device.
let stream, timer, generation=0;
export function stopScanner(){generation++;clearTimeout(timer);stream?.getTracks().forEach(t=>t.stop());stream=null;}
export function mountScanner(host,onRead){
  host.innerHTML='<div class="scanner-window"><video muted playsinline aria-label="Vista de la cámara"></video><div class="scan-reticle" aria-hidden="true"></div><span>Ubicá el código dentro del marco</span></div><p id="camera-message" class="caption" role="status">La cámara se activa solo cuando la pedís.</p><button class="btn secondary" id="start-camera">Activar cámara</button>';
  const button=host.querySelector('#start-camera'),message=host.querySelector('#camera-message'),video=host.querySelector('video');
  button.addEventListener('click',async()=>{
    stopScanner();const current=generation;
    if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia){message.textContent='La cámara necesita una conexión HTTPS compatible. Podés escribir el código abajo.';return;}
    if(!('BarcodeDetector' in window)){message.textContent='Este navegador no ofrece lectura de códigos con cámara. Escribí el código abajo.';return;}
    button.disabled=true;message.textContent='Preparando cámara…';
    try{
      const formats=(await window.BarcodeDetector.getSupportedFormats()).filter(f=>['ean_13','ean_8','upc_a','upc_e','itf'].includes(f));
      if(!formats.length)throw new Error('formats');
      const acquired=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});
      if(current!==generation){acquired.getTracks().forEach(t=>t.stop());return;}
      stream=acquired;video.srcObject=stream;await video.play();if(current!==generation)return;
      const detector=new window.BarcodeDetector({formats});message.textContent='Buscando un código. También podés ingresarlo manualmente.';
      const read=async()=>{if(current!==generation)return;try{const codes=await detector.detect(video);if(current!==generation)return;if(codes.length){const code=codes[0].rawValue;stopScanner();onRead(code);return;}timer=setTimeout(read,400);}catch{stopScanner();button.disabled=false;message.textContent='No se pudo leer el código. Probá de nuevo o escribilo abajo.';}};
      read();
    }catch(error){if(current!==generation)return;stopScanner();button.disabled=false;message.textContent=error.name==='NotAllowedError'?'No se habilitó la cámara. Podés escribir el código sin dar permiso.':error.name==='NotFoundError'?'No encontramos una cámara. Ingresá el código abajo.':'No pudimos iniciar la lectura en este navegador. Podés ingresar el código abajo.';}
  });
}
