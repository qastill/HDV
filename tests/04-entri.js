const auto=require('./auto.js');const {chromium,devices}=require('playwright');const fs=require('fs');const URL=process.env.URL||'http://localhost:8765/',PIN=process.env.PIN||'uji-1234',POOL=process.env.POOL||'P3';
(async()=>{const b=await chromium.launch();let fail=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fail++};
const ctx=await b.newContext({viewport:{width:1400,height:1000}});const p=auto(await ctx.newPage());const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errs.push(m.text())});p.on('dialog',d=>d.accept());
await p.goto(URL);await p.waitForTimeout(3500);const T=id=>p.evaluate(i=>document.getElementById(i)?.textContent||'',id);
ok((await T('hs-sub')).includes('Belum ada entri')||/lembar diary/.test(await T('hs-sub')),'bagian Hasil survei tampil: '+(await T('hs-sub')).slice(0,70));
// masuk
await p.fill('#en-pin',PIN);await p.fill('#en-enm','Uji Otomatis');await p.selectOption('#en-pool',POOL);await p.click('#en-login button[type=submit]');await p.waitForTimeout(1500);
ok(/admin/.test(await T('en-st')),'masuk dengan PIN → '+(await T('en-st')).replace(/\n/g,' | '));
// F1
await p.click('.tab[data-tab=f1]');const set=async(k,v)=>{const el=p.locator(`#en-body [data-k="${k}"]`).first();const tag=await el.evaluate(e=>e.tagName);if(tag==='SELECT')await el.selectOption(v);else await el.fill(String(v))};
for(const [k,v] of [['perusahaan','PT Uji Rahasia'],['nama_pool','Pool Uji'],['kab','Subang'],['prov','Jawa Barat'],['lat','-6.2637'],['lon','107.1758'],['jenis_usaha','3pl'],['pola','P'],['hdv_rigid','20'],['hdv_tt','40'],['pln_va','197000'],['beban_kw','120'],['jarak_gardu_m','150'],['ruang_charger','Y'],['n_hdv','60'],['t_hdv','50']])await set(k,v);
await p.locator('#en-body [data-k=komoditas] input[value="6"]').check();
const f1c=await T('f1-calc');ok(/60 unit/.test(f1c)&&/50 \+ 5 = 55/.test(f1c)&&/Sukatani/.test(f1c)&&!/500/.test(f1c),'F1 hitung otomatis: armada, sampel+cadangan, GI terdekat → '+f1c.replace(/\n/g,' ').slice(0,150));
await p.click('#f1f button[type=submit]');await p.waitForTimeout(300);
// F2: dua truk
await p.click('.tab[data-tab=f2]');
for(const t of [{kelas:'H',status:'U',jenis:'T',bodi:'car carrier',merek:'Hino',tahun:2019,jbb:26,bbm:'S',kml:3.2,pola:'P',komoditas:'6',rute:'Patimban → Cikarang',odo0:120000,gps:'Y',parkir:'A',tiba_h0:'19.30'},{kelas:'H',status:'U',jenis:'R',bodi:'box',merek:'Isuzu',tahun:2021,jbb:16,bbm:'S',kml:4.0,pola:'P',komoditas:'6',rute:'Patimban → Karawang',odo0:80000,gps:'T',parkir:'A',tiba_h0:'18.10'}]){for(const [k,v] of Object.entries(t))await set(k,v);await p.click('#f2f button[type=submit]');await p.waitForTimeout(250)}
ok((await p.locator('#en-body tr[data-t]').count())===2,'F2: dua truk terdaftar, kode otomatis '+(await p.locator('#en-body tr[data-t] td b').allInnerTexts()).join(', '));
// F3 hari 1 truk 1
await p.click('.tab[data-tab=mx]');await p.waitForTimeout(200);ok((await T('en-body')).includes('0 dari 14 lembar'),'tabel lembar harian: 0 dari 14');
await p.locator('#en-body td[data-d]').first().click();await p.waitForTimeout(300);
ok((await p.inputValue('#e-odo_awal'))==='120000','F3 odometer awal terisi dari F2 (120000)');
await set('mulai','06.00');
const trip=async(i,o)=>{for(const [k,v] of Object.entries(o)){const el=p.locator(`#f3-rows .tr[data-i="${i}"] [data-k="${k}"]`);if((await el.evaluate(e=>e.tagName))==='SELECT')await el.selectOption(v);else await el.fill(String(v))}};
await trip(0,{b:'06.30',ke:'Pelabuhan Patimban',t:'08.00',odo:120060,keg:'1',lama:90,muat:'K',sopir:'1',sumber:'S'});
await trip(1,{b:'09.30',dari:'Patimban',ke:'Cikarang',t:'12.30',odo:120170,keg:'2',lama:60,bbm:80,muat:'P',sopir:'1',sumber:'G'});
await p.click('#f3-add');await trip(2,{b:'13.30',dari:'Cikarang',ke:'Pool',t:'17.45',odo:120285,keg:'6',muat:'K',sopir:'1',sumber:'S'});
await set('odo_akhir',120285);await set('tiba_parkir','17.45');await set('parkir','A');
let chk=await T('f3-chk');ok(/285 km/.test(chk)&&/Lolos/.test(chk)&&/342 kWh/.test(chk),'F3 cek logika langsung: 285 km, lolos, setara 342 kWh');
// buat salah: odometer turun
await trip(1,{odo:120010});chk=await T('f3-chk');ok(/odometer turun/.test(chk)&&/Saran kualitas: B/.test(chk),'F3 mendeteksi odometer turun → saran kualitas B');await trip(1,{odo:120170});
await p.click('#f3f button[data-next]');await p.waitForTimeout(400);
ok((await p.inputValue('#f3-h'))==='2'&&(await p.inputValue('#e-odo_awal'))==='120285','simpan & lanjut → hari 2, odometer awal 120285 dari hari 1');
// hari 2: lewat tengah malam + parkir di luar pool
await set('mulai','07.00');await trip(0,{b:'07.15',ke:'Karawang',t:'10.00',odo:120400,keg:'2',lama:45,muat:'P',sopir:'1',sumber:'S'});await trip(1,{b:'11.00',dari:'Karawang',ke:'Patimban',t:'01.20+1',odo:120650,keg:'1',lama:30,muat:'S',sopir:'1',sumber:'S'});
await set('odo_akhir',120650);await set('tiba_parkir','01.20+1');await set('parkir','B');await set('lokasi_parkir','Patimban');
chk=await T('f3-chk');ok(/365 km/.test(chk)&&/01\.20 \(\+1\)/.test(chk),'F3 menangani jam lewat tengah malam: 365 km, parkir 01.20 (+1)');console.log('   cek:',chk.replace(/\n+/g,' | ').slice(0,260));
await p.click('#f3f button[type=submit]:not([data-next])');await p.waitForTimeout(300);
// hari tidak jalan untuk truk 2
await p.selectOption('#f3-t',POOL+'-002');await p.waitForTimeout(300);await set('status','T');await set('alasan','servis');await p.click('#f3f button[type=submit]:not([data-next])');await p.waitForTimeout(300);
// unggah
ok(/6\s+entri menunggu/.test(await T('en-st')),'entri menunggu unggah: '+(await T('en-st')).replace(/\n/g,' | '));
await p.click('#en-sync');await p.waitForTimeout(2500);ok(/Semua entri sudah terunggah/.test(await T('en-st')),'Unggah sekarang → '+(await T('en-st')).replace(/\n/g,' | '));
// hasil & monitoring ikut berubah
const hs=await T('hs');ok(/3 \/ 3\.500/.test(hs)&&/Berapa jauh truk berjalan/i.test(hs)&&/Di mana truk bermalam/i.test(hs)&&/Kebutuhan daya tiap pool/i.test(hs)&&!/NaN|undefined|Infinity/.test(hs),'Hasil survei terisi otomatis, tanpa NaN');
ok(/3 \/ 3\.500/.test(await T('mk'))&&/dihitung otomatis/.test(await T('mon-sub')),'Monitoring ikut terhitung dari entri: '+(await T('mon-sub')));
const row=await p.evaluate(P=>[...document.querySelectorAll('#hs table tbody tr')].map(r=>r.innerText.replace(/\t/g,' | ')).find(t=>t.startsWith(P)),POOL);console.log('   pool:',row);
ok(/60/.test(row)&&/197/.test(row)&&/Sukatani/.test(row),'tabel kebutuhan daya pool memakai armada F1, daya PLN, dan GI terdekat');
// pengunjung tanpa PIN: lihat hasil, tidak lihat identitas
const c2=await b.newContext({viewport:{width:1400,height:1000}});const v=auto(await c2.newPage());await v.goto(URL);await v.waitForTimeout(3500);
const pub=await v.evaluate(P=>({hs:document.getElementById('hs').textContent,st:surveiDebug.state(),html:document.body.textContent}),POOL);
ok(/3 \/ 3\.500/.test(pub.hs)&&!pub.st.auth,'pengunjung tanpa PIN melihat hasil yang sama (mode baca)');
ok(!JSON.stringify(pub.st.S).includes('PT Uji Rahasia')&&!pub.html.includes('PT Uji Rahasia')&&!JSON.stringify(pub.st.S).includes('Uji Otomatis'),'nama perusahaan & enumerator TIDAK terkirim ke pengunjung tanpa PIN');
await v.selectOption('#en-pool',POOL);await v.click('.tab[data-tab=f1]');await v.waitForTimeout(200);ok(await v.locator('#f1f button[type=submit]').isDisabled(),'tanpa PIN, profil pool tidak bisa ditimpa');
// luring: entri tetap aman
await ctx.route('**/api/survey',r=>r.abort());await p.click('.tab[data-tab=f3]');await p.selectOption('#f3-t',POOL+'-002');await p.selectOption('#f3-h','2');await p.waitForTimeout(300);await set('status','T');await set('alasan','libur');await p.click('#f3f button[type=submit]:not([data-next])');await p.click('#en-sync');await p.waitForTimeout(1500);
ok(/1\s+entri menunggu unggah/.test(await T('en-st'))&&/aman di perangkat/.test(await T('en-msg')),'tanpa sinyal: entri tetap tersimpan → '+(await T('en-msg')).slice(0,90));
await ctx.unroute('**/api/survey');await p.reload();await p.waitForTimeout(4000);ok(/Semua entri sudah terunggah/.test(await T('en-st')),'sinyal kembali + muat ulang → entri tertunda terunggah otomatis');
ok(/4 \/ 3\.500/.test(await T('hs')),'hasil sekarang 4 truk-hari');
// CSV
const [dl]=await Promise.all([p.waitForEvent('download'),p.click('[data-csv=trip]')]);const csv=fs.readFileSync(await dl.path(),'utf8');ok(csv.split('\n').length===6&&/Pelabuhan Patimban/.test(csv),'unduh CSV perjalanan: '+(csv.split('\n').length-1)+' baris');
const [dk]=await Promise.all([p.waitForEvent('download'),p.click('[data-csv=kamus]')]);ok(fs.readFileSync(await dk.path(),'utf8').split('\n').length>60,'unduh kamus data');
await p.click('.tab[data-tab=mx]');await p.waitForTimeout(300);await p.locator('#en').screenshot({path:'e-matrix.png'});
ok(errs.length===0,'tanpa galat JS '+errs.join(' | '));await b.close();process.exit(fail?1:0)})();
