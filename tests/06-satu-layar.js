const auto=require('./auto.js');const {chromium,devices}=require('playwright');const URL=process.env.URL||'http://localhost:8765/';
const V=[['peta',['peta','profil','skenario','rekom']],['hasil',['tugas','simpul','kondisi','charging','proyeksi','daya','statistik','unduh','entri']],['mon',['jadwal','pool','lapor','ringkas','usaha','beban','insight','statistik','daftar']]];
(async()=>{const b=await chromium.launch();let fail=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fail++};
for(const [name,opt] of [['laptop 1366×768',{viewport:{width:1366,height:768}}],['layar 1920×1080',{viewport:{width:1920,height:1080}}],['ponsel',{...devices['iPhone 13']}]]){
const ctx=await b.newContext(opt);const p=await ctx.newPage();{const og=p.goto.bind(p);p.goto=async(...a)=>{const r=await og(...a);if(await p.locator('form[action="/masuk"] #kode').count()){await p.fill('#kode',process.env.KODE||'1234');await Promise.all([p.waitForNavigation({waitUntil:'load'}),p.click('form[action="/masuk"] button')])}return r}}const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(URL);await p.waitForTimeout(4500);
ok(await p.evaluate(()=>document.querySelectorAll('.view.on').length===1&&document.querySelector('.view.on').id==='peta'&&PANE.peta!=='profil'&&document.getElementById('map').offsetHeight>200&&document.querySelectorAll('#dash-t .dtile').length===3),name+': dibuka di Dasbor (angka + peta), hanya satu tampilan aktif');
await p.evaluate(()=>pick(D.DP[0],false));await p.waitForTimeout(400);
let bad=[],inner=[];for(const [v,panes] of V)for(const pn of panes){await p.click(`.menu button[data-view="${v}"]`);if(pn)await p.click(`#${v} .st button[data-pane="${pn}"]`);await p.waitForTimeout(250);
 const m=await p.evaluate(([v,pn])=>{const el=document.getElementById(v),vb=el.querySelector('.vbody'),on=document.querySelectorAll('.view.on');const de=document.documentElement;
  return{y:de.scrollHeight>innerHeight+1||document.body.scrollHeight>innerHeight+1,x:de.scrollWidth>innerWidth,one:on.length===1&&on[0]===el,pane:!pn||(el.querySelectorAll('.pane.on').length===1&&el.querySelector('.pane.on').dataset.pane===pn),inner:vb?vb.scrollHeight-vb.clientHeight:0,vis:el.getBoundingClientRect().height>100}},[v,pn]);
 if(m.y||m.x||!m.one||!m.pane||!m.vis)bad.push(v+'/'+pn+JSON.stringify(m));if(m.inner>4)inner.push(v+(pn?'/'+pn:'')+' '+m.inner+'px')}
ok(bad.length===0,name+': 21 tampilan/panel, halaman tidak pernah bergulir dan hanya satu yang tampil '+bad.join(' '));
console.log('   panel yang masih perlu gulir di dalam:',inner.length?inner.join(', '):'tidak ada');
// formulir entri F3 sengaja terbuka penuh (perlu gulir), jadi tidak dihitung
if(!name.startsWith('ponsel')){const lain=inner.filter(x=>!/^hasil\/entri /.test(x));ok(lain.length<=6,name+': paling banyak 6 panel (selain formulir entri) perlu gulir dalam ('+lain.length+')')}
// peta menyesuaikan ukuran setelah kembali
await p.click('.menu button[data-view="peta"]');await p.click('#peta .st button[data-pane="peta"]');await p.waitForTimeout(500);const mp=await p.evaluate(()=>{const r=document.getElementById('map').getBoundingClientRect(),c=document.querySelector('#map canvas').getBoundingClientRect();return{h:r.height,w:r.width,bottom:r.bottom,ih:innerHeight,cw:c.width,sz:map.getSize()}});
ok(mp.h>300&&Math.abs(mp.sz.x-mp.w)<2&&Math.abs(mp.sz.y-mp.h)<2&&mp.cw>mp.w*.9,name+`: peta memenuhi ruang (${Math.round(mp.w)}×${Math.round(mp.h)}) dan ukurannya sinkron`);
// tautan "analisis lengkap" & klik baris tabel berpindah tampilan
await p.click('#side button[data-go="detail"]');await p.waitForTimeout(200);ok(await p.evaluate(()=>document.querySelector('.view.on').id==='peta'&&PANE.peta==='profil'&&document.getElementById('detail').offsetHeight>100&&!document.getElementById('map').offsetHeight),name+': tombol “Lihat analisis lengkap” membuka detail pool di tampilan Peta');
await p.click('.menu button[data-view="mon"]');await p.click('#mon .st button[data-pane="daftar"]');await p.locator('#tb tbody tr').nth(2).click();await p.waitForTimeout(1500);
ok(await p.evaluate(()=>document.querySelector('.view.on').id==='peta'&&PANE.peta==='peta'&&document.getElementById('map').offsetHeight>200&&!!document.querySelector('.pulse')),name+': klik baris tabel → pindah ke Peta dan depo disorot');
ok(await p.evaluate(()=>/Terpilih: DEPO-\d{3}/.test(document.getElementById('det-sub').textContent)&&[...document.querySelectorAll('#det-st button')].every(b=>!b.disabled)),name+': kepala Peta menandai depo terpilih dan tab detail aktif');
// muat ulang di tampilan lain lalu kembali ke peta → peta tetap benar
await p.click('.menu button[data-view="mon"]');await p.reload();await p.waitForTimeout(4000);ok(await p.evaluate(()=>document.querySelector('.view.on').id==='mon'),name+': muat ulang tetap di tampilan terakhir (Monitoring)');
await p.click('.menu button[data-view="peta"]');await p.waitForTimeout(2500);const z=await p.evaluate(()=>({z:map.getZoom(),n:D.DP.filter(d=>map.getBounds().contains([d.lat,d.lon])).length,w:map.getSize().x}));ok(z.w>200&&(name.startsWith('ponsel')?z.n>=60:z.n===114),name+`: peta yang dimuat tersembunyi tampil benar saat dibuka (zoom ${z.z}, ${z.n} depo terlihat)`);
if(!name.startsWith('ponsel')){const w0=await p.evaluate(()=>document.getElementById('sb').getBoundingClientRect().width);await p.click('#sb-t');await p.waitForTimeout(300);const w1=await p.evaluate(()=>({sb:document.getElementById('sb').getBoundingClientRect().width,map:map.getSize().x,mw:document.getElementById('map').getBoundingClientRect().width}));ok(w1.sb<70&&w0>180&&Math.abs(w1.map-w1.mw)<2,name+`: menu bisa dilipat (${Math.round(w0)}→${Math.round(w1.sb)} px), peta melebar`);await p.click('#sb-t')}
else ok(await p.evaluate(()=>{const r=document.getElementById('sb').getBoundingClientRect();return r.bottom>=innerHeight-1&&r.height<90&&r.width>=innerWidth-1}),name+': menu menjadi bilah bawah');
ok(errs.length===0,name+': tanpa galat JS '+errs.join('|'));await ctx.close()}
await b.close();process.exit(fail?1:0)})();
