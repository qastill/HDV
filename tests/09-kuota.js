// warna kuota di peta: pool (bulat) dan gardu induk (kotak)
const {chromium}=require('playwright');const auto=require('./auto.js');let n=0,f=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);c?n++:f++};const U=(process.env.URL||'http://localhost:8765/')+'pantau_hdv_depo_gardu.html';
(async()=>{const b=await chromium.launch();for(const [name,vw,vh] of [['laptop',1440,900],['ponsel',390,844]]){const c=await b.newContext({viewport:{width:vw,height:vh},deviceScaleFactor:1});const p=await c.newPage();auto(p);const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto(U);await p.waitForTimeout(1500);await p.evaluate(()=>{goView('peta','peta');smode='daftar';side(null)});await p.waitForTimeout(1500);const tx=s=>p.locator(s).first().evaluate(e=>e.textContent);
 ok(await p.inputValue('#cby')==='kuota'&&!await p.locator('#cby option[value="beban"]').count(),name+': warna bawaan = kecukupan kuota gardu induk');
 const lg=await p.evaluate(()=>({d:[...document.querySelectorAll('#lg .lgi em')].map(e=>+e.textContent),g:[...document.querySelectorAll('#lgg .lgi em')].map(e=>+e.textContent),ng:D.GI.length}));
 const NDP=await p.evaluate(()=>D.DP.length);ok(lg.d.length>=3&&lg.d.every(v=>v>0)&&lg.d.reduce((a,b)=>a+b)===NDP,name+': legenda pool tanpa kelas kosong, total '+NDP+' → '+lg.d.join('/'));
 ok(lg.g.length>=3&&lg.g.every(v=>v>0)&&lg.g.reduce((a,b)=>a+b)===lg.ng,name+': legenda gardu induk tanpa kelas kosong, total '+lg.ng+' → '+lg.g.join('/'));ok(await p.evaluate(()=>D.DP.every(d=>(d.q.k==='n')===(d.gi_ld==null))&&D.GI.every(g=>(g.q.k==='n')===(g.ld==null||!g.cap))&&D.DP.filter(d=>d.q.k!=='n').every(d=>d.gi_s80!=null)),name+': kelas “data beban menyusul” hanya untuk depo dan GI yang memang belum ada data bebannya');
 const col=await p.evaluate(()=>({dp:D.DP.every(d=>d._m.options.fillColor===KD[d.q.k][0]),gi:D.GI.every(g=>g._m.options.fillColor===KQ[g.q.k][0]&&g._m instanceof GIM&&g._m.options.ld===g.ld)}));
 ok(col.dp&&col.gi,name+': warna penanda pool dan GI mengikuti status kuota');
 const lo=await p.evaluate(()=>{const ix={};D.GI.forEach(g=>ix[g.id]=g);let a=0,c=0,x=0;D.DP.forEach(d=>{const g=ix[d.gi_id];if(!g)return;if(g.q.k==='a'&&d.q.k!=='a')x++;if(g.ld!=null&&g.ld>=80){c++;if(d.q.k!=='c')x++}if(g.ld==null&&d.q.k!=='n')x++;if(g.q.k==='a')a++});return{a,c,x,
  r:D.DP.filter(d=>d.q.k!=='n').every(d=>{const s=d.gi_cap*Math.max(0,.8-d.gi_ld/100),me=calc(50,kmOf(d),8).mva;return Math.abs(s-d.q.s)<1e-6&&Math.abs(me-d.q.me)<1e-6&&d.q.k===(me>s?'c':d.q.t>s||me>.5*s?'b':'a')})}});
 ok(lo.x===0&&lo.r,name+`: logika taat asas (GI hijau → pool hijau [${lo.a}], GI ≥80% → pool merah [${lo.c}], tanpa data → abu)`);
 // legenda GI menyaring
 if(vw<600)await p.evaluate(()=>{document.getElementById('layers').open=true});
 const nc=await p.evaluate(()=>D.GI.filter(g=>g.q.k==='c').length);await p.locator('#lgg .lgi[data-g="c"]').click();await p.waitForTimeout(300);
 ok(await p.evaluate(()=>D.GI.filter(g=>g._m.options.fillOpacity>.5).length)===nc&&nc>0,name+': klik legenda GI "hampir penuh" → hanya '+nc+' GI yang menyala');
 await p.locator('#lgg .lgi[data-g=""]').click();await p.waitForTimeout(200);ok(await p.evaluate(()=>D.GI.every(g=>g._m.options.fillOpacity>.5)),name+': "Tampilkan semua" mengembalikan GI');
 // legenda pool menyaring peta + daftar
 const nb=await p.evaluate(()=>D.DP.filter(d=>d.q.k==='a').length);await p.locator('#lg .lgi[data-k="a"]').click();await p.waitForTimeout(300);
 ok(await p.locator('#s-list .dli').count()===nb&&await p.locator('#s-flt .fch.on').getAttribute('data-f')==='a',name+': klik legenda pool → daftar depo ikut tersaring ('+nb+')');
 await p.locator('#s-flt [data-f=""]').click();await p.waitForTimeout(250);ok(await p.locator('#s-list .dli').count()===NDP&&await p.evaluate(()=>D.DP.every(d=>d._m.options.fillOpacity===1))&&!await p.locator('#lg .lgi.on').count(),name+': chip "Semua" mengembalikan peta dan legenda');
 await p.selectOption('#cby','pola');await p.waitForTimeout(250);ok(/pola operasi/.test(await tx('#side .sub'))&&await p.locator('#s-flt .fch').count()===4,name+': ganti mode warna → daftar depo mengikuti');await p.selectOption('#cby','kuota');await p.waitForTimeout(200);
 // popup & tooltip
 const document_text=await p.evaluate(()=>document.getElementById('layers').textContent+document.getElementById('side').textContent+document.getElementById('vi').textContent);const pd=await p.evaluate(()=>{const a=D.DP.find(d=>d.q.k==='b')||D.DP.find(d=>d.q.k==='a'),g=D.GI.find(x=>x.q.k==='c'&&x.q.n)||D.GI.find(x=>x.q.k==='c');return{a:dpPop(a),g:giPop(g),gt:giTip(g),dt:dpTip(a)}});
 ok(/class="qb"/.test(pd.a)&&/sisa kuota GI/.test(pd.a)&&/GI terdekat/.test(pd.a)&&/Google Maps/.test(pd.a),name+': popup pool berdata: batang kuota + kebutuhan vs sisa');
 ok(/Hampir penuh/.test(pd.g)&&/class="qb"/.test(pd.g)&&/batas 80%/.test(pd.g),name+': popup GI: status + batang kuota');
 ok(/beban \d+% · sisa \d+ MVA/.test(pd.gt)&&/butuh [\d,]+ MVA · sisa kuota GI/.test(pd.dt),name+': tooltip GI dan pool memuat beban/kuota');ok(!/2022|Jawa Barat|Jabar|ndikatif|divalidasi|cakupan|anpa data|belum ada data/.test(pd.a+pd.g+document_text),name+': tanpa nama wilayah, tahun data, cakupan, atau “indikatif”');
 await p.evaluate(()=>pick(D.DP.find(d=>d.q.k==='b')||D.DP.find(d=>d.q.k==='a'),false));await p.waitForTimeout(300);ok(await p.locator('#side .qb').count()===1&&/dari sisa kuota/.test(await tx('#side')),name+': kartu depo memuat batang kuota');await p.locator('#side [data-back]').click();
 // bentuk kotak terisi: piksel atas putih, bawah berwarna
 const px=await p.evaluate(async()=>{const g=D.GI.filter(x=>x.ld!=null&&x.ld>30&&x.ld<45&&!NGI[x.id]).sort((a,b)=>a.ld-b.ld)[0];map.removeLayer(LY.ln);map.removeLayer(LY.dp);map.removeLayer(LY.gd);map.closePopup();map.setView([g.lat,g.lon],15,{animate:false});await new Promise(r=>setTimeout(r,700));
  const cv=document.querySelector('#map canvas'),r=cv.getBoundingClientRect(),mr=document.getElementById('map').getBoundingClientRect(),pt=map.latLngToContainerPoint([g.lat,g.lon]),k=cv.width/r.width,h=Math.max(2,Math.round(g._m._radius*.9));
  const at=(dx,dy)=>[...cv.getContext('2d').getImageData(Math.round((pt.x+mr.left-r.left+dx)*k),Math.round((pt.y+mr.top-r.top+dy)*k),1,1).data];return{top:at(0,-h+3),bot:at(0,h-2),out:at(h+6,0),ld:g.ld,h}});
 ok(px.top[0]>240&&px.top[1]>240&&px.top[2]>240&&px.bot[1]>px.bot[0]+40&&px.out[3]===0,name+`: GI digambar kotak terisi sesuai beban (${px.ld}%: atas putih ${px.top.slice(0,3)}, bawah hijau ${px.bot.slice(0,3)})`);
 await p.evaluate(()=>{map.addLayer(LY.dp);goView('mon','daftar')});await p.waitForTimeout(400);
 const tb=await p.evaluate(()=>({h:[...document.querySelectorAll('#tb thead th')].map(x=>x.textContent.trim()),pills:document.querySelectorAll('#tb tbody td:nth-child(3) .pill').length}));ok(tb.h[2]==='Kuota GI'&&tb.h[3]==='Siap'&&tb.pills===NDP,name+': tabel daftar depo punya kolom Kuota GI di depan');
 await p.locator('#tb thead th[data-k="qo"]').click();await p.waitForTimeout(200);ok((await p.locator('#tb tbody tr').first().locator('td:nth-child(3)').innerText()).trim()==='Kurang',name+': urut kolom kuota → yang kurang di atas');
 await p.evaluate(()=>{pick(D.DP.find(d=>d.q.k==='c'),false);goView('rek')});await p.waitForTimeout(400);ok(/Kuota GI tidak cukup/.test(await tx('#r-dep .dh'))&&/Kuota GI tidak cukup/.test(await tx('#g-dep .dh')),name+': kepala depo terpilih di Grid dan Rekomendasi memuat status kuota');
 const nav=await p.evaluate(()=>{const B=[...document.querySelectorAll('#tng [data-g]')];return{n:B.length,in:B.every(b=>{const r=b.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1}),cut:B.some(b=>{const s=b.querySelector('span');return s&&s.offsetWidth&&s.scrollWidth>s.clientWidth+1})}});ok(nav.n===4&&nav.in&&!nav.cut,name+': keempat tombol bilah atas (Dasbor, Survei, Hasil survei, Jaringan) terlihat utuh tanpa gulir');
 ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+': tanpa gulir mendatar');ok(!errs.length,name+': tanpa galat JS '+errs.join(' | '));await c.close()}
 console.log(`\n${n} lolos, ${f} gagal`);await b.close();process.exit(f?1:0)})();
