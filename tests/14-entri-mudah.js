// Entri data yang mudah: F3 terbuka sejak awal, pool bisa dicari/dipilih dari depo/dibuat baru, truk baru langsung terdaftar
const {chromium}=require('playwright');const auto=require('./auto.js');const fs=require('fs'),path=require('path');let n=0,f=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);c?n++:f++};
const U=(process.env.URL||'http://localhost:8765/'),PIN=process.env.PIN||'uji-1234',LOKAL=!process.env.URL,NP=/^N[2-9A-HJ-NP-Z]{4}$/;
(async()=>{const b=await chromium.launch();for(const [name,vw,vh] of [['laptop',1366,800],['ponsel',390,844]]){const c=await b.newContext({viewport:{width:vw,height:vh}});await c.addInitScript(()=>{window.SV_TUNDA=600000});const p=await c.newPage();auto(p);const errs=[];p.on('pageerror',e=>errs.push(e.message));let dlg=0;p.on('dialog',d=>{dlg++;d.dismiss()});
 await p.goto(U);await p.waitForTimeout(3000);await p.evaluate(()=>goView('hasil','entri'));await p.waitForTimeout(400);const tx=s=>p.locator(s).first().evaluate(e=>e.innerText);const st=()=>p.evaluate(()=>surveiDebug.state().L);
 // 1. F3 langsung terbuka dan bisa diisi
 let a=await p.evaluate(()=>({tab:document.querySelector('#en .tab.on').dataset.tab,tabs:[...document.querySelectorAll('#en .tab')].map(t=>t.dataset.tab).join(','),rows:document.querySelectorAll('#f3-rows .tr').length,inp:document.querySelectorAll('#f3f input:not([type=hidden]),#f3f select').length,truk:document.getElementById('f3-t').value,kls:!!document.querySelector('.seg[data-seg=kelas_baru]'),txt:document.querySelector('.pane[data-pane=entri]').innerText}));
 ok(a.tab==='f3'&&a.tabs.startsWith('f3,')&&a.rows>=2&&a.inp>20&&a.truk==='+'&&a.kls,name+`: Entri data langsung membuka F3 dengan ${a.inp} kolom isian; truk baru bisa langsung diisi`);
 ok(!/Formulir F1–F3 v1\.1|Tanpa PIN, bagian ini hanya bisa dibaca|Penyimpanan server belum diaktifkan\. Entri|Klik kotak untuk mengisi atau memperbaiki\. Hijau/.test(a.txt),name+': kalimat penjelasan panjang sudah dihapus');
 // 2. pemilih pool: 10 pool rencana + semua depo + pool baru
 await p.click('#en-pool');await p.waitForTimeout(200);a=await p.evaluate(()=>({pool:document.querySelectorAll('#en-pl [data-pool]').length,depo:document.querySelectorAll('#en-pl [data-depo]').length,nd:D.DP.length,fokus:document.activeElement.id}));
 ok(a.pool>=10&&a.depo===a.nd&&a.fokus==='en-pq',name+`: daftar pool memuat ${a.pool} pool survei dan ${a.depo} depo, kolom cari langsung aktif`);
 await p.fill('#en-pq','gunung putri');await p.waitForTimeout(150);a=await p.evaluate(()=>[...document.querySelectorAll('#en-pl .pko')].map(o=>o.innerText.replace(/\n/g,' ')));
 ok(a.some(t=>/Multi Prima Usahatama/.test(t))&&a.some(t=>/Pool baru: “gunung putri”/.test(t)),name+': cari “gunung putri” → depo yang cocok dan pilihan pool baru');
 await p.locator('#en-pl [data-depo="DEPO-016"]').click();await p.waitForTimeout(400);let L=await st();let f1=L.dirty['f1:'+L.pool];
 ok(NP.test(L.pool)&&f1&&f1.data.depo_id==='DEPO-016'&&f1.data.draf===1&&/Multi Prima/.test(await tx('#en-pool')),name+`: memilih depo membuat pool ${L.pool} yang tersambung ke DEPO-016`);
 await p.click('#en-pool');await p.fill('#en-pq','Pool Uji Cikande Baru');await p.keyboard.press('ArrowDown');await p.keyboard.press('Enter');await p.waitForTimeout(400);L=await st();const P2=L.pool;f1=L.dirty['f1:'+P2];
 ok(NP.test(P2)&&f1&&f1.data.nama_pool==='Pool Uji Cikande Baru'&&/Pool Uji Cikande Baru/.test(await tx('#en-pool'))&&/dibuat/.test(await tx('#en-msg')),name+`: mengetik nama yang belum terdata membuat pool baru ${P2}`);
 await p.click('#en-pool');await p.fill('#en-pq','cikande');await p.waitForTimeout(150);ok(await p.evaluate(id=>{const o=document.querySelector('#en-pl .pko');return o&&o.dataset.pool===id&&o.classList.contains('act')},P2),name+': pool baru langsung muncul di daftar, paling atas saat dicari');await p.keyboard.press('Escape');await p.waitForTimeout(150);
 ok(await p.evaluate(()=>document.getElementById('en-pd').hidden),name+': Esc menutup daftar pool');
 // 3. F3: truk baru, jam ringkas, “Dari” otomatis, baris bertambah sendiri
 await p.fill('#e-odo_awal','50000');await p.fill('#e-mulai','600');await p.fill('#e-t0-b','0630');await p.fill('#e-t0-ke','Tanjung Priok');await p.fill('#e-t0-t','815');await p.fill('#e-t0-odo','50040');await p.fill('#e-t0-lama','75');await p.locator('#e-t0-keg').selectOption('1');await p.locator('#e-t0-b').focus();await p.locator('#e-t0-t').focus();await p.locator('#e-mulai').focus();await p.waitForTimeout(100);
 a=await p.evaluate(()=>({b:document.getElementById('e-t0-b').value,t:document.getElementById('e-t0-t').value,m:document.getElementById('e-mulai').value,dari:document.getElementById('e-t1-dari').value,rows:document.querySelectorAll('#f3-rows .tr').length,chk:document.getElementById('f3-chk').innerText}));
 ok(a.b==='06.30'&&a.t==='08.15'&&a.m==='06.00',name+`: jam bisa diketik 0630/815/600 → ${a.b}, ${a.t}, ${a.m}`);ok(a.dari==='Tanjung Priok'&&a.rows===2,name+': “Dari” baris berikutnya terisi otomatis dari “Ke”');
 await p.fill('#e-t1-b','0930');await p.waitForTimeout(100);ok(await p.locator('#f3-rows .tr').count()===3,name+': mengisi baris terakhir memunculkan baris kosong baru');
 await p.fill('#e-t1-ke','Pool');await p.fill('#e-t1-t','1100');await p.fill('#e-t1-odo','50080');await p.fill('#e-odo_akhir','50080');await p.fill('#e-tiba_parkir','1100');await p.locator('#e-parkir').selectOption('A');
 a=await tx('#f3-chk');ok(/80 km/.test(a)&&/2 perjalanan/.test(a)&&/Lolos/.test(a),name+': cek logika ringkas: '+a.replace(/\n+/g,' · '));
 await p.locator('#f3-h button[data-h="3"]').click();await p.waitForTimeout(200);ok(dlg===1&&await p.evaluate(()=>document.querySelector('#f3-h button.on').textContent==='1'),name+': pindah hari saat isian belum disimpan → ditanya dulu, isian tidak hilang');
 await p.locator('#f3f button[type=submit]:not([data-next])').click();await p.waitForTimeout(200);ok(/Pilih kelas truk/.test(await tx('#en-msg'))&&await p.evaluate(()=>document.querySelector('.seg[data-seg=kelas_baru]').classList.contains('need')),name+': truk baru wajib pilih kelas MDV/HDV');
 await p.locator('.seg[data-seg=kelas_baru] button[data-v="H"]').click();await p.locator('#f3f button[data-next]').click();await p.waitForTimeout(400);L=await st();const T1=P2+'-001';
 a=await p.evaluate(()=>({t:document.getElementById('f3-t').value,h:document.querySelector('#f3-h button.on').textContent,ok:[...document.querySelectorAll('#f3-h button.ok')].map(x=>x.textContent).join(','),odo:document.getElementById('e-odo_awal').value}));
 ok(L.dirty['f2:'+T1]&&L.dirty['f2:'+T1].data.kelas==='H'&&L.dirty['f3:'+T1+':1']&&L.dirty['f3:'+T1+':1'].data.trips.length===2,name+`: simpan → truk ${T1} (HDV) terdaftar dan lembar hari 1 tersimpan`);
 ok(a.t===T1&&a.h==='2'&&a.ok==='1'&&a.odo==='50080'&&/tersimpan · truk .* terdaftar/.test(await tx('#en-msg')),name+': lanjut ke hari 2, odometer awal 50080 dari akhir hari 1');
 await p.click('.tab[data-tab=mx]');await p.waitForTimeout(200);ok(/1 dari 7 lembar/.test(await tx('#en-body')),name+': Rekap 7 hari ikut terisi');
 // 4. pool baru ikut di Tugas dan Monitoring
 await p.evaluate(()=>goView('hasil','tugas'));await p.waitForTimeout(300);ok((await tx('#hs .pane[data-pane=tugas] table')).includes(P2),name+': pool baru tampil di tabel Tugas');
 await p.evaluate(()=>goView('mon','pool'));await p.waitForTimeout(300);ok((await tx('#pools')).includes(P2),name+': pool baru tampil di Monitoring');
 // 5. Mulai survei dari depo: ada pilihan pool baru
 await p.evaluate(()=>{goView('peta','peta');pick(D.DP.find(x=>x.id==='DEPO-020'),false)});await p.waitForTimeout(400);await p.locator('#side [data-mulai]').click();await p.waitForTimeout(250);await p.locator('#svd [data-barudp]').click();await p.waitForTimeout(500);L=await st();
 ok(NP.test(L.pool)&&L.dirty['f1:'+L.pool].data.depo_id==='DEPO-020'&&await p.evaluate(()=>document.querySelector('.view.on').id==='hasil'),name+`: “Pool baru untuk depo ini” di Mulai survei membuat ${L.pool}`);
 if(LOKAL&&name==='laptop'){ // server menerima kode pool baru, nama pool tetap rahasia
  await p.evaluate(()=>goView('hasil','entri'));await p.fill('#en-pin',PIN);await p.click('#en-login button[type=submit]');await p.waitForTimeout(1500);await p.click('#en-sync');await p.waitForTimeout(1800);
  ok(/Semua entri sudah terunggah/.test(await tx('#en-st')),name+': entri pool baru terunggah ke server');
  const doc=JSON.parse(fs.readFileSync(path.join(__dirname,'.data.json'),'utf8'));ok(!!doc.recs[`f3:${T1}:1`]&&!!doc.recs[`f2:${T1}`],name+`: server menyimpan f2:${T1} dan f3:${T1}:1`);
  const pub=await p.evaluate(async id=>(await (await fetch('/api/survey',{cache:'no-store'})).json()).recs['f1:'+id].data,P2);ok(pub&&!('nama_pool' in pub),name+': tanpa PIN, nama pool baru tidak dikirim server')}
 ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+': tanpa gulir mendatar');ok(!errs.length,name+': tanpa galat JS '+errs.join(' | '));await c.close()}
 console.log(`\n${n} lolos, ${f} gagal`);await b.close();process.exit(f?1:0)})();
