const auto=require('./auto.js');const {chromium,devices}=require('playwright');
const MODE=process.env.MODE||'real';
(async()=>{const b=await chromium.launch();let fail=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fail++};
for(const [name,opt] of [['desktop',{viewport:{width:1400,height:1000}}],['mobile',{...devices['iPhone 13']}]]){
const ctx=await b.newContext({...opt});const p=auto(await ctx.newPage());const errs=[];let tiles=0,tfail=0;
p.on('pageerror',e=>errs.push(e.message));
p.on('response',r=>{if(/openstreetmap|arcgisonline/.test(r.url())&&r.status()===200)tiles++});
p.on('requestfailed',r=>{if(/openstreetmap|arcgisonline/.test(r.url()))tfail++});
await p.goto('http://localhost:8765/');await p.waitForTimeout(2000);await p.evaluate(()=>goView('peta'));await p.waitForTimeout(MODE==='real'?6000:4000);
const s=await p.evaluate(()=>({base:document.getElementById('map').dataset.base,note:document.getElementById('b-note').textContent,imgs:document.querySelectorAll('#map img.leaflet-tile-loaded').length,att:document.querySelector('.leaflet-control-attribution')?.innerText,z:map.getZoom(),hs:document.documentElement.scrollWidth>innerWidth}));
console.log(name,JSON.stringify(s),'tiles200='+tiles,'tfail='+tfail);
if(MODE==='real'){ok(s.base==='osm'&&s.imgs>3,name+': tile OSM sungguhan termuat ('+s.imgs+')');ok(/OpenStreetMap/.test(s.att),name+': atribusi OSM tampil')}
else{ok(s.base==='polos'&&/tidak terjangkau/.test(s.note),name+': tile gagal → otomatis peta polos')}
ok(!s.hs,name+': tanpa scroll horizontal');
await p.screenshot({path:`m-${MODE}-${name}-1.png`});
// klik depo terisolasi di peta
if(name==='mobile'){await p.evaluate(()=>window.scrollTo(0,document.getElementById('map').getBoundingClientRect().top+scrollY-20));await p.waitForTimeout(300)}
const find=()=>p.evaluate(()=>{const m=document.getElementById('map').getBoundingClientRect();const ds=D.DP.map(d=>({d,q:map.latLngToContainerPoint([d.lat,d.lon])}));
const gs=D.GI.map(g=>map.latLngToContainerPoint([g.lat,g.lon]));
const o=ds.find(o=>o.q.x>X0&&o.q.x<m.width-60&&o.q.y>Y0&&o.q.y<m.height-90&&ds.every(z=>z===o||z.q.distanceTo(o.q)>18)&&gs.every(g=>g.distanceTo(o.q)>14));return o?{x:m.x+o.q.x,y:m.y+o.q.y,id:o.d.id,nama:o.d.nama}:null});
await p.evaluate(n=>{window.X0=n?20:270;window.Y0=n?70:30;map.setView([-6.9,107.6],10,{animate:false})},name==='mobile');await p.waitForTimeout(MODE==='real'?3000:600);let r=await find();if(!r){console.log('no isolated depot');fail++}else{
 if(name==='mobile')await p.touchscreen.tap(r.x,r.y);else await p.mouse.click(r.x,r.y);await p.waitForTimeout(900);
 const pop=await p.evaluate(()=>document.querySelector('.leaflet-popup-content')?.innerText||'');
 ok(pop.includes(r.nama)&&pop.includes('GI terdekat')&&pop.includes('Google Maps'),name+': klik depo → popup informatif ('+r.id+')');
 ok((await p.innerText('#side')).includes(r.id),name+': klik depo → kartu depo terisi');
 ok(await p.evaluate(()=>!!document.querySelector('.dist')),name+': label jarak ke GI muncul');
 await p.screenshot({path:`m-${MODE}-${name}-2.png`})}
// klik GI
await p.evaluate(()=>{map.closePopup()});
const g=await p.evaluate(()=>{const m=document.getElementById('map').getBoundingClientRect();const ds=D.DP.map(d=>map.latLngToContainerPoint([d.lat,d.lon]));const gs=D.GI.map(g=>({g,q:map.latLngToContainerPoint([g.lat,g.lon])}));
const o=gs.find(o=>o.q.x>X0&&o.q.x<m.width-60&&o.q.y>Y0&&o.q.y<m.height-90&&ds.every(z=>z.distanceTo(o.q)>18)&&gs.every(z=>z===o||z.q.distanceTo(o.q)>14));return o?{x:m.x+o.q.x,y:m.y+o.q.y,n:o.g.n}:null});if(!g){console.log('no isolated GI');fail++}else{
if(name==='mobile')await p.touchscreen.tap(g.x,g.y);else await p.mouse.click(g.x,g.y);await p.waitForTimeout(700);
ok(((await p.evaluate(()=>document.querySelector('.leaflet-popup-content')?.innerText||''))).includes('GI '+g.n),name+': klik gardu induk → popup ('+g.n+')')}
// klik garis transmisi: titik tengah segmen yang jauh dari marker
await p.evaluate(()=>{map.closePopup()});
const l=await p.evaluate(()=>{const m=document.getElementById('map').getBoundingClientRect();const pts=[...D.DP.map(d=>[d.lat,d.lon]),...D.GI.map(g=>[g.lat,g.lon])].map(c=>map.latLngToContainerPoint(c));
for(const [kv,c] of D.LN){for(let i=1;i<c.length;i++){const a=map.latLngToContainerPoint([c[i-1][1],c[i-1][0]]),b=map.latLngToContainerPoint([c[i][1],c[i][0]]);if(a.distanceTo(b)<30)continue;const q=L.point((a.x+b.x)/2,(a.y+b.y)/2);
 if(q.x>X0&&q.x<m.width-60&&q.y>Y0&&q.y<m.height-90&&pts.every(z=>z.distanceTo(q)>20))return{x:m.x+q.x,y:m.y+q.y,kv}}}return null});
if(name==='mobile')await p.touchscreen.tap(l.x,l.y);else await p.mouse.click(l.x,l.y);await p.waitForTimeout(700);
const lp=await p.evaluate(()=>document.querySelector('.leaflet-popup-content')?.innerText||'');ok(/Transmisi \d+ kV/.test(lp)&&/km/.test(lp),name+': klik garis transmisi → popup ('+lp.replace(/\n/g,' ')+')');
await p.evaluate(()=>{map.closePopup()});
if(MODE==='real'){await p.evaluate(()=>{document.getElementById('layers').open=true});await p.click('input[name=base][value=sat]');await p.waitForTimeout(5000);
 const s2=await p.evaluate(()=>({base:document.getElementById('map').dataset.base,imgs:document.querySelectorAll('#map img.leaflet-tile-loaded').length}));ok(s2.base==='sat'&&s2.imgs>3,name+': citra satelit termuat ('+s2.imgs+')');await p.screenshot({path:`m-${MODE}-${name}-sat.png`});
 await p.click('input[name=base][value=osm]');await p.waitForTimeout(1500)}
// tabel → terbang ke depo
await p.locator('#tb tbody tr').nth(3).click();await p.waitForTimeout(MODE==='real'?5000:1800);ok(await p.evaluate(()=>map.getZoom()>=11),name+': klik tabel → zoom ke depo (z='+await p.evaluate(()=>map.getZoom())+')');
await p.evaluate(()=>document.getElementById('map').scrollIntoView({block:'center'}));await p.waitForTimeout(400);await p.screenshot({path:`m-${MODE}-${name}-3.png`});
ok(errs.length===0,name+': tanpa galat JS '+errs.join(' | '));await ctx.close()}
await b.close();process.exit(fail?1:0)})();
