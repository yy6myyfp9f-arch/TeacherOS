/* TeacherOS 0.7 – lokales Materialstudio (IndexedDB); kein Upload zu Servern. */
'use strict';
const MAT_DB='teacheros-material-v1', MAT_STORE='files';
let matDbPromise=null, matPromptText='', matObjectUrls=[], matCurrentFile=null, matPdfDoc=null, matSelection=null, matDrag=null, matCanvasActive=false;
const matEl=id=>document.getElementById(id), matMessage=t=>matEl('matMessage').textContent=t;
function matDb(){
 if(!matDbPromise)matDbPromise=new Promise((resolve,reject)=>{
  if(!('indexedDB' in window)){reject(new Error('Lokaler Dateispeicher ist in diesem Browser nicht verfügbar.'));return}
  const req=indexedDB.open(MAT_DB,1);
  req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(MAT_STORE)){const store=db.createObjectStore(MAT_STORE,{keyPath:'id'});store.createIndex('lessonId','lessonId',{unique:false})}};
  req.onsuccess=()=>{req.result.onversionchange=()=>req.result.close();resolve(req.result)};req.onerror=()=>reject(req.error);
 });return matDbPromise;
}
async function matTransaction(mode,fn){const db=await matDb();return new Promise((resolve,reject)=>{const tx=db.transaction(MAT_STORE,mode),store=tx.objectStore(MAT_STORE);let answer;try{answer=fn(store)}catch(err){reject(err);return}tx.oncomplete=()=>resolve(answer);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)})}
async function matListFiles(lessonId){const db=await matDb();return new Promise((resolve,reject)=>{const tx=db.transaction(MAT_STORE,'readonly');const req=tx.objectStore(MAT_STORE).index('lessonId').getAll(lessonId);req.onsuccess=()=>resolve(req.result.sort((a,b)=>a.created.localeCompare(b.created)));req.onerror=()=>reject(req.error)})}
async function matGet(id){const db=await matDb();return new Promise((resolve,reject)=>{const req=db.transaction(MAT_STORE,'readonly').objectStore(MAT_STORE).get(id);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
async function matPut(record){const db=await matDb();return new Promise((resolve,reject)=>{const req=db.transaction(MAT_STORE,'readwrite').objectStore(MAT_STORE).put(record);req.onsuccess=()=>resolve();req.onerror=()=>reject(req.error)})}
async function matDelete(id){const db=await matDb();return new Promise((resolve,reject)=>{const req=db.transaction(MAT_STORE,'readwrite').objectStore(MAT_STORE).delete(id);req.onsuccess=()=>resolve();req.onerror=()=>reject(req.error)})}
function matSelectedSeries(){return (state.reihen||[]).find(r=>r.id===matEl('matSeries').value)}
function matSelectedLesson(){return matSelectedSeries()?.lessons?.find(l=>l.id===matEl('matLesson').value)}
function matCreate(tag,cls,value){const x=document.createElement(tag);if(cls)x.className=cls;if(value!==undefined)x.textContent=value;return x}
function matFillSeries(keep=true){
 const old=keep?matEl('matSeries').value:'';const sel=matEl('matSeries');
 sel.replaceChildren(new Option('— Unterrichtsreihe auswählen —',''));
 for(const r of state.reihen||[])sel.add(new Option(r.title+' · '+r.subject,r.id));
 if((state.reihen||[]).some(r=>r.id===old))sel.value=old;
 else if((state.reihen||[]).length===1)sel.value=state.reihen[0].id;
 matFillLessons();
}
function matFillLessons(keep=true){
 const sel=matEl('matLesson'),old=keep?sel.value:'';
 const lessons=matSelectedSeries()?.lessons||[];
 sel.replaceChildren(new Option('— Unterrichtsstunde auswählen —',''));
 for(const l of lessons)sel.add(new Option(l.topic,l.id));
 if(lessons.some(l=>l.id===old))sel.value=old;
 // Bei genau einer Stunde wird das Uploadziel automatisch eindeutig festgelegt.
 else if(lessons.length===1)sel.value=lessons[0].id;
 matRefresh();
}
function matOpenLesson(seriesId,lessonId){matFillSeries(false);matEl('matSeries').value=seriesId;matFillLessons(false);matEl('matLesson').value=lessonId;matRefresh()}
async function matRefresh(){
 const series=matSelectedSeries(),lesson=matSelectedLesson();
 const target=matEl('matUploadTarget');
 if(target){
  target.textContent=lesson?`✓ Uploadziel: ${series.title} → ${lesson.topic}`:
   series?'Bitte zunächst eine Unterrichtsstunde auswählen. Ohne ausgewählte Stunde kann keine Datei gespeichert werden.':'Bitte zuerst Unterrichtsreihe und Unterrichtsstunde auswählen.';
  target.classList.toggle('mat-target-warn',!lesson);
 }
 matCloseCrop();matPromptText='';matEl('matPrompt').textContent='KI-Auftrag noch nicht erstellt. Dateien müssen zusätzlich in ChatGPT hochgeladen werden.';
 for(const url of matObjectUrls)URL.revokeObjectURL(url);matObjectUrls=[];
 const list=matEl('matList');list.replaceChildren();matEl('matCount').textContent='';
 if(!lesson){list.append(matCreate('p','muted','Bitte eine Unterrichtsreihe und eine Stunde auswählen.'));return}
 try{const files=await matListFiles(lesson.id);if(matSelectedLesson()?.id!==lesson.id)return;
 matEl('matCount').textContent=files.length+' Datei(en)';if(!files.length){list.append(matCreate('p','muted','Noch keine Dateien für diese Stunde.'));return}
 for(const f of files){const row=matCreate('div','mat-file');row.append(matCreate('div','mat-file-title',f.name));row.append(matCreate('div','smalltxt',`${f.type||'Datei'} · ${(f.blob.size/1024/1024).toFixed(1)} MB${f.parentName?' · Ausschnitt von '+f.parentName:''}`));
 if(f.type.startsWith('image/')){const img=document.createElement('img');const url=URL.createObjectURL(f.blob);matObjectUrls.push(url);img.src=url;img.alt=f.name;img.className='mat-thumb-mini';row.append(img)}
 const actions=matCreate('div','actions'),download=matCreate('button','btn secondary small','Datei sichern');download.type='button';download.onclick=()=>matDownload(f);actions.append(download);
 if(f.type.startsWith('image/')||f.type==='application/pdf'||/\.pdf$/i.test(f.name)){const crop=matCreate('button','btn secondary small','✂️ Zuschneiden');crop.type='button';crop.onclick=()=>matOpenCrop(f.id);actions.append(crop)}
 const del=matCreate('button','btn secondary small','Entfernen');del.type='button';del.onclick=async()=>{if(!confirm('Diese lokale Materialdatei entfernen?'))return;await matDelete(f.id);await matRefresh()};actions.append(del);row.append(actions);list.append(row)}
 }catch(e){list.append(matCreate('p','muted','Dateien konnten nicht geladen werden: '+e.message))}
}
function matDownload(f){const url=URL.createObjectURL(f.blob),a=document.createElement('a');a.href=url;a.download=f.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),20000)}
async function matUpload(input){
 const lesson=matSelectedLesson();
 const files=[...(input.files||[])];
 if(!files.length){matMessage('Keine Datei übergeben. Bitte über „Fotos“ oder „Dateien“ ein Bild auswählen.');return}
 if(!lesson){matMessage('⚠️ '+files.length+' Datei(en) ausgewählt, aber noch keine Unterrichtsstunde als Ziel gewählt. Wähle oben eine Stunde und tippe dann auf „Ausgewählte Dateien übernehmen“.');return}
 const button=matEl('matUploadConfirm');if(button)button.disabled=true;
 matMessage('Übernehme '+files.length+' Datei(en) für „'+lesson.topic+'“ …');
 let saved=0,failed=[];for(const file of files){
  if(file.size>35*1024*1024){failed.push(file.name+' (größer als 35 MB)');continue}
  if(!(/\.(pdf|png|jpe?g|webp|heic|heif|docx|pptx)$/i.test(file.name)||file.type.startsWith('image/'))){failed.push(file.name+' (Dateityp nicht unterstützt)');continue}
  try{await matPut({id:crypto.randomUUID(),lessonId:lesson.id,created:new Date().toISOString(),name:file.name,type:file.type||matType(file.name),blob:file});saved++}
  catch(e){failed.push(file.name+' (Speichern fehlgeschlagen: '+e.message+')');break}
 }
 if(saved){
  // Nicht sofort input.value leeren: iPadOS würde sonst „Keine Datei ausgewählt“ anzeigen,
  // obwohl das Foto erfolgreich gespeichert wurde.
  matMessage('✓ '+saved+' Datei(en) gespeichert für „'+lesson.topic+'“. Sie erscheinen weiter unten unter „Materialien der ausgewählten Stunde“.'+(failed.length?' Nicht übernommen: '+failed.join('; '):''));
 }else matMessage('Keine Datei gespeichert. '+(failed.join('; ')||'Bitte Datei erneut auswählen.'));
 if(button)button.disabled=false;
 await matRefresh();
}
// Screenshots aus der iPad-Zwischenablage lokal übernehmen; Browser-Berechtigungen gelten weiterhin.
async function matSaveClipboardImage(blob){
 const lesson=matSelectedLesson();
 if(!lesson){matMessage('Bitte zuerst eine Unterrichtsstunde auswählen.');return false}
 if(!blob||!blob.type.startsWith('image/')){matMessage('Die Zwischenablage enthält kein unterstütztes Bild.');return false}
 if(blob.size>35*1024*1024){matMessage('Der Screenshot ist größer als 35 MB.');return false}
 const extension=blob.type==='image/jpeg'?'jpg':blob.type==='image/webp'?'webp':blob.type==='image/gif'?'png':'png';
 // GIF/andere Typen behalten nur dann die richtige Endung, wenn der MIME-Typ unterstützt ist.
 const actualExt=blob.type==='image/gif'?'gif':extension;
 const filename='Screenshot-'+new Date().toISOString().replace(/[:.]/g,'-')+'.'+actualExt;
 try{
  await matPut({id:crypto.randomUUID(),lessonId:lesson.id,created:new Date().toISOString(),name:filename,type:blob.type,blob});
  await matRefresh();matMessage('✓ Kopierter Screenshot wurde dieser Unterrichtsstunde lokal hinzugefügt.');
  matEl('matPasteZone').replaceChildren();
  return true;
 }catch(e){matMessage('Screenshot konnte nicht gespeichert werden: '+e.message);return false}
}
matEl('matPasteButton').addEventListener('click',async()=>{
 if(!matSelectedLesson()){matMessage('Bitte zuerst eine Unterrichtsstunde auswählen.');return}
 if(!navigator.clipboard||typeof navigator.clipboard.read!=='function'){
  matMessage('Der direkte Zugriff auf die Zwischenablage ist auf diesem Gerät nicht verfügbar. Tippe in das Feld darunter, halte gedrückt und wähle „Einsetzen“.');
  matEl('matPasteZone').focus();return;
 }
 try{
  const items=await navigator.clipboard.read();
  for(const item of items){
   const type=item.types.find(t=>t.startsWith('image/') && ['image/png','image/jpeg','image/webp','image/gif'].includes(t));
   if(type){await matSaveClipboardImage(await item.getType(type));return}
  }
  matMessage('Kein Bild in der Zwischenablage. Kopiere zuerst einen Screenshot in der Fotos-App.');
 }catch(e){
  matMessage('iPadOS hat den direkten Zugriff nicht erlaubt. Tippe in das Feld darunter, halte gedrückt und wähle „Einsetzen“.');
  matEl('matPasteZone').focus();
 }
});
matEl('matPasteZone').addEventListener('paste',async event=>{
 const data=event.clipboardData;
 if(!data)return;
 const files=[...(data.files||[])];
 let blob=files.find(f=>f.type.startsWith('image/'));
 if(!blob){for(const item of data.items||[]){if(item.kind==='file'&&item.type.startsWith('image/')){blob=item.getAsFile();break}}}
 if(blob){event.preventDefault();await matSaveClipboardImage(blob)}
 else{event.preventDefault();matMessage('Es wurde kein Screenshot eingefügt. Bitte ein Bild kopieren und erneut versuchen.')}
});
matEl('matPasteZone').addEventListener('input',()=>{
 // Keine versehentlich eingefügten Texte oder HTML-Bilder im Feld stehen lassen.
 const zone=matEl('matPasteZone');
 if(zone.textContent.trim()||zone.querySelector('img')){
  zone.replaceChildren();matMessage('Bitte ein Bild aus der Zwischenablage einfügen; Texte werden nicht als Material gespeichert.');
 }
});
function matType(name){if(/\.pdf$/i.test(name))return'application/pdf';if(/\.docx$/i.test(name))return'application/vnd.openxmlformats-officedocument.wordprocessingml.document';if(/\.pptx$/i.test(name))return'application/vnd.openxmlformats-officedocument.presentationml.presentation';return 'application/octet-stream'}
const matCanvas=matEl('matCanvas'), matHolder=matEl('matHolder'),matRect=matEl('matRect');
function matCloseCrop(){matEl('matCropPanel').hidden=true;matEl('matCropSave').disabled=true;matSelection=null;matDrag=null;matCanvasActive=false;matPdfDoc=null;matCurrentFile=null;matRect.hidden=true}
function matPoint(ev){const r=matCanvas.getBoundingClientRect();return{x:Math.min(matCanvas.width,Math.max(0,(ev.clientX-r.left)*matCanvas.width/r.width)),y:Math.min(matCanvas.height,Math.max(0,(ev.clientY-r.top)*matCanvas.height/r.height))}}
function matShowSelection(){const r=matSelection;if(!r){matRect.hidden=true;matEl('matCropSave').disabled=true;return}matRect.hidden=false;for(const [k,v] of Object.entries({left:r.x/matCanvas.width*100+'%',top:r.y/matCanvas.height*100+'%',width:r.w/matCanvas.width*100+'%',height:r.h/matCanvas.height*100+'%'}))matRect.style[k]=v;matEl('matCropSave').disabled=r.w<12||r.h<12}
matHolder.addEventListener('pointerdown',ev=>{if(!matCanvasActive)return;ev.preventDefault();matDrag=matPoint(ev);matHolder.setPointerCapture(ev.pointerId);matSelection={x:matDrag.x,y:matDrag.y,w:0,h:0};matShowSelection()});
matHolder.addEventListener('pointermove',ev=>{if(!matDrag)return;ev.preventDefault();const pt=matPoint(ev);matSelection={x:Math.min(pt.x,matDrag.x),y:Math.min(pt.y,matDrag.y),w:Math.abs(pt.x-matDrag.x),h:Math.abs(pt.y-matDrag.y)};matShowSelection()});
matHolder.addEventListener('pointerup',()=>{matDrag=null});matHolder.addEventListener('pointercancel',()=>{matDrag=null});
matEl('matWhole').addEventListener('click',()=>{if(!matCanvasActive)return;matSelection={x:0,y:0,w:matCanvas.width,h:matCanvas.height};matShowSelection()});
async function matOpenCrop(id){
 try{const record=await matGet(id);if(!record)return;matCurrentFile=record;matPdfDoc=null;matSelection=null;matShowSelection();matEl('matCropPanel').hidden=false;matEl('matPdfPage').disabled=true;matEl('matPdfPage').replaceChildren();matCanvasActive=false;
 matEl('matCropInfo').textContent='Datei wird geöffnet …';matEl('matCropPanel').scrollIntoView({behavior:'smooth',block:'start'});
 if(record.type==='application/pdf'||/\.pdf$/i.test(record.name)){
  const pdfjs=await mathPdfLoadLibrary();const data=await record.blob.arrayBuffer();const task=pdfjs.getDocument({data:new Uint8Array(data),useSystemFonts:true});matPdfDoc=await task.promise;
  const select=matEl('matPdfPage');for(let i=1;i<=matPdfDoc.numPages;i++)select.add(new Option('Seite '+i,i));select.disabled=false;await matRenderPdfPage();
 }else{const bitmap=await createImageBitmap(record.blob);const factor=Math.min(1,2000/Math.max(bitmap.width,bitmap.height));matCanvas.width=Math.round(bitmap.width*factor);matCanvas.height=Math.round(bitmap.height*factor);matCanvas.getContext('2d').drawImage(bitmap,0,0,matCanvas.width,matCanvas.height);bitmap.close?.();matCanvasActive=true;matEl('matCropInfo').textContent='Mit dem Finger einen Rahmen ziehen oder ganze Seite wählen.'}
 }catch(e){matEl('matCropInfo').textContent='Öffnen nicht möglich: '+e.message+' (für PDF wird beim ersten Mal Internet benötigt).'}
}
async function matRenderPdfPage(){if(!matPdfDoc)return;matCanvasActive=false;matSelection=null;matShowSelection();const page=await matPdfDoc.getPage(Number(matEl('matPdfPage').value)||1);const base=page.getViewport({scale:1}),ratio=Math.min(2,1600/base.width);const vp=page.getViewport({scale:ratio});matCanvas.width=Math.round(vp.width);matCanvas.height=Math.round(vp.height);await page.render({canvasContext:matCanvas.getContext('2d',{alpha:false}),viewport:vp}).promise;matCanvasActive=true;matEl('matCropInfo').textContent='PDF-Seite '+matEl('matPdfPage').value+' von '+matPdfDoc.numPages+'. Ausschnitt mit dem Finger markieren.'}
matEl('matPdfPage').addEventListener('change',()=>matRenderPdfPage().catch(e=>matEl('matCropInfo').textContent='PDF-Fehler: '+e.message));
matEl('matCropClose').addEventListener('click',matCloseCrop);
matEl('matCropSave').addEventListener('click',async()=>{
 if(!matCurrentFile||!matSelection||matSelection.w<12||matSelection.h<12)return;
 const r=matSelection,canvas=document.createElement('canvas');canvas.width=Math.round(r.w);canvas.height=Math.round(r.h);canvas.getContext('2d',{alpha:false}).drawImage(matCanvas,r.x,r.y,r.w,r.h,0,0,canvas.width,canvas.height);
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.93));if(!blob){matEl('matCropInfo').textContent='Ausschnitt konnte nicht erzeugt werden.';return}
 const base=matCurrentFile.name.replace(/\.[^.]+$/,'');const pg=matPdfDoc?'-Seite-'+matEl('matPdfPage').value:'';const name=base+pg+'-Ausschnitt.jpg';
 try{await matPut({id:crypto.randomUUID(),lessonId:matCurrentFile.lessonId,created:new Date().toISOString(),name,type:'image/jpeg',blob,parentName:matCurrentFile.name});matMessage('Ausschnitt '+name+' gespeichert.');await matRefresh()}
 catch(e){matEl('matCropInfo').textContent='Speichern fehlgeschlagen: '+e.message}
});
const matUseRules={complete:'Erzeuge einen realistischen tabellarischen Stundenverlauf sowie ein druckfertiges DOCX-Arbeitsblatt, Lösungen und eine visuelle PPTX und GoodNotes-PDF.',worksheet:'Erzeuge ein druckfertiges bearbeitbares DOCX-Arbeitsblatt plus PDF und Lösungen.',ppt:'Erzeuge eine bearbeitbare PPTX und GoodNotes-PDF mit anschaulichen Bildern, didaktischer Dramaturgie und sinnvoller Ergebnissicherung.',adapt:'Überarbeite das vorhandene Material zu einer direkt verwendbaren verbesserten Version im selben Dateiformat, soweit verfügbar.',differentiate:'Erzeuge zwei nachvollziehbar abgestufte Arbeitsblattfassungen plus gemeinsame Lösungen.',lesson:'Erstelle eine konkrete Unterrichtsplanung mit tabellarischem Ablauf, Differenzierung, Aufgaben und Ergebnissicherung.'};
matEl('matPromptBuild').addEventListener('click',async()=>{
 const r=matSelectedSeries(),l=matSelectedLesson();if(!r||!l){matMessage('Bitte zuerst eine Stunde auswählen.');return}
 try{const files=await matListFiles(l.id),goal=matEl('matPreserve').value==='original'?'Bewahre die Originalinhalte, Zahlen, Zeichnungen und Quellen soweit fachlich und urheberrechtlich zulässig.':'Bereite die Inhalte didaktisch und grafisch neu auf; behalte sachliche Aussagen und Quellen korrekt bei.';
 matPromptText=`Du unterstützt mich bei der Unterrichtsvorbereitung an einer Gemeinschaftsschule in Baden-Württemberg.\n\nReihe: ${r.title}\nFach: ${r.subject}\nKlasse: ${r.klass}\nReihenziel: ${r.goal||'nicht angegeben'}\nUnterrichtsstunde: ${l.topic} (${l.duration} Minuten)\nLernziel: ${l.goal||'Bitte passend vorschlagen.'}\nBisheriger Unterricht laut meinen Einträgen:\n${r.lessons.filter(x=>x.status!=='geplant').map(x=>'- '+x.topic+': '+(x.reflection||x.status)).join('\n')||'- Keine Angaben'}\n\nMATERIALIEN: Ich werde diese Dateien ZUSÄTZLICH IN DIESEM CHAT ANHÄNGEN (die Dateinamen hier sind kein Dateizugriff):\n${files.length?files.map((f,i)=>`${i+1}. ${f.name}${f.parentName?' (Ausschnitt aus '+f.parentName+')':''}`).join('\n'):'- Noch keine Datei ausgewählt.'}\nWeitere Materialhinweise: ${l.materials||'Keine.'}\n\nArbeitsauftrag: ${matUseRules[matEl('matUse').value]}\n${goal}\nFachspezifische Gestaltung: ${designRuleFor(r.subject).rule}\n\nAnalysiere ausschließlich die wirklich im Chat angehängten Ausgangsdateien als Materialien. Wenn eine Datei fehlt oder sich nicht auslesen lässt, sage das ausdrücklich und erfinde keine Buchseiteninhalte. Erhalte Quellenangaben und unterscheide Originalinhalt, Ergänzungen und eigene Vorschläge. Verwende konkrete historische Quellen/Bilder mit nachvollziehbarem Nachweis statt bloßer Dekoration. Liefere tatsächlich nutzbare Dateien, nicht nur einen Entwurf oder eine Beschreibung. Beachte Datenschutz und Urheberrecht. Keine personenbezogenen Schülerdaten.\n\nSchule: Glemstalschule. Arbeitsblätter mit Feldern für Name, Klasse, Datum und Fach; kein erfundenes Schullogo.`;
 matEl('matPrompt').textContent=matPromptText;matMessage(`KI-Auftrag bereit. ${files.length} Materialdatei(en) sind lokal gespeichert und müssen noch separat in ChatGPT angehängt werden.`)
 }catch(e){matMessage('KI-Auftrag konnte nicht erstellt werden: '+e.message)}
});
matEl('matPromptCopy').addEventListener('click',async()=>{if(!matPromptText){matMessage('Erstelle zunächst einen KI-Auftrag.');return}try{await navigator.clipboard.writeText(matPromptText);matMessage('Auftrag kopiert. Jetzt in ChatGPT einfügen und die Originaldateien zusätzlich hochladen.')}catch(e){matMessage('Automatisches Kopieren nicht möglich. Auftrag bitte manuell markieren.')}});
matEl('matSeries').addEventListener('change',()=>matFillLessons(false));matEl('matLesson').addEventListener('change',matRefresh);
matEl('matCamera').addEventListener('change',e=>matUpload(e.target));
matEl('matPhotos').addEventListener('change',e=>matUpload(e.target));
matEl('matFiles').addEventListener('change',e=>matUpload(e.target));
matEl('matUploadConfirm').addEventListener('click',async()=>{
 const inputs=['matPhotos','matFiles','matCamera'].map(matEl).filter(x=>x.files?.length);
 if(!inputs.length){matMessage('Noch keine Bild- oder Dokumentdatei ausgewählt. Tippe zuerst auf „Datei auswählen“ oder „Foto auswählen“.');return}
 for(const input of inputs)await matUpload(input);
});
matFillSeries(false);
