/* TeacherOS 1.0 · datumssicherer Wochenstundenplan, Unterrichtsreihen, Ferien BW */
'use strict';
(function(){
const q=id=>document.getElementById(id);
const DAY=['Montag','Dienstag','Mittwoch','Donnerstag','Freitag'];
const SHORT=['Mo','Di','Mi','Do','Fr'];
const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const date=s=>new Date(s+'T12:00:00');
const plus=(s,n)=>{const d=date(s);d.setDate(d.getDate()+n);return iso(d)};
const monday=s=>{const d=date(s),day=(d.getDay()+6)%7;d.setDate(d.getDate()-day);return iso(d)};
const fmt=s=>date(s).toLocaleDateString('de-DE',{day:'2-digit',month:'short',year:'numeric'});
const random=()=>crypto.randomUUID();
const key=(s,h)=>s+'|'+Number(h);
const specials=[
 ['2026-07-30','2026-09-12','Sommerferien 2026'],['2026-10-26','2026-10-30','Herbstferien 2026'],['2026-10-31','2026-10-31','Reformationsfest (schulfrei)'],
 ['2026-12-23','2027-01-09','Weihnachtsferien 2026/27'],['2027-03-25','2027-03-25','Gründonnerstag (schulfrei)'],['2027-03-30','2027-04-03','Osterferien 2027'],['2027-05-18','2027-05-29','Pfingstferien 2027'],['2027-07-29','2027-09-11','Sommerferien 2027'],
 ['2027-11-02','2027-11-06','Herbstferien 2027'],['2027-12-23','2028-01-08','Weihnachtsferien 2027/28'],['2028-04-13','2028-04-13','Gründonnerstag (schulfrei)'],['2028-04-18','2028-04-22','Osterferien 2028'],['2028-06-06','2028-06-17','Pfingstferien 2028'],['2028-07-27','2028-09-09','Sommerferien 2028'],
 ['2028-10-30','2028-11-03','Herbstferien 2028'],['2028-10-31','2028-10-31','Reformationsfest (schulfrei)'],['2028-12-23','2029-01-05','Weihnachtsferien 2028/29'],['2029-03-26','2029-04-07','Osterferien 2029'],['2029-05-22','2029-06-01','Pfingstferien 2029'],['2029-07-26','2029-09-08','Sommerferien 2029']
];
function easter(year){ // Meeus/Jones/Butcher, gregorian calendar
 const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k+7)%7,m=Math.floor((a+11*h+22*l)/451),p=h+l-7*m+114;
 return `${year}-${String(Math.floor(p/31)).padStart(2,'0')}-${String(p%31+1).padStart(2,'0')}`;
}
function statePlan(){return state.scheduleV1}
function init(){
 if(!state.scheduleV1||!Array.isArray(state.scheduleV1.base)){
  const base=[];
  for(const s of (state.slots||[])){
   if(!DAY.includes(s.day)||!(Number(s.hour)>=1&&Number(s.hour)<=9))continue;
   const kind=(s.hour===7&&/Mittagspause|Pausenaufsicht/i.test(s.name))?'break':'other';
   base.push({id:random(),from:'2025-01-01',day:DAY.indexOf(s.day),hour:Number(s.hour),kind,subject:'',klass:'',label:String(s.name||''),seriesId:''});
  }
  state.scheduleV1={base,changes:{},plans:{},closures:[],archive:[]};
  try{localStorage.setItem('teacheros-v01',JSON.stringify(state))}catch{} // einmalige nicht-destruktive Migration
 }
 const p=statePlan();if(!p.changes||typeof p.changes!=='object')p.changes={};if(!p.plans||typeof p.plans!=='object')p.plans={};if(!Array.isArray(p.closures))p.closures=[];if(!Array.isArray(p.archive))p.archive=[];
}
function fixedHolidays(y){
 const e=easter(y),shift=n=>plus(e,n);
 return new Map([
 [`${y}-01-01`,'Neujahr'],[`${y}-01-06`,'Heilige Drei Könige'],[shift(-2),'Karfreitag'],[shift(1),'Ostermontag'],[`${y}-05-01`,'Tag der Arbeit'],[shift(39),'Christi Himmelfahrt'],[shift(50),'Pfingstmontag'],[shift(60),'Fronleichnam'],[`${y}-10-03`,'Tag der Deutschen Einheit'],[`${y}-11-01`,'Allerheiligen'],[`${y}-12-25`,'1. Weihnachtstag'],[`${y}-12-26`,'2. Weihnachtstag']]);
}
function closure(s){
 const custom=statePlan().closures.find(x=>s>=x.from&&s<=x.to);if(custom)return custom.label;
 const holiday=fixedHolidays(+s.slice(0,4)).get(s);if(holiday)return holiday;
 const vacation=specials.find(x=>s>=x[0]&&s<=x[1]);return vacation?vacation[2]:'';
}
function dayOf(s){const n=date(s).getDay();return n? n-1:6;}
function baseEntry(s,h){const day=dayOf(s);const candidates=statePlan().base.filter(x=>x.day===day&&+x.hour===+h&&x.from<=s).sort((a,b)=>a.from.localeCompare(b.from));const slot=candidates[candidates.length-1];return slot&&!slot.removed?{...slot}:null;}
function slotAt(s,h){const changes=statePlan().changes,change=changes[key(s,h)];if(change)return change.type==='cancel'?null:{...change.slot};if(closure(s))return null;return baseEntry(s,h);}
function getPlan(s,h){return statePlan().plans[key(s,h)]||null;}
function boundSeries(slot,plan){return (state.reihen||[]).find(x=>x.id===(plan?.seriesId||slot?.seriesId||''));}
function eventLabel(s){const matches=(state.events||[]).filter(x=>x.date===s).slice(0,2);return matches.map(x=>x.title).join(' · ')}
let week=monday(iso(new Date())),mobileDay=Math.min(4,dayOf(iso(new Date()))),editing=null,mode='',from=null,dirty=false;
function banner(message,error=false){const e=q('tpBanner');if(e){e.textContent=message;e.classList.toggle('alert',!!error)}}
function make(tag,cls,content){const e=document.createElement(tag);if(cls)e.className=cls;if(content!==undefined)e.textContent=content;return e}
function btn(label,cls,action){const e=make('button',cls,label);e.type='button';e.addEventListener('click',action);return e}
function titleOf(slot){return slot?.kind==='teaching'?[(slot.subject||'Unterricht'),slot.klass].filter(Boolean).join(' · '):(slot?.label||'Sonstiger Termin')}
function statusOf(s,h){return getPlan(s,h)?.status||'geplant'}
function tileFor(s,h){const sc=slotAt(s,h),cl=closure(s),plan=getPlan(s,h),over=statePlan().changes[key(s,h)];const has=!!sc;
 let tile=make('button','tp-tile');tile.type='button';
 if(cl&&!over){tile.classList.add('tp-closed');tile.append(make('strong','',cl));if(plan)tile.append(make('small','','Planung vorhanden · nicht durchgeführt'));}
 else if(over?.type==='cancel'){tile.classList.add('tp-cancel');tile.append(make('strong','','Entfallen'));if(plan)tile.append(make('small','',plan.topic||'Planung vorhanden'));}
 else if(has){tile.classList.add(sc.kind==='teaching'?'tp-class':'tp-break');if(sc.kind==='teaching')tile.classList.add('tp-s'+(Array.from(sc.subject||'').reduce((a,c)=>a+c.charCodeAt(0),0)%4+1));
 tile.append(make('strong','',titleOf(sc)));const detail=plan?.topic||boundSeries(sc,plan)?.title||sc.label||'';if(detail)tile.append(make('small','',detail));
 if(plan?.status==='erledigt')tile.classList.add('tp-done');if(plan?.status==='teilweise')tile.classList.add('tp-inprogress');
 } else {tile.classList.add('tp-empty');tile.textContent='+';tile.setAttribute('aria-label',`${s}, ${h}. Stunde eintragen`)}
 if(over)tile.classList.add('tp-changed');if(editing?.date===s&&editing?.hour===h)tile.classList.add('tp-selected');
 tile.title=`${fmt(s)} · ${h}. Stunde · ${cl||titleOf(sc)||'frei'}`;tile.addEventListener('click',()=>clickCell(s,h));return tile;
}
function tpRender(){if(!q('tpTableBody'))return;
 const end=plus(week,4);q('tpWeekCaption').textContent=`${fmt(week)} – ${fmt(end)} · KW ${weekNumber(week)} · Schulwoche`;
 const todayS=iso(new Date());let count=0,done=0,closed=0;
 for(let d=0;d<5;d++){const s=plus(week,d);const head=q('tpHead'+d);head.textContent=SHORT[d]+' · '+date(s).getDate()+'.'+(date(s).getMonth()+1)+'.';head.title=eventLabel(s);if(closure(s))closed++;for(let h=1;h<=9;h++){const slot=slotAt(s,h);if(slot?.kind==='teaching'){count++;if(statusOf(s,h)==='erledigt')done++;}}}
 q('tpCount').textContent=`Unterrichtsstunden: ${count}`;q('tpDone').textContent=`Dokumentiert: ${done}`;q('tpHoliday').textContent=closed?`${closed} unterrichtsfreie Tage`: 'BW-Ferien berücksichtigt';
 const body=q('tpTableBody');body.replaceChildren();for(let h=1;h<=9;h++){const tr=make('tr');const label=make('td','tp-hour',h+'.');tr.append(label);for(let d=0;d<5;d++){const s=plus(week,d),td=make('td',s===todayS?'tp-today':'');td.append(tileFor(s,h));tr.append(td)}body.append(tr)}
 const tabs=q('tpDayTabs');tabs.replaceChildren();for(let d=0;d<5;d++){const s=plus(week,d),b=btn(SHORT[d]+' '+date(s).getDate(),d===mobileDay?'active':'',()=>{mobileDay=d;tpRender()});tabs.append(b)}
 const mobile=q('tpMobileCards');mobile.replaceChildren();const dayS=plus(week,mobileDay);const cl=closure(dayS),ev=eventLabel(dayS);
 if(cl)mobile.append(make('div','tp-day-note',`🏖 ${cl} – keine regulären Unterrichtsstunden`));if(ev)mobile.append(make('div','tp-day-note',`📅 ${ev}`));
 for(let h=1;h<=9;h++){const r=make('div','tp-mobile-row');r.append(make('div','tp-mobile-hour',h+'.'));r.append(tileFor(dayS,h));mobile.append(r)}
 const active=!!mode;q('tpStopAction').hidden=!active;q('tpSwap').textContent=mode==='swap'?'⇄ Tausch läuft …':'⇄ Stunden tauschen';q('tpMove').textContent=mode==='move'?'↗ Verschieben läuft …':'↗ Stunde verschieben';
 renderClosures();
}
function weekNumber(s){const d=date(s);d.setHours(0,0,0,0);d.setDate(d.getDate()+3-(d.getDay()+6)%7);const first=new Date(d.getFullYear(),0,4);return 1+Math.round(((d-first)/86400000-3+(first.getDay()+6)%7)/7)}
function openWeek(shift){week=plus(week,shift*7);editing=null;q('tpEditor').classList.add('hidden');tpRender()}
function clickCell(s,h){
 if(mode){ if(!from){if(!slotAt(s,h)){banner('Bitte eine vorhandene Stunde als Ausgang auswählen.',true);return}from={date:s,hour:h};banner(`Ausgang: ${fmt(s)}, ${h}. Std. – jetzt ${mode==='swap'?'zweite Stunde':'freies Zielfeld'} antippen.`);return}
  const target={date:s,hour:h};if(from.date===s&&from.hour===h){banner('Bitte eine andere Stunde wählen.',true);return}doMove(from,target,mode);mode='';from=null;tpRender();return;}
 editing={date:s,hour:h};openEditor();
}
function persistPlan(){try{localStorage.setItem('teacheros-v01',JSON.stringify(state))}catch(e){alert('Speichern fehlgeschlagen – lokale Speicherkapazität prüfen.');return false}render();return true}
function swapContents(a,b){const p=statePlan(),k1=key(a.date,a.hour),k2=key(b.date,b.hour),p1=p.plans[k1],p2=p.plans[k2],s1=slotAt(a.date,a.hour),s2=slotAt(b.date,b.hour);return {p,k1,k2,p1,p2,s1,s2};}
function doMove(a,b,type){const {p,k1,k2,p1,p2,s1,s2}=swapContents(a,b);
 if(!s1){banner('Ausgangsstunde wurde nicht gefunden.',true);return}
 if(type==='swap'&&!s2){banner('Zum Tauschen bitte zwei vorhandene Stunden auswählen.',true);return}
 if(type==='move'&&s2){banner('Ziel ist belegt. Verwende „Stunden tauschen“ oder wähle eine freie Stunde.',true);return}
 if(!confirm(`${type==='swap'?'Stunden tauschen':'Stunde verschieben'}: ${fmt(a.date)}, ${a.hour}. Std. → ${fmt(b.date)}, ${b.hour}. Std.?\nDie zugehörigen Unterrichtsplanungen wandern mit.`))return;
 p.changes[k2]={type:'set',slot:s1};p.changes[k1]=s2?{type:'set',slot:s2}:{type:'cancel'};
 if(p1)p.plans[k2]=p1;else delete p.plans[k2];if(p2)p.plans[k1]=p2;else delete p.plans[k1];
 persistPlan();banner(type==='swap'?'Stunden samt Planungen getauscht.':'Stunde samt Planung verschoben.');
}
function seriesOptions(selected){const sel=q('tpSeries');sel.replaceChildren(new Option('Ohne Unterrichtsreihe',''));for(const r of state.reihen||[])sel.add(new Option(`${r.title} · ${r.subject} · ${r.klass}`,r.id));if((state.reihen||[]).some(r=>r.id===selected))sel.value=selected;}
function linkedOptions(seriesId,selected){const sel=q('tpLinkedLesson');sel.replaceChildren(new Option('Kein vorhandener Reihen-Eintrag',''));const r=state.reihen.find(x=>x.id===seriesId);for(const l of r?.lessons||[])sel.add(new Option(l.topic,l.id));if(r?.lessons?.some(x=>x.id===selected))sel.value=selected;}
function openEditor(){if(!editing)return;const {date:s,hour:h}=editing,slot=slotAt(s,h),plan=getPlan(s,h),cl=closure(s),previous=baseEntry(s,h);
 q('tpEditor').classList.remove('hidden');q('tpEditorTag').textContent=`${fmt(s)} · ${h}. Stunde${cl?' · '+cl:''}`;q('tpEditorTitle').textContent=slot?titleOf(slot):'Neue Unterrichtsstunde';q('tpDate').value=s;q('tpHour').value=String(h);
 q('tpKind').value=slot?.kind||'teaching';q('tpSubject').value=slot?.subject||'';q('tpKlass').value=slot?.klass||'';q('tpLabel').value=slot?.label||'';
 q('tpScope').value=slot||cl?'once':'always';seriesOptions(plan?.seriesId||slot?.seriesId||'');linkedOptions(q('tpSeries').value,plan?.linkedLessonId||'');
 q('tpTopic').value=plan?.topic||'';q('tpGoal').value=plan?.goal||'';q('tpNotes').value=plan?.notes||'';q('tpReflection').value=plan?.reflection||'';q('tpStatus').value=plan?.status||'geplant';
 q('tpLinkStatus').textContent=plan?'Planung vorhanden':'Noch keine Planung';q('tpPromptBox').classList.add('hidden');q('tpCancelSlot').disabled=!slot;q('tpDeleteSlot').disabled=!slot&&!previous;
 q('tpLessonBox').classList.toggle('hidden',q('tpKind').value!=='teaching');
 // always expose possibility to define permanent recurrence even if selected in holidays
 setTimeout(()=>q('tpEditor').scrollIntoView({block:'start',behavior:'smooth'}),70);
}
function setScopeText(){const val=q('tpScope').value;if(val==='always')banner('Dauerhafte Änderung: gilt ab dem ausgewählten Datum für diesen Wochentag und diese Unterrichtsstunde. Frühere Wochen bleiben erhalten.');}
function readSlot(){const kind=q('tpKind').value,subject=q('tpSubject').value.trim(),klass=q('tpKlass').value.trim(),label=q('tpLabel').value.trim();if(kind==='teaching'&&(!subject||!klass)){banner('Bitte für Unterricht Fach und Klasse eingeben.',true);return null}if(kind!=='teaching'&&!label){banner('Bitte eine Bezeichnung für Pause oder Sondertermin eingeben.',true);return null}return{kind,subject,klass,label,seriesId:q('tpSeries').value};}
function changeKeyIfNeeded(targetHour){const a=editing,k1=key(a.date,a.hour),k2=key(a.date,targetHour);if(k1===k2)return true;
 const p=statePlan();if(slotAt(a.date,targetHour)){banner('Die Zielstunde ist belegt. Zum Ändern bitte zuerst Stunden tauschen.',true);return false}
 if(!confirm('Stunde auf einen anderen Platz am selben Tag verschieben? Die Planung wird mitgenommen.'))return false;
 p.changes[k1]={type:'cancel'};if(p.plans[k1]){p.plans[k2]=p.plans[k1];delete p.plans[k1]}editing.hour=targetHour;return true;
}
function saveSlot(){if(!editing)return;const slot=readSlot();if(!slot)return;const s=editing.date,h=Number(q('tpHour').value),scope=q('tpScope').value;
 if(scope==='always'&&h!==editing.hour){banner('Zum dauerhaften Ändern der Stundenposition bitte den neuen Zeitplatz direkt im Wochenraster bearbeiten.',true);return}
 if(h!==editing.hour&&!changeKeyIfNeeded(h))return;
 const p=statePlan(),k=key(s,h),old=slotAt(s,h),plan=p.plans[k];
 if(old?.kind==='teaching'&&slot.kind==='teaching'&&(old.subject!==slot.subject||old.klass!==slot.klass)&&plan){
  if(!confirm('Fach oder Klasse ändern? Die bisherige datumsbezogene Planung wird in ein Archiv verschoben, damit sie nicht der falschen Klasse zugeordnet wird.'))return;
  p.archive.push({...plan,originalDate:s,originalHour:h,archivedAt:new Date().toISOString()});delete p.plans[k];
 }
 if(scope==='always'){
  p.base.push({id:random(),from:s,day:dayOf(s),hour:h,...slot});delete p.changes[k];
 }else p.changes[k]={type:'set',slot:{...slot,id:random()}};
 if(p.plans[k])p.plans[k].seriesId=slot.seriesId||p.plans[k].seriesId;
 persistPlan();banner(`${scope==='always'?'Grundstundenplan ab '+fmt(s):'Einzeltermin'} gespeichert.`);openEditor();
}
function removeSlot(permanent){if(!editing)return;const {date:s,hour:h}=editing,p=statePlan(),k=key(s,h),existing=slotAt(s,h);
 if(permanent&&!confirm('Regelmäßigen Stundenplaneintrag ab diesem Datum entfernen? Vergangene Unterrichtsstunden bleiben erhalten.'))return;
 if(!permanent&&!confirm('Diesen Unterrichtstermin als „entfällt“ markieren? Vorhandene Planung bleibt gespeichert.'))return;
 if(permanent){p.base.push({id:random(),from:s,day:dayOf(s),hour:h,removed:true});delete p.changes[k]}else p.changes[k]={type:'cancel'};
 persistPlan();banner(permanent?'Regelmäßiger Eintrag ab diesem Datum entfernt.':'Einzeltermin als entfallen markiert. Planung bleibt gespeichert.');openEditor();
}
function saveLesson(){if(!editing)return;const slot=slotAt(editing.date,editing.hour);if(!slot||slot.kind!=='teaching'){banner('Bitte zunächst einen Unterrichtstermin mit Fach und Klasse anlegen.',true);return}
 const s=editing.date,h=editing.hour,k=key(s,h),p=statePlan(),old=p.plans[k]||{};
 const seriesId=q('tpSeries').value||slot.seriesId||'',topic=q('tpTopic').value.trim(),linkedLessonId=q('tpLinkedLesson').value;
 p.plans[k]={...old,id:old.id||random(),topic,goal:q('tpGoal').value.trim(),notes:q('tpNotes').value.trim(),reflection:q('tpReflection').value.trim(),status:q('tpStatus').value,seriesId,linkedLessonId,savedAt:new Date().toISOString()};
 const r=state.reihen.find(x=>x.id===seriesId),l=r?.lessons?.find(x=>x.id===linkedLessonId);
 if(l){l.status=p.plans[k].status;l.reflection=p.plans[k].reflection;if(topic)l.topic=topic;if(p.plans[k].goal)l.goal=p.plans[k].goal;l.date=s;}
 persistPlan();banner('✓ Unterrichtsplanung gespeichert und dem konkreten Termin zugeordnet.');openEditor();
}
function autoLesson(){const s=editing.date,h=editing.hour,k=key(s,h),p=statePlan(),sl=slotAt(s,h),selected=q('tpSeries').value,series=state.reihen.find(x=>x.id===selected);if(!series){banner('Bitte zuerst eine passende Unterrichtsreihe auswählen und die Unterrichtsplanung speichern.',true);return null}
 let current=p.plans[k];if(!current){current={id:random(),seriesId:series.id,topic:q('tpTopic').value.trim(),goal:q('tpGoal').value.trim(),notes:q('tpNotes').value.trim(),status:'geplant',reflection:''};p.plans[k]=current}
 let linked=series.lessons.find(x=>x.id===current.linkedLessonId);
 if(!linked){linked={id:random(),topic:current.topic||`${sl.subject} ${fmt(s)}`,date:s,duration:45,goal:current.goal||'',materials:current.notes||'',status:current.status||'geplant',reflection:current.reflection||''};series.lessons.push(linked);current.linkedLessonId=linked.id}
 return{series,linked};
}
function openMaterials(){if(!editing)return;const sl=slotAt(editing.date,editing.hour);if(!sl||sl.kind!=='teaching'){banner('Bitte zuerst Unterricht eintragen.',true);return}
 const link=autoLesson();if(!link)return;
 persistPlan();changeTab('material');if(typeof matOpenLesson==='function')matOpenLesson(link.series.id,link.linked.id);
}
function showPrompt(){if(!editing)return;const s=editing.date,h=editing.hour,sl=slotAt(s,h);if(!sl||sl.kind!=='teaching'){banner('Zuerst eine Unterrichtsstunde anlegen.',true);return}
 const current=getPlan(s,h)||{},r=boundSeries(sl,current),l=r?.lessons?.find(x=>x.id===current.linkedLessonId);
 const before=(r?.lessons||[]).filter(x=>x.status==='erledigt'||x.status==='teilweise').slice(-5).map(x=>`- ${x.topic}: ${x.reflection||x.status}`).join('\n');
 const prompt=`Du unterstützt bei der Unterrichtsvorbereitung einer Gemeinschaftsschule in Baden-Württemberg.\nSchule: Glemstalschule. Fach: ${sl.subject}; Klasse: ${sl.klass}.\nDatum: ${fmt(s)}; ${h}. Stunde.\nUnterrichtsreihe: ${r?.title||'Nicht zugeordnet'}; Reihenziel: ${r?.goal||'Nicht angegeben'}.\nStundenthema: ${q('tpTopic').value.trim()||current.topic||l?.topic||'Bitte auf Grundlage der Reihe vorschlagen'}.\nLernziel: ${q('tpGoal').value.trim()||current.goal||'Bitte passend vorschlagen'}.\nUnterrichtsplanung / Hinweise: ${q('tpNotes').value.trim()||current.notes||l?.materials||'Keine'}.\nVorheriger dokumentierter Unterricht:\n${before||'Keine Angaben.'}\nOffene Punkte aus dieser Stunde: ${q('tpReflection').value.trim()||'Keine angegeben.'}\n\nErstelle eine realistische Unterrichtsplanung mit tabellarischem Verlauf, Differenzierung und Ergebnissicherung sowie tatsächlich nutzbare, druckfertige Materialien als DOCX (Arbeitsblatt und Lösungen), PPTX und GoodNotes-PDF (Querformat). Nutze originale Buchabbildungen aus von mir hier zusätzlich hochgeladenen Dateien originalgetreu, soweit zulässig, statt dekorative Neuzeichnungen zu erfinden; Quellen nennen. Erfinde keine Buchinhalte und keine Schülerdaten. Arbeitsblattfelder: Glemstalschule, Name, Klasse, Datum, Fach. Moderne magazinartige Optik. Materialien aus TeacherOS müssen in diesem Chat noch separat angehängt werden. Keine Behauptungen über unbekannte Dateien.`;
 q('tpPromptBox').classList.remove('hidden');q('tpPrompt').value=prompt;q('tpPromptBox').scrollIntoView({block:'nearest',behavior:'smooth'});
}
async function copyPrompt(){try{await navigator.clipboard.writeText(q('tpPrompt').value);banner('KI-Auftrag kopiert. Die Dateien bitte separat in ChatGPT anhängen.')}catch{q('tpPrompt').select();banner('Bitte den markierten Text manuell kopieren.',true)}}
function openVoice(){if(!editing)return;const sl=slotAt(editing.date,editing.hour);if(!sl||sl.kind!=='teaching'){banner('Bitte zuerst Unterricht eintragen.',true);return}
 const linked=autoLesson();if(!linked)return;const dateKey=key(editing.date,editing.hour);persistPlan();changeTab('voice');if(typeof voiceSetMode==='function')voiceSetMode(q('tpStatus').value==='geplant'?'plan':'review');const sr=q('voiceSeries'),le=q('voiceLesson');sr.value=linked.series.id;sr.dispatchEvent(new Event('change'));le.value=linked.linked.id;
 q('voiceTitle').value=q('tpTopic').value||sl.subject+' '+sl.klass;if(typeof voiceSetTimetableKey==='function')voiceSetTimetableKey(dateKey);
}
function carry(){if(!editing)return;const s=editing.date,h=editing.hour,src=slotAt(s,h),p=statePlan(),plan=p.plans[key(s,h)];if(!src||!plan){banner('Zunächst eine geplante Stunde mit Inhalt speichern.',true);return}
 let target=null;for(let k=1;k<=90;k++){const day=plus(s,k);const found=slotAt(day,h);if(found&&found.kind==='teaching'&&found.klass===src.klass&&found.subject===src.subject){target=day;break}}
 if(!target){banner('In den nächsten 90 Tagen kein entsprechender Unterrichtstermin gefunden.',true);return}
 const k=key(target,h),existing=p.plans[k];if(existing&&!confirm(`Für ${fmt(target)} existiert bereits eine Planung. Wirklich ersetzen?`))return;
 p.plans[k]={...plan,id:random(),status:'geplant',reflection:'',carriedFrom:s,savedAt:new Date().toISOString()};persistPlan();banner(`Planung in ${fmt(target)}, ${h}. Stunde übernommen. Original bleibt unverändert.`);
}
function renderClosures(){const holder=q('tpClosureList');if(!holder)return;holder.replaceChildren();const list=[...statePlan().closures].sort((a,b)=>a.from.localeCompare(b.from));for(const c of list){const row=make('div','tp-closure-item');const t=make('div','');t.append(make('strong','',c.label),make('small','',` · ${fmt(c.from)}–${fmt(c.to)}`));row.append(t,btn('Entfernen','btn secondary small',()=>{if(!confirm('Diesen schulinternen freien Zeitraum löschen?'))return;statePlan().closures=statePlan().closures.filter(x=>x.id!==c.id);persistPlan()}));holder.append(row)}if(!list.length)holder.append(make('p','smalltxt','Noch keine zusätzlichen beweglichen Ferientage oder schulfreien Termine eingetragen.'));
 const arc=q('tpArchiveList');if(!arc)return;arc.replaceChildren();const archived=statePlan().archive;if(!archived.length){arc.append(make('p','smalltxt','Noch keine archivierten Planungen.'));return}
 for(const item of [...archived].reverse()){
  const row=make('div','tp-closure-item'),meta=make('div');meta.append(make('strong','',item.topic||'Unbenannte Unterrichtsplanung'),make('small','',` · ehemals ${item.originalDate}, ${item.originalHour}. Std.`));row.append(meta);
  row.append(btn('In ausgewählten Termin übernehmen','btn secondary small',()=>{
   if(!editing){banner('Bitte zuerst im Stundenplan einen Zieltermin öffnen.',true);return}
   const slot=slotAt(editing.date,editing.hour);if(!slot||slot.kind!=='teaching'){banner('Bitte als Ziel einen Unterrichtstermin auswählen.',true);return}
   const k=key(editing.date,editing.hour);if(statePlan().plans[k]&&!confirm('Vorhandene Zielplanung überschreiben?'))return;
   statePlan().plans[k]={...item,id:random(),restoredAt:new Date().toISOString()};persistPlan();banner('Archivierte Planung wiederhergestellt.');openEditor();
  }));arc.append(row)
 }
}
function addClosure(){const from=q('tpClosureFrom').value,to=q('tpClosureTo').value,label=q('tpClosureLabel').value.trim();if(!from||!to||!label||to<from){banner('Bitte Zeitraum und Bezeichnung korrekt eingeben.',true);return}
 if((date(to)-date(from))/86400000>60){banner('Ein einzelner Zeitraum darf höchstens 61 Tage umfassen.',true);return}
 statePlan().closures.push({id:random(),from,to,label});persistPlan();banner(`„${label}“ als unterrichtsfrei hinterlegt.`);q('tpClosureLabel').value='';}
function tpOpen(){tpRender()}
window.tpOpen=tpOpen;window.tpRender=tpRender;window.tpAfterRestore=()=>{init();editing=null;mode='';from=null;q('tpEditor').classList.add('hidden');tpRender()};
init();
const hours=q('tpHour');for(let i=1;i<=9;i++)hours.add(new Option(i+'. Stunde',String(i)));
q('tpPrev').addEventListener('click',()=>openWeek(-1));q('tpNext').addEventListener('click',()=>openWeek(1));q('tpToday').addEventListener('click',()=>{week=monday(iso(new Date()));mobileDay=Math.min(4,dayOf(iso(new Date())));tpRender()});
q('tpAdd').addEventListener('click',()=>{mode='';from=null;editing={date:plus(week,mobileDay),hour:1};openEditor()});
q('tpSwap').addEventListener('click',()=>{mode='swap';from=null;editing=null;q('tpEditor').classList.add('hidden');banner('Tauschmodus: erst Ausgangsstunde, dann zweite vorhandene Stunde antippen.');tpRender()});
q('tpMove').addEventListener('click',()=>{mode='move';from=null;editing=null;q('tpEditor').classList.add('hidden');banner('Verschieben: erst Ausgangsstunde, dann freies Zielfeld antippen.');tpRender()});
q('tpStopAction').addEventListener('click',()=>{mode='';from=null;banner('Aktion abgebrochen.');tpRender()});
q('tpClose').addEventListener('click',()=>{editing=null;q('tpEditor').classList.add('hidden');tpRender()});
q('tpSaveSlot').addEventListener('click',saveSlot);q('tpSaveLesson').addEventListener('click',saveLesson);
q('tpCancelSlot').addEventListener('click',()=>removeSlot(false));q('tpDeleteSlot').addEventListener('click',()=>removeSlot(true));
q('tpKind').addEventListener('change',()=>q('tpLessonBox').classList.toggle('hidden',q('tpKind').value!=='teaching'));
q('tpScope').addEventListener('change',setScopeText);
q('tpSeries').addEventListener('change',()=>linkedOptions(q('tpSeries').value,''));
q('tpLinkedLesson').addEventListener('change',()=>{const id=q('tpLinkedLesson').value,r=state.reihen.find(x=>x.id===q('tpSeries').value),l=r?.lessons.find(x=>x.id===id);if(l){q('tpTopic').value=l.topic||'';q('tpGoal').value=l.goal||'';q('tpNotes').value=l.materials||'';q('tpStatus').value=l.status||'geplant';q('tpReflection').value=l.reflection||'';}});
q('tpMaterials').addEventListener('click',openMaterials);q('tpGenerate').addEventListener('click',showPrompt);q('tpCopyPrompt').addEventListener('click',copyPrompt);q('tpVoice').addEventListener('click',openVoice);q('tpCarry').addEventListener('click',carry);
q('tpClosureAdd').addEventListener('click',addClosure);
q('tpClosureFrom').value=iso(new Date());q('tpClosureTo').value=iso(new Date());
tpRender();
})();
