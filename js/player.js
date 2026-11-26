/* Motorul cursului „Pictează orașul.” – navigare, voce sincronizată, subtitrare, cuprins, fișe, SCORM.
   Date: window.COURSE (js/data.js), window.VO (audio/vo.js), exerciții: window.EXR (js/ex.js). */
(function(){
  'use strict';
  var C=window.COURSE, VO=window.VO||{}, EXR=window.EXR||{};
  var SL=C.slides, N=SL.length;
  var $=function(s,r){return (r||document).querySelector(s);};
  var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};
  var stage=$('#stage'), audio=$('#vo'), capEl=$('#cap'), live=$('#live');
  var idx=0, cur=null, raf=0, cueList=[], capList=[], playing=false, blocked=false;
  var KEY='UI3_Pictura_AS2_RO_v1';

  /* ---------- starea ---------- */
  var S={v:{},h:{},loc:'',ws:{},ex:{},cc:false,voice:true,speed:1,ix:{},fb:{}};
  function loadState(){
    var raw='';
    if(LMS.active){ raw=LMS.get('cmi.suspend_data'); }
    else { try{ raw=localStorage.getItem(KEY)||''; }catch(e){} }
    if(raw){ try{ var o=JSON.parse(raw); for(var k in o) S[k]=o[k]; }catch(e){} }
    if(LMS.active && !S.ws.nume){ var n=LMS.get('cmi.learner_name'); if(n){ var p=n.split(','); S.ws.nume=(p.length===2?(p[1].trim()+' '+p[0].trim()):n).trim(); } }
  }
  var saveT=0;
  function save(now){
    clearTimeout(saveT);
    var f=function(){
      var s=JSON.stringify(S);
      if(s.length>60000){ S.h={}; s=JSON.stringify(S); }
      if(LMS.active){ LMS.set('cmi.suspend_data',s); LMS.set('cmi.location',S.loc); reportProgress(); LMS.commit(); }
      else { try{ localStorage.setItem(KEY,s); }catch(e){} }
      var sv=$$('.saved'); sv.forEach(function(x){x.textContent='Salvat automat · '+new Date().toLocaleTimeString('ro-RO',{hour:'2-digit',minute:'2-digit'});});
    };
    if(now) f(); else saveT=setTimeout(f,600);
  }
  var api={S:S,save:save,go:function(id){go(indexOf(id));},next:function(){go(idx+1);},
    exDone:function(id,score,ans,meta){ S.ex[id]={s:score,a:ans,t:Date.now()}; reportEx(id,score,ans,meta); save(); },
    toast:toast, lightbox:lightbox, wsForm:wsForm, openWs:openWs, C:C};
  window.PLAYER=api;

  /* ---------- SCORM ---------- */
  function tracked(){ return SL.filter(function(s){return s.track;}); }
  function moduleDone(m){ var b=SL.filter(function(s){return s.mod===m && s.role==='biblio';})[0]; return !!(b && S.v[b.id]); }
  function allDone(){ return C.modules.every(function(m){return moduleDone(m.n);}); }
  function reportProgress(){
    if(!LMS.active) return;
    var t=tracked(), v=t.filter(function(s){return S.v[s.id];}).length;
    LMS.set('cmi.progress_measure',(Math.round(v/t.length*100)/100).toFixed(2));
    var scores=Object.keys(S.ex).map(function(k){return S.ex[k].s;}).filter(function(x){return typeof x==='number';});
    if(scores.length){ var avg=scores.reduce(function(a,b){return a+b;},0)/scores.length;
      LMS.set('cmi.score.min','0');LMS.set('cmi.score.max','100');LMS.set('cmi.score.raw',String(Math.round(avg*100)));LMS.set('cmi.score.scaled',avg.toFixed(2)); }
    if(allDone()){ LMS.set('cmi.completion_status','completed'); LMS.set('cmi.success_status','passed'); }
    else LMS.set('cmi.completion_status','incomplete');
  }
  function ixIndex(id){
    if(S.ix[id]!==undefined) return S.ix[id];
    var n=parseInt(LMS.get('cmi.interactions._count'),10); if(isNaN(n)) n=0;
    var used=Object.keys(S.ix).map(function(k){return S.ix[k];}); var m=used.length?Math.max.apply(null,used)+1:0;
    S.ix[id]=Math.max(n,m); return S.ix[id];
  }
  function stamp(){ var d=new Date(); var p=function(x){return (x<10?'0':'')+x;}; return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+'T'+p(d.getHours())+':'+p(d.getMinutes())+':'+p(d.getSeconds()); }
  function reportEx(id,score,ans,meta){
    if(!LMS.active) return;
    var n=ixIndex(id), b='cmi.interactions.'+n+'.';
    LMS.set(b+'id',id); LMS.set(b+'type',(meta&&meta.type)||'other'); LMS.set(b+'timestamp',stamp());
    var r=String(ans==null?'':ans).slice(0,3900); if(meta&&meta.type==='likert') r=String(ans);
    LMS.set(b+'learner_response',r);
    if(typeof score==='number'){ LMS.set(b+'result',score>=0.999?'correct':(score<=0?'incorrect':'neutral')); }
    if(meta&&meta.desc) LMS.set(b+'description',meta.desc.slice(0,250));
  }

  /* ---------- scalare și modul telefon ---------- */
  var canvas=$('#canvas'), html=document.documentElement;
  function fit(){
    if(html.classList.contains('typing')) return;
    var W=html.clientWidth, H=html.clientHeight;
    var s=Math.min(W/1920,H/1224);
    var phone=s<0.5;
    html.classList.toggle('m',phone);
    if(phone){ var z=Math.max(0.36,Math.min(0.75,W/1000)); html.style.setProperty('--z',z); html.classList.toggle('m-wide',W/z>=1300); canvas.style.removeProperty('--s'); }
    else { html.style.setProperty('--s',s); }
  }
  window.addEventListener('resize',fit);
  document.addEventListener('focusin',function(e){ if(html.classList.contains('m') && /INPUT|TEXTAREA/.test(e.target.tagName)) html.classList.add('typing'); });
  document.addEventListener('focusout',function(){ setTimeout(function(){ html.classList.remove('typing'); fit(); },300); });

  /* ---------- navigare ---------- */
  function indexOf(id){ for(var i=0;i<N;i++) if(SL[i].id===id) return i; return 0; }
  function go(i,opt){
    opt=opt||{};
    if(i<0||i>=N) return;
    stopAudio();
    idx=i; cur=SL[i];
    var first=!S.v[cur.id], vo=VO[cur.id];
    var useCues = !!(vo && S.voice && !S.h[cur.id] && !opt.showAll);
    stage.innerHTML='<div class="slide '+(cur.dark?'s-dark':'s-paper')+(useCues?' cue-wait':'')+'" data-id="'+cur.id+'" data-layout="'+(cur.layout||'')+'">'+cur.html+'</div>';
    var sl=stage.firstChild;
    $$('img',sl).forEach(function(im){ if(!im.getAttribute('loading')) im.loading='eager'; im.decoding='async'; });
    S.v[cur.id]=1; S.loc=cur.id;
    bindSlide(sl);
    if(EXR._all){ try{ EXR._all(sl,cur,api); }catch(e){ console.error('_all',e); } }
    if(cur.init && EXR[cur.init]){ try{ EXR[cur.init](sl,cur,api); }catch(e){ console.error('init '+cur.init,e); } }
    updateBar();
    announce();
    var h=$('h1,h2',sl); if(h){ h.setAttribute('tabindex','-1'); if(!opt.noFocus){ try{ h.focus({preventScroll:true}); }catch(e){} } }
    if(html.classList.contains('m')){ try{ window.scrollTo(0,0); document.querySelector('.app').scrollTop=0; }catch(e){} }
    capEl.textContent='';
    if(vo && S.voice){ startAudio(vo,useCues); } else { revealAll(); }
    save();
    if(allDone() && !S.doneShown){ S.doneShown=1; }
  }
  function announce(){
    var pos=SL.filter(function(s){return s.track;}).indexOf(cur);
    live.textContent='Ecranul '+(idx+1)+' din '+N+': '+cur.title;
  }
  function updateBar(){
    $('#bPrev').disabled=idx===0;
    $('#bNext').disabled=idx===N-1;
    $('#bNext').classList.remove('pulse');
    var t=tracked(), v=t.filter(function(s){return S.v[s.id];}).length;
    $('#progI').style.width=(v/t.length*100)+'%';
    $('#pos').textContent=(idx+1)+' / '+N;
    var vo=VO[cur.id];
    ['#bPlay','#bReplay','#bAll'].forEach(function(s){ $(s).disabled=!vo||!S.voice; });
    $('#bWs').disabled=!cur.mod;
    setPlayIcon(false);
  }

  /* ---------- vocea și apariția elementelor ---------- */
  function startAudio(vo,useCues){
    cueList=(vo.cues||[]).slice(); capList=vo.cap||[];
    var sl=stage.firstChild;
    if(!useCues){ revealAll(true); }
    audio.src=vo.src; audio.playbackRate=S.speed; audio.currentTime=0;
    var p=audio.play();
    playing=true; setPlayIcon(true);
    if(p && p.catch){ p.catch(function(){ playing=false; blocked=true; setPlayIcon(false); revealAll(); $('#bPlay').classList.add('pulse'); toast('Apasă ▶ ca să pornești vocea.'); }); }
    loop();
  }
  function loop(){
    cancelAnimationFrame(raf);
    var tick=function(){
      var t=audio.currentTime;
      var sl=stage.firstChild; if(!sl) return;
      if(sl.classList.contains('cue-wait')){
        for(var i=0;i<cueList.length;i++){ if(t>=cueList[i]-0.2){ $$('[data-cue="'+(i+1)+'"]:not(.in)',sl).forEach(function(el){el.classList.add('in'); onCue(el);}); } }
      }
      var c=''; for(var j=0;j<capList.length;j++){ if(t>=capList[j][0] && t<capList[j][1]+0.25){ c=capList[j][2]; break; } }
      if(S.cc){ if(capEl.textContent!==c) capEl.textContent=c; } else if(capEl.textContent) capEl.textContent='';
      if(!audio.paused) raf=requestAnimationFrame(tick);
    };
    raf=requestAnimationFrame(tick);
  }
  function onCue(el){
    var v=el.matches('video')?el:$('video',el);
    if(v && v.dataset.autoplay!=='0'){ try{ v.currentTime=0; v.play().catch(function(){}); }catch(e){} }
  }
  function revealAll(noVideo){
    var sl=stage.firstChild; if(!sl) return;
    $$('[data-cue]',sl).forEach(function(el){ if(!el.classList.contains('in')){ el.classList.add('in'); if(!noVideo) onCue(el);} });
    sl.classList.remove('cue-wait');
  }
  function stopAudio(){ cancelAnimationFrame(raf); try{ audio.pause(); }catch(e){} playing=false; }
  audio.addEventListener('ended',function(){
    playing=false; setPlayIcon(false); revealAll(); S.h[cur.id]=1; capEl.textContent=''; save();
    if(idx<N-1 && !cur.noPulse) $('#bNext').classList.add('pulse');
  });
  audio.addEventListener('play',function(){ playing=true; setPlayIcon(true); loop(); });
  audio.addEventListener('pause',function(){ playing=false; setPlayIcon(false); });
  function setPlayIcon(on){
    var b=$('#bPlay'); b.setAttribute('aria-label',on?'Pauză':'Pornește vocea'); b.title=on?'Pauză':'Pornește vocea';
    $('use',b).setAttribute('href',on?'#i-pause':'#i-play');
  }

  /* ---------- legarea elementelor din ecran ---------- */
  function bindSlide(sl){
    $$('[data-go]',sl).forEach(function(b){ b.addEventListener('click',function(){ var g=b.getAttribute('data-go'); if(g==='next') go(idx+1); else if(g==='prev') go(idx-1); else go(indexOf(g)); }); });
    $$('[data-zoom]',sl).forEach(function(b){ b.addEventListener('click',function(){ lightbox(b.getAttribute('data-zoom'),b.getAttribute('data-cap')||'',b.getAttribute('data-alt')||''); }); });
    $$('.vt',sl).forEach(function(t){
      var v=$('video',t), b=$('.pp',t); if(!v||!b) return;
      var sync=function(){ var on=!v.paused; b.setAttribute('aria-label',on?'Oprește clipul':'Pornește clipul'); $('use',b).setAttribute('href',on?'#i-pause':'#i-play'); };
      b.addEventListener('click',function(){ if(v.paused) v.play().catch(function(){}); else v.pause(); });
      v.addEventListener('play',sync); v.addEventListener('pause',sync); sync();
      if(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches){ v.removeAttribute('autoplay'); v.pause(); }
    });
    $$('[data-act]',sl).forEach(function(b){
      var a=b.getAttribute('data-act');
      b.addEventListener('click',function(){
        if(a==='start'){ go(idx+1); }
        else if(a==='resume'){ go(indexOf(S.resumeFrom||SL[1].id)); }
        else if(a==='toc'){ openToc(); }
        else if(a==='ws'){ openWs(cur.mod); }
        else if(a==='exit'){ exitCourse(); }
      });
    });
    if(cur.role==='ws'){ var host=$('.wshost',sl); if(host) wsForm(host,cur.mod,true); }
  }

  /* ---------- lightbox ---------- */
  var lastFocus=null;
  function trap(m){
    lastFocus=document.activeElement;
    m.addEventListener('keydown',function(e){
      if(e.key==='Escape'){ e.preventDefault(); closeModal(m); }
      if(e.key==='Tab'){ var f=$$('button,a[href],input,select,textarea,[tabindex]:not([tabindex="-1"])',m).filter(function(x){return !x.disabled && x.offsetParent!==null;}); if(!f.length) return;
        var a=f[0], z=f[f.length-1]; if(e.shiftKey && document.activeElement===a){ e.preventDefault(); z.focus(); } else if(!e.shiftKey && document.activeElement===z){ e.preventDefault(); a.focus(); } }
    });
  }
  function closeModal(m){ if(m && m.parentNode) m.parentNode.removeChild(m); html.classList.remove('has-modal'); if(lastFocus && lastFocus.focus) try{ lastFocus.focus(); }catch(e){} }
  function lightbox(src,cap,alt){
    var m=document.createElement('div'); m.className='lb'; m.setAttribute('role','dialog'); m.setAttribute('aria-modal','true'); m.setAttribute('aria-label','Imagine mărită');
    m.innerHTML='<button class="x" aria-label="Închide imaginea mărită">×</button><img src="'+src+'" alt="'+(alt||'').replace(/"/g,'&quot;')+'"><p>'+cap+'</p>';
    $('#canvas').appendChild(m); html.classList.add('has-modal'); trap(m);
    $('.x',m).addEventListener('click',function(){closeModal(m);}); m.addEventListener('click',function(e){ if(e.target===m) closeModal(m); });
    $('.x',m).focus();
  }

  /* ---------- cuprins ---------- */
  function openToc(){
    var m=document.createElement('div'); m.className='modal'; m.setAttribute('role','dialog'); m.setAttribute('aria-modal','true'); m.setAttribute('aria-labelledby','tocH');
    var h='<div class="dlg"><header><h2 id="tocH">Cuprins</h2><button class="x" aria-label="Închide cuprinsul">×</button></header><div class="bd"><div class="toc">';
    var groups=[{n:0,t:'Început',k:'',items:SL.filter(function(s){return !s.mod && s.id!=='9.0';})}];
    C.modules.forEach(function(md){ groups.push({n:md.n,t:md.title,k:'Modulul '+md.n,items:SL.filter(function(s){return s.mod===md.n;})}); });
    groups.push({n:9,t:'Final',k:'',items:SL.filter(function(s){return s.id==='9.0';})});
    groups.forEach(function(g){
      if(!g.items.length) return;
      var done=g.n&&moduleDone(g.n);
      h+='<section><h3>'+(g.k?'<small>'+g.k.toUpperCase()+(done?' · PARCURS':'')+'</small>':'')+g.t+'</h3><ol>';
      g.items.forEach(function(s){ h+='<li><a href="#" data-i="'+indexOf(s.id)+'" class="'+(S.v[s.id]?'v':'')+'"'+(s===cur?' aria-current="page"':'')+'><span class="d" aria-hidden="true"></span><span class="k">'+s.id+'</span><span>'+s.title+(S.v[s.id]?'<span class="sr"> (vizitat)</span>':'')+'</span></a></li>'; });
      h+='</ol></section>';
    });
    h+='</div>';
    if(!LMS.active) h+='<p class="small" style="margin-top:26px;color:#44474F">Răspunsurile și progresul se păstrează în acest browser. <button class="btn sm" id="wipe" style="margin-left:12px">Șterge datele de pe acest dispozitiv</button></p>';
    h+='</div></div>';
    m.innerHTML=h; $('#canvas').appendChild(m); html.classList.add('has-modal'); trap(m);
    $('.x',m).addEventListener('click',function(){closeModal(m);});
    m.addEventListener('click',function(e){ if(e.target===m) closeModal(m); });
    $$('a[data-i]',m).forEach(function(a){ a.addEventListener('click',function(e){ e.preventDefault(); closeModal(m); go(+a.getAttribute('data-i')); }); });
    var w=$('#wipe',m); if(w) w.addEventListener('click',function(){ if(confirm('Ștergi progresul și răspunsurile de pe acest dispozitiv?')){ try{ localStorage.removeItem(KEY); }catch(e){} location.reload(); } });
    var c=$('a[aria-current]',m)||$('a',m); if(c) c.focus();
  }

  /* ---------- fișa de lucru ---------- */
  function wsItems(mod){ return (C.ws[mod]||{}).items||[]; }
  function wsForm(host,mod,inline){
    var W=C.ws[mod]; if(!W){ host.innerHTML=''; return; }
    var h='<div class="ws">';
    h+='<div class="it" style="grid-template-columns:1fr 1fr;display:grid;gap:18px"><div><label for="ws_nume">Prenumele (sau inițialele)</label><input class="ti" id="ws_nume" data-k="nume" autocomplete="off"></div><div><label for="ws_clasa">Clasa</label><input class="ti" id="ws_clasa" data-k="clasa" autocomplete="off"></div></div>';
    W.items.forEach(function(it,k){
      var id='ws_'+it.k;
      h+='<div class="it">';
      if(it.type==='likert'){
        h+='<div class="lq" id="'+id+'_l">'+(k+1)+'. '+it.q+'</div><div class="likert" role="radiogroup" aria-labelledby="'+id+'_l">';
        for(var v=1;v<=5;v++) h+='<label><input type="radio" name="'+id+'" value="'+v+'" data-k="'+it.k+'"><span>'+v+'</span></label>';
        h+='</div><div class="rv">1 = deloc · 5 = foarte mult</div>';
      } else {
        h+='<label for="'+id+'">'+(k+1)+'. '+it.q+'</label><textarea class="ta" id="'+id+'" data-k="'+it.k+'" rows="'+(it.rows||3)+'"></textarea>';
        if(it.rev) h+='<div class="rv">Revezi: <button type="button" data-rev="'+it.rev+'">ecranul '+it.rev+'</button></div>';
      }
      h+='</div>';
    });
    h+='<div class="wsbar"><button class="btn pri sm" data-w="docx" type="button">Descarcă fișa (.docx)</button><button class="btn sm" data-w="print" type="button">Tipărește / PDF</button><span class="saved" aria-live="polite"></span></div></div>';
    host.innerHTML=h;
    $$('[data-k]',host).forEach(function(el){
      var k=el.getAttribute('data-k');
      if(el.type==='radio'){ el.checked=String(S.ws[k])===el.value; el.addEventListener('change',function(){ S.ws[k]=+el.value; reportEx('fisa_m'+mod+'_'+k,null,el.value,{type:'likert',desc:'Fișa '+mod+': '+k}); save(); }); }
      else { el.value=S.ws[k]||''; el.addEventListener('input',function(){ S.ws[k]=el.value; save(); });
        el.addEventListener('change',function(){ if(k!=='nume'&&k!=='clasa'){ var it=W.items.filter(function(x){return x.k===k;})[0]; reportEx('fisa_m'+mod+'_'+k,null,el.value,{type:'long-fill-in',desc:it?it.q:k}); save(true);} }); }
    });
    $$('[data-rev]',host).forEach(function(b){ b.addEventListener('click',function(){ var m=b.closest('.modal'); if(m) closeModal(m); go(indexOf(b.getAttribute('data-rev'))); }); });
    $('[data-w="docx"]',host).addEventListener('click',function(){ downloadWs(mod); });
    $('[data-w="print"]',host).addEventListener('click',function(){ printWs(mod); });
  }
  function openWs(mod){
    mod=mod||cur.mod; if(!mod||!C.ws[mod]) return;
    var W=C.ws[mod];
    var m=document.createElement('div'); m.className='modal'; m.setAttribute('role','dialog'); m.setAttribute('aria-modal','true'); m.setAttribute('aria-labelledby','wsH');
    m.innerHTML='<div class="dlg"><header><h2 id="wsH">Fișa de lucru · Modulul '+mod+'</h2><button class="x" aria-label="Închide fișa">×</button></header><div class="bd"><p class="small" style="margin:0 0 22px;color:#44474F">'+W.intro+'</p><div class="wshost"></div></div></div>';
    $('#canvas').appendChild(m); html.classList.add('has-modal'); trap(m);
    wsForm($('.wshost',m),mod,false);
    $('.x',m).addEventListener('click',function(){closeModal(m);}); m.addEventListener('click',function(e){ if(e.target===m) closeModal(m); });
    var f=$('textarea,input',m); if(f) f.focus();
  }
  function wsData(mod){
    var W=C.ws[mod], blocks=[];
    W.items.forEach(function(it,k){ var a=S.ws[it.k]; blocks.push({q:(k+1)+'. '+it.q}); blocks.push({a:it.type==='likert'?(a?String(a)+' (din 5)':''):(a||'')}); });
    return {sig:C.sig, title:'Fișa de lucru · Modulul '+mod+': '+W.title, sub:C.title+' · '+C.sub, meta:[['Prenumele',S.ws.nume||''],['Clasa',S.ws.clasa||''],['Data',new Date().toLocaleDateString('ro-RO',{day:'numeric',month:'long',year:'numeric'})]], blocks:blocks, footer:C.funding+' Conținut: '+C.content+'. E-learning: '+C.author+'.'};
  }
  function downloadWs(mod){
    try{
      var b=makeDocx(wsData(mod)), a=document.createElement('a');
      a.href=URL.createObjectURL(b); a.download='Fisa_Pictura_M'+mod+(S.ws.nume?'_'+S.ws.nume.replace(/[^\wăâîșțĂÂÎȘȚ-]+/g,'_'):'')+'.docx';
      document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); },1500);
      toast('Fișa se descarcă. Dacă nu apare, folosește „Tipărește / PDF”.');
    }catch(e){ toast('Descărcarea nu e permisă aici. Folosește „Tipărește / PDF”.'); }
  }
  function printWs(mod){
    var d=wsData(mod), p=$('#print');
    var esc=function(s){return String(s||'').replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];});};
    var h='<div style="font:12pt Arial,sans-serif;padding:14mm 16mm;color:#000"><div style="font-size:9pt;color:#444;margin-bottom:6mm">'+esc(d.sig)+'</div><div style="font-size:20pt;margin-bottom:2mm">'+esc(d.title)+'</div><div style="font-size:11pt;color:#444;margin-bottom:6mm">'+esc(d.sub)+'</div>';
    d.meta.forEach(function(m){ h+='<div><b>'+m[0]+':</b> '+(esc(m[1])||'…………………………')+'</div>'; });
    d.blocks.forEach(function(b){ if(b.q) h+='<p style="font-weight:bold;margin:6mm 0 2mm">'+esc(b.q)+'</p>'; if(b.a!==undefined) h+='<div style="border-left:3pt solid #000;padding:2mm 4mm;min-height:18mm;white-space:pre-wrap">'+(esc(b.a)||'')+'</div>'; });
    h+='<div style="margin-top:10mm;font-size:8pt;color:#444">'+esc(d.footer)+'</div></div>';
    p.innerHTML=h;
    try{ window.print(); }catch(e){ toast('Tipărirea nu e permisă aici.'); }
  }

  /* ---------- ieșire ---------- */
  function exitCourse(){
    save(true);
    if(LMS.active){ reportProgress(); LMS.set('cmi.exit',allDone()?'normal':'suspend'); try{ LMS.set('adl.nav.request','exitAll'); }catch(e){} LMS.commit(); LMS.finish(); toast('Ai ieșit din curs. Poți închide fereastra.'); }
    else toast('Progresul e salvat în acest browser. Poți închide fereastra.');
  }

  /* ---------- mesaje ---------- */
  var tT=0;
  function toast(t){ var e=$('#toast'); e.textContent=t; e.hidden=false; clearTimeout(tT); tT=setTimeout(function(){e.hidden=true;},4200); }

  /* ---------- bara ---------- */
  function bindBar(){
    $('#bPrev').addEventListener('click',function(){ go(idx-1); });
    $('#bNext').addEventListener('click',function(){ go(idx+1); });
    $('#bPlay').addEventListener('click',function(){
      var vo=VO[cur.id]; if(!vo) return;
      $('#bPlay').classList.remove('pulse');
      if(!audio.src || audio.src.indexOf(vo.src)<0){ startAudio(vo,false); return; }
      if(audio.paused){ audio.play().catch(function(){}); } else audio.pause();
    });
    $('#bReplay').addEventListener('click',function(){ var vo=VO[cur.id]; if(!vo) return; S.h[cur.id]=0; go(idx,{noFocus:true}); });
    $('#bAll').addEventListener('click',function(){ stopAudio(); revealAll(); capEl.textContent=''; S.h[cur.id]=1; save(); });
    var cc=$('#bCC'); cc.setAttribute('aria-pressed',S.cc?'true':'false');
    cc.addEventListener('click',function(){ S.cc=!S.cc; cc.setAttribute('aria-pressed',S.cc?'true':'false'); if(!S.cc) capEl.textContent=''; save(); });
    var vb=$('#bVoice'); vb.setAttribute('aria-pressed',S.voice?'true':'false');
    vb.addEventListener('click',function(){ S.voice=!S.voice; vb.setAttribute('aria-pressed',S.voice?'true':'false'); if(!S.voice){ stopAudio(); revealAll(); capEl.textContent=''; } save(); updateBar(); });
    var sp=$('#speed'); sp.value=String(S.speed);
    sp.addEventListener('change',function(){ S.speed=parseFloat(sp.value)||1; audio.playbackRate=S.speed; save(); });
    $('#bToc').addEventListener('click',openToc);
    $('#bWs').addEventListener('click',function(){ openWs(cur.mod); });
    var fs=$('#bFull'), canFS=document.fullscreenEnabled||document.webkitFullscreenEnabled;
    if(!canFS) fs.hidden=true;
    fs.addEventListener('click',function(){
      var d=document, on=d.fullscreenElement||d.webkitFullscreenElement;
      if(on){ (d.exitFullscreen||d.webkitExitFullscreen).call(d); } else { var e=d.documentElement; (e.requestFullscreen||e.webkitRequestFullscreen).call(e); }
    });
    document.addEventListener('fullscreenchange',function(){ fs.setAttribute('aria-pressed',document.fullscreenElement?'true':'false'); setTimeout(fit,100); });
    document.addEventListener('keydown',function(e){
      if(html.classList.contains('has-modal')) return;
      var t=e.target.tagName; if(/INPUT|TEXTAREA|SELECT/.test(t) || e.target.isContentEditable) return;
      if(e.altKey||e.ctrlKey||e.metaKey) return;
      if(e.key==='ArrowRight' && !e.target.closest('[data-keys]')){ e.preventDefault(); go(idx+1); }
      if(e.key==='ArrowLeft' && !e.target.closest('[data-keys]')){ e.preventDefault(); go(idx-1); }
    });
  }

  /* ---------- intro ---------- */
  function intro(done){
    var box=$('#intro'), v=$('#introV'), sk=$('#skip'), fin=false;
    var end=function(){ if(fin) return; fin=true; try{v.pause();}catch(e){} box.remove(); done(); };
    if(!box){ done(); return; }
    sk.addEventListener('click',end); v.addEventListener('ended',function(){ setTimeout(end,350); }); v.addEventListener('error',end);
    var p=v.play(); if(p&&p.catch) p.catch(function(){ /* fără autoplay: rămâne „Sari peste” */ });
    setTimeout(function(){ if(!fin && v.paused && v.currentTime===0) end(); },3500);
    sk.focus();
  }

  /* ---------- pornire ---------- */
  function boot(){
    LMS.init();
    loadState();
    if(LMS.active){ if(LMS.get('cmi.completion_status')==='not attempted'||!LMS.get('cmi.completion_status')) LMS.set('cmi.completion_status','incomplete'); }
    fit(); bindBar();
    var resumeId=S.loc && S.loc!==SL[0].id ? S.loc : (LMS.active?LMS.get('cmi.location'):'');
    S.resumeFrom=resumeId||'';
    intro(function(){ go(0); });
    window.addEventListener('pagehide',function(){ save(true); if(LMS.active){ reportProgress(); LMS.set('cmi.exit','suspend'); LMS.commit(); } });
    var t0=Date.now();
    window.addEventListener('beforeunload',function(){ if(LMS.active){ var s=Math.round((Date.now()-t0)/1000); LMS.set('cmi.session_time','PT'+Math.floor(s/3600)+'H'+Math.floor(s%3600/60)+'M'+(s%60)+'S'); LMS.set('cmi.exit','suspend'); LMS.commit(); LMS.finish(); } });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
