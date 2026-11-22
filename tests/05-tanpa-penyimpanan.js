const auto=require('./auto.js');const {chromium}=require('playwright');const {execSync,spawn}=require('child_process');const fs=require('fs');
const start=env=>{try{execSync("pkill -f 'node server.js'")}catch(e){}const c=spawn('node',['server.js'],{cwd:__dirname,env:{...process.env,...env},stdio:'ignore',detached:true});c.unref();return new Promise(r=>setTimeout(r,1500))};
(async()=>{let fail=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fail++};try{fs.unlinkSync(require('path').join(__dirname,'.data.json'))}catch(e){}
await start({NOREADY:'1'});const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1400,height:1000}});const p=auto(await ctx.newPage());const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8765/');await p.waitForTimeout(3500);const T=id=>p.evaluate(i=>document.getElementById(i)?.textContent||'',id);
ok(/Server belum aktif/.test(await T('en-st'))&&/belum diaktifkan/.test(await T('en-msg')),'server belum aktif → status jelas: '+(await T('en-st')).replace(/\n/g,' | '));
await p.fill('#en-pin','pin-saya');await p.selectOption('#en-pool','P2');await p.click('#en-login button[type=submit]');await p.waitForTimeout(800);
const set=async(k,v)=>{const el=p.locator(`#en-body [data-k="${k}"]`).first();if((await el.evaluate(e=>e.tagName))==='SELECT')await el.selectOption(v);else await el.fill(String(v))};
await p.click('.tab[data-tab=f2]');for(const [k,v] of [['kelas','H'],['kml','3'],['odo0','1000'],['parkir','A']])await set(k,v);await p.click('#f2f button[type=submit]');await p.waitForTimeout(200);
await p.click('.tab[data-tab=f3]');await p.waitForTimeout(200);await set('mulai','06.00');await p.fill('#f3-rows .tr[data-i="0"] [data-k=b]','06.10');await p.fill('#f3-rows .tr[data-i="0"] [data-k=t]','09.10');await p.fill('#f3-rows .tr[data-i="0"] [data-k=odo]','1120');await set('odo_akhir','1120');await set('tiba_parkir','18.00');await set('parkir','A');await p.click('#f3f button[type=submit]:not([data-next])');await p.click('#en-sync');await p.waitForTimeout(1500);
ok(/2\s+entri menunggu unggah/.test(await T('en-st')),'entri tetap aman di perangkat: '+(await T('en-st')).replace(/\n/g,' | '));
ok(/1 \/ 3\.500/.test(await T('hs'))&&/120 km/.test(await T('hs')),'hasil survei tetap dihitung dari entri di perangkat (1 truk-hari, 120 km)');
// server diaktifkan (gudang + PIN), admin membuka halaman lagi
await start({SURVEY_PIN:'pin-saya'});await p.reload();await p.waitForTimeout(4500);
ok(/Tersambung sebagai admin/.test(await T('en-st'))&&/Semua entri sudah terunggah/.test(await T('en-st')),'server aktif → entri tertunda terunggah otomatis: '+(await T('en-st')).replace(/\n/g,' | '));
const doc=JSON.parse(fs.readFileSync(require('path').join(__dirname,'.data.json'),'utf8'));ok(Object.keys(doc.recs).length===2&&doc.recs['f3:P2-001:1'].data.odo_akhir===1120,'data sampai di server: '+Object.keys(doc.recs).join(', '));
ok(errs.length===0,'tanpa galat JS '+errs.join('|'));await b.close();try{execSync("pkill -f 'node server.js'")}catch(e){}process.exit(fail?1:0)})();
