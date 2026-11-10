/* TeacherOS 0.9 - eigene Planung und Rückblick mit Tastaturdiktat / lokaler Audioaufnahme */
'use strict';
(function(){
const $v = id => document.getElementById(id);
if (!Array.isArray(state.voiceEntries)) state.voiceEntries=[];
let recorder=null, chunks=[], audioBlob=null, pendingUrl=null, dbPromise=null, timetableKey='';
window.voiceSetTimetableKey=value=>{timetableKey=String(value||'')};
function message(t){$v('voiceStatus').textContent=t;}
function openDb(){
 if(!('indexedDB' in window))return Promise.reject(new Error('Audiospeicher auf diesem Gerät nicht verfügbar'));
 if(dbPromise)return dbPromise;
 dbPromise=new Promise((resolve,reject)=>{const r=indexedDB.open('teacheros-audios-v1',1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('audios'))r.result.createObjectStore('audios')};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
 return dbPromise;
}
async function dbPut(key,blob){const d=await openDb();return new Promise((resolve,reject)=>{const tx=d.transaction('audios','readwrite');tx.objectStore('audios').put(blob,key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}
async function dbGet(key){const d=await openDb();return new Promise((resolve,reject)=>{const tx=d.transaction('audios','readonly');const r=tx.objectStore('audios').get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function dbDel(key){const d=await openDb();return new Promise((resolve,reject)=>{const tx=d.transaction('audios','readwrite');tx.objectStore('audios').delete(key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}
function refreshSeries(){const series=$v('voiceSeries'),lessons=$v('voiceLesson');const selected=series.value;series.replaceChildren(new Option('Ohne Reihe / später zuordnen',''));for(const r of state.reihen||[])series.add(new Option(r.title+' · '+r.klass,r.id));if((state.reihen||[]).some(r=>r.id===selected))series.value=selected;const prev=lessons.value;lessons.replaceChildren(new Option('Ohne konkrete Stunde',''));const current=(state.reihen||[]).find(r=>r.id===series.value);if(current)for(const l of current.lessons||[])lessons.add(new Option(l.topic,l.id));if(current?.lessons?.some(l=>l.id===prev))lessons.value=prev;}
function setMode(mode){$v('voiceType').value=mode;$v('voiceTitle').placeholder=mode==='review'?'z. B. Was wurde geschafft?':'z. B. Idee für den Einstieg';$v('voiceText').placeholder=mode==='review'?'Was wurde erreicht? Was blieb offen? Was wird nächste Stunde benötigt?':'Was möchtest du in der nächsten Stunde machen? Welche Materialien, Aufgaben und Ziele?';}
window.voiceSetMode=setMode;
function safeText(item){const r=(state.reihen||[]).find(x=>x.id===item.seriesId);const l=r?.lessons?.find(x=>x.id===item.lessonId);return [r?.title,l?.topic].filter(Boolean).join(' · ')||'Noch nicht zugeordnet';}
function renderList(){
 const list=$v('voiceList');list.replaceChildren();$v('voiceCount').textContent=state.voiceEntries.length+' Einträge';
 if(!state.voiceEntries.length){const p=document.createElement('p');p.className='empty';p.textContent='Noch keine Sprachplanungen oder Stundenrückblicke.';list.append(p);return}
 for(const item of [...state.voiceEntries].reverse()){
  const card=document.createElement('article');card.className='voice-item';
  const h=document.createElement('h4');h.textContent=(item.kind==='review'?'✓ Rückblick: ':'✦ Planung: ')+(item.title||'Ohne Titel');card.append(h);
  const sub=document.createElement('div');sub.className='smalltxt';sub.textContent=safeText(item)+' · '+new Date(item.created).toLocaleString('de-DE');card.append(sub);
  if(item.text){const body=document.createElement('div');body.className='voice-note-body';body.textContent=item.text;card.append(body)}
  if(item.audio){const audio=document.createElement('audio');audio.controls=true;audio.preload='none';card.append(audio);let tempUrl=null;const load=async()=>{if(tempUrl)return;try{const blob=await dbGet(item.id);if(!blob){const txt=document.createElement('p');txt.className='alert';txt.textContent='Audio ist auf diesem Gerät nicht verfügbar (z. B. nach Gerätewechsel).';card.append(txt);return}tempUrl=URL.createObjectURL(blob);audio.src=tempUrl}catch{message('Die gespeicherte Audioaufnahme konnte nicht gelesen werden.')}};audio.addEventListener('click',load,{once:true});audio.addEventListener('focus',load,{once:true});const loadBtn=document.createElement('button');loadBtn.className='btn secondary small';loadBtn.textContent='Audio laden';loadBtn.addEventListener('click',load);card.append(loadBtn);}
  const actions=document.createElement('div');actions.className='actions';
  if(item.text){const copy=document.createElement('button');copy.type='button';copy.className='btn secondary small';copy.textContent='Text für ChatGPT kopieren';copy.addEventListener('click',async()=>{const info=`TeacherOS – ${item.kind==='review'?'Stundenrückblick':'Unterrichtsplanung'}\n${safeText(item)}\n\n${item.text}\n\nBitte als ${item.kind==='review'?'Unterrichtsreflexion mit offenen Punkten und nächsten Schritten':'Unterrichtsentwurf mit Lernziel, Verlauf und Materialbedarf'} strukturieren. Keine Informationen erfinden.`;try{await navigator.clipboard.writeText(info);message('Notiz und Kontext kopiert. In ChatGPT einfügen.')}catch{message('Automatisches Kopieren nicht möglich. Text manuell markieren.')}});actions.append(copy)}
  const del=document.createElement('button');del.type='button';del.className='btn secondary small';del.textContent='Löschen';del.addEventListener('click',async()=>{if(!confirm('Eintrag endgültig löschen?'))return;state.voiceEntries=state.voiceEntries.filter(x=>x.id!==item.id);if(item.audio)try{await dbDel(item.id)}catch{}persist();renderList()});actions.append(del);card.append(actions);list.append(card);
 }
}
async function startRecord(){
 if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){message('Audioaufnahme wird hier nicht unterstützt. Nutze die Diktierfunktion der iOS-Tastatur.');return}
 try{
  const stream=await navigator.mediaDevices.getUserMedia({audio:true});
  const mime=['audio/mp4','audio/webm;codecs=opus','audio/webm'].find(t=>MediaRecorder.isTypeSupported(t));
  chunks=[];recorder=new MediaRecorder(stream,mime?{mimeType:mime}:undefined);
  recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
  recorder.onstop=()=>{audioBlob=new Blob(chunks,{type:recorder.mimeType||'audio/mp4'});stream.getTracks().forEach(t=>t.stop());if(pendingUrl)URL.revokeObjectURL(pendingUrl);pendingUrl=URL.createObjectURL(audioBlob);$v('voicePendingPlayer').src=pendingUrl;$v('voicePendingAudio').classList.remove('hidden');$v('voiceRecord').disabled=false;$v('voiceStop').disabled=true;message('Aufnahme bereit: Bitte „Notiz speichern“ tippen. Audio wird nicht automatisch transkribiert.')};
  recorder.onerror=()=>{stream.getTracks().forEach(t=>t.stop());message('Aufnahmefehler. Diktat über die Tastatur ist weiterhin möglich.');$v('voiceRecord').disabled=false;$v('voiceStop').disabled=true};
  recorder.start();$v('voiceRecord').disabled=true;$v('voiceStop').disabled=false;message('Aufnahme läuft … Zum Beenden auf ■ tippen. Bitte keine personenbezogenen Schülerdaten aufnehmen.');
 }catch(e){message('Mikrofon nicht verfügbar oder Zugriff abgelehnt. Du kannst über das Tastaturmikrofon diktieren.');}
}
function clearPending(){if(pendingUrl){URL.revokeObjectURL(pendingUrl);pendingUrl=null}audioBlob=null;$v('voicePendingAudio').classList.add('hidden');$v('voicePendingPlayer').removeAttribute('src');$v('voicePendingPlayer').load()}
async function save(){
 if(recorder?.state==='recording'){message('Bitte die laufende Aufnahme zuerst beenden.');return}
 const content=$v('voiceText').value.trim(),title=$v('voiceTitle').value.trim();if(!content&&!audioBlob){message('Bitte Text diktieren/eingeben oder eine Aufnahme erstellen.');return}
 const id=crypto.randomUUID(),entry={id,kind:$v('voiceType').value,title:title||((content||'').split('\n')[0].slice(0,70))||'Audioaufnahme',text:content,seriesId:$v('voiceSeries').value,lessonId:$v('voiceLesson').value,created:new Date().toISOString(),audio:!!audioBlob,timetableKey};
 if(audioBlob){try{await dbPut(id,audioBlob)}catch(e){message('Audio konnte nicht gespeichert werden. Bitte Browser-Speicher prüfen. Eintrag wurde nicht angelegt.');return}}
 state.voiceEntries.push(entry);
 // Keep reflection adjacent to a real lesson when explicitly selected.
 const r=(state.reihen||[]).find(x=>x.id===entry.seriesId),l=r?.lessons?.find(x=>x.id===entry.lessonId);
 if(l&&entry.kind==='review'&&content){l.reflection=[l.reflection,content].filter(Boolean).join('\n\n');}
 if(entry.timetableKey&&state.scheduleV1?.plans){const p=state.scheduleV1.plans[entry.timetableKey]||{id:crypto.randomUUID(),topic:entry.title,seriesId:entry.seriesId,linkedLessonId:entry.lessonId,status:'geplant'};if(content){if(entry.kind==='review')p.reflection=[p.reflection,content].filter(Boolean).join('\n\n');else p.notes=[p.notes,content].filter(Boolean).join('\n\n');}state.scheduleV1.plans[entry.timetableKey]=p;}
 persist();timetableKey='';clearPending();$v('voiceText').value='';$v('voiceTitle').value='';message('✓ Auf diesem Gerät gespeichert. Text ist im JSON-Export enthalten; Audio nicht.');renderList();
}
$v('voicePlanMode').addEventListener('click',()=>{timetableKey='';setMode('plan')});
$v('voiceReviewMode').addEventListener('click',()=>{timetableKey='';setMode('review')});
$v('voiceSeries').addEventListener('change',refreshSeries);
$v('voiceRecord').addEventListener('click',startRecord);
$v('voiceStop').addEventListener('click',()=>{if(recorder?.state==='recording')recorder.stop()});
$v('voiceSave').addEventListener('click',save);
// refresh upon opening tab, and after data import (reihen rendering)
const observer=new MutationObserver(()=>{if(!$v('voice').classList.contains('hidden')){refreshSeries();renderList()}});
observer.observe($v('voice'),{attributes:true,attributeFilter:['class']});
refreshSeries();renderList();
})();
