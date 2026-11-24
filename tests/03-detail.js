const auto=require('./auto.js');const {chromium,devices}=require('playwright');const URL=process.env.URL||'http://localhost:8765/';const TAG=process.env.TAG||'n';
(async()=>{const b=await chromium.launch();let fail=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fail++};
for(const [name,opt] of [['desktop',{viewport:{width:1400,height:1000}}],['mobile',{...devices['iPhone 13']}]]){
const ctx=await b.newContext({...opt});const p=auto(await ctx.newPage());const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errs.push(m.text())});
await p.goto(URL);await p.waitForTimeout(2500);await p.evaluate(()=>goView('peta'));await p.waitForTimeout(4000);
const T=id=>p.evaluate(i=>document.getElementById(i)?.textContent||'',id);
ok(!(await p.content()).includes('Keyakinan titik'),name+': "Keyakinan titik" sudah dihapus');
ok((await T('vi')).includes('Di tampilan ini'),name+': insight tampilan peta → '+(await T('vi')).slice(0,150));
ok((await p.locator('#i-ins li').count())===8&&!/NaN|undefined|Infinity/.test(await T('i-ins')),name+': 8 insight (termasuk 2 dari beban harian) tanpa NaN');
ok((await p.locator('#side .dnt').count())===3&&(await p.locator('#side .dnt').nth(1).locator('circle').count())===3,name+': panel Ringkasan: 3 diagram lingkar, pola operasi 3 segmen');
ok((await p.locator('#side .dnt').nth(2).locator('circle').count())===4&&/114/.test(await p.locator('#side .dnt').nth(2).innerText()),name+': diagram lingkar jenis usaha 4 kelompok, total 114');
ok((await p.locator('#i-gi .gt2').count())===8,name+': 8 GI tumpuan');
// pilih depo Jabar dengan data lengkap (DEPO-001) lewat API klik tabel
await p.fill('#q','DEPO-001');await p.waitForTimeout(200);await p.locator('#tb tbody tr').first().click();await p.waitForTimeout(2500);
const DT=async()=>(await T('side'))+(await T('g-dep'))+(await T('r-dep'));let det=await DT();
for(const k of ['Profil depo','Sistem kelistrikan','Skenario','Dampak ke jaringan','Kesimpulan','Rekomendasi','Skema sambungan','Waktu charging','Manajemen beban','Gardu distribusi CPCG','GI pemasok','Data yang masih harus dilengkapi'])if(!det.toLowerCase().includes(k.toLowerCase())){ok(false,name+': detail memuat "'+k+'"')}
ok(!/NaN|undefined|Infinity|null/.test(det),name+': detail DEPO-001 tanpa NaN/undefined');
ok(/MW/.test(await T('s-v')),name+': kartu samping berisi kesimpulan → '+(await T('s-v')).replace(/\n/g,' | '));
const c1=await T('d-c');await p.evaluate(()=>{const z=document.getElementById('z1');z.value=300;z.dispatchEvent(new Event('input'));const k=document.getElementById('z2');k.value=600;k.dispatchEvent(new Event('input'))});
const c2=await T('d-c');ok(c1!==c2&&/300 truk/.test(c2),name+': geser skenario → kesimpulan berubah');
console.log('   KESIMPULAN(300 truk, 600 km):',c2.slice(0,330));console.log('   VONIS:',await T('d-v'));
if(name==='desktop'){await p.evaluate(()=>{goView('peta','detail');dsGo('analisa')});await p.waitForTimeout(400);await p.screenshot({path:`d-${TAG}-detail.png`,fullPage:false});
 await p.locator('.pdet').screenshot({path:`d-${TAG}-detail-full.png`});await p.evaluate(()=>goView('peta'))}
else{await p.evaluate(()=>{goView('peta','detail');dsGo('analisa')});await p.locator('.pdet').screenshot({path:`d-${TAG}-detail-mobile.png`});await p.evaluate(()=>goView('peta'))}
// depo yang GI-nya paling jauh
await p.fill('#q','DEPO-017');await p.waitForTimeout(200);await p.locator('#tb tbody tr').first().click();await p.waitForTimeout(1500);det=await DT();
ok(/Perlu kajian khusus|penguatan/.test(await T('d-v'))&&!/NaN|undefined|Infinity|null/.test(det),name+': DEPO-017 (GI 6,7 km) → '+(await T('d-v')));
await p.fill('#q','');
// pewarnaan + filter legenda
await p.evaluate(()=>{document.getElementById('layers').open=true;document.getElementById('map').scrollIntoView({block:'center'})});
for(const m of ['ev','pola','jenis','jarak']){await p.selectOption('#cby',m);await p.waitForTimeout(150);const n=await p.locator('#lg .lgi').count();const sum=await p.evaluate(()=>[...document.querySelectorAll('#lg .lgi em')].reduce((s,e)=>s+ +e.textContent,0));ok(n>=3&&sum===114,name+`: warnai menurut ${m} → ${n} kelas, total ${sum}`)}
await p.selectOption('#cby','pola');await p.locator('#lg .lgi').first().click();await p.waitForTimeout(300);
const dim=await p.evaluate(()=>({dim:D.DP.filter(d=>d._m.options.fillOpacity<1).length,vi:document.getElementById('vi').innerText}));ok(dim.dim===54&&/saring/.test(dim.vi),name+': klik legenda menyaring (54 depo diredupkan) dim='+dim.dim+' vi='+dim.vi.slice(0,60));
await p.locator('#lg .lgi').last().click();await p.selectOption('#cby','ev');await p.waitForTimeout(300);
if(name==='desktop')await p.screenshot({path:`d-${TAG}-map-ev.png`,clip:{x:0,y:0,width:1400,height:1000}});
// klik GI tumpuan dari daftar insight
await p.locator('#i-gi .gt2').first().click();await p.waitForTimeout(2500);
const gp=await p.evaluate(()=>({pop:document.querySelector('.leaflet-popup-content')?.innerText||'',lines:document.querySelectorAll('#map .leaflet-overlay-pane svg path').length}));
ok(/13 depo/.test(gp.pop)&&/MVA/.test(gp.pop)&&gp.lines>=13,name+': klik GI tumpuan → popup + '+gp.lines+' garis ke depo');console.log('   POPUP GI:',gp.pop.replace(/\n/g,' | ').slice(0,260));
if(name==='desktop'){await p.evaluate(()=>document.getElementById('map').scrollIntoView({block:'center'}));await p.waitForTimeout(1500);await p.screenshot({path:`d-${TAG}-gi.png`})}
// klik depo dari popup GI
await p.locator('.leaflet-popup-content a[data-dp]').first().click();await p.waitForTimeout(2500);ok(/Kartu depo/i.test(await T('side'))&&/Depo terpilih/i.test(await T('g-dep'))&&/Bila armadanya beralih/i.test(await T('r-dep')),name+': tautan depo di popup GI membuka kartu depo dan rekomendasinya');
ok(!(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),name+': tanpa scroll horizontal');
ok(errs.length===0,name+': tanpa galat JS '+errs.join(' | '));await ctx.close()}
await b.close();process.exit(fail?1:0)})();
