// Entri data berurutan: pool → truk → diary 7 hari, dengan warna penanda; pool bisa dicari/dipilih dari depo/dibuat baru
const {chromium}=require('playwright');const auto=require('./auto.js');const fs=require('fs'),path=require('path');let n=0,f=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);c?n++:f++};
const U=(process.env.URL||'http://localhost:8765/'),PIN=process.env.PIN||'uji-1234',LOKAL=!process.env.URL,NP=/^N[2-9A-HJ-NP-Z]{4}$/;
(async()=>{const b=await chromium.launch();for(const [name,vw,vh] of [['laptop',1366,800],['ponsel',390,844]]){const c=await b.newContext({viewport:{width:vw,height:vh}});await c.addInitScript(()=>{window.SV_TUNDA=600000});const p=await c.newPage();auto(p);const errs=[];p.on('pageerror',e=>errs.push(e.message));let dlg=0;p.on('dialog',d=>{dlg++;d.dismiss()});
 await p.goto(U);await p.waitForTimeout(3000);await p.evaluate(()=>goView('hasil','entri'));await p.waitForTimeout(400);const tx=s=>p.locator(s).first().evaluate(e=>e.innerText);const st=()=>p.evaluate(()=>surveiDebug.state().L);
 const lk=()=>p.evaluate(()=>{const q=s=>document.querySelector(s),S=[...document.querySelectorAll('#en-alur .stp')];return{on:q('#en-alur .stp.on').dataset.tab,nx:(q('#en-alur .stp.nx')||{dataset:{}}).dataset.tab,st:S.map(x=>(x.className.match(/s-(ok|isi|kosong)/)||[])[1]).join(','),txt:q('#en-alur').innerText.replace(/\s+/g,' ')}});
 // 1. kalimat panjang hilang, ada tiga langkah berurutan
 let a=await p.evaluate(()=>document.querySelector('.pane[data-pane=entri]').innerText);
 ok(!/Formulir F1–F3 v1\.1|Tanpa PIN, bagian ini hanya bisa dibaca|Penyimpanan server belum diaktifkan\. Entri|Rekap 7 hari/.test(a),name+': kalimat penjelasan panjang dan tab terpisah sudah hilang');
 // 2. pemilih pool: 10 pool rencana + semua depo + pool baru
 await p.click('#en-pool');await p.waitForTimeout(200);a=await p.evaluate(()=>({pool:document.querySelectorAll('#en-pl [data-pool]').length,depo:document.querySelectorAll('#en-pl [data-depo]').length,nd:D.DP.length,fokus:document.activeElement.id}));
 ok(a.pool>=10&&a.depo===0&&a.fokus==='en-pq',name+`: daftar pool memuat ${a.pool} pool survei, tanpa daftar depo (survei depo hanya dari ▶ Mulai survei), kolom cari langsung aktif`);
 await p.fill('#en-pq','gunung putri');await p.waitForTimeout(150);a=await p.evaluate(()=>[...document.querySelectorAll('#en-pl .pko')].map(o=>o.innerText.replace(/\n/g,' ')));
 ok(a.some(t=>/Pool baru: “gunung putri”/.test(t))&&await p.locator('#en-pl [data-det=depo]').count()===1,name+': cari “gunung putri” → pilihan pool baru dan tautan ke daftar depo');
 await p.locator('#en-pl [data-det=depo]').click();await p.waitForTimeout(400);ok(await p.evaluate(()=>document.getElementById('dlg').open&&!!document.querySelector('#dlg [data-mulai="DEPO-016"]')),name+': tautan membuka daftar depo dengan tombol ▶ Mulai survei');
 await p.locator('#dlg [data-mulai="DEPO-016"]').click();await p.waitForTimeout(500);await p.waitForTimeout(300);let L=await st();let f1=L.dirty['f1:'+L.pool];
 ok(NP.test(L.pool)&&f1&&f1.data.depo_id==='DEPO-016'&&f1.data.draf===1&&/Multi Prima/.test(await tx('#en-pool')),name+`: ▶ Mulai survei langsung membuat pool ${L.pool} yang tersambung ke DEPO-016`);
 await p.click('#en-pool');await p.fill('#en-pq','Pool Uji Cikande Baru');await p.keyboard.press('ArrowDown');await p.keyboard.press('Enter');await p.waitForTimeout(400);L=await st();const P2=L.pool;f1=L.dirty['f1:'+P2];
 ok(NP.test(P2)&&f1&&f1.data.nama_pool==='Pool Uji Cikande Baru'&&/Pool Uji Cikande Baru/.test(await tx('#en-pool')),name+`: mengetik nama yang belum terdata membuat pool baru ${P2}`);
 await p.click('#en-pool');await p.fill('#en-pq','cikande');await p.waitForTimeout(150);ok(await p.evaluate(id=>{const o=document.querySelector('#en-pl .pko');return o&&o.dataset.pool===id&&o.classList.contains('act')},P2),name+': pool baru langsung muncul di daftar, paling atas saat dicari');await p.keyboard.press('Escape');await p.waitForTimeout(150);
 // 3. langkah 1: data pool
 a=await lk();ok(a.on==='f1'&&a.nx==='f1'&&a.st==='isi,kosong,kosong'&&/Isi ini dulu/.test(a.txt)&&/1 Data pool.*2 Data truk.*3 Diary 7 hari/.test(a.txt),name+': pool baru dibuka di langkah 1 “Data pool”, ditandai “Isi ini dulu” → '+a.txt.slice(0,120));
 a=await p.evaluate(()=>[...document.querySelectorAll('#f1f details.sec')].map(d=>d.open+':'+d.className+':'+d.querySelector('.sc').textContent));
 ok(a.length===5&&a[0].startsWith('true:sec s-isi')&&a.slice(1).every(x=>x.startsWith('false')),name+': data pool dibagi 5 bagian berpenanda isian; bagian yang belum lengkap terbuka '+a[0]);
 await p.locator('#e-kab').fill('Serang');await p.waitForTimeout(100);ok(/2 \/ \d+ terisi/.test(await tx('#f1f details.sec .sc')),name+': hitungan isian bagian ikut bertambah saat mengetik');
 await p.locator('#f1f button[data-next]').click();await p.waitForTimeout(400);a=await lk();
 ok(a.on==='f2'&&a.nx==='f2'&&a.st.startsWith('ok,')&&/Data pool tersimpan/.test(await tx('#en-msg')),name+': “Simpan, lanjut” → langkah 1 hijau ✓, pindah ke langkah 2 “Data truk”');
 // 4. langkah 2: data truk (kelas wajib) → langsung diary
 ok(await p.locator('#en-tkl .tk-baru.on').count()===1&&/Truk baru · /.test(await tx('#en-tkp h3')),name+': langkah 2 membuka formulir truk baru di dalam pool');
 await p.locator('#f2f button[data-next]').click();await p.waitForTimeout(200);ok(/kelas/.test(await tx('#en-msg'))&&await p.evaluate(()=>document.getElementById('e-kelas').closest('label').classList.contains('need')),name+': truk tanpa kelas tidak disimpan; kolom kelas ditandai merah');
 await p.locator('#e-kelas').selectOption('H');await p.locator('#f2f button[data-next]').click();await p.waitForTimeout(400);const T1=P2+'-001';L=await st();a=await lk();
 ok(L.dirty['f2:'+T1]&&L.dirty['f2:'+T1].data.kelas==='H'&&a.on==='f3'&&a.nx==='f3'&&a.st==='ok,isi,kosong',name+`: truk ${T1} tersimpan → langsung ke langkah 3 “Diary 7 hari” truk itu`);
 ok(await p.evaluate(id=>document.querySelector('#en-tkl .tk.on').dataset.truk===id&&document.querySelector('#f3-h button.on').textContent==='1'&&/Diary 7 hari · 0\/7/.test(document.querySelector('.sub2').innerText),T1),name+': truk terpilih di daftar, diary hari 1 terbuka');
 // 5. langkah 3: diary
 a=await p.evaluate(()=>document.getElementById('f3-chk').hidden);ok(a,name+': lembar kosong belum menampilkan peringatan');
 await p.fill('#e-odo_awal','50000');await p.fill('#e-mulai','600');await p.fill('#e-t0-b','0630');await p.fill('#e-t0-ke','Tanjung Priok');await p.fill('#e-t0-t','815');await p.fill('#e-t0-odo','50040');await p.fill('#e-t0-lama','75');await p.locator('#e-t0-keg').selectOption('1');await p.locator('#e-t0-b').focus();await p.locator('#e-t0-t').focus();await p.locator('#e-mulai').focus();await p.waitForTimeout(100);
 a=await p.evaluate(()=>({b:document.getElementById('e-t0-b').value,t:document.getElementById('e-t0-t').value,m:document.getElementById('e-mulai').value,dari:document.getElementById('e-t1-dari').value,rows:document.querySelectorAll('#f3-rows .tr').length}));
 ok(a.b==='06.30'&&a.t==='08.15'&&a.m==='06.00',name+`: jam bisa diketik 0630/815/600 → ${a.b}, ${a.t}, ${a.m}`);ok(a.dari==='Tanjung Priok'&&a.rows===2,name+': “Dari” baris berikutnya terisi otomatis dari “Ke”');
 await p.fill('#e-t1-b','0930');await p.waitForTimeout(100);ok(await p.locator('#f3-rows .tr').count()===3,name+': mengisi baris terakhir memunculkan baris kosong baru');
 await p.fill('#e-t1-ke','Pool');await p.fill('#e-t1-t','1100');await p.fill('#e-t1-odo','50080');await p.fill('#e-odo_akhir','50080');await p.fill('#e-tiba_parkir','1100');await p.locator('#e-parkir').selectOption('A');
 a=await tx('#f3-chk');ok(/80 km/.test(a)&&/2 perjalanan/.test(a)&&/Lolos/.test(a),name+': cek logika ringkas: '+a.replace(/\n+/g,' · '));
 await p.locator('#f3-h button[data-h="3"]').click();await p.waitForTimeout(200);ok(dlg===1&&await p.evaluate(()=>document.querySelector('#f3-h button.on').textContent==='1'),name+': pindah hari saat isian belum disimpan → ditanya dulu, isian tidak hilang');
 await p.locator('#f3f button[data-next]').click();await p.waitForTimeout(400);L=await st();
 a=await p.evaluate(()=>({h:document.querySelector('#f3-h button.on').textContent,ok:[...document.querySelectorAll('#f3-h button.ok')].map(x=>x.textContent).join(','),odo:document.getElementById('e-odo_awal').value,dd:[...document.querySelectorAll('#en-tkl .tk.on .dd i')].map(i=>i.className||'-').join(' '),tl:document.getElementById('en-tkl').innerText}));
 ok(L.dirty['f3:'+T1+':1']&&L.dirty['f3:'+T1+':1'].data.trips.length===2&&a.h==='2'&&a.ok==='1'&&a.odo==='50080',name+': simpan → hari 2 terbuka, odometer awal 50080 dari akhir hari 1');
 ok(/^d-A - - - - - -$/.test(a.dd)&&/1 dari 7 lembar/.test(a.tl),name+': kotak hari di daftar truk ikut berwarna ('+a.dd+')');
 // 6. tidak dikunci: langkah mana pun bisa dibuka
 await p.locator('#en-alur [data-tab="f1"]').click();await p.waitForTimeout(200);ok(await p.locator('#f1f').count()===1&&(await lk()).on==='f1',name+': langkah 1 tetap bisa dibuka lagi kapan saja');
 await p.locator('#en-alur [data-tab="f3"]').click();await p.waitForTimeout(200);ok(await p.evaluate(id=>document.querySelector('#en-tkl .tk.on').dataset.truk===id&&document.querySelector('#f3-h button.on').textContent==='2',T1),name+': langkah 3 langsung ke hari berikutnya yang belum diisi');
 await p.locator('.sub2 [data-sub="f2"]').click();await p.waitForTimeout(200);ok(await p.evaluate(()=>document.getElementById('e-kelas').value==='H')&&await p.locator('#f2-del').count()===1,name+': data truk bisa dibuka lagi dari panel truk');
 // 7. pool baru ikut di Tugas dan Monitoring
 await p.evaluate(()=>goView('hasil','tugas'));await p.waitForTimeout(300);ok((await tx('#sv-tg .pane[data-pane=tugas] table')).includes(P2),name+': pool baru tampil di tabel Tugas');
 await p.evaluate(()=>goView('mon','pool'));await p.waitForTimeout(300);ok((await tx('#pools')).includes(P2),name+': pool baru tampil di Monitoring');
 // 8. Mulai survei dari depo: langsung pool baru khusus depo itu
 await p.evaluate(()=>goView('peta','peta'));await p.locator('#dash-t [data-det="depo"]').click();await p.waitForTimeout(250);await p.locator('#dlg-tb tr[data-dp="DEPO-020"] [data-mulai]').click();await p.waitForTimeout(600);L=await st();
 ok(NP.test(L.pool)&&L.dirty['f1:'+L.pool].data.depo_id==='DEPO-020'&&await p.evaluate(()=>document.querySelector('.view.on').id==='hasil'&&document.querySelector('#en-alur .stp.on').dataset.tab==='f1'),name+`: ▶ Mulai survei langsung membuat ${L.pool} dan membuka langkah 1`);
 if(LOKAL&&name==='laptop'){ // server menerima kode pool baru, nama pool tetap rahasia
  await p.fill('#en-pin',PIN);await p.click('#en-login button[type=submit]');await p.waitForTimeout(1500);await p.click('#en-sync');await p.waitForTimeout(1800);
  ok(/Semua entri sudah terunggah/.test(await tx('#en-st')),name+': entri pool baru terunggah ke server');
  const doc=JSON.parse(fs.readFileSync(path.join(__dirname,'.data.json'),'utf8'));ok(!!doc.recs[`f3:${T1}:1`]&&!!doc.recs[`f2:${T1}`],name+`: server menyimpan f2:${T1} dan f3:${T1}:1`);
  const pub=await p.evaluate(async id=>(await (await fetch('/api/survey',{cache:'no-store'})).json()).recs['f1:'+id].data,P2);ok(pub&&!('nama_pool' in pub),name+': tanpa PIN, nama pool baru tidak dikirim server')}
 ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+': tanpa gulir mendatar');ok(!errs.length,name+': tanpa galat JS '+errs.join(' | '));await c.close()}
 console.log(`\n${n} lolos, ${f} gagal`);await b.close();process.exit(f?1:0)})();
