// beban harian trafo GI (data PLN Distribusi Jakarta): data tertanam, panel Beban GI, popup GI, detail depo, insight
const {chromium}=require('playwright');const auto=require('./auto.js');let n=0,f=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);c?n++:f++};const U=(process.env.URL||'http://localhost:8765/');
(async()=>{const b=await chromium.launch();for(const [name,vw,vh] of [['laptop',1366,800],['ponsel',390,844]]){const c=await b.newContext({viewport:{width:vw,height:vh}});const p=await c.newPage();auto(p);const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto(U);await p.waitForTimeout(3000);const tx=s=>p.locator(s).first().evaluate(e=>e.innerText);
 // data
 let a=await p.evaluate(()=>{const G=D.GI.filter(g=>g.hs),dk=D.DP.filter(d=>d.provinsi==='DKI Jakarta');return{td:D.TD.length,hari:D.HD.hari,bulan:D.HD.bulan,g:G.length,len:G.every(g=>g.hs.length===D.HD.hari&&g.hm.length===D.HD.hari),dk:dk.length,dkd:dk.filter(d=>d.gi_ld!=null&&d.q.k!=='n').length,baru:D.GI.filter(g=>g.id.startsWith('GI-DKI')).map(g=>g.n).join(','),pct:D.TD.every(t=>t[5].concat(t[6]).every(v=>v==null||(v>0&&v<200))),gand:(g=>g&&g.ntr)(D.GI.find(g=>g.n==='Gandaria'&&g.hs))}});
 ok(a.td===220&&a.hari===23&&a.bulan==='November 2026'&&a.g===76&&a.len&&a.pct,name+`: data harian tertanam: ${a.td} trafo, ${a.g} GI, ${a.hari} hari ${a.bulan}, persen beban wajar`);
 ok(a.dk===36&&a.dkd===36,name+': seluruh 36 depo DKI sekarang punya beban GI dan kelas kuota');
 ok(a.baru==='Cawang Baru,Jgc,Karet Baru,Ketapang,Mampang Lama,Sunter'&&a.gand===5,name+': 6 GI baru masuk peta; GI perbatasan menggabungkan trafo dari kedua sumber (Gandaria 5 trafo)');
 // panel Beban GI
 await p.evaluate(()=>goView('mon','beban'));await p.waitForTimeout(900);
 a=await p.evaluate(()=>({vis:!document.getElementById('hd-c').hidden,k:document.querySelectorAll('#hd-k .tile').length,kt:document.getElementById('hd-k').innerText,sel:document.getElementById('hd-gi').value,opt:document.querySelectorAll('#hd-gi option').length,ch:document.querySelectorAll('#hd-ch svg path').length,rows:document.querySelectorAll('#hd-hm tbody tr').length,txt:document.getElementById('hd-c').innerText}));
 ok(a.vis&&a.k===5&&/76/.test(a.kt)&&/220/.test(a.kt)&&a.opt===76&&a.ch===2&&!/NaN|undefined|Infinity/.test(a.txt),name+': kartu beban harian: 5 angka ringkas, pilihan 76 GI, grafik siang & malam');
 ok(await p.evaluate(()=>giOf(document.getElementById('hd-gi').value).n==='Kandang Sapi'),name+': bawaan: GI tumpuan depo terbanyak (Kandang Sapi)');
 ok(a.rows>0&&a.rows===await p.evaluate(()=>D.TD.filter(t=>t[0]&&D.DP.some(d=>d.gi_id===t[0])).length),name+`: peta panas bawaan = trafo GI tumpuan depo (${a.rows} baris)`);
 await p.locator('#hd-f').selectOption('top');await p.waitForTimeout(200);let r=await p.evaluate(()=>[...document.querySelectorAll('#hd-hm tbody tr')].map(t=>parseInt(t.querySelector('td.r').textContent)));
 ok(r.length===30&&r.every((v,i)=>!i||v<=r[i-1]),name+`: “30 trafo terpadat” diurutkan dari puncak tertinggi (${r[0]}%)`);
 await p.locator('#hd-f').selectOption('all');await p.waitForTimeout(200);ok(await p.locator('#hd-hm tbody tr').count()===220,name+': “Semua trafo” = 220 baris');
 const c0=await p.evaluate(()=>document.querySelector('#hd-hm tbody td.c').getAttribute('style'));await p.locator('#hd-m [data-m="ma"]').click();await p.waitForTimeout(150);
 ok(await p.evaluate(()=>document.querySelector('#hd-m .on').dataset.m==='ma')&&typeof c0==='string',name+': mode Siang/Malam/Puncak bisa diganti');
 await p.locator('#hd-f').selectOption('top');await p.waitForTimeout(150);const g1=await p.locator('#hd-hm tbody tr[data-g]').first().getAttribute('data-g');await p.locator('#hd-hm tbody tr[data-g] td.l').first().click();await p.waitForTimeout(300);
 ok(await p.evaluate(g=>document.getElementById('hd-gi').value===g&&document.getElementById('hd-st').innerText.includes(giOf(g).n),g1),name+': klik baris peta panas → grafik pindah ke GI trafo itu');
 a=await tx('#hd-st');ok(/Sisa kuota malam/.test(a)&&/Hari GI ≥80%/.test(a),name+': ringkasan GI memuat hari ≥80% dan sisa kuota malam');
 // insight
 await p.evaluate(()=>goView('mon','insight'));await p.waitForTimeout(300);a=await tx('#i-ins');ok(/GI lebih padat saat malam/.test(a)&&/Hari padat dalam sebulan/.test(a)&&!/di antaranya/.test(a.split('Beban malam')[1]||''),name+': dua insight baru dari beban harian');
 // popup GI dan detail depo
 await p.evaluate(()=>{goView('peta','peta');const g=D.GI.find(x=>x.n==='Plumpang'&&x.hs);map.setView([g.lat,g.lon],13,{animate:false});g._m.openPopup()});await p.waitForTimeout(800);
 ok(await p.evaluate(()=>{const e=document.querySelector('.leaflet-popup-content');return!!e&&!!e.querySelector('.spk svg')&&/Beban harian November 2026/.test(e.innerText)}),name+': popup GI memuat grafik beban harian');
 await p.evaluate(()=>{map.closePopup();pick(D.DP.find(d=>d.gi_n==='Kandang Sapi'),false);goView('mon')});await p.waitForTimeout(500);
 a=await tx('#g-dep');ok(/Beban harian GI Kandang Sapi/i.test(a)&&await p.locator('#g-dep .hchart').count()===1&&/Sisa kuota malam \d+ MVA/.test(a),name+': detail depo DKI memuat grafik beban harian GI terdekat');
 await p.evaluate(()=>goView('peta','peta'));await p.waitForTimeout(200);ok(/Sisa saat malam/.test(await tx('#side')),name+': kartu depo memuat sisa kuota GI saat malam');
 ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+': tanpa gulir mendatar');ok(!errs.length,name+': tanpa galat JS '+errs.join(' | '));await c.close()}
 console.log(`\n${n} lolos, ${f} gagal`);await b.close();process.exit(f?1:0)})();
