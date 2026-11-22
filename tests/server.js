// server pengembangan lokal: berkas statis + /api/survey dengan penyimpanan berkas
const http=require('http'),fs=require('fs'),path=require('path'),ROOT=path.resolve(__dirname,'..');
if(!process.env.NOREADY){process.env.SURVEY_LOCAL_FILE=process.env.SURVEY_LOCAL_FILE||path.join(__dirname,'.data.json');process.env.SURVEY_PIN=process.env.SURVEY_PIN||'uji-1234'}
const api=require(ROOT+'/api/survey.js'),MT={'.html':'text/html; charset=utf-8','.js':'application/javascript','.json':'application/json'};
http.createServer((req,res)=>{const u=new URL(req.url,'http://x');
 if(u.pathname==='/api/survey'){let b='';req.on('data',c=>b+=c);req.on('end',()=>{try{req.body=b?JSON.parse(b):undefined}catch(e){req.body=b}req.query=Object.fromEntries(u.searchParams);res.status=c=>{res.statusCode=c;return res};res.json=o=>{res.setHeader('content-type','application/json');res.end(JSON.stringify(o))};api(req,res)});return}
 let f=path.join(ROOT,u.pathname==='/'?'index.html':decodeURIComponent(u.pathname));if(!f.startsWith(ROOT)||!fs.existsSync(f)){res.statusCode=404;return res.end('404')}
 res.setHeader('content-type',MT[path.extname(f)]||'application/octet-stream');fs.createReadStream(f).pipe(res)}).listen(8765,()=>console.log('dev server 8765'));
