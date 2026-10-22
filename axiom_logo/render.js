const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});const p=await b.newPage({viewport:{width:1024,height:1200}});
await p.goto('file://'+process.cwd()+'/logo.svg');await p.screenshot({path:'axiom_logo.png',omitBackground:true});await b.close();})();
