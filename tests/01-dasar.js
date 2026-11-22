const auto=require('./auto.js');const {chromium,devices}=require('playwright');
(async()=>{const b=await chromium.launch();let fail=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fail++};
for(const [name,opt] of [['desktop',{viewport:{width:1400,height:1000}}],['mobile',{...devices['iPhone 13']}]]){
const ctx=await b.newContext({...opt,timezoneId:'Europe/London'});const p=auto(await ctx.newPage());const errs=[];
p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts/.test(m.text()))errs.push(m.text())});
await p.goto('http://localhost:8765/');await p.waitForTimeout(2500);await p.evaluate(()=>goView('peta'));await p.waitForTimeout(1500);
ok(p.url().includes('pantau_hdv_depo_gardu.html'),name+': root / mengarah ke dasbor');
const s=await p.evaluate(()=>({cw:document.querySelector('#map canvas').getBoundingClientRect().width,rows:document.querySelectorAll('#tb tbody tr').length,k:document.getElementById('k0').textContent,g:document.querySelector('#gantt .sub').innerText,open:document.getElementById('layers').open,hs:document.documentElement.scrollWidth>innerWidth}));
ok(s.cw>300,name+': canvas peta terlihat ('+s.cw+'px)');ok(s.rows===114,name+': tabel 114 depo');ok(s.k==='114',name+': KPI terisi');ok(s.g==='10 Nov – 17 Nov',name+': tanggal Gantt benar (TZ London)');ok(!s.hs,name+': tanpa scroll horizontal');
ok(s.open===(name==='desktop'),name+': panel Layer '+(s.open?'terbuka':'terlipat'));
await p.screenshot({path:'final-'+name+'.png'});
await p.locator('#tb tbody tr').first().click();await p.waitForTimeout(1200);ok((await p.innerText('#side')).toLowerCase().includes('truk listrik'),name+': klik tabel membuka kartu depo');
await p.fill('#z1','100');await p.dispatchEvent('#z1','input');ok((await p.innerText('#z-mw')).includes('MW'),name+': simulasi beban jalan ('+await p.innerText('#z-mw')+')');
await p.fill('#f-th','30');await p.click('#f-ok');await p.waitForTimeout(300);ok((await p.innerText('#f-msg')).startsWith('Tersimpan'),name+': simpan laporan harian');
await p.reload();await p.waitForTimeout(1500);ok((await p.innerText('#tl tbody')).includes('30'),name+': laporan bertahan setelah muat ulang');
ok(errs.length===0,name+': tanpa galat JS '+errs.join(' | '));await ctx.close()}
await b.close();process.exit(fail?1:0)})();
