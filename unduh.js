/* unduh.js — unduhan keluaran RFP tanpa pustaka luar:
   peta depo & gardu (.shp dalam .zip, GeoJSON), satu berkas Excel banyak lembar, dan formulir kertas F1–F3.
   Memakai data yang sama dengan halaman (D, stats, KD, KQ, trGI) dan tabel survei dari survei.js (svData, svSkema). */
(function(){'use strict';
const enc=new TextEncoder(),esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const hari=()=>new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Jakarta'});
const simpan=(nama,blob)=>{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=nama;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),30000)};

/* ---------- ZIP (tanpa kompresi) ---------- */
const CT=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
const crc=b=>{let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=CT[(c^b[i])&255]^(c>>>8);return(c^0xFFFFFFFF)>>>0};
function zip(files,type){const parts=[],cd=[];let off=0;const d=new Date(),tm=(d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1),dt=((d.getFullYear()-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate();
 for(const f of files){const nm=enc.encode(f.name),b=typeof f.data==='string'?enc.encode(f.data):f.data,c=crc(b),h=new DataView(new ArrayBuffer(30)),e=new DataView(new ArrayBuffer(46));
  h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint16(10,tm,true);h.setUint16(12,dt,true);h.setUint32(14,c,true);h.setUint32(18,b.length,true);h.setUint32(22,b.length,true);h.setUint16(26,nm.length,true);
  e.setUint32(0,0x02014b50,true);e.setUint16(4,20,true);e.setUint16(6,20,true);e.setUint16(8,0x0800,true);e.setUint16(12,tm,true);e.setUint16(14,dt,true);e.setUint32(16,c,true);e.setUint32(20,b.length,true);e.setUint32(24,b.length,true);e.setUint16(28,nm.length,true);e.setUint32(42,off,true);
  parts.push(new Uint8Array(h.buffer),nm,b);cd.push(new Uint8Array(e.buffer),nm);off+=30+nm.length+b.length}
 const n=cd.reduce((a,x)=>a+x.length,0),z=new DataView(new ArrayBuffer(22));z.setUint32(0,0x06054b50,true);z.setUint16(8,files.length,true);z.setUint16(10,files.length,true);z.setUint32(12,n,true);z.setUint32(16,off,true);
 return new Blob(parts.concat(cd,[new Uint8Array(z.buffer)]),{type:type||'application/zip'})}

/* ---------- lapisan peta: [kunci ≤10 huruf, keterangan, jenis C|N, panjang, desimal, pengambil nilai] ---------- */
const r1=v=>v==null||v===''||isNaN(v)?null:Math.round(v*10)/10,r2=v=>v==null||v===''||isNaN(v)?null:Math.round(v*100)/100;
function lapisan(){const kd=k=>typeof KD!=='undefined'&&KD[k]?KD[k][1]:'',kq=k=>typeof KQ!=='undefined'&&KQ[k]?KQ[k][1]:'',P=D.DP;
 return[
 {nama:'depo',judul:'Depo dan pool truk',tipe:'titik',baris:P,xy:d=>[d.lon,d.lat],kol:[
  ['id','Kode depo','C',12,0,d=>d.id],['nama','Nama depo','C',90,0,d=>d.nama],['perusahaan','Perusahaan','C',70,0,d=>d.perusahaan],['lokasi','Kecamatan, kabupaten/kota','C',70,0,d=>d.lokasi],['provinsi','Provinsi','C',32,0,d=>d.provinsi],
  ['jenis','Jenis usaha/fasilitas','C',45,0,d=>d.tipe_fasilitas],['pola','Pola operasi','C',26,0,d=>d.pola_operasi_iesr],['komoditas','Bidang/komoditas','C',50,0,d=>d.komoditas_indikatif],
  ['gi_id','Kode gardu induk terdekat','C',14,0,d=>d.gi_id],['gi_nama','Gardu induk terdekat','C',45,0,d=>d.gi_n],['gi_km','Jarak garis lurus ke gardu induk (km)','N',9,2,d=>r2(d.gi_km)],['gi_kv','Tegangan gardu induk (kV)','C',12,0,d=>d.gi_v],
  ['gi_mva','Kapasitas trafo gardu induk (MVA)','N',9,1,d=>r1(d.gi_cap||d.gi_mva)],['gi_beban','Beban puncak gardu induk (%)','N',7,1,d=>r1(d.gi_ld)],['gi_siang','Beban puncak siang (%)','N',7,1,d=>r1(d.gi_ps)],['gi_malam','Beban puncak malam (%)','N',7,1,d=>r1(d.gi_pm)],
  ['gi_sisa80','Sisa kapasitas GI sampai batas 80% (MVA)','N',9,1,d=>r1(d.gi_s80)],['kuota','Kecukupan kuota GI untuk 50 truk listrik','C',26,0,d=>d.q?kd(d.q.k):''],['butuh_mva','Kebutuhan daya 50 truk listrik (MVA)','N',8,2,d=>d.q?r2(d.q.me):null],['kesiapan','Kesiapan sambungan (A/B/C; N = belum dinilai)','C',2,0,d=>d.siap],
  ['gd_nama','Gardu distribusi 20 kV terdekat','C',32,0,d=>d.gd_nama],['gd_m','Jarak ke gardu distribusi (m)','N',8,0,d=>d.gd_jarak_m],['gd_kva','Kapasitas gardu distribusi (kVA)','N',9,0,d=>d.gd_kva],['gd_beban','Beban gardu distribusi (%)','N',7,1,d=>r1(d.gd_beban_pct)],
  ['penyulang','Penyulang 20 kV','C',32,0,d=>d.penyulang],['gi_pemasok','Gardu induk pemasok penyulang','C',45,0,d=>d.gi_nama],['sumber','Sumber lokasi depo','C',24,0,d=>d.sumber]]},
 {nama:'gardu_induk',judul:'Gardu induk (tegangan tinggi)',tipe:'titik',baris:D.GI,xy:g=>[g.lon,g.lat],kol:[
  ['id','Kode gardu induk','C',14,0,g=>g.id],['nama','Nama gardu induk','C',50,0,g=>g.n],['kv','Tegangan (kV)','C',12,0,g=>g.v],['mva','Kapasitas trafo (MVA)','N',9,1,g=>r1(g.cap||g.mva)],['n_trafo','Jumlah trafo','N',4,0,g=>g.ntr||g.tr],
  ['provinsi','Provinsi','C',32,0,g=>g.pr],['sistem','Sistem kelistrikan','C',20,0,g=>g.sy],['beban','Beban puncak (%)','N',7,1,g=>r1(g.ld)],['siang','Beban puncak siang (%)','N',7,1,g=>r1(g.ps)],['malam','Beban puncak malam (%)','N',7,1,g=>r1(g.pm)],
  ['trafo_max','Beban trafo terpadat (%)','N',7,1,g=>r1(g.tmax)],['n_trafo80','Jumlah trafo berbeban 80% ke atas','N',4,0,g=>g.n80],['sisa80','Sisa kapasitas sampai batas 80% (MVA)','N',9,1,g=>g.q?r1(g.q.s):null],['kuota','Status kuota','C',28,0,g=>g.q?kq(g.q.k):''],['n_depo','Jumlah depo yang bertumpu','N',4,0,g=>g.q?g.q.n:null]]},
 {nama:'gardu_distribusi_terdekat',judul:'Gardu distribusi 20 kV terdekat tiap depo',tipe:'titik',baris:P.filter(d=>d.gd_nama&&d.gd_lat!=null),xy:d=>[d.gd_lon,d.gd_lat],kol:[
  ['gd_nama','Nama gardu distribusi','C',32,0,d=>d.gd_nama],['gd_kode','Kode gardu','C',20,0,d=>d.gd_kode],['kva','Kapasitas trafo (kVA)','N',9,0,d=>d.gd_kva],['beban','Beban (%)','N',7,1,d=>r1(d.gd_beban_pct)],['kategori','Kategori beban','C',24,0,d=>d.gd_kategori],
  ['penyulang','Penyulang 20 kV','C',32,0,d=>d.penyulang],['gi_pemasok','Gardu induk pemasok','C',45,0,d=>d.gi_nama],['depo_id','Kode depo yang dilayani','C',12,0,d=>d.id],['depo_m','Jarak ke depo (m)','N',8,0,d=>d.gd_jarak_m],['n_1km','Jumlah gardu dalam 1 km dari depo','N',5,0,d=>d.gd_n_1km],['sisa_1km','Sisa kapasitas gardu dalam 1 km (kVA)','N',9,0,d=>d.gd_sisa_kva_1km]]},
 {nama:'gardu_distribusi_sebaran',judul:'Sebaran gardu distribusi 20 kV (jumlah per sel ±2,8 km)',tipe:'titik',baris:D.GD,xy:g=>[g[0],g[1]],kol:[
  ['n_gardu','Jumlah gardu distribusi dalam sel','N',6,0,g=>g[2]],['kva','Kapasitas terpasang dalam sel (kVA)','N',10,0,g=>g[3]],['beban_med','Median beban gardu dalam sel (%)','N',7,1,g=>r1(g[4])],['n_80','Jumlah gardu berbeban 80% ke atas','N',5,0,g=>g[5]]]},
 {nama:'transmisi',judul:'Jaringan transmisi',tipe:'garis',baris:D.LN,xy:l=>l[1],kol:[['kv','Tegangan (kV)','N',5,0,l=>l[0]]]}]}

/* ---------- Shapefile ---------- */
const PRJ='GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]]';
function potong(s,n){let b=enc.encode(s);if(b.length<=n)return b;let k=n;while(k>0&&(b[k]&0xC0)===0x80)k--;return b.slice(0,k)}
function dbf(L){const n=L.baris.length,rl=1+L.kol.reduce((a,k)=>a+k[3],0),hl=32+32*L.kol.length+1,b=new Uint8Array(hl+n*rl+1),v=new DataView(b.buffer),d=new Date();
 b[0]=3;b[1]=d.getFullYear()-1900;b[2]=d.getMonth()+1;b[3]=d.getDate();v.setUint32(4,n,true);v.setUint16(8,hl,true);v.setUint16(10,rl,true);
 L.kol.forEach((k,i)=>{const o=32+32*i;b.set(enc.encode(k[0]).slice(0,10),o);b[o+11]=k[2].charCodeAt(0);b[o+16]=k[3];b[o+17]=k[4]});b[hl-1]=0x0D;
 let o=hl;for(const r of L.baris){b.fill(32,o,o+rl);let p=o+1;for(const k of L.kol){let x=k[5](r);if(k[2]==='N'){x=x==null||x===''||isNaN(x)?'':Number(x).toFixed(k[4]);const t=enc.encode(x.length>k[3]?x.slice(0,k[3]):x);b.set(t,p+k[3]-t.length)}else b.set(potong(x==null?'':String(x),k[3]),p);p+=k[3]}o+=rl}
 b[o]=0x1A;return b}
function shp(L){const n=L.baris.length,garis=L.tipe==='garis',G=L.baris.map(L.xy),isi=garis?G.map(g=>44+4+16*g.length):G.map(()=>20),tot=100+isi.reduce((a,x)=>a+8+x,0),s=new DataView(new ArrayBuffer(tot)),x=new DataView(new ArrayBuffer(100+8*n));
 let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;const bb=p=>{if(p[0]<x0)x0=p[0];if(p[0]>x1)x1=p[0];if(p[1]<y0)y0=p[1];if(p[1]>y1)y1=p[1]};G.forEach(g=>garis?g.forEach(bb):bb(g));if(!n)x0=y0=x1=y1=0;
 const kepala=(v,len)=>{v.setInt32(0,9994,false);v.setInt32(24,len/2,false);v.setInt32(28,1000,true);v.setInt32(32,garis?3:1,true);v.setFloat64(36,x0,true);v.setFloat64(44,y0,true);v.setFloat64(52,x1,true);v.setFloat64(60,y1,true)};kepala(s,tot);kepala(x,100+8*n);
 let o=100;G.forEach((g,i)=>{x.setInt32(100+8*i,o/2,false);x.setInt32(104+8*i,isi[i]/2,false);s.setInt32(o,i+1,false);s.setInt32(o+4,isi[i]/2,false);o+=8;
  if(garis){let a=Infinity,b=Infinity,c=-Infinity,d=-Infinity;g.forEach(p=>{if(p[0]<a)a=p[0];if(p[0]>c)c=p[0];if(p[1]<b)b=p[1];if(p[1]>d)d=p[1]});s.setInt32(o,3,true);s.setFloat64(o+4,a,true);s.setFloat64(o+12,b,true);s.setFloat64(o+20,c,true);s.setFloat64(o+28,d,true);s.setInt32(o+36,1,true);s.setInt32(o+40,g.length,true);s.setInt32(o+44,0,true);g.forEach((p,j)=>{s.setFloat64(o+48+16*j,p[0],true);s.setFloat64(o+56+16*j,p[1],true)})}
  else{s.setInt32(o,1,true);s.setFloat64(o+4,g[0],true);s.setFloat64(o+12,g[1],true)}o+=isi[i]});
 return{shp:new Uint8Array(s.buffer),shx:new Uint8Array(x.buffer)}}
const baca=L=>`${L.nama} — ${L.judul} (${L.baris.length} ${L.tipe})\n`+L.kol.map(k=>`  ${k[0].padEnd(11)} ${k[1]}`).join('\n');
const BACA=LS=>`Peta depo truk dan gardu — Survei Operasi HDV (IESR)\nDibuat ${hari()} dari dasbor Pantau HDV Depo–Gardu.\nSistem koordinat: WGS84 (EPSG:4326), derajat desimal. Jarak ke gardu adalah garis lurus.\nNilai kosong berarti datanya belum tersedia.\n\nLAPISAN DAN ATRIBUT\n\n`+LS.map(baca).join('\n\n')+'\n';
function unduhShp(){const LS=lapisan(),F=[];LS.forEach(L=>{const g=shp(L);F.push({name:L.nama+'.shp',data:g.shp},{name:L.nama+'.shx',data:g.shx},{name:L.nama+'.dbf',data:dbf(L)},{name:L.nama+'.prj',data:PRJ},{name:L.nama+'.cpg',data:'UTF-8'})});
 F.push({name:'BACA_SAYA.txt',data:BACA(LS)});const z=zip(F);simpan(`peta-depo-gardu-shp-${hari()}.zip`,z);return z}
const geojson=L=>JSON.stringify({type:'FeatureCollection',name:L.nama,crs:{type:'name',properties:{name:'urn:ogc:def:crs:OGC:1.3:CRS84'}},features:L.baris.map(r=>({type:'Feature',properties:Object.fromEntries(L.kol.map(k=>{const v=k[5](r);return[k[0],v===''||v===undefined||(typeof v==='number'&&isNaN(v))?null:v]})),geometry:L.tipe==='garis'?{type:'LineString',coordinates:L.xy(r)}:{type:'Point',coordinates:L.xy(r)}}))});
function unduhGeojson(){const LS=lapisan(),z=zip(LS.map(L=>({name:L.nama+'.geojson',data:geojson(L)})).concat([{name:'BACA_SAYA.txt',data:BACA(LS)}]));simpan(`peta-depo-gardu-geojson-${hari()}.zip`,z);return z}

/* ---------- Excel (.xlsx) ---------- */
const kolom=i=>{let s='';for(i++;i>0;i=Math.floor((i-1)/26))s=String.fromCharCode(65+(i-1)%26)+s;return s},xmlAman=s=>esc(String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g,''));
const angka=v=>typeof v==='number'?isFinite(v):typeof v==='string'&&v.length<15&&/^-?(0|[1-9]\d*)(\.\d+)?$/.test(v);
function lembar(rows){const lebar=[];const isi=rows.map((r,i)=>`<row r="${i+1}">`+r.map((v,j)=>{if(Array.isArray(v))v=v.join(' | ');if(v==null||v==='')return '';const t=String(v);if(i<200)lebar[j]=Math.max(lebar[j]||0,Math.min(60,t.length));const a=kolom(j)+(i+1);
  return i&&angka(v)?`<c r="${a}"><v>${typeof v==='number'?+v.toFixed(6):v}</v></c>`:`<c r="${a}" t="inlineStr"${i?'':' s="1"'}><is><t xml:space="preserve">${xmlAman(t)}</t></is></c>`}).join('')+'</row>').join('');
 const n=Math.max(1,...rows.map(r=>r.length)),cols=Array.from({length:n},(_,j)=>`<col min="${j+1}" max="${j+1}" width="${Math.max(8,(lebar[j]||8)+2)}" customWidth="1"/>`).join('');
 return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${cols}</cols><sheetData>${isi}</sheetData></worksheet>`}
function xlsx(sheets){const X='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',F=[
 {name:'[Content_Types].xml',data:X+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+sheets.map((s,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')+'</Types>'},
 {name:'_rels/.rels',data:X+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'},
 {name:'xl/workbook.xml',data:X+'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'+sheets.map((s,i)=>`<sheet name="${xmlAman(s[0].slice(0,31))}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')+'</sheets></workbook>'},
 {name:'xl/_rels/workbook.xml.rels',data:X+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+sheets.map((s,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')+`<Relationship Id="rId${sheets.length+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`},
 {name:'xl/styles.xml',data:X+'<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs></styleSheet>'}];
 sheets.forEach((s,i)=>F.push({name:`xl/worksheets/sheet${i+1}.xml`,data:lembar(s[1])}));return zip(F,'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
const tabelLapisan=L=>[L.kol.map(k=>k[1]).concat(L.tipe==='titik'?['Bujur (lon)','Lintang (lat)']:[])].concat(L.baris.map(r=>L.kol.map(k=>k[5](r)).concat(L.tipe==='titik'?L.xy(r):[])));
function statDepo(){const R=[['kelompok','nilai','variabel','n','min','Q1','median','rata-rata','Q3','P90','maks','simpangan baku']];if(typeof stats!=='function')return R;
 const V=[['Jarak ke gardu induk terdekat (km)',d=>d.gi_km],['Kapasitas gardu induk terdekat (MVA)',d=>d.gi_cap||d.gi_mva],['Beban puncak gardu induk (%)',d=>d.gi_ld],['Sisa kapasitas GI sampai batas 80% (MVA)',d=>d.gi_s80],['Jarak ke gardu distribusi terdekat (m)',d=>d.gd_jarak_m],['Kapasitas gardu distribusi terdekat (kVA)',d=>d.gd_kva],['Beban gardu distribusi terdekat (%)',d=>d.gd_beban_pct]];
 const add=(g,v,P)=>V.forEach(([l,f])=>{const s=stats(P.map(f));R.push(s?[g,v,l,s.n,s.min,s.q1,s.med,s.mean,s.q3,s.p90,s.max,s.sd]:[g,v,l,0])}),grup=(g,f)=>[...new Set(D.DP.map(f))].sort().forEach(k=>add(g,k,D.DP.filter(d=>f(d)===k)));
 add('Semua','',D.DP);grup('Pola operasi',d=>d.pola_operasi_iesr);grup('Provinsi',d=>d.provinsi);return R}
function trafoRows(){const R=[['Gardu induk','Kode gardu induk','Provinsi','Trafo','Kapasitas (MVA)','Puncak siang (%)','Puncak malam (%)','Beban puncak (%)']];if(typeof trGI!=='function')return R;
 Object.entries(trGI()).forEach(([k,a])=>{const g=k[0]==='~'?null:D.GI.find(x=>x.id===k);a.forEach(t=>R.push([g?g.n:k.slice(1),g?g.id:'',g?g.pr:'','Trafo '+t.no,t.cap,r1(t.ps),r1(t.pm),r1(t.pk)]))});return R}
function penyulangRows(){const R=[['Gardu induk','Kode gardu induk','Wilayah','UP3','Trafo','Penyulang','Jenis','Kemampuan hantar (A)','Beban siang (A)','Beban siang (%)','Beban malam (A)','Beban malam (%)','Beban puncak (%)']],ix={};(D.GL||[]).forEach(g=>ix[g[0]]=g[8]);
 (D.PY||[]).forEach(p=>{const g=ix[p[0]]?D.GI.find(x=>x.id===ix[p[0]]):null;R.push([g?g.n:p[0],g?g.id:'',g?(g.pr==='DKI Jakarta'||g.pr==='Banten'?g.pr:'Jawa Barat'):'Jawa Barat',p[1],p[2],p[3],p[4],p[5],p[6],p[7],p[8],p[9],Math.max(p[7]||0,p[9]||0)])});return R}
function gdaRows(){const R=[['Gardu induk','Kode gardu induk','Wilayah','Jumlah gardu distribusi','Gardu berdata beban','Kapasitas terpasang (kVA)','Berbeban ≥100%','Berbeban 80–100%','Berbeban 30–80%','Berbeban <30%','Rata-rata beban siang (%)','Rata-rata beban malam (%)','Gardu lebih padat malam']],ix={};(D.GL||[]).forEach(g=>ix[g[0]]=g[8]);
 Object.entries(D.GDA||{}).forEach(([k,a])=>{const g=ix[k]?D.GI.find(x=>x.id===ix[k]):null;R.push([g?g.n:k,g?g.id:'',g?(g.pr==='DKI Jakarta'||g.pr==='Banten'?g.pr:'Jawa Barat'):'Jawa Barat'].concat(a.slice(0,10)))});return R}
function unduhXlsx(){const sv=k=>{try{return window.svData(k).rows}catch(e){return[['Tabel survei tidak tersedia di halaman ini.']]}},L=lapisan(),ada=r=>r.length>1?r:r.concat([['Belum ada entri survei.']]);
 const S=[['Baca saya',[['Basis data Survei Operasi HDV dan pemetaan depo–gardu (IESR)'],['Dibuat '+hari()+' dari dasbor Pantau HDV Depo–Gardu. Seluruh angka survei berasal dari entri formulir F1–F3, bukan data simulasi.'],['Tanpa PIN admin, kolom identitas pool (perusahaan, nama, alamat, koordinat, narasumber) tidak ikut terunduh.'],[''],['Lembar','Isi'],['Diary harian','Satu baris per truk per hari (F3), termasuk jarak harian dan lama parkir yang dihitung'],['Perjalanan','Satu baris per perjalanan dalam diary'],['Truk','Daftar truk sampel (F2)'],['Pool','Profil pool (F1) dan gardu induk terdekatnya'],['Statistik survei','Statistik deskriptif diary: seluruh sampel, per kelas truk, per pola operasi, per pool'],['Depo','Lokasi depo, profil usaha, gardu induk dan gardu distribusi terdekat'],['Statistik depo','Statistik deskriptif jarak dan beban gardu: seluruh depo, per pola operasi, per provinsi'],['Gardu induk','Lokasi, kapasitas, dan beban gardu induk'],['Trafo GI','Kapasitas dan beban puncak siang dan malam tiap trafo gardu induk'],['Penyulang','Beban puncak siang dan malam tiap penyulang 20 kV'],['GD per GI','Ringkasan gardu distribusi 20 kV per gardu induk (jumlah, kapasitas, sebaran beban)'],['Gardu distribusi','Gardu distribusi 20 kV terdekat tiap depo'],['GD sebaran','Jumlah gardu distribusi per sel ±2,8 km'],['Kamus data','Arti tiap kolom formulir']]],
  ['Diary harian',ada(sv('f3'))],['Perjalanan',ada(sv('trip'))],['Truk',ada(sv('f2'))],['Pool',ada(sv('f1'))],['Statistik survei',ada(sv('stat'))],['Depo',tabelLapisan(L[0])],['Statistik depo',statDepo()],['Gardu induk',tabelLapisan(L[1])],['Trafo GI',trafoRows()],['Penyulang',penyulangRows()],['GD per GI',gdaRows()],['Gardu distribusi',tabelLapisan(L[2])],['GD sebaran',tabelLapisan(L[3])],['Kamus data',sv('kamus')]];
 const z=xlsx(S);simpan(`survei-hdv-depo-gardu-${hari()}.xlsx`,z);return z}

/* ---------- formulir kertas F1–F3 ---------- */
function formulirHTML(){const S=window.svSkema&&window.svSkema();if(!S)return '';const pil=x=>(x.o||[]).map(p=>`<span>☐ ${esc(p[1])}</span>`).join('');
 const isian=x=>`<div class="f${x.w||((x.o||[]).length>4)?' w':''}"><label>${esc(x.l)}</label>${x.t==='sel'||x.t==='multi'?`<div class="op">${pil(x)}</div>`:`<div class="ln">${x.t==='time'?'<i>____ . ____</i>':x.t==='date'?'<i>____ / ____ / 2026</i>':''}</div>`}</div>`;
 const kepala=(kode,judul,ket)=>`<header><div><b>${kode}</b><span>${judul}</span><small>${ket}</small></div><div class="hk">Survei Operasi HDV · IESR<br>Kode pool: ________ &nbsp; Enumerator: ______________</div></header>`;
 const f1=`<section class="hal">${kepala('F1','Profil pool','Satu lembar per pool. Diisi bersama pengelola pool.')}${S.F1.map(s=>`<h2>${esc(s[0])}</h2><div class="g">${s[1].map(isian).join('')}</div>`).join('')}</section>`;
 const truk=i=>`<div class="tb"><div class="tn">Truk ke-____ &nbsp; Kode truk: ________ – ______ <small>(kode pool – nomor urut 3 angka, pengganti nomor polisi)</small></div><div class="g g4">${S.F2.map(isian).join('')}</div></div>`;
 const f2=`<section class="hal">${kepala('F2','Daftar truk sampel','Satu kotak per truk: 50 truk utama + 5 cadangan per pool. Cetak lembar ini secukupnya.')}${truk(1)}${truk(2)}</section>`;
 const kode=(l,a)=>`<span><b>${l}:</b> ${a.map(p=>esc(p[1])).join(' &nbsp; ')}</span>`,T=S.F3T,baris=Array.from({length:10},(_,i)=>`<tr><td class="no">${i+1}</td>${T.map(()=>'<td></td>').join('')}</tr>`).join('');
 const f3=`<section class="hal lanskap">${kepala('F3','Diary harian truk','Satu lembar per truk per hari, 7 hari berturut-turut. Kode truk: ________ – ______ &nbsp; Hari ke: ☐1 ☐2 ☐3 ☐4 ☐5 ☐6 ☐7')}
  <div class="g g4">${S.F3H.map(isian).join('')}</div>
  <table><thead><tr><th class="no">No</th>${T.map(x=>`<th>${esc(x.l)}</th>`).join('')}</tr></thead><tbody>${baris}</tbody></table>
  <div class="kd">${T.filter(x=>x.o).map(x=>kode(x.l,x.o)).join('')}</div>
  <div class="g g4">${S.F3F.map(isian).join('')}</div>
  <h2>Hanya di hari ke-7 (penutup)</h2><div class="g g4">${S.F3C.map(isian).join('')}</div></section>`;
 return `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Formulir Survei Operasi HDV · F1–F3</title><style>
*{box-sizing:border-box}body{margin:0;font:10.5px/1.35 Arial,Helvetica,sans-serif;color:#000;background:#eceff2}
.bar{position:sticky;top:0;background:#13212e;color:#fff;padding:10px 14px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;font-size:13px}.bar button{font:inherit;font-weight:700;padding:8px 14px;border:0;border-radius:8px;background:#0e6f73;color:#fff;cursor:pointer}
.hal{background:#fff;width:210mm;min-height:297mm;margin:10px auto;padding:10mm;page:tegak;break-after:page}.hal.lanskap{width:297mm;min-height:210mm;page:lanskap}
header{display:flex;justify-content:space-between;gap:10px;border-bottom:2px solid #000;padding-bottom:5px;margin-bottom:6px}header b{font-size:20px;margin-right:8px}header span{font-size:15px;font-weight:700}header small{display:block;font-size:10px;margin-top:2px}.hk{text-align:right;font-size:10px;line-height:1.9;white-space:nowrap}
h2{font-size:11px;margin:8px 0 4px;padding:2px 6px;background:#e3e7eb;text-transform:uppercase;letter-spacing:.03em}
.g{display:grid;grid-template-columns:repeat(3,1fr);gap:5px 12px}.g4{grid-template-columns:repeat(4,1fr)}.f{break-inside:avoid}.f.w{grid-column:1/-1}.f label{display:block;font-weight:700;font-size:9.5px}
.ln{border-bottom:1px solid #000;height:17px}.ln i{font-style:normal;color:#555}.op{display:flex;flex-wrap:wrap;gap:1px 10px;font-size:9.5px;padding-top:1px}.op span{white-space:nowrap}
.tb{border:1px solid #000;padding:6px 8px;margin-bottom:7px;break-inside:avoid}.tn{font-weight:700;font-size:11px;margin-bottom:5px}.tn small{font-weight:400;font-size:9px}
table{width:100%;border-collapse:collapse;margin:7px 0 4px;table-layout:fixed}th,td{border:1px solid #000;padding:2px 3px;font-size:8.5px;vertical-align:top}th{background:#e3e7eb}td{height:25px}.no{width:22px;text-align:center}
.kd{display:flex;flex-wrap:wrap;gap:1px 14px;font-size:8.5px;margin-bottom:6px}
@page tegak{size:A4 portrait;margin:0}@page lanskap{size:A4 landscape;margin:0}
@media print{body{background:#fff}.bar{display:none}.hal{margin:0;box-shadow:none}}
</style></head><body><div class="bar"><button type="button" onclick="print()">🖨️ Cetak / simpan sebagai PDF</button><span>F1: 1 lembar per pool · F2: 2 truk per lembar (28 lembar untuk 55 truk) · F3: 7 lembar per truk (mendatar)</span></div>${f1}${f2}${f3}</body></html>`}
function cetak(){const h=formulirHTML();if(!h)return;const u=URL.createObjectURL(new Blob([h],{type:'text/html;charset=utf-8'})),w=window.open(u,'_blank');if(!w)simpan('formulir-survei-hdv-f1-f3.html',new Blob([h],{type:'text/html;charset=utf-8'}))}

window.unduh={shp:unduhShp,geojson:unduhGeojson,xlsx:unduhXlsx,cetak,formulirHTML,lapisan};
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-unduh]');if(!b||typeof D==='undefined'||!D)return;const f=window.unduh[b.dataset.unduh];if(f)try{f()}catch(err){console.error(err);alert('Unduhan gagal dibuat: '+err.message)}});
})();
