/* Generator .docx minimal, fără biblioteci: un fișier ZIP necomprimat cu XML-ul WordprocessingML.
   makeDocx({title, sub, meta:[[k,v]], blocks:[{h|q|a|p|note}], footer}) -> Blob */
(function(){
  'use strict';
  var CRC=(function(){var t=[],c,n,k;for(n=0;n<256;n++){c=n;for(k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
  function crc32(u8){var c=0xFFFFFFFF;for(var i=0;i<u8.length;i++)c=CRC[(c^u8[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0;}
  var enc=new TextEncoder();
  function zip(files){
    var parts=[],central=[],off=0;
    files.forEach(function(f){
      var name=enc.encode(f.name),data=typeof f.data==='string'?enc.encode(f.data):f.data,crc=crc32(data);
      var h=new DataView(new ArrayBuffer(30));
      h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint16(8,0,true);
      h.setUint16(10,0,true);h.setUint16(12,0x21,true);h.setUint32(14,crc,true);h.setUint32(18,data.length,true);
      h.setUint32(22,data.length,true);h.setUint16(26,name.length,true);h.setUint16(28,0,true);
      parts.push(new Uint8Array(h.buffer),name,data);
      var c=new DataView(new ArrayBuffer(46));
      c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);c.setUint16(10,0,true);
      c.setUint16(12,0,true);c.setUint16(14,0x21,true);c.setUint32(16,crc,true);c.setUint32(20,data.length,true);c.setUint32(24,data.length,true);
      c.setUint16(28,name.length,true);c.setUint16(30,0,true);c.setUint16(32,0,true);c.setUint16(34,0,true);c.setUint16(36,0,true);
      c.setUint32(38,0,true);c.setUint32(42,off,true);
      central.push(new Uint8Array(c.buffer),name);
      off+=30+name.length+data.length;
    });
    var csize=central.reduce(function(a,b){return a+b.length;},0);
    var e=new DataView(new ArrayBuffer(22));
    e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);
    e.setUint32(12,csize,true);e.setUint32(16,off,true);
    return new Blob(parts.concat(central,[new Uint8Array(e.buffer)]),{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
  }
  function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  function run(t,o){o=o||{};var rp='<w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>'+(o.b?'<w:b/>':'')+(o.i?'<w:i/>':'')+(o.color?'<w:color w:val="'+o.color+'"/>':'')+'<w:sz w:val="'+(o.sz||22)+'"/></w:rPr>';
    return String(t).split('\n').map(function(line,k){return (k?'<w:r>'+rp+'<w:br/></w:r>':'')+'<w:r>'+rp+'<w:t xml:space="preserve">'+esc(line)+'</w:t></w:r>';}).join('');}
  function para(t,o){o=o||{};var pp='<w:pPr><w:spacing w:before="'+(o.before||0)+'" w:after="'+(o.after==null?120:o.after)+'"/>'+(o.shade?'<w:shd w:val="clear" w:color="auto" w:fill="'+o.shade+'"/>':'')+(o.border?'<w:pBdr><w:left w:val="single" w:sz="18" w:space="8" w:color="0F1014"/></w:pBdr><w:ind w:left="200"/>':'')+'</w:pPr>';return '<w:p>'+pp+run(t,o)+'</w:p>';}
  function makeDocx(d){
    var body=[];
    body.push(para(d.sig||'',{sz:18,color:'44474F',after:200}));
    body.push(para(d.title,{sz:40,after:80}));
    if(d.sub) body.push(para(d.sub,{sz:24,color:'44474F',after:240}));
    (d.meta||[]).forEach(function(m){body.push('<w:p><w:pPr><w:spacing w:after="60"/></w:pPr>'+run(m[0]+': ',{b:true})+run(m[1]||'…………………………')+'</w:p>');});
    body.push(para('',{after:120}));
    (d.blocks||[]).forEach(function(b){
      if(b.h) body.push(para(b.h,{sz:30,before:240,after:120}));
      if(b.q) body.push(para(b.q,{b:true,before:160,after:80}));
      if(b.a!==undefined) body.push(para(b.a||'(fără răspuns)',{border:true,color:b.a?'0F1014':'5A5D66',i:!b.a,after:120}));
      if(b.p) body.push(para(b.p,{}));
      if(b.note) body.push(para(b.note,{sz:18,color:'44474F'}));
    });
    var footer='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'+para(d.footer||'',{sz:16,color:'44474F',after:0})+'</w:ftr>';
    var doc='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>'+body.join('')+
      '<w:sectPr><w:footerReference w:type="default" r:id="rIdF"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body></w:document>';
    var files=[
      {name:'[Content_Types].xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>'},
      {name:'_rels/.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>'},
      {name:'word/_rels/document.xml.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdF" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/></Relationships>'},
      {name:'word/document.xml',data:doc},
      {name:'word/footer1.xml',data:footer},
      {name:'docProps/core.xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>'+esc(d.title)+'</dc:title><dc:creator>LEETUCATION SRL</dc:creator></cp:coreProperties>'}
    ];
    return zip(files);
  }
  window.makeDocx=makeDocx;
})();
