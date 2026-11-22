// fitur baru: menu digabung, daftar depo di peta, hasil survei (kesimpulan, kondisi, charging, proyeksi), contoh tampilan
const {chromium}=require('playwright');const auto=require('./auto.js');let n=0,f=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);c?n++:f++};
(async()=>{const b=await chromium.launch();for(const [name,vw,vh] of [['laptop',1440,900],['ponsel',390,844]]){const c=await b.newContext({viewport:{width:vw,height:vh}});const p=await c.newPage();auto(p);const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto((process.env.URL||'http://localhost:8765/')+'pantau_hdv_depo_gardu.html');await p.waitForTimeout(1500);const tx=s=>p.locator(s).first().evaluate(e=>e.textContent);
 const menu=await p.evaluate(()=>[...document.querySelectorAll('.sb .menu button[data-view]')].map(b=>b.dataset.view));
 ok(menu.join()==='peta,mon,hasil'&&!await p.locator('#detail-s,#dash,#entri').count(),name+': menu = '+menu.join());
 ok(!await p.locator('#info').count()&&!await p.locator('#rfp').count()&&!/Tentang data/.test(await tx('body')),name+': "Tentang data" dan menu RFP terpisah sudah tidak ada');
 ok((await tx('#mon h2'))==='Monitoring'&&await p.locator('#mon .st button').count()===9,name+': Monitoring memuat 9 sub-menu');
 {const q=await c.newPage();auto(q);let on=0;for(const h of ['#rfp','#info']){await q.goto('about:blank');await q.goto((process.env.URL||'http://localhost:8765/')+'pantau_hdv_depo_gardu.html'+h);await q.waitForTimeout(900);on+=await q.locator('#mon.on').count()}await q.close();ok(on===2,name+': tautan lama #rfp/#info mendarat di Monitoring')}
 // panel samping: Ringkasan (bawaan) dan Daftar depo
 await p.evaluate(()=>goView('peta','peta'));await p.waitForTimeout(1200);
 ok(await p.locator('#s-tab button.on').getAttribute('data-m')==='ringkas'&&await p.locator('#side .rkc').count()===3&&!await p.locator('#s-list').count(),name+': panel samping dibuka di Ringkasan (3 sebaran)');
 await p.locator('#s-tab [data-m="daftar"]').click();await p.waitForTimeout(300);
 const NDP=await p.evaluate(()=>D.DP.length);ok(NDP===25&&await p.locator('#s-list .dli').count()===NDP&&/25 depo/.test(await tx('#s-n')),name+': kartu depo berisi daftar 25 depo');
 const o=await p.evaluate(()=>{const r=document.querySelector('#s-list .dli').getBoundingClientRect(),s=document.getElementById('side').getBoundingClientRect();return r.right<=s.right+1&&r.width>150});ok(o,name+': baris daftar tidak terpotong');
 await p.fill('#s-q','cikarang');await p.waitForTimeout(250);const nq=await p.locator('#s-list .dli').count();ok(nq>0&&nq<NDP,name+': pencarian menyaring daftar → '+nq);
 await p.fill('#s-q','zzzz');await p.waitForTimeout(250);ok(/Tidak ada depo/.test(await tx('#s-list')),name+': pencarian tanpa hasil diberi tahu');await p.fill('#s-q','');await p.waitForTimeout(200);
 await p.locator('#s-flt [data-f="a"]').click();await p.waitForTimeout(250);const nA=await p.locator('#s-list .dli').count();ok(nA===await p.evaluate(()=>D.DP.filter(d=>d.q.k==='a').length)&&nA===await p.evaluate(()=>D.DP.filter(d=>d._m.options.fillOpacity===1).length),name+': saring "kuota cukup" → daftar dan peta sama-sama '+nA);
 await p.locator('#s-flt [data-f=""]').click();await p.selectOption('#s-o','jarak');await p.waitForTimeout(200);
 const first=await p.locator('#s-list .dli').first().getAttribute('data-dp');ok(first===await p.evaluate(()=>[...D.DP].sort((a,b)=>a.gi_km-b.gi_km)[0].id),name+': urut jarak terdekat');
 await p.locator('#s-list .dli').first().click();await p.waitForTimeout(1300);
 ok(/Kartu depo/i.test(await tx('#side'))&&await p.locator('#side [data-back]').count()===1&&await p.evaluate(()=>!!sel),name+': klik baris → detail depo + peta memilih depo');
 await p.locator('#side [data-back]').click();await p.waitForTimeout(300);ok(await p.locator('#s-list .dli').count()===NDP&&await p.evaluate(()=>!sel),name+': tombol kembali → daftar depo lagi');
 // hasil survei: keadaan kosong
 await p.evaluate(()=>goView('hasil'));await p.waitForTimeout(500);
 ok(await p.locator('#hasil .st button').count()===9&&(await tx('#hasil .st button.on'))==='Tugas',name+': Survei punya 9 sub-menu, mulai dari Tugas');await p.locator('#hasil .st button[data-pane="simpul"]').click();await p.waitForTimeout(250);
 ok(/Belum ada entri survei/.test(await tx('#hasil .pane.on'))&&!await p.locator('#hs .sim').count(),name+': tanpa entri tidak ada kesimpulan, hanya penjelasan');
 // contoh tampilan
 ok(await p.evaluate(()=>new Set([...document.querySelectorAll('#hs [id]')].map(e=>e.id)).size===document.querySelectorAll('#hs [id]').length),name+': tidak ada id ganda di Hasil survei');await p.locator('#hasil .st button[data-pane="charging"]').click();await p.locator('#hasil .pane.on [data-demo]').click();await p.waitForTimeout(300);ok((await tx('#hasil .st button.on'))==='Analisis charging'&&/DATA SIMULASI/.test(await tx('#hs')),name+': tombol contoh di panel mana pun bekerja dan tetap di panel itu');await p.locator('#hasil .st button[data-pane="simpul"]').click();await p.waitForTimeout(500);
 ok(/DATA SIMULASI/.test(await tx('#hs .demo'))&&/bukan hasil survei/.test(await tx('#hs-sub')),name+': contoh tampilan diberi label data simulasi');
 ok(await p.locator('#hs .sim').count()===1&&await p.locator('#hs .tmu').count()===6&&/hari operasi cocok/.test(await tx('#hs .sim')),name+': Kesimpulan: 1 kesimpulan utama + 6 temuan');
 ok(await p.locator('#hs .tl i').count()>=2,name+': infografis sehari operasi truk');
 for(const [k,re,sel2] of [['kondisi',/Berapa jauh truk berjalan[\s\S]*berjalan kosong[\s\S]*boros solar/,'.bar'],['charging',/Di mana truk bermalam[\s\S]*Jam berapa truk tiba[\s\S]*Baterai sebesar apa/,'.hist i'],['proyeksi',/bisa diubah[\s\S]*Solar sekarang dibanding listrik[\s\S]*Target 500 truk/,'[data-as]'],['daya',/Kebutuhan daya tiap pool/,'table'],['statistik',/Statistik deskriptif[\s\S]*Perbandingan antarkelompok/,'.stt']]){
  await p.locator(`#hasil .st button[data-pane="${k}"]`).click();await p.waitForTimeout(350);const t=await tx('#hasil .pane.on');ok(re.test(t)&&await p.locator('#hasil .pane.on '+sel2).count()>0,name+': panel '+k+' terisi')}
 await p.locator('#hasil .st button[data-pane="proyeksi"]').click();const s0=(await tx('#hasil .pane.on')).match(/Selisih biaya energi Rp [\d.,]+ (juta|miliar)/)[0];
 await p.fill('[data-as="solar"]','12000');await p.locator('[data-as="solar"]').dispatchEvent('change');await p.waitForTimeout(300);const s1=(await tx('#hasil .pane.on')).match(/Selisih biaya energi Rp [\d.,]+ (juta|miliar)/)[0];
 ok(s0!==s1&&await p.inputValue('[data-as="solar"]')==='12000',name+': ubah asumsi → proyeksi dihitung ulang ('+s0.slice(21)+' → '+s1.slice(21)+')');
 await p.locator('#as-reset').click();await p.waitForTimeout(300);ok(await p.inputValue('[data-as="solar"]')==='6800',name+': asumsi bisa dikembalikan');
 const st=await p.evaluate(()=>({d:Object.keys(JSON.parse(localStorage.getItem('pantau-hdv-survei')||'{}').dirty||{}).length,sv:Object.keys(window.svCount().reg).length}));
 ok(st.d===0&&st.sv===0,name+': data simulasi tidak tersimpan, tidak masuk dasbor/monitoring');
 await p.locator('#hf-demo').click();await p.waitForTimeout(300);ok(!await p.locator('#hs .demo').count()&&/Belum ada entri survei/.test(await tx('#hasil .pane.on')),name+': contoh tampilan bisa ditutup');
 ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+': tanpa gulir mendatar');
 ok(!errs.length,name+': tanpa galat JS '+errs.join(' | '));await c.close()}
 console.log(`\n${n} lolos, ${f} gagal`);await b.close();process.exit(f?1:0)})();
