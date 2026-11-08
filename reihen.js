/* TeacherOS 0.6 · Unterrichtsreihen, lokale Daten */
'use strict';
let reihenPromptText='';
function reihenCurrent(){return (state.reihen||[]).find(r=>r.id===$('reiheSelect').value)}
function reihenFeedback(message){$('reiheMessage').textContent=message}
function reihenMake(tag,cls,content){const item=document.createElement(tag);if(cls)item.className=cls;if(content!==undefined)item.textContent=content;return item}
function renderReihen(){
 if(!Array.isArray(state.reihen))state.reihen=[];
 const select=$('reiheSelect');if(!select)return;
 const choice=select.value;select.replaceChildren(new Option('— Bitte wählen —',''));
 for(const r of state.reihen)select.add(new Option(`${r.title} · ${r.subject}`,r.id));
 if(state.reihen.some(x=>x.id===choice))select.value=choice;
 $('reiheCount').textContent=`${state.reihen.length} Reihe(n)`;
 const r=reihenCurrent();$('reiheDetail').classList.toggle('hidden',!r);if(!r)return;
 $('reiheSummary').textContent=`${r.subject} · ${r.klass} · Ziel: ${r.goal||'Noch nicht angegeben'} · ${r.lessons.length} Stunden`;
 const list=$('reiheLessonList');list.replaceChildren();
 if(!r.lessons.length)list.append(reihenMake('p','muted','Noch keine Stunden erfasst.'));
 for(const item of r.lessons){
   const box=reihenMake('div','itemrow');
   const heading=reihenMake('b','',`${item.topic} · ${item.duration} Min.${item.date?' · '+item.date:''}`);box.append(heading);
   const goal=reihenMake('div','smalltxt','Ziel: '+(item.goal||'Noch nicht angegeben'));box.append(goal);
   const label=reihenMake('label','field','Status');
   const status=document.createElement('select');for(const [v,t] of [['geplant','Geplant'],['teilweise','Teilweise durchgeführt'],['erledigt','Durchgeführt']])status.add(new Option(t,v));status.value=item.status;
   status.addEventListener('change',()=>{item.status=status.value;persist()});label.append(status);box.append(label);
   const progress=reihenMake('label','field','Rückblick / nächster Schritt');const area=document.createElement('textarea');area.value=item.reflection||'';area.placeholder='Was wurde geschafft? Was muss wiederholt werden?';area.addEventListener('change',()=>{item.reflection=area.value;persist()});progress.append(area);box.append(progress);
   const mats=reihenMake('div','smalltxt','Materialien: '+(item.materials||'keine vermerkt'));box.append(mats);
   const actions=reihenMake('div','actions');
   const remove=reihenMake('button','btn secondary small','Stunde löschen');remove.type='button';remove.addEventListener('click',()=>{if(confirm('Diese Stunde wirklich löschen?')){r.lessons=r.lessons.filter(l=>l.id!==item.id);persist()}});actions.append(remove);const mat=reihenMake('button','btn secondary small','📷 Materialien');mat.type='button';mat.addEventListener('click',()=>{changeTab('material');if(typeof matOpenLesson==='function')matOpenLesson(r.id,item.id)});actions.append(mat);box.append(actions);list.append(box);
 }
}
$('reiheAdd').addEventListener('click',()=>{
 const title=$('reiheTitle').value.trim(),subject=$('reiheSubject').value.trim(),klass=$('reiheClass').value.trim();
 if(!title||!subject||!klass){reihenFeedback('Bitte Titel, Fach und Klasse eingeben.');return}
 const r={id:crypto.randomUUID(),title,subject,klass,goal:$('reiheGoal').value.trim(),lessons:[],created:new Date().toISOString()};state.reihen.push(r);persist();$('reiheSelect').value=r.id;renderReihen();reihenFeedback('Reihe lokal gespeichert.');$('reiheTitle').value='';$('reiheGoal').value='';
});
$('reiheSelect').addEventListener('change',()=>{reihenPromptText='';$('reihePrompt').textContent='Auftrag noch nicht erstellt.';renderReihen()});
$('reiheLessonAdd').addEventListener('click',()=>{
 const r=reihenCurrent(),topic=$('reiheLessonTitle').value.trim();if(!r||!topic)return alert('Bitte Stundenthema eingeben.');
 r.lessons.push({id:crypto.randomUUID(),topic,date:$('reiheLessonDate').value,duration:Number($('reiheLessonDuration').value),goal:$('reiheLessonGoal').value.trim(),materials:$('reiheLessonMaterials').value.trim(),status:'geplant',reflection:''});
 for(const id of ['reiheLessonTitle','reiheLessonDate','reiheLessonGoal','reiheLessonMaterials'])$(id).value='';persist();
});
$('reiheDelete').addEventListener('click',()=>{const r=reihenCurrent();if(!r||!confirm('Unterrichtsreihe und alle zugehörigen Stunden löschen?'))return;state.reihen=state.reihen.filter(x=>x.id!==r.id);$('reiheSelect').value='';persist()});
$('reihePromptBuild').addEventListener('click',()=>{
 const r=reihenCurrent();if(!r)return;
 const done=r.lessons.filter(x=>x.status==='erledigt'||x.status==='teilweise');
 const upcoming=r.lessons.find(x=>x.status==='geplant');
 reihenPromptText=`Du unterstützt mich bei der Unterrichtsvorbereitung an einer Gemeinschaftsschule in Baden-Württemberg.\n\nUnterrichtsreihe: ${r.title}\nFach: ${r.subject}\nLerngruppe: ${r.klass}\nÜbergeordnetes Ziel: ${r.goal||'nicht angegeben'}\n\nBisheriger Unterricht (meine Angaben, nicht automatisch ermittelt):\n${done.length?done.map(x=>'- '+x.topic+' ['+x.status+']'+(x.reflection?' – '+x.reflection:'')).join('\n'):'- Noch keine Stunde als durchgeführt markiert.'}\n\nNächste geplante Stunde: ${upcoming?upcoming.topic+' ('+upcoming.duration+' Minuten)':'Noch keine geplant.'}\nZiel: ${upcoming?.goal||'Bitte passend vorschlagen.'}\nVorhandene Materialien: ${upcoming?.materials||'Keine angegeben.'}\n\nAuftrag: Plane die nächste Stunde auf Grundlage des dokumentierten Lernfortschritts. Gib einen realistischen tabellarischen Stundenverlauf, geeignete Lernaufgaben, Differenzierung und eine Ergebnissicherung. Nutze für ${r.subject} ein sachgerechtes, visuelles Unterrichtsdesign. Wenn du Dateien erzeugst, liefere tatsächlich nutzbare DOCX/PDF/PPTX-Dateien. Berücksichtige meine hochgeladenen Vorlagen, falls ich sie im Chat bereitstelle. Erfinde keine Angaben über die Lerngruppe. Verwende keine personenbezogenen Schülerdaten.`;
 $('reihePrompt').textContent=reihenPromptText;
});
$('reihePromptCopy').addEventListener('click',async()=>{if(!reihenPromptText)return alert('Zuerst den KI-Auftrag erstellen.');try{await navigator.clipboard.writeText(reihenPromptText);alert('KI-Auftrag kopiert.')}catch{alert('Kopieren fehlgeschlagen. Bitte den Text markieren und kopieren.')}});
renderReihen();
