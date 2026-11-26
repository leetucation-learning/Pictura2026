/* SCORM 2004 (3rd Edition) – legătura cu LMS-ul. Fără LMS, cursul merge la fel (stare în localStorage). */
(function(){
  'use strict';
  function findAPI(win){
    var n=0;
    try{
      while(win && !win.API_1484_11 && win.parent && win.parent!==win && n<10){n++;win=win.parent;}
      if(win && win.API_1484_11) return win.API_1484_11;
    }catch(e){}
    return null;
  }
  var api=null;
  try{ api=findAPI(window) || (window.opener ? findAPI(window.opener) : null); }catch(e){ api=null; }
  var LMS={
    api:api, active:false, ok:true, errors:[],
    init:function(){
      if(!this.api) return false;
      try{ var r=this.api.Initialize(''); this.active=(r===true||r==='true'); }catch(e){ this.active=false; }
      return this.active;
    },
    get:function(k){
      if(!this.active) return '';
      try{ var v=this.api.GetValue(k); this.chk(k); return v==null?'':String(v); }catch(e){ return ''; }
    },
    set:function(k,v){
      if(!this.active) return false;
      try{ var r=this.api.SetValue(k,String(v)); this.chk(k); return r===true||r==='true'; }catch(e){ return false; }
    },
    chk:function(k){
      try{ var c=parseInt(this.api.GetLastError(),10); if(c && c!==0 && c!==403){ this.errors.push(k+': '+c+' '+this.api.GetErrorString(String(c))); } }catch(e){}
    },
    commit:function(){ if(!this.active) return; try{ this.api.Commit(''); }catch(e){} },
    finish:function(){
      if(!this.active) return;
      try{ this.api.Terminate(''); }catch(e){}
      this.active=false;
    }
  };
  window.LMS=LMS;
})();
