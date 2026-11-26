/* Exercițiile și elementele interactive ale cursului „Pictează orașul.”
   Fiecare funcție primește (sl = ecranul, cur = datele ecranului, api = window.PLAYER).
   window.EXR._all rulează pe fiecare ecran, înainte de funcția proprie. */
(function(){
  'use strict';
  var $=function(s,r){return (r||document).querySelector(s);};
  var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};
  var EX=function(k){ return (window.COURSE.ex||{})[k]||{}; };
  function el(tag,cls,html){ var e=document.createElement(tag); if(cls) e.className=cls; if(html!=null) e.innerHTML=html; return e; }
  function strip(h){ return String(h).replace(/<[^>]+>/g,''); }
  function pct(a,b){ return Math.round(a/b*100); }

  /* ---------- culori ---------- */
  function rgb(h){ h=h.replace('#',''); return [parseInt(h.substr(0,2),16),parseInt(h.substr(2,2),16),parseInt(h.substr(4,2),16)]; }
  function hex(c){ return '#'+c.map(function(v){ v=Math.max(0,Math.min(255,Math.round(v))); return (v<16?'0':'')+v.toString(16); }).join(''); }
  function mix(a,b,t){ a=typeof a==='string'?rgb(a):a; b=typeof b==='string'?rgb(b):b; return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]; }
  function lum(c){ c=typeof c==='string'?rgb(c):c; return (0.2126*c[0]+0.7152*c[1]+0.0722*c[2])/255; }
  function hsl(h,s,l){ h/=360; var q=l<.5?l*(1+s):l+s-l*s, p=2*l-q; var f=function(t){ if(t<0)t+=1; if(t>1)t-=1; if(t<1/6) return p+(q-p)*6*t; if(t<1/2) return q; if(t<2/3) return p+(q-p)*(2/3-t)*6; return p; }; return [f(h+1/3)*255,f(h)*255,f(h-1/3)*255]; }

  /* ---------- strada în perspectivă: culori pe roluri ---------- */
  var BASE={sky:'#9EC3E6',end:'#E8D8B6',endT:'#DECB9F',endR:'#4F6B5E',win:'#3B4656',corn:'#EFE6D2',door:'#5A3A2A',L1:'#D38C4C',L2:'#C9B27A',R1:'#B5563C',R2:'#E1C79E',walk:'#B4AEA2',street:'#6B6964',rail:'#2E2E2E',tram:'#E3AE24',tramS:'#BE8F17',tree:'#5B8A3A',trunk:'#4A3A2A',fig:'#2F3640'};
  function paint(svg,fn){
    $$('[data-r]',svg).forEach(function(e){
      var r=e.getAttribute('data-r'), z=+e.getAttribute('data-z')||0, c=fn(r,z,e);
      if(typeof c!=='string') c=hex(c);
      if(e.tagName.toLowerCase()==='line') e.style.stroke=c; else e.style.fill=c;
    });
  }
  function depth(z){ return Math.pow(Math.max(0,Math.min(1,(z-4)/106)),0.7); }

  /* ---------- potrivirea unei imagini într-o cutie ---------- */
  function fitBox(wrap,fit,img){
    var go=function(){
      var ar=img.naturalWidth/img.naturalHeight; if(!ar) return;
      var W=wrap.clientWidth, H=document.documentElement.classList.contains('m')?1e9:wrap.clientHeight; if(!W||!H) return;
      var w=Math.min(W,H*ar); fit.style.width=Math.floor(w)+'px';
    };
    if(img.complete) go(); img.addEventListener('load',go); window.addEventListener('resize',go);
    return go;
  }

  /* lungimea liniilor desenate și grosimea liniilor peste imagini */
  function drawLens(root){
    $$('.draw',root).forEach(function(d){
      $$('path,line,polyline,circle,rect,ellipse',d).forEach(function(s){
        var L=2400; try{ L=Math.ceil(s.getTotalLength())+4; }catch(e){}
        s.style.setProperty('--len',L);
      });
    });
  }
  function strokes(root){
    $$('svg.ov',root).forEach(function(svg){
      var host=svg.parentNode, vb=svg.viewBox&&svg.viewBox.baseVal;
      var set=function(){ var w=host.offsetWidth; if(!w||!vb||!vb.width) return; svg.style.strokeWidth=(5*vb.width/w).toFixed(2); };
      set(); var im=$('img',host); if(im) im.addEventListener('load',set);
    });
  }

  var R={};
  var PROT={hopper:'The Phillips Collection, Washington',kossoff:'colecție particulară'};
  function hideProtected(sl){
    if(!window.CFG || window.CFG.showProtected!==false) return;
    $$('img',sl).forEach(function(im){
      var m=/picturi\/(hopper|kossoff)/.exec(im.getAttribute('src')||''); if(!m) return;
      var d=el('div','prot','Reproducerea acestei lucrări este protejată de drepturi de autor. O poți vedea pe site-ul colecției: '+PROT[m[1]]+'.');
      var z=im.parentNode.querySelector('.zoom'); if(z) z.remove();
      im.parentNode.replaceChild(d,im);
    });
  }
  /* lucrările de artă: rama se strânge pe imagine, ca legenda și lupa să stea lângă ea */
  function placeArt(sl){
    $$('.art',sl).forEach(function(f){
      var fr=$('.fr',f), im=fr&&$('img',fr), z=fr&&$('.zoom',fr); if(!im||f.classList.contains('ovfig')) return;
      var go=function(){
        fr.style.height=''; fr.style.flex=''; f.style.flex='';
        if(!im.naturalWidth) return;
        var ih=im.offsetHeight, iw=im.offsetWidth, fh=fr.clientHeight, fw=fr.clientWidth;
        if(fh-ih>4 && !document.documentElement.classList.contains('m') && !f.classList.contains('fixh')){ fr.style.flex='none'; fr.style.height=ih+'px'; f.style.flex='none'; if(f.parentNode.classList.contains('col')) f.parentNode.style.justifyContent='center'; }
        if(z){ z.style.right=Math.max(10,(fw-iw)/2+10)+'px'; z.style.bottom='10px'; }
      };
      if(im.complete) go(); im.addEventListener('load',go); window.addEventListener('resize',go);
    });
  }
  R._all=function(sl){ hideProtected(sl); placeArt(sl); drawLens(sl); strokes(sl); };

  /* ---------- 0.0 start ---------- */
  R.start=function(sl,cur,api){
    var r=api.S.resumeFrom, b=$('#bResume',sl);
    if(r && r!=='0.0' && b){
      var s=api.C.slides.filter(function(x){return x.id===r;})[0];
      b.hidden=false; b.textContent='Continuă: '+r+(s?' · '+s.title:'');
      $('#bStart',sl).lastChild.textContent='Ia-o de la capăt';
    }
  };

  /* ---------- 0.2 stadiul modulelor ---------- */
  function modState(api,m){
    var S=api.S, sl=api.C.slides.filter(function(s){return s.mod===m;});
    var bib=sl.filter(function(s){return s.role==='biblio';})[0];
    if(bib && S.v[bib.id]) return 'parcurs';
    return sl.some(function(s){return S.v[s.id];})?'început':'';
  }
  R.modstatus=function(sl,cur,api){
    $$('.mst',sl).forEach(function(e){ var st=modState(api,+e.getAttribute('data-mod')); e.textContent=st; e.className='mst'+(st?' on':''); });
  };

  /* ---------- 1.1 sondaj ---------- */
  R.poll=function(sl,cur,api){
    var D=EX('poll1'), box=$('#poll1',sl), o=$('.opts',box), fb=$('.fb',box), S=api.S;
    var prev=S.ex.poll1?S.ex.poll1.a:null;
    D.opts.forEach(function(t,i){
      var b=el('button','opt',t); b.type='button'; b.setAttribute('aria-pressed',String(prev===t));
      b.addEventListener('click',function(){
        $$('.opt',o).forEach(function(x){x.setAttribute('aria-pressed','false');}); b.setAttribute('aria-pressed','true');
        fb.hidden=false; fb.innerHTML='<b>Ai ales: '+t+'.</b> '+D.fb;
        var w=S.ws[D.key]||''; if(!w || D.opts.some(function(x){return w.indexOf(x+'.')===0;})) S.ws[D.key]=t+'. De ce: ';
        api.exDone('poll1',null,t,{type:'other',desc:'Ce ai pune mai întâi pe pânză?'});
      });
      o.appendChild(b);
    });
    if(prev){ fb.hidden=false; fb.innerHTML='<b>Ai ales: '+prev+'.</b> '+D.fb; }
  };

  /* ---------- puncte pe imagine (1.3 Lorenzetti, 4.1 masa de lucru) ---------- */
  function hotspots(sl,api,o){
    var wrap=$('#'+o.wrap,sl), fit=$('.fit',wrap), img=$('img',fit), card=$('#'+o.card,sl), cnt=$('#'+o.count,sl);
    var all=o.pts.length+(o.more?o.more.length:0), seen={}, S=api.S;
    var prev=S.ex[o.id]; if(prev && prev.a) String(prev.a).split('|').forEach(function(k){ if(k) seen[k]=1; });
    fitBox(wrap,fit,img);
    function show(k,t,d,im,btn){
      seen[k]=1;
      $$('[aria-expanded]',sl).forEach(function(x){x.setAttribute('aria-expanded','false');});
      if(btn){ btn.setAttribute('aria-expanded','true'); btn.classList.add('seen'); }
      card.innerHTML=(im?'<img class="hc-img" src="'+im+'" alt="">':'')+'<h3>'+t+'</h3><p>'+d+'</p>';
      upd();
      var n=Object.keys(seen).length;
      if(n>=all && !(S.ex[o.id]&&S.ex[o.id].s===1)) api.exDone(o.id,1,Object.keys(seen).join('|'),{type:'other',desc:o.desc});
      else if(n<all) S.ex[o.id]={s:null,a:Object.keys(seen).join('|'),t:Date.now()};
    }
    function upd(){ var n=Object.keys(seen).length; cnt.innerHTML=o.word+': <b>'+n+'</b> din '+all+(n>=all?' · '+o.done:''); }
    o.pts.forEach(function(p,i){
      var b=el('button','hot','<span class="dot">'+(i+1)+'</span>'); b.type='button';
      b.style.left=p.x+'%'; b.style.top=p.y+'%';
      b.setAttribute('aria-label','Punctul '+(i+1)+' din '+o.pts.length+(seen['p'+i]?': '+p.t:''));
      b.setAttribute('aria-expanded','false'); b.setAttribute('aria-controls',o.card);
      if(seen['p'+i]) b.classList.add('seen');
      b.addEventListener('click',function(){ b.setAttribute('aria-label','Punctul '+(i+1)+': '+p.t); show('p'+i,p.t,p.d,null,b); });
      fit.appendChild(b);
    });
    if(o.more){
      var mb=$('.morebtns',sl);
      o.more.forEach(function(m,i){
        var b=el('button','mb','<img src="'+m.img+'" alt=""><span>'+m.t+'</span>'); b.type='button';
        b.setAttribute('aria-expanded','false'); b.setAttribute('aria-controls',o.card);
        if(seen['m'+i]) b.classList.add('seen');
        b.addEventListener('click',function(){ show('m'+i,m.t,m.d,m.img,b); });
        mb.appendChild(b);
      });
    }
    upd();
  }
  R.hot=function(sl,cur,api){ var D=EX('hot1'); hotspots(sl,api,{id:'hot1',wrap:'hot1',card:'hot1card',count:'hot1c',pts:D.pts,word:'Găsite',done:'toate semnele binelui comun',desc:'Lorenzetti: semnele orașului bine condus'}); };
  R.tools=function(sl,cur,api){ var D=EX('tools'); hotspots(sl,api,{id:'tools',wrap:'tools',card:'toolsCard',count:'toolsC',pts:D.pts,more:D.more,word:'Descoperite',done:'ai tot ce-ți trebuie',desc:'Instrumentele atelierului'}); };

  /* ---------- 1.8 asociere ---------- */
  R.match=function(sl,cur,api){
    var D=EX('match1'), sels=$$('select.sel',sl), score=$('#m1score',sl), S=api.S;
    var prev=S.ex.match1&&S.ex.match1.a?String(S.ex.match1.a).split(','):null;
    if(prev) sels.forEach(function(s,i){ if(prev[i]!==undefined && prev[i]!=='') s.value=prev[i]; });
    sels.forEach(function(s){ s.addEventListener('change',function(){ var li=s.closest('.mi'); li.classList.remove('good','bad'); $('.mfb',li).textContent=''; }); });
    $('#m1chk',sl).addEventListener('click',function(){
      var ok=0, empty=0, ans=[];
      sels.forEach(function(s,i){
        var it=D.items[i], li=s.closest('.mi'), f=$('.mfb',li); ans.push(s.value);
        li.classList.remove('good','bad');
        if(s.value===''){ empty++; f.innerHTML='Alege un răspuns.'; return; }
        var g=+s.value===it.ans; if(g) ok++;
        li.classList.add(g?'good':'bad');
        f.innerHTML='<b>'+(g?'Corect.':'Nu chiar: '+D.roles[it.ans]+'.')+'</b> '+it.fb;
      });
      if(empty){ score.innerHTML='Mai ai '+empty+' '+(empty===1?'tablou':'tablouri')+' fără răspuns.'; return; }
      score.innerHTML='Scor: <b>'+ok+' din '+D.items.length+'</b>. Citește explicațiile de sub fiecare tablou.';
      api.exDone('match1',ok/D.items.length,ans.join(','),{type:'other',desc:'Ce face orașul în tablou?'});
    });
    $('#m1rst',sl).addEventListener('click',function(){ sels.forEach(function(s){ s.value=''; var li=s.closest('.mi'); li.classList.remove('good','bad'); $('.mfb',li).textContent=''; }); score.textContent=''; sels[0].focus(); });
  };

  /* ---------- 1.9 reflecție (merge direct în fișă) ---------- */
  R.reflect=function(sl,cur,api){
    var S=api.S;
    $$('[data-k]',sl).forEach(function(e){
      var k=e.getAttribute('data-k'); e.value=S.ws[k]||'';
      e.addEventListener('input',function(){ S.ws[k]=e.value; api.save(); });
      e.addEventListener('change',function(){ api.exDone('fisa_m1_'+k,null,e.value,{type:'long-fill-in',desc:strip($('label[for="'+e.id+'"]',sl).textContent)}); });
    });
  };

  /* ---------- 2.2 vizorul ---------- */
  R.vizor=function(sl,cur,api){
    var D=EX('vizor'), box=$('#vizor',sl), st=$('.vz-stage',box), img=$('img',st), fr=$('.vz-frame',st), out=$('.vz-out',box), crop=$('.vz-crop',out), fb=$('.fb',out);
    var portrait=false, cx=.5, cy=.55, W=0, H=0, fw=0, fh=0;
    function layout(){
      var aw=box.clientWidth-(out.hidden?0:out.offsetWidth+40), ah=box.clientHeight;
      W=Math.min(aw,ah*D.ar); H=W/D.ar; st.style.width=W+'px'; st.style.height=H+'px';
      if(portrait){ fh=H*.94; fw=fh*2/3; } else { fw=W*.52; fh=fw*2/3; if(fh>H*.94){ fh=H*.94; fw=fh*1.5; } }
      place();
    }
    function place(){
      var hx=fw/W/2, hy=fh/H/2; cx=Math.max(hx,Math.min(1-hx,cx)); cy=Math.max(hy,Math.min(1-hy,cy));
      fr.style.width=fw+'px'; fr.style.height=fh+'px'; fr.style.left=(cx*W-fw/2)+'px'; fr.style.top=(cy*H-fh/2)+'px';
      fr.setAttribute('aria-valuenow',String(Math.round(cx*100)));
      fr.setAttribute('aria-valuetext','Cadrul '+(portrait?'vertical':'orizontal')+', la '+Math.round(cx*100)+'% din lățime și '+Math.round(cy*100)+'% din înălțime');
      $('.vz-fmt',fr).textContent=portrait?'40 × 60 · vertical':'60 × 40 · orizontal';
    }
    var drag=null;
    fr.addEventListener('pointerdown',function(e){ drag={x:e.clientX,y:e.clientY,cx:cx,cy:cy,k:st.getBoundingClientRect().width/W}; fr.setPointerCapture(e.pointerId); fr.classList.add('drag'); });
    fr.addEventListener('pointermove',function(e){ if(!drag) return; cx=drag.cx+(e.clientX-drag.x)/drag.k/W; cy=drag.cy+(e.clientY-drag.y)/drag.k/H; place(); });
    var up=function(){ drag=null; fr.classList.remove('drag'); };
    fr.addEventListener('pointerup',up); fr.addEventListener('pointercancel',up);
    fr.addEventListener('keydown',function(e){
      var s=e.shiftKey?.08:.02, m={ArrowLeft:[-s,0],ArrowRight:[s,0],ArrowUp:[0,-s],ArrowDown:[0,s]}[e.key];
      if(m){ e.preventDefault(); cx+=m[0]; cy+=m[1]; place(); }
      if(e.key==='Enter'){ e.preventDefault(); fix(); }
    });
    $('#vzRot',sl).addEventListener('click',function(){ portrait=!portrait; layout(); });
    function fix(){
      var x0=cx-fw/W/2, y0=cy-fh/H/2, rw=fw/W, rh=fh/H;
      var colIn=D.col.x>x0 && D.col.x<x0+rw, rx=(D.col.x-x0)/rw;
      var domIn=D.dom.x1>x0 && D.dom.x0<x0+rw;
      var gr=(D.ground-y0)/rh;
      var msg=[], txt=[];
      if(!colIn){ msg.push('<b>Coloana a rămas în afara cadrului.</b> Subiectul devin clădirile din jur; e o alegere, dar piața își pierde centrul.'); txt.push('coloana a rămas în afara cadrului'); }
      else if(Math.abs(rx-1/3)<.09 || Math.abs(rx-2/3)<.09){ msg.push('<b>Coloana stă pe o linie a treimilor.</b> Compoziția e vie și echilibrată: privirea are loc să circule.'); txt.push('coloana stă pe o linie a treimilor'); }
      else if(Math.abs(rx-.5)<.09){ msg.push('<b>Coloana e în centru.</b> Imaginea devine simetrică, calmă, solemnă. E o alegere bună pentru un monument.'); txt.push('coloana e în centru (simetrie)'); }
      else { msg.push('<b>Coloana e aproape de margine.</b> Tensiunea crește; verifică dacă ai vrut asta.'); txt.push('coloana e aproape de margine'); }
      msg.push(domIn?'Domul intră în cadru și dă o a doua greutate vizuală.':'Domul a rămas afară: piața se citește mai simplu.');
      if(gr>.9) msg.push('Pământul aproape lipsește: cerul și fațadele domină.'); else if(gr<.6) msg.push('Mult prim-plan: pavajul ocupă o parte mare din tablou.');
      txt.push(portrait?'format vertical':'format orizontal');
      out.hidden=false; layout();
      var cw=out.clientWidth, ch=cw*rh*H/(rw*W); if(ch>box.clientHeight*.62){ ch=box.clientHeight*.62; cw=ch*rw*W/(rh*H); }
      crop.style.width=cw+'px'; crop.style.height=ch+'px';
      crop.style.backgroundImage='url("'+img.getAttribute('src')+'")';
      crop.style.backgroundSize=(cw/rw)+'px '+(ch/rh)+'px';
      crop.style.backgroundPosition=(-x0*cw/rw)+'px '+(-y0*ch/rh)+'px';
      crop.setAttribute('role','img'); crop.setAttribute('aria-label','Încadrarea ta: '+txt.join(', '));
      fb.innerHTML=msg.join(' ');
      var d='Am încadrat Piața Unirii în '+txt.join('; ')+'.';
      if(!api.S.ws[D.key] || /^Am încadrat/.test(api.S.ws[D.key])) api.S.ws[D.key]=d+' De ce: ';
      api.exDone('vizor',null,d,{type:'other',desc:'Vizorul: încadrarea Pieței Unirii'});
    }
    $('#vzFix',sl).addEventListener('click',fix);
    if(img.complete) layout(); img.addEventListener('load',layout); window.addEventListener('resize',layout);
    setTimeout(layout,60);
  };

  /* ---------- 2.6 structura ---------- */
  R.struct=function(sl,cur,api){
    var D=EX('struct'), res=[], first=[];
    $$('.stc',sl).forEach(function(li,i){
      var it=D.items[i], o=$('.opts',li), f=$('.mfb',li), ov=$('svg.ov',li);
      D.opts.forEach(function(t,j){
        var b=el('button','opt',t); b.type='button'; b.setAttribute('aria-pressed','false');
        b.addEventListener('click',function(){
          if(first[i]===undefined) first[i]=(j===it.ans);
          $$('.opt',o).forEach(function(x,k){ x.classList.toggle('good',k===it.ans); x.setAttribute('aria-pressed',String(k===j)); if(k===j&&k!==it.ans) x.classList.add('bad'); });
          ov.classList.add('on');
          f.innerHTML='<b>'+(j===it.ans?'Corect.':'Nu chiar: e '+D.opts[it.ans]+'.')+'</b> '+it.fb;
          res[i]=j;
          var n=first.filter(function(x){return x!==undefined;}).length;
          if(n===D.items.length){
            var ok=first.filter(Boolean).length;
            $('#stScore',sl).innerHTML='Din prima: <b>'+ok+' din '+D.items.length+'</b>';
            api.exDone('struct',ok/D.items.length,res.join(','),{type:'other',desc:'Structuri compoziționale'});
          }
        });
        o.appendChild(b);
      });
    });
  };

  /* ---------- străzile: pregătire ---------- */
  function street(sl,sel){ var s=$(sel,sl); if(!s) return null; paint(s,function(r){return BASE[r]||'#999';}); return s; }

  /* ---------- 2.8 demonstrația perspectivei: liniile apar odată cu vocea ---------- */
  R.perspdemo=function(sl){
    var s=street(sl,'#stA'); if(!s) return;
    [['g-hz',2],['g-vp',3],['g-or',4]].forEach(function(p){ var g=$('.'+p[0],s); if(!g) return; g.setAttribute('data-cue',p[1]); if(p[0]!=='g-vp'){ g.classList.add('draw'); } else g.setAttribute('data-a','zoom'); });
    drawLens(s);
  };

  /* ---------- 2.9 punctul de fugă ---------- */
  R.vp=function(sl,cur,api){
    var D=EX('vp'), s=street(sl,'#stB'), wrap=$('#vpx',sl), h=$('.vp-h',wrap), p=$('.vp-p',wrap), fb=$('#vpFb',sl), steps=$$('#vpSteps li',sl), bH=$('#vpH',sl);
    var hy=300, px=800, py=450, phase=1, hOK=null, pOK=null;
    var G=function(c){ return $('.'+c,s); };
    ['g-hz','g-or','g-vp'].forEach(function(c){ G(c).style.display='none'; });
    function setH(){ hy=Math.max(10,Math.min(890,hy)); h.style.top=(hy/900*100)+'%'; h.setAttribute('aria-valuenow',String(Math.round(hy))); h.setAttribute('aria-valuetext','la '+Math.round(hy/9)+'% din înălțime'); }
    function setP(){ p.style.left=(px/1600*100)+'%'; p.style.top=(py/900*100)+'%'; }
    function vb(e){ var r=wrap.getBoundingClientRect(); return [(e.clientX-r.left)/r.width*1600,(e.clientY-r.top)/r.height*900]; }
    setH();
    var drag=false;
    h.addEventListener('pointerdown',function(e){ if(phase!==1) return; drag=true; h.setPointerCapture(e.pointerId); e.preventDefault(); });
    h.addEventListener('pointermove',function(e){ if(!drag) return; hy=vb(e)[1]; setH(); });
    h.addEventListener('pointerup',function(){ drag=false; });
    wrap.addEventListener('pointerdown',function(e){ if(phase===1 && e.target!==h && !h.contains(e.target)){ hy=vb(e)[1]; setH(); drag=true; h.setPointerCapture&&h.setPointerCapture(e.pointerId); } });
    h.addEventListener('keydown',function(e){ if(phase!==1) return; var d=e.shiftKey?40:8; if(e.key==='ArrowUp'){e.preventDefault();hy-=d;setH();} if(e.key==='ArrowDown'){e.preventDefault();hy+=d;setH();} if(e.key==='Enter'){e.preventDefault();fixH();} });
    function fixH(){
      if(phase!==1) return;
      var d=hy-D.vp[1]; hOK=Math.abs(d)<=D.tolH;
      G('g-hz').style.display=''; h.classList.add('fixed'); h.tabIndex=-1; bH.disabled=true;
      fb.hidden=false;
      fb.innerHTML=hOK?'<b>Corect.</b> Orizontul e la înălțimea ochilor celui care a desenat strada: acolo se întâlnesc liniile.':'<b>Nu chiar.</b> Linia ta e '+(d<0?'prea sus':'prea jos')+'. Orizontul adevărat e linia trasă acum peste imagine: acolo se întâlnesc streșinile și trotuarele.';
      hy=D.vp[1]; setH();
      phase=2; steps[0].classList.remove('on'); steps[1].classList.add('on');
      p.hidden=false; px=800; py=hy; setP(); p.tabIndex=0; p.setAttribute('role','slider'); p.setAttribute('aria-valuetext','ținta e la mijloc, pe orizont'); p.focus();
    }
    bH.addEventListener('click',fixH);
    function fixP(){
      if(phase!==2) return;
      var dist=Math.sqrt(Math.pow(px-D.vp[0],2)+Math.pow(py-D.vp[1],2)); pOK=dist<=D.tolP;
      ['g-or','g-vp'].forEach(function(c){ G(c).style.display=''; G(c).classList.add('reveal'); });
      phase=3; p.classList.add('fixed'); steps[1].classList.remove('on');
      fb.innerHTML+=' <br>'+(pOK?'<b>Și punctul de fugă e corect.</b> Toate liniile paralele cu strada se strâng acolo.':'<b>Punctul tău e '+(px<D.vp[0]?'prea la stânga':'prea la dreapta')+'.</b> Urmărește liniile galbene: ele se întâlnesc în punctul de fugă, pe orizont.');
      var sc=(hOK?.5:0)+(pOK?.5:0);
      api.exDone('vp',sc,'orizont '+Math.round(hy)+'; punct '+Math.round(px)+','+Math.round(py),{type:'other',desc:'Linia orizontului și punctul de fugă'});
    }
    wrap.addEventListener('click',function(e){ if(phase!==2 || e.target===h) return; var v=vb(e); px=v[0]; py=v[1]; setP(); fixP(); });
    p.addEventListener('keydown',function(e){ if(phase!==2) return; var d=e.shiftKey?60:15, m={ArrowLeft:[-d,0],ArrowRight:[d,0],ArrowUp:[0,-d],ArrowDown:[0,d]}[e.key]; if(m){ e.preventDefault(); px=Math.max(0,Math.min(1600,px+m[0])); py=Math.max(0,Math.min(900,py+m[1])); setP(); p.setAttribute('aria-valuetext','ținta e la '+Math.round(px/16)+'% din lățime și '+Math.round(py/9)+'% din înălțime'); } if(e.key==='Enter'){ e.preventDefault(); fixP(); } });
    $('#vpShow',sl).addEventListener('click',function(){ ['g-hz','g-or','g-vp'].forEach(function(c){ G(c).style.display=''; }); });
    $('#vpReset',sl).addEventListener('click',function(){ api.go(cur.id); });
  };

  /* ---------- 2.10 perspectiva aeriană și cromatică ---------- */
  R.air=function(sl){
    var s=street(sl,'#stC'), r=$('#airR',sl), b=$('#warmCold',sl); if(!s) return;
    var haze=mix(BASE.sky,'#FFFFFF',.2);
    function draw(){
      var a=r.value/100, wc=b.getAttribute('aria-pressed')==='true';
      paint(s,function(role,z){
        var c=rgb(BASE[role]||'#999'); if(role==='sky') return c;
        var f=depth(z);
        if(wc){ c=mix(c,'#E2772F',.30*Math.pow(1-f,1.4)); c=mix(c,'#6C8DC0',.42*f); }
        return mix(c,haze,a*.88*f);
      });
      r.setAttribute('aria-valuetext',a===0?'fără aer':(a<.5?'puțin aer':'mult aer'));
    }
    r.addEventListener('input',draw);
    b.addEventListener('click',function(){ b.setAttribute('aria-pressed',b.getAttribute('aria-pressed')==='true'?'false':'true'); draw(); });
    draw();
  };

  /* ---------- 3.2 cercul culorilor ---------- */
  var WH=[['galben','#F2C500',1],['galben-portocaliu','#F29E00',3],['portocaliu','#EE7A1A',2],['roșu-portocaliu','#E0532A',3],['roșu','#C8282D',1],['roșu-violet','#9E2B5E',3],['violet','#6B3A8C',2],['albastru-violet','#4A4A9C',3],['albastru','#2457A6',1],['albastru-verde','#1F8A8A',3],['verde','#2E9A4A',2],['galben-verde','#9DBF2E',3]];
  R.wheel=function(sl){
    var box=$('#wheel',sl), fb=$('#wheelFb',sl), n=12, R1=300, R0=150, cx=320, cy=320, sel=-1;
    var h='<svg viewBox="0 0 640 640" role="group" aria-label="Cercul culorilor, 12 culori">';
    for(var i=0;i<n;i++){
      var a0=(i-.5)/n*2*Math.PI-Math.PI/2, a1=(i+.5)/n*2*Math.PI-Math.PI/2;
      var p=function(r,a){ return (cx+r*Math.cos(a)).toFixed(1)+' '+(cy+r*Math.sin(a)).toFixed(1); };
      var rr=WH[i][2]===1?R1:(WH[i][2]===2?R1-14:R1-28);
      h+='<path class="sec" data-i="'+i+'" tabindex="'+(i===0?0:-1)+'" role="button" aria-label="'+WH[i][0]+'" d="M'+p(R0,a0)+' L'+p(rr,a0)+' A'+rr+' '+rr+' 0 0 1 '+p(rr,a1)+' L'+p(R0,a1)+' A'+R0+' '+R0+' 0 0 0 '+p(R0,a0)+'Z" fill="'+WH[i][1]+'"/>';
      if(WH[i][2]===1){ var m=(a0+a1)/2; h+='<text x="'+(cx+(R0+60)*Math.cos(m)).toFixed(0)+'" y="'+(cy+(R0+60)*Math.sin(m)+9).toFixed(0)+'" class="wl" aria-hidden="true">'+WH[i][0]+'</text>'; }
    }
    h+='<circle cx="320" cy="320" r="138" class="hole"/><text x="372" y="334" class="wc" aria-hidden="true">cald</text><text x="268" y="334" class="wc cold" aria-hidden="true">rece</text><line x1="'+(cx+R0*Math.cos(-Math.PI/2-Math.PI/12))+'" y1="'+(cy+R0*Math.sin(-Math.PI/2-Math.PI/12))+'" x2="'+(cx-R0*Math.cos(-Math.PI/2-Math.PI/12))+'" y2="'+(cy-R0*Math.sin(-Math.PI/2-Math.PI/12))+'" class="split" aria-hidden="true"/></svg>';
    box.innerHTML=h;
    var secs=$$('.sec',box);
    function pick(i,focus){
      sel=(i+n)%n; var a=(sel+n-1)%n, b=(sel+1)%n, c=(sel+6)%n, t=WH[sel];
      secs.forEach(function(s,k){ s.classList.toggle('dim',[sel,a,b,c].indexOf(k)<0); s.classList.toggle('on',k===sel); s.classList.toggle('cp',k===c); s.setAttribute('tabindex',k===sel?'0':'-1'); s.setAttribute('aria-pressed',String(k===sel)); });
      if(focus) secs[sel].focus();
      var kind=t[2]===1?'culoare primară':(t[2]===2?'culoare secundară':'culoare terțiară, între o primară și o secundară');
      fb.innerHTML='<b>'+t[0][0].toUpperCase()+t[0].slice(1)+'</b>: '+kind+', '+(sel<6?'caldă':'rece')+'. Vecine, înrudite: '+WH[a][0]+' și '+WH[b][0]+'. Complementara, față în față: <b>'+WH[c][0]+'</b>.';
    }
    secs.forEach(function(s,k){
      s.addEventListener('click',function(){ pick(k); });
      s.addEventListener('keydown',function(e){
        if(e.key==='Enter'||e.key===' '){ e.preventDefault(); pick(k); }
        if(e.key==='ArrowRight'||e.key==='ArrowDown'){ e.preventDefault(); pick(k+1,true); }
        if(e.key==='ArrowLeft'||e.key==='ArrowUp'){ e.preventDefault(); pick(k-1,true); }
      });
    });
  };

  /* ---------- 3.4 monocromie, policromie, gamă restrânsă ---------- */
  function palMode(mode){
    return function(r){
      var c=BASE[r]||'#999';
      if(mode==='mono'){ var L=lum(c); return hsl(213,.46,.10+.80*L); }
      if(mode==='restr'){ var L2=lum(c)*255; return mix(mix(c,[L2,L2,L2],.58),'#A48A64',.2); }
      return c;
    };
  }
  R.mono=function(sl){
    var s=street(sl,'#stM'); if(!s) return;
    $$('[data-pal]',sl).forEach(function(b){ b.addEventListener('click',function(){
      $$('[data-pal]',sl).forEach(function(x){x.setAttribute('aria-pressed',String(x===b));});
      s.classList.add('fade'); paint(s,palMode(b.getAttribute('data-pal')));
    }); });
  };

  /* ---------- 3.6 alb-negru ---------- */
  R.bw=function(sl){
    var b=$('#bwT',sl), on=false;
    $$('img[data-bw]',sl).forEach(function(i){ i.setAttribute('data-c',i.getAttribute('src')); var p=new Image(); p.src=i.getAttribute('data-bw'); });
    b.addEventListener('click',function(){
      on=!on; b.setAttribute('aria-pressed',String(on)); b.textContent=on?'Vezi în culoare':'Vezi în alb-negru';
      $$('img[data-bw]',sl).forEach(function(i){ i.src=i.getAttribute(on?'data-bw':'data-c'); });
    });
  };

  /* ---------- 3.7 laboratorul de culoare ---------- */
  var FAM={
    rece:{sky:'#A9BCD0',end:'#C7D1DD',endT:'#BCC7D4',endR:'#56677F',win:'#2F3A4C',corn:'#D5DCE5',door:'#3D4A60',L1:'#7F93AE',L2:'#9AAAC0',R1:'#6E7F99',R2:'#B3C0D0',walk:'#8E98A6',street:'#5C6573',rail:'#2C3440',tram:'#8FA3BD',tramS:'#74879F',tree:'#5F7F86',trunk:'#3A4452',fig:'#2E3644'},
    cald:{sky:'#F0C88A',end:'#F1D9A8',endT:'#E8C88E',endR:'#9A5A2E',win:'#5A3826',corn:'#F4E1BC',door:'#6E3B22',L1:'#D58A45',L2:'#E0B56A',R1:'#B8552F',R2:'#E9C58E',walk:'#C9A57A',street:'#8A6A4C',rail:'#4A3020',tram:'#D99A3C',tramS:'#B97E2C',tree:'#9A8A3A',trunk:'#5A3A22',fig:'#4A2E22'},
    neutru:{sky:'#C9C9C7',end:'#D8D6D1',endT:'#CFCDC8',endR:'#6E6C68',win:'#3E3E3E',corn:'#E0DED9',door:'#4A4846',L1:'#9E9C98',L2:'#B5B3AE',R1:'#8A8884',R2:'#C2C0BB',walk:'#A8A6A2',street:'#6E6C69',rail:'#3A3A3A',tram:'#9A9893',tramS:'#84827E',tree:'#7E7D79',trunk:'#4A4846',fig:'#3A3A3A'}
  };
  var COMP={rece:['#E8762B','#C25A18'],cald:['#2E6FB7','#1F5390'],neutru:['#E2452A','#B23219']};
  var LIGHT={rece:['#C9DCF2','#A9C2E0'],cald:['#F6C35A','#E0A73E'],neutru:['#F2F0EB','#DAD8D2']};
  var TGT={tram:['tram','tramS'],end:['end','endT','endR'],nimic:['door','fig']};
  R.lab=function(sl,cur,api){
    var D=EX('lab'), s=street(sl,'#stL'), mi=0, ch={}, first=[], ok=0;
    var fb=$('#labFb',sl), bChk=$('#labChk',sl), bNext=$('#labNext',sl);
    var NAMES={dom:{rece:'rece',cald:'caldă',neutru:'neutră, gri'},rel:{armonie:'armonie',contrast:'contrast de complementare'},acc:{nimic:'niciun accent',tram:'accent pe tramvai',end:'accent pe clădirea din fund'}};
    function render(){
      var fam=FAM[ch.dom]||null;
      paint(s,function(r){
        var c=fam?fam[r]:BASE[r]; if(!c) return '#999';
        var tg=TGT[ch.acc||'nimic']||[]; var k=tg.indexOf(r);
        if(ch.rel==='contrast' && k>=0 && (ch.acc!=='nimic' || r==='door')) return (COMP[ch.dom||'neutru']||COMP.neutru)[k===0?0:1];
        if(ch.rel!=='contrast' && ch.acc && ch.acc!=='nimic' && k>=0) return (LIGHT[ch.dom||'neutru']||LIGHT.neutru)[k===0?0:1];
        return c;
      });
    }
    function load(){
      var m=D.missions[mi]; ch={};
      $('#labN',sl).textContent='Comanda '+(mi+1)+' din '+D.missions.length; $('#labT',sl).textContent=m.t;
      $$('.seg[data-g] .btn',sl).forEach(function(b){ b.setAttribute('aria-pressed','false'); b.disabled=false; });
      fb.hidden=true; bChk.hidden=false; bChk.disabled=false; bNext.hidden=true; render();
    }
    $$('.seg[data-g]',sl).forEach(function(g){
      var k=g.getAttribute('data-g'); g.setAttribute('role','group');
      $$('.btn',g).forEach(function(b){ b.setAttribute('aria-pressed','false'); b.addEventListener('click',function(){
        ch[k]=b.getAttribute('data-v'); $$('.btn',g).forEach(function(x){x.setAttribute('aria-pressed',String(x===b));}); render();
      }); });
    });
    bChk.addEventListener('click',function(){
      var m=D.missions[mi], need=m.need, miss=[];
      ['dom','rel','acc'].forEach(function(k){ if(!ch[k]) miss.push({dom:'dominanta',rel:'relația dintre culori',acc:'accentul'}[k]); });
      if(miss.length){ fb.hidden=false; fb.innerHTML='Alege mai întâi: '+miss.join(', ')+'.'; return; }
      var bad=[];
      if(need.dom && ch.dom!==need.dom) bad.push('Atmosfera cere o dominantă <b>'+NAMES.dom[need.dom]+'</b>.');
      if(need.rel && ch.rel!==need.rel) bad.push(need.rel==='armonie'?'Culorile înrudite, adică <b>armonia</b>, dau calm; contrastul aduce tensiune.':'Ca să atragi privirea, ai nevoie de un <b>contrast de complementare</b>.');
      if(need.acc && ch.acc!==need.acc) bad.push(need.acc==='nimic'?'Un accent puternic ar rupe liniștea: lasă strada <b>fără accent</b>.':'Accentul trebuie pus pe <b>tramvai</b>.');
      var good=!bad.length; if(first[mi]===undefined){ first[mi]=good; if(good) ok++; }
      fb.hidden=false;
      fb.innerHTML=good?'<b>Da.</b> '+m.why:'<b>Încă nu.</b> '+bad.join(' ')+' Schimbă și verifică din nou.';
      if(good){ bChk.hidden=true; if(mi<D.missions.length-1){ bNext.hidden=false; bNext.focus(); } else finish(); }
    });
    function finish(){
      $('#labScore',sl).innerHTML='Corecte din prima: <b>'+ok+' din '+D.missions.length+'</b>';
      fb.innerHTML+=' <br><b>Ai terminat laboratorul.</b>';
      api.exDone('lab',ok/D.missions.length,first.map(function(x){return x?1:0;}).join(','),{type:'other',desc:'Laboratorul de culoare'});
    }
    bNext.addEventListener('click',function(){ mi++; load(); $('.seg .btn',sl).focus(); });
    load();
  };

  /* ---------- 4.3 culoarea se închide la uscare ---------- */
  R.wet=function(sl){
    var box=$('.wd-sw',sl), r=$('#wdR',sl), cols=['#2F5FA8','#C0392B','#E1A21A','#2E7D4F'];
    box.innerHTML=cols.map(function(){return '<i></i>';}).join('');
    var is=$$('i',box);
    function draw(){ var t=r.value/100; is.forEach(function(e,k){ e.style.background=hex(mix(mix(cols[k],'#FFFFFF',.32),cols[k],t)); }); r.setAttribute('aria-valuetext',t<.15?'umed':(t>.85?'uscat':'pe jumătate uscat')); }
    r.addEventListener('input',draw); draw();
    box.setAttribute('role','img'); box.setAttribute('aria-label','Patru pete de acrilic: umede sunt mai deschise, uscate devin mai închise.');
  };

  /* ---------- 4.6 ce tehnică e ---------- */
  R.tech=function(sl,cur,api){
    var D=EX('tech'), ol=$('#tech',sl), first=[], ans=[];
    D.items.forEach(function(it,i){
      var li=el('li','tq','<p class="q" id="tq'+i+'">'+(i+1)+'. '+it.q+'</p><div class="opts" role="group" aria-labelledby="tq'+i+'"></div><div class="mfb" aria-live="polite"></div>');
      var o=$('.opts',li), f=$('.mfb',li);
      D.opts.forEach(function(t,j){
        var b=el('button','opt',t); b.type='button'; b.setAttribute('aria-pressed','false');
        b.addEventListener('click',function(){
          if(first[i]===undefined) first[i]=j===it.ans;
          ans[i]=j;
          $$('.opt',o).forEach(function(x,k){ x.setAttribute('aria-pressed',String(k===j)); x.classList.toggle('good',k===it.ans); x.classList.toggle('bad',k===j&&k!==it.ans); });
          f.innerHTML='<b>'+(j===it.ans?'Corect.':'Nu: '+D.opts[it.ans]+'.')+'</b> '+it.fb;
          var n=first.filter(function(x){return x!==undefined;}).length;
          if(n===D.items.length){ var ok=first.filter(Boolean).length; $('#techScore',sl).innerHTML='Din prima: <b>'+ok+' din '+D.items.length+'</b>'; api.exDone('tech',ok/D.items.length,ans.join(','),{type:'other',desc:'Ce tehnică e?'}); }
        });
        o.appendChild(b);
      });
      ol.appendChild(li);
    });
  };

  /* ---------- 4.8 ordinea pașilor ---------- */
  R.seq=function(sl,cur,api){
    var D=EX('seq'), ol=$('#seq',sl), fb=$('#seqFb',sl), order=D.start.slice(), tries=0;
    function draw(focusIdx,dir){
      ol.innerHTML='';
      order.forEach(function(k,i){
        var li=el('li','',''); li.setAttribute('data-k',k);
        li.innerHTML='<span class="n">'+(i+1)+'</span><span class="tx">'+D.steps[k]+'</span><span class="mv"><button type="button" class="btn sm up" aria-label="Mută mai sus: '+D.steps[k]+'"'+(i===0?' disabled':'')+'>▲</button><button type="button" class="btn sm dn" aria-label="Mută mai jos: '+D.steps[k]+'"'+(i===order.length-1?' disabled':'')+'>▼</button></span>';
        $('.up',li).addEventListener('click',function(){ mv(i,-1); });
        $('.dn',li).addEventListener('click',function(){ mv(i,1); });
        ol.appendChild(li);
      });
      if(focusIdx!=null){ var li=ol.children[focusIdx], b=$(dir<0?'.up':'.dn',li); if(!b||b.disabled) b=$(dir<0?'.dn':'.up',li); if(b) b.focus(); }
    }
    function mv(i,d){ var j=i+d; if(j<0||j>=order.length) return; var t=order[i]; order[i]=order[j]; order[j]=t; fb.hidden=true; draw(j,d); }
    $('#seqChk',sl).addEventListener('click',function(){
      tries++; var ok=0;
      $$('li',ol).forEach(function(li,i){ var g=+li.getAttribute('data-k')===i; if(g) ok++; li.classList.toggle('good',g); li.classList.toggle('bad',!g); });
      fb.hidden=false;
      fb.innerHTML=ok===order.length?'<b>Perfect: toți pașii sunt la locul lor.</b> Încadrezi, listezi la dimensiunea pânzei, pui indigoul, fixezi imaginea, urmărești contururile, apoi pictezi.':'<b>'+ok+' din '+order.length+' pași</b> sunt la locul lor. Gândește-te: indigoul stă între pânză și imagine, deci îl pui înaintea imaginii.';
      if(ok===order.length || tries===1) api.exDone('seq',tries===1?ok/order.length:(api.S.ex.seq?api.S.ex.seq.s:0),order.join(','),{type:'other',desc:'Pașii transferului cu indigo'});
    });
    $('#seqRst',sl).addEventListener('click',function(){ order=D.start.slice(); fb.hidden=true; draw(0,1); });
    draw();
  };

  /* ---------- 8.0 părerea ta ---------- */
  R.feedback=function(sl,cur,api){
    var W=api.C.ws[8], S=api.S, host=$('#fbForm',sl);
    var h='<div class="ws">';
    W.items.forEach(function(it,k){
      var id='fb_'+it.k;
      if(it.type==='likert'){
        h+='<div class="it"><div class="lq" id="'+id+'_l">'+it.q+'</div><div class="likert" role="radiogroup" aria-labelledby="'+id+'_l">';
        for(var v=1;v<=5;v++) h+='<label><input type="radio" name="'+id+'" value="'+v+'" data-k="'+it.k+'"><span>'+v+'</span></label>';
        h+='</div><div class="rv">1 = deloc · 5 = foarte mult</div></div>';
      } else h+='<div class="it"><label for="'+id+'">'+it.q+'</label><textarea class="ta" id="'+id+'" data-k="'+it.k+'" rows="'+(it.rows||3)+'"></textarea></div>';
    });
    h+='<div class="wsbar"><button class="btn pri sm" type="button" id="fbSend">Trimite părerea</button><span class="fbok" id="fbOk" role="status"></span></div></div>';
    host.innerHTML=h;
    $$('[data-k]',host).forEach(function(e){
      var k=e.getAttribute('data-k');
      if(e.type==='radio'){ e.checked=String(S.ws[k])===e.value; e.addEventListener('change',function(){ S.ws[k]=+e.value; api.save(); }); }
      else { e.value=S.ws[k]||''; e.addEventListener('input',function(){ S.ws[k]=e.value; api.save(); }); }
    });
    $('#fbSend',host).addEventListener('click',function(){
      W.items.forEach(function(it){ var v=S.ws[it.k]; if(v!==undefined && v!=='') api.exDone('parere_'+it.k,null,v,{type:it.type==='likert'?'likert':'long-fill-in',desc:it.q}); });
      $('#fbOk',host).textContent='Mulțumim! Părerea ta a fost salvată.';
      api.save(true);
    });
  };

  /* ---------- 9.0 final ---------- */
  R.final=function(sl,cur,api){
    var left=api.C.modules.filter(function(m){ return modState(api,m.n)!=='parcurs'; });
    var p=el('p','small done-st',left.length?'Pentru finalizarea cursului îți mai rămân: '+left.map(function(m){return '<button class="lnk" data-go="'+m.n+'.0">modulul '+m.n+'</button>';}).join(', ')+'.':'Ai parcurs toate cele patru module. Cursul este finalizat.');
    var b=$('.fin-l .st-btns',sl); b.parentNode.insertBefore(p,b);
    $$('.lnk',p).forEach(function(x){ x.addEventListener('click',function(){ api.go(x.getAttribute('data-go')); }); });
  };

  window.EXR=R;
})();
