const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{const [,,src,out,w,h]=process.argv;const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});const p=await b.newPage({viewport:{width:+w,height:+h}});
await p.goto('file://'+process.cwd()+'/'+src);await p.screenshot({path:out,omitBackground:true});await b.close();})();
