// Requires Node.js 22+ and Edge, or BROWSER_PATH pointing to a Chromium browser.
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { spawn } = require("node:child_process");
const assert = require("node:assert/strict");
const target = path.resolve(__dirname, "..");
const build = path.join(target, "build");
const output = path.join(target, "test-results/shipments-browser");
fs.mkdirSync(output, { recursive: true });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let edge, server, ws;
const pending = new Map();
let seq = 0;
const exceptions = [];
const calls = [];
let account;
const normal = {
  id: "merchant-1",
  role: "user",
  firstName: "Ashamco",
  lastName: "Merchant",
  email: "merchant@example.test",
  phone: "+966-555123456",
  isRegistered: true,
  isBlocked: false,
  verificationStatus: "approved",
  emailVerified: true,
  phoneVerified: true,
};
function send(method, params = {}) {
  const id = ++seq;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error("CDP timeout: " + method));
    }, 15000);
    pending.set(id, {
      resolve: (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      reject: (error) => {
        clearTimeout(timer);
        reject(error);
      },
    });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const result = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (result.exceptionDetails)
    throw new Error(
      result.exceptionDetails.text +
        " " +
        result.exceptionDetails.exception?.description,
    );
  return result.result.value;
}
async function until(expression, label) {
  for (let i = 0; i < 150; i++) {
    if (await evaluate(expression)) return;
    await sleep(100);
  }
  throw new Error(
    "Timed out: " + label + "\n" + (await evaluate("document.body.innerText")),
  );
}
async function navigate(route) {
  await send("Page.navigate", { url: "http://127.0.0.1:3138" + route });
}
async function fill(name, value) {
  await evaluate(
    `(()=>{const input=document.querySelector('input[name=${JSON.stringify(name)}]');if(!input)throw new Error('Missing input ${name}');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(value)});input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));})()`,
  );
}
async function submit() {
  await evaluate("document.querySelector('button[type=submit]').click()");
}
async function choosePlace(name, value) {
  await fill(name, value);
  await until(
    "Boolean(document.querySelector('[role=option]'))",
    "place options",
  );
  await evaluate("document.querySelector('[role=option]').click()");
}
async function reset(route = "/sign-in") {
  await evaluate(
    "localStorage.clear();sessionStorage.clear();localStorage.setItem('my-language','en')",
  );
  await navigate(route);
  await until(
    "Boolean(document.querySelector('form')) || (location.pathname.includes('delete') && document.body.innerText.includes('info@ashamcoex.com'))",
    route,
  );
}
async function login(email) {
  await reset();
  await fill("email", email);
  await fill("password", "password123");
  await submit();
}

async function fillSelector(selector, value) {
  await evaluate(
    `(()=>{const input=document.querySelector(${JSON.stringify(selector)});if(!input)throw new Error('Missing input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(value)});input.dispatchEvent(new Event('input',{bubbles:true}));})()`,
  );
}
async function clickText(text, selector = "button") {
  await evaluate(
    `(()=>{const element=[...document.querySelectorAll(${JSON.stringify(selector)})].find(element=>element.textContent.trim()===${JSON.stringify(text)});if(!element)throw new Error('Missing action '+${JSON.stringify(text)});element.click();})()`,
  );
}

async function fulfill(
  event,
  status,
  result,
  contentType = "application/json",
) {
  await send("Fetch.fulfillRequest", {
    requestId: event.requestId,
    responseCode: status,
    responseHeaders: [
      { name: "Content-Type", value: contentType },
      { name: "Access-Control-Allow-Origin", value: "*" },
      { name: "Access-Control-Allow-Headers", value: "*" },
      {
        name: "Access-Control-Allow-Methods",
        value: "GET,POST,PATCH,DELETE,OPTIONS",
      },
      { name: "Cache-Control", value: "no-store" },
    ],
    body:
      status === 204
        ? ""
        : Buffer.from(
            typeof result === "string" ? result : JSON.stringify(result),
          ).toString("base64"),
  });
}


const {PDFDocument}=require(path.join(target,'node_modules/pdf-lib'));
const countryId='65fd1a1c1fdbc094e3369b29';
const countries=[{id:countryId,name:{en:'Saudi Arabia',ar:'السعودية'},code:'SA'}];
const carriers=[{id:'carrier-1',name:'Fixture Carrier',isActive:true,hasState:true,isEnglish:false,serviceName:'aramex',shippingMethods:['local','international','cashOnDelivery']},{id:'carrier-auth',name:'Authorized Carrier',isActive:true,hasState:false,isAuthorizationRequired:true,shippingMethods:['local']}];
const states=[{id:'state-1',name:{en:'Riyadh',ar:'الرياض'},countryId,shipmentStates:[{shippingCompanyId:'carrier-1',name:'RIYADH'}]}];
const cities=[{id:'city-1',name:{en:'Riyadh City',ar:'الرياض'},countryId,stateId:'state-1',postalCode:'12345',shipmentCities:[{shippingCompanyId:'carrier-1',name:'RIYADH CITY'}]}];
const users=[{...normal,firstName:'Merchant',lastName:'Alpha',isAuthorized:false,balance:10000,codBalance:50},{...normal,id:'merchant-2',firstName:'Merchant',lastName:'Beta',isAuthorized:true,balance:500,codBalance:0}];
const separator=' - العنوان الوطني: ';
const contacts=[{id:'sender-1',type:'sender',fullName:'Saved Sender',phone:'+966-555123456',address:{countryId,stateId:'state-1',cityId:'city-1',street:'Sender Street'+separator+'S123',zipCode:'12345'}},{id:'receiver-1',type:'receiver',fullName:'Saved Receiver',phone:'+971-555987654',address:{countryId,stateId:'state-1',cityId:'city-1',street:'Receiver Street'+separator+'R123',zipCode:'12345'}}];
const details={senderName:'Original Sender',senderPhone:'+966-555123456',senderCountryId:countryId,senderCountryName:'Saudi Arabia',senderCountryCode:'SA',senderStateId:'state-1',senderStateName:'RIYADH',senderCityId:'city-1',senderCityName:'RIYADH CITY',senderStreet:'Sender Street'+separator+'S123',senderZipCode:'12345',receiverName:'Original Receiver',receiverPhone:'+971-555987654',receiverCountryId:countryId,receiverCountryName:'Saudi Arabia',receiverCountryCode:'SA',receiverStateId:'state-1',receiverStateName:'RIYADH',receiverCityId:'city-1',receiverCityName:'RIYADH CITY',receiverStreet:'Receiver Street'+separator+'R123',receiverZipCode:'12345',length:1,width:1,height:1,weight:1,packagesCount:1,description:'Fixture parcel'};
const records=Array.from({length:24},(_,i)=>({id:'shipment-'+(i+1),shippingCompanyId:'carrier-1',shippingCompany:carriers[0],userId:i<20?'merchant-1':'merchant-2',user:users[i<20?0:1],updatedById:'staff-1',updatedBy:{id:'staff-1',firstName:'Staff',lastName:'One'},method:i===3?'international':'local',type:'box',status:i===1?'failed':'processing',trackingNumber:'TRACK-'+(i+1),trackingUrl:'https://tracking.example.test/'+i,labelUrl:i===2?'':`https://reports.example.test/label-${i}.pdf`,imageUrl:'https://reports.example.test/parcel.png',isCod:i%2===0,shipmentCod:{id:'cod-'+(i+1),codPrice:50,codStatus:'pending',reference:'REF',updatedAt:'2026-10-24T12:00:00Z'},shipmentPrice:{shippingCompanyPrice:10,extraWeightPrice:0,total:12},shipmentDetails:{...details,id:'details-'+i,receiverName:'Receiver '+(i+1)},shipmentProducts:[{title:'Commercial item',price:15,quantity:3}],trackingStats:[{description:'Accepted',date:'2026-10-22',location:'Riyadh'},{description:'In transit',date:'2026-10-23',location:'Riyadh'}],createdAt:'2026-10-24T12:00:00Z'}));
let failCodId='',failList=false,failWrite=false,failQuote=false,failCreateReceiver='',failFile=false,asyncCreate=false,contactFailure=false,contactCreates=0,shipmentCreates=0,passed=0;
const fixtureErrors=[];
function pass(name){passed++;console.log('PASS '+name);}
const listCalls=()=>calls.filter(x=>x.url==='/v1/shipments'&&x.method==='GET');
const creates=()=>calls.filter(x=>x.url==='/v1/shipments'&&x.method==='POST');
async function intercept(event){const req=event.request,url=new URL(req.url),method=req.method;if(method==='OPTIONS')return fulfill(event,204,'');
 if(url.hostname==='reports.example.test'){if(failFile)return fulfill(event,500,'failed');const pdf=await PDFDocument.create();pdf.addPage();const bytes=await pdf.save();return send('Fetch.fulfillRequest',{requestId:event.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/pdf'},{name:'Access-Control-Allow-Origin',value:'*'}],body:Buffer.from(bytes).toString('base64')});}
 const query=Object.fromEntries(url.searchParams),body=JSON.parse(req.postData||'{}');calls.push({url:url.pathname,method,query,body,statuses:url.searchParams.getAll('status'),codStatuses:url.searchParams.getAll('codStatus')});let status=200,result={};
 try{
 if(url.pathname.endsWith('/auth-sessions/login')){const kind=body.email.split('@')[0];account={...normal,id:'staff-1',role:'admin',balance:10000};if(kind==='merchant')account={...users[0]};if(['viewer','editor','noview','denied'].includes(kind)){account.role='employee';account.features=kind==='denied'?[{feature:'merchants',accessView:true}]:[{feature:'shipments',accessView:kind!=='noview',accessUpdate:kind==='editor',accessCreate:kind==='editor'}];}result={user:account,accessToken:'shipments-access',refreshToken:'shipments-refresh'};}
 else if(url.pathname==='/v1/users/me')result=account?.role==='user'?users.find(x=>x.id===account.id):account||normal;
 else if(url.pathname==='/v1/users')result={results:query.type==='user'?users:[{id:'staff-1',firstName:'Staff',lastName:'One'}],total:2};
 else if(url.pathname.startsWith('/v1/users/'))result=users.find(x=>x.id===url.pathname.split('/').at(-1))||account;
 else if(url.pathname==='/v1/shipping-companies')result={results:carriers,total:carriers.length};
 else if(url.pathname.startsWith('/v1/shipping-companies/'))result=carriers.find(x=>x.id===url.pathname.split('/').at(-1));
 else if(['/v1/countries','/v1/states','/v1/cities'].includes(url.pathname)){const list=url.pathname.endsWith('countries')?countries:url.pathname.endsWith('states')?states:cities;result={results:list,total:list.length};}
 else if(/^\/v1\/(countries|states|cities)\//.test(url.pathname))result=[...countries,...states,...cities].find(x=>x.id===url.pathname.split('/').at(-1));
 else if(url.pathname==='/v1/shipping-users'){if(method==='POST'){contactCreates++;if(contactFailure){status=500;result={message:'Contact save failed'};}else{result={...body,id:'contact-created-'+contactCreates};contacts.push(result);}}else {const list=contacts.filter(x=>!query.type||x.type===query.type);result={results:list,total:list.length};}}
 else if(url.pathname.startsWith('/v1/shipping-users/'))result=contacts.find(x=>x.id===url.pathname.split('/').at(-1));
 else if(url.pathname==='/v1/coupons')result={results:[{id:'coupon-1',code:'SAVE',shippingCompanyId:'carrier-1',isActive:true,expiresAt:'2030-01-01',type:'fixed',value:2}]};
 else if(url.pathname==='/v1/shipments/review'){if(failQuote){status=500;result={message:'Quote failed'};}else result={shippingCompanyPrice:10,extraWeightPrice:0,total:12};}
 else if(url.pathname==='/v1/shipments/shipment/summary')result={shippingCompanyAnalyticData:[{label:'Fixture Carrier',value:10}],methodAnalyticData:[{label:'local',value:10}],userAnalyticData:[{label:'Merchant Alpha',value:10}]};
 else if(url.pathname==='/v1/shipments/shipment/label')result={labelUrl:'https://reports.example.test/generated.pdf'};
 else if(url.pathname.startsWith('/v1/shipments/shipment/tracking/'))result={message:'Synced'};
 else if(url.pathname==='/v1/shipments'){
  if(method==='POST'){shipmentCreates++;if(failCreateReceiver&&body.receiverName===failCreateReceiver){status=500;result={message:'Receiver creation failed'};}else {const row={...body,id:'created-'+shipmentCreates,userId:account.id,user:account,shippingCompany:carriers[0],status:'processing',trackingNumber:'NEW-'+shipmentCreates,shipmentDetails:{...body,id:'detail-created'},shipmentPrice:{total:12},createdAt:'2026-10-25T00:00:00Z'};records.push(row);result=asyncCreate?{message:'Accepted for processing'}:row;status=201;}}
  else if(failList){status=500;result={message:'List failed'};}else {const list=records.filter(x=>(account.role!=='user'||x.userId===account.id)&&(!query.userId||x.userId===query.userId)&&(!query.shippingCompanyId||x.shippingCompanyId===query.shippingCompanyId)&&(!query.method||x.method===query.method)&&(query.isCod===undefined||x.isCod===(query.isCod==='true'))&&(!query.search||JSON.stringify(x).toLowerCase().includes(query.search.toLowerCase()))&&(!url.searchParams.getAll('status').length||url.searchParams.getAll('status').includes(x.status)));result={results:list.slice(Number(query.page)*Number(query.pageSize),(Number(query.page)+1)*Number(query.pageSize)),total:list.length};}
 }
 else if(/^\/v1\/shipments\/[^/]+\/(review-extra-weight-price|deduct-extra-weight-price)$/.test(url.pathname)){if(failWrite){status=500;result={message:'Write failed'};}else result=url.pathname.includes('/review-')?{extraWeightPrice:Number(body.weight)*2}:{};}
 else if(url.pathname.startsWith('/v1/shipments/')){const row=records.find(x=>x.id===url.pathname.split('/').at(-1));if(!row){status=404;result={message:'Not found'};}else if(method==='PATCH'){if(failWrite){status=500;result={message:'Write failed'};}else {Object.assign(row,body);result=row;}}else result=row;}
 else if(url.pathname.startsWith('/v1/shipment-cods/')){if(failWrite||url.pathname.endsWith('/'+failCodId)){status=500;result={message:'Write failed'};}else {const row=records.find(x=>x.shipmentCod?.id===url.pathname.split('/').at(-1));assert.deepEqual(body,{codStatus:'paid'});row.shipmentCod.codStatus='paid';result={};}}
 else if(url.pathname==='/v1/transactions')result={results:Array.from({length:12},(_,i)=>({id:'tx-'+(i+1),reference:'TX-TRACK-'+(i+1),userId:query.userId,type:'withdraw',relatedBalance:'wallet',title:'Shipment cost',amount:12,currentBalance:88,previousBalance:100})),total:12};
 else if(url.pathname==='/v1/requests'&&method==='POST'){assert.equal(body.type,'cancelShipment');assert.equal(body.userId,account.id);result={id:'request-1'};}
 else if(url.pathname==='/v1/alerts'||url.pathname.includes('notification'))result={results:[],total:0};
 else {status=404;result={message:'Unexpected fixture '+url.pathname};fixtureErrors.push(result.message);}
 }catch(error){fixtureErrors.push(error.stack);status=500;result={message:error.message};}
 return fulfill(event,status,result);
}
const exists = (selector) =>
  `Boolean(document.querySelector(${JSON.stringify(selector)}))`;
async function click(selector) {
  await until(exists(selector), "action " + selector);
  await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
}
async function clickReady(selector) {
  await until(
    `${exists(selector)}&&!document.querySelector(${JSON.stringify(selector)}).disabled`,
    "enabled " + selector,
  );
  await click(selector);
}
async function fillField(name, value) {
  await until(exists(`[name="${name}"]`), "field " + name);
  await evaluate(
    `(()=>{const input=document.querySelector('input[name=${JSON.stringify(name)}],textarea[name=${JSON.stringify(name)}]');Object.getOwnPropertyDescriptor(input.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(value)});input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));input.dispatchEvent(new FocusEvent('blur',{bubbles:true}));})()`,
  );
}
async function escape() {
  await send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Escape",
    code: "Escape",
  });
  await send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: "Escape",
    code: "Escape",
  });
  await sleep(100);
}
async function choose(name, value) {
  await evaluate(
    `document.querySelector('input[name=${JSON.stringify(name)}],textarea[name=${JSON.stringify(name)}]').closest('.MuiFormControl-root').querySelector('[role=combobox]').dispatchEvent(new MouseEvent('mousedown',{bubbles:true}))`,
  );
  await until(
    exists(`[role=option][data-value="${value}"]`),
    "select " + value,
  );
  await click(`[role=option][data-value="${value}"]`);
}
async function selectUser(name, text) {
  await evaluate(
    `(()=>{const input=document.querySelector('input[name=${JSON.stringify(name)}],textarea[name=${JSON.stringify(name)}]');input.focus();input.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',code:'ArrowDown',bubbles:true}));})()`,
  );
  await fillField(name, text);
  await until(
    `Boolean([...document.querySelectorAll('[role=option]')].find(x=>x.textContent.includes(${JSON.stringify(text)})))`,
    "account " + text,
  );
  await evaluate(
    `[...document.querySelectorAll('[role=option]')].find(x=>x.textContent.includes(${JSON.stringify(text)})).click()`,
  );
}
async function filterControl(label) {
  return evaluate(
    `(()=>{const title=[...document.querySelectorAll('[role=menu] p')].find(x=>x.textContent.toLowerCase()===${JSON.stringify(label.toLowerCase())});if(!title)throw new Error('Missing filter '+${JSON.stringify(label)});title.parentElement.querySelector('[role=combobox]').dispatchEvent(new MouseEvent('mousedown',{bubbles:true}));})()`,
  );
}
async function chooseFilter(label, value) {
  await filterControl(label);
  await until(
    exists(`[role=option][data-value="${value}"]`),
    "filter option " + value,
  );
  await click(`[role=option][data-value="${value}"]`);
}
async function screenshot(name) {
  await sleep(400);
  const shot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(
    path.join(output, name + ".png"),
    Buffer.from(shot.data, "base64"),
  );
}
async function downloadedSince(start, type) {
  let file;
  for (let i = 0; i < 150; i++) {
    file = fs
      .readdirSync(output)
      .filter((x) => x.endsWith("." + type))
      .map((x) => path.join(output, x))
      .find((x) => fs.statSync(x).mtimeMs >= start);
    if (file && !fs.existsSync(file + ".crdownload")) break;
    await sleep(100);
  }
  assert.ok(file, "new " + type + " download");
  return file;
}

async function shipmentList(){await navigate('/shipments/all/all');await until(exists('[data-testid=shipments-table]'),'shipments table');await until(exists('[role=row][data-id]'),'shipment rows');}
async function openOperation(title){await click('[aria-label="Shipment actions"]');await clickText(title,'[role=menuitem]');await until(exists('[role=dialog]'),'operation dialog');}
async function newContact(prefix,path=''){await fillField(path+prefix+'Name','New '+(prefix==='sender'?'Sender':'Receiver'));await fillField(path+prefix+'Phone','+966555123456');await selectUser(path+prefix+'StateId','Riyadh');await selectUser(path+prefix+'CityId','Riyadh City');await fillField(path+prefix+'Street','New Street');await fillField(path+prefix+'NationalAddress','N123');}
async function main() {
  server = http.createServer((req, res) => {
    let file = path.join(
      build,
      decodeURIComponent(new URL(req.url, "http://localhost").pathname),
    );
    if (!file.startsWith(build)) {
      res.writeHead(403);
      return res.end();
    }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory())
      file = path.join(build, "index.html");
    const mime = {
      ".html": "text/html",
      ".js": "application/javascript",
      ".css": "text/css",
      ".json": "application/json",
      ".png": "image/png",
      ".svg": "image/svg+xml",
      ".woff2": "font/woff2",
    };
    res.setHeader(
      "Content-Type",
      mime[path.extname(file)] || "application/octet-stream",
    );
    res.end(fs.readFileSync(file));
  });
  await new Promise((resolve) => server.listen(3138, "127.0.0.1", resolve));
  edge = spawn(
    process.env.BROWSER_PATH ||
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    [
      "--headless=new",
      "--disable-gpu",
      "--disable-extensions",
      "--disable-component-extensions-with-background-pages",
      "--disable-features=msEdgeSidebarV2",
      "--no-first-run",
      "--no-default-browser-check",
      "--remote-debugging-port=9338",
      "--user-data-dir=" + path.join(output, "edge-profile"),
      "about:blank",
    ],
    { windowsHide: true, stdio: "ignore" },
  );
  fs.writeFileSync(path.join(output, "edge.pid"), String(edge.pid));
  edge.on("error", (error) => {
    console.error(error);
    process.exitCode = 1;
  });
  let pages;
  for (let i = 0; i < 60; i++) {
    try {
      pages = await (
        await fetch("http://127.0.0.1:9338/json", {
          signal: AbortSignal.timeout(500),
        })
      ).json();
      break;
    } catch {
      if (edge.exitCode !== null)
        throw new Error("Browser exited with code " + edge.exitCode);
      await sleep(150);
    }
  }
  if (!pages) throw new Error("Browser did not start");
  const page = pages.find((p) => p.type === "page");
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });
  ws.onmessage = (message) => {
    const event = JSON.parse(message.data);
    if (event.id) {
      const p = pending.get(event.id);
      if (p) {
        pending.delete(event.id);
        event.error
          ? p.reject(new Error(event.error.message))
          : p.resolve(event.result);
      }
    } else if (event.method === "Fetch.requestPaused")
      intercept(event.params).catch((error) => console.error(error));
    else if (event.method === "Runtime.exceptionThrown")
      exceptions.push({
        description:
          event.params.exceptionDetails.exception?.description ||
          event.params.exceptionDetails.text,
        url: event.params.exceptionDetails.url,
        stack: event.params.exceptionDetails.stackTrace,
      });
  };
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Fetch.enable", {
    patterns: [
      { urlPattern: "*/v1/*" },
      { urlPattern: "https://reports.example.test/*" },
    ],
  });
  await send("Browser.setPermission", {
    permission: { name: "notifications" },
    setting: "denied",
    origin: "http://127.0.0.1:3138",
  });
  const languageScript = await send("Page.addScriptToEvaluateOnNewDocument", {
    source:
      "localStorage.setItem('my-language','en');Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__copiedText=text}}});document.execCommand=()=>true",
  });
  await navigate("/sign-in");
  await until(
    "Boolean(document.querySelector('input[name=email]')) || location.pathname==='/home'",
    "initial browser load",
  );

  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send("Browser.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: output,
  });


  await reset('/shipments/all/all');await until("location.pathname==='/sign-in'",'guest');pass('Shipment routes require authentication');
  await login('denied@example.test');await until("location.pathname==='/home'",'denied');let before=listCalls().length;await navigate('/shipments/all/all');await sleep(500);assert.equal(listCalls().length,before);pass('Staff without shipment scope cannot fetch list data');
  await login('noview@example.test');await until("location.pathname==='/home'",'no view');before=listCalls().length;await navigate('/shipments/all/all');await sleep(500);assert.equal(listCalls().length,before);pass('View permission is required even when the shipment scope exists');
  await login('viewer@example.test');await until("location.pathname==='/home'",'viewer');await shipmentList();assert.equal(await evaluate("document.querySelectorAll('[role=row][data-id]').length"),10);assert.equal(await evaluate("Boolean(document.querySelector('[data-testid=add-shipment]'))"),false);assert.equal(await evaluate("Boolean(document.querySelector('button[aria-label^=Shipment]'))"),false);pass('Read-only staff get ten-row pagination without create/update controls');
  await click('[aria-label="Go to next page"]');await until("[...document.querySelectorAll('[role=row][data-id]')].some(x=>x.dataset.id==='shipment-11')",'second page');assert.equal(listCalls().at(-1).query.page,'1');pass('Server pagination keeps requested page and last total');
  await fillSelector('[data-testid=shipments-search]','TRACK-3');await until("document.querySelectorAll('[role=row][data-id]').length===1",'search');assert.equal(listCalls().at(-1).query.page,'0');pass('Search resets pagination and filters backend requests');
  const start=Date.now();await clickText('Export All Pages');const workbookPath=await downloadedSince(start,'xlsx');const XLSX=require(path.join(target,'node_modules/xlsx')),book=XLSX.readFile(workbookPath),sheet=XLSX.utils.sheet_to_json(book.Sheets[book.SheetNames[0]],{defval:''});assert.equal(listCalls().at(-1).query.pageSize,'50000');assert.ok(sheet.some(x=>Object.values(x).includes('TRACK-3')));assert.ok(sheet.some(x=>Object.values(x).includes('12.00 ر.س')||Object.values(x).some(v=>String(v).includes('12'))));assert.ok(!sheet.some(x=>Object.values(x).includes('NaN')));pass('Filtered export-all downloads a workbook with count and nested price totals');
  await shipmentList();await click('[data-testid=shipments-view-toggle]');await until(exists('[data-testid=shipments-summary]'),'charts');assert.equal(calls.filter(x=>x.url==='/v1/shipments/shipment/summary').at(-1).query.search,undefined);pass('Charts preserve independent account-only summary scope');
  failList=true;await navigate('/shipments/all/local');await until("document.body.innerText.includes('Unable to load shipments')",'failed list');failList=false;await clickText('Retry');await until(exists('[role=row][data-id]'),'retry list');pass('Failed list reads remain retryable');
  await navigate('/shipments/all/all/shipment-3');await until(exists('[data-testid=shipment-view]'),'detail');await clickText('Waybill');await until("Boolean(document.querySelector('iframe[src=\"https://reports.example.test/generated.pdf\"]'))",'generated label');pass('Missing waybills use label generation endpoint with actual shipment identity');
  failFile=true;await clickText('Download');await until("document.querySelector('[role=dialog]').innerText.includes('500')",'download failure');failFile=false;await clickText('Retry');await until("!document.querySelector('[role=dialog] button').disabled",'label retry');const downloadStart=Date.now();await clickText('Download');const labelFile=await downloadedSince(downloadStart,'pdf');assert.equal((await PDFDocument.load(fs.readFileSync(labelFile))).getPageCount(),1);await clickText('Close');pass('Document HTTP failures remain retryable and successful waybills download as valid PDFs');

  await clickText('Tracking','button[role=tab]');await until("document.body.innerText.includes('In transit')",'timeline');assert.ok((await evaluate("document.body.innerText")).indexOf('In transit')<(await evaluate("document.body.innerText")).indexOf('Accepted'));assert.ok(calls.some(x=>x.url==='/v1/shipments/shipment/tracking/shipment-3'));pass('Tracking sync and newest-first timeline retain carrier behavior');

  await navigate('/shipments/all/all/shipment-4');await until(exists('[data-testid=shipment-view]'),'international invoice');await clickText('Invoice');await until(exists('[data-testid=shipment-invoice]'),'invoice content');assert.ok((await evaluate("document.querySelector('[data-testid=shipment-invoice]').innerText")).includes('15.00'));const invoiceStart=Date.now();await clickText('Download');const invoiceFile=await downloadedSince(invoiceStart,'pdf');assert.ok((await PDFDocument.load(fs.readFileSync(invoiceFile))).getPageCount()>0);await clickText('Close');pass('Generated international invoice preserves customs totals and downloads every rendered page');
  await shipmentList();for(const id of ['shipment-1','shipment-3'])await click(`[role=row][data-id=${id}] input[type=checkbox]`);const mergedStart=Date.now();await clickText('Print Waybills');const mergedFile=await downloadedSince(mergedStart,'pdf');assert.equal((await PDFDocument.load(fs.readFileSync(mergedFile))).getPageCount(),2);pass('Selected shipment waybills merge into a complete two-page PDF');

  await login('editor@example.test');await until("location.pathname==='/home'",'editor');await navigate('/shipments/all/all/shipment-1');await until(exists('[data-testid=shipment-view]'),'staff detail');await clickText('Transactions','button[role=tab]');await until("document.body.innerText.includes('TX-TRACK')",'shipment ledger');await evaluate("document.querySelector('.MuiDataGrid-virtualScroller').scrollTop=100000");await until(exists('[role=row][data-id=tx-12]'),'all shipment ledger rows');const tx=calls.filter(x=>x.url==='/v1/transactions').at(-1);assert.equal(tx.query.search,'TRACK-1');assert.equal(tx.query.userId,'merchant-1');pass('Shipment-update grant opens the scoped ledger without requiring a separate ledger grant');
  await clickText('Shipment Details','button[role=tab]');await openOperation('Attach invoice number');await fillSelector('[role=dialog] input','INV-123');failWrite=true;await clickReady('[data-testid=confirm-shipment-operation]');await until("document.querySelector('[role=dialog]').innerText.includes('Write failed')",'write failure');assert.equal(await evaluate("document.querySelector('[role=dialog] input').value"),'INV-123');failWrite=false;await clickReady('[data-testid=confirm-shipment-operation]');await until("!document.querySelector('[role=dialog]')",'invoice attached');assert.equal(records[0].closeInvoiceNumber,'INV-123');pass('Failed invoice writes keep editable draft and retry the selected shipment ID');
  await openOperation('Charge extra weight');await fillSelector('[role=dialog] input[type=number]','4');await clickText('Review weight price');await until("[...document.querySelectorAll('[role=dialog] input')].some(x=>x.value==='8')",'review weight');await clickReady('[data-testid=confirm-shipment-operation]');await until("!document.querySelector('[role=dialog]')",'deduct');assert.deepEqual(calls.filter(x=>x.url.endsWith('/deduct-extra-weight-price')).at(-1).body,{weight:4,extraWeightPrice:8});pass('Local extra-weight charge uses reviewed fee and exact payload');
  await openOperation('Settle COD balance');await until("document.querySelector('[role=dialog]').innerText.includes('Balance after settlement')",'balance preview');await clickReady('[data-testid=confirm-shipment-operation]');await until("!document.querySelector('[role=dialog]')",'settled');assert.equal(records[0].shipmentCod.codStatus,'paid');pass('COD settlement previews balance and updates the COD record');

  await shipmentList();for(const id of ['shipment-3','shipment-5'])await click(`[role=row][data-id=${id}] input[type=checkbox]`);failCodId='cod-5';await clickText('Settle Selected Dues');await until(exists('[role=dialog]'),'bulk settlement');await clickReady('[data-testid=confirm-shipment-operation]');await until("document.querySelector('[role=dialog]').innerText.includes('Write failed')",'partial bulk settlement');const settledCount=calls.filter(x=>x.url==='/v1/shipment-cods/cod-3'&&x.method==='PATCH').length;assert.equal(settledCount,1);failCodId='';await clickReady('[data-testid=confirm-shipment-operation]');await until("!document.querySelector('[role=dialog]')",'bulk settlement retry');assert.equal(calls.filter(x=>x.url==='/v1/shipment-cods/cod-3'&&x.method==='PATCH').length,1);assert.equal(records[4].shipmentCod.codStatus,'paid');pass('Partial bulk settlement retries only failed COD records');
  await shipmentList();for(const id of ['shipment-1','shipment-4','shipment-6'])await click(`[role=row][data-id=${id}] input[type=checkbox]`);await clickText('Mark selected as delivered');await until(exists('[role=dialog]'),'bulk delivered');await clickReady('[data-testid=confirm-shipment-operation]');await until("!document.querySelector('[role=dialog]')",'delivered result');assert.equal(records[3].status,'delivered');assert.equal(records[5].status,'delivered');assert.equal(records[0].status,'processing');pass('Bulk delivered action excludes COD shipments and updates only eligible records');

  await login('merchant@example.test');await until("location.pathname==='/home'",'merchant');await shipmentList();assert.equal(await evaluate("document.querySelector('[role=row][data-id=shipment-2]').innerText.includes('View')"),false);await navigate('/shipments/all/all/shipment-21');await until("location.pathname==='/home'",'foreign detail');pass('Merchant list hides failed-record view and blocks another owner’s details');
  await navigate('/shipments/all/all/shipment-3');await until(exists('[data-testid=shipment-view]'),'merchant detail');await openOperation('Request cancellation');await clickReady('[data-testid=confirm-shipment-operation]');await until("!document.querySelector('[role=dialog]')",'cancel request');assert.equal(calls.filter(x=>x.url==='/v1/requests'&&x.method==='POST').at(-1).body.shipmentId,'shipment-3');pass('Merchant cancellation sends pending request with actual owner and shipment');
  await navigate('/shipments/all/all/new');await until(exists('[data-testid=carrier-carrier-1]'),'new draft');assert.equal(await evaluate("document.querySelector('[data-testid=carrier-carrier-auth]').disabled"),true);await until(exists('[name=senderId]'),'sender step');await selectUser('senderId','Saved Sender');await until("document.querySelector('[name=senderName]').value==='Saved Sender'",'saved sender');await fillField('senderName','Draft Sender');await until(exists('[name="receivers.0.receiverId"]'),'receiver step');await selectUser('receivers.0.receiverId','Saved Receiver');await until("document.querySelector('[name=\"receivers.0.receiverName\"]').value==='Saved Receiver'",'saved receiver');await fillField('receivers.0.receiverName','Receiver One');await click('[data-testid=add-receiver]');await selectUser('receivers.1.receiverId','Saved Receiver');await until("document.querySelector('[name=\"receivers.1.receiverName\"]').value==='Saved Receiver'",'second receiver');await fillField('receivers.1.receiverName','Receiver Two');await click('[data-testid=carrier-carrier-1]');await until(exists('[name=description]'),'parcel');await fillField('description','Test shipment contents');await click('[name=acceptExtraWeightTerms]');await until(exists('[name=couponCode]'),'payment');await fillField('couponCode','SAVE');await clickReady('[data-testid=check-shipment-coupon]');await until(exists('[data-testid=remove-shipment-coupon]'),'coupon');await until(exists('[data-testid=shipment-review]'),'review');failQuote=true;await clickReady('[data-testid=review-shipment-costs]');await until("document.body.innerText.includes('Quote failed')",'quote failed');assert.equal(await evaluate("document.querySelector('[data-testid=create-shipments]').disabled"),true);failQuote=false;await clickReady('[data-testid=review-shipment-costs]');await until("document.querySelectorAll('[data-testid=shipment-cost-total]').length===2",'quotes');pass('Multi-receiver draft supports saved contacts, coupon and recoverable individual price reviews');for(const id of ['receiver','carrier','parcel','payment']){await evaluate(`document.querySelector('#shipment-section-${id}').scrollIntoView({block:'start'})`);await screenshot('shipment-'+id+'-en-desktop');}
  failCreateReceiver='Receiver Two';const countBefore=creates().length;await clickReady('[data-testid=create-shipments]');await until("document.body.innerText.includes('Receiver creation failed')",'partial create');assert.equal(creates().length-countBefore,2);assert.equal(creates().filter(x=>x.body.receiverName==='Receiver One').length,1);const first=creates().find(x=>x.body.receiverName==='Receiver One');assert.equal(first.body.senderName,'Draft Sender');assert.equal(first.body.senderId,'sender-1');assert.equal(first.body.receiverId,'receiver-1');assert.equal(first.body.couponCodeId,'coupon-1');assert.equal(first.body.status,undefined);failCreateReceiver='';await clickReady('[data-testid=review-shipment-costs]');await until("!document.querySelector('[data-testid=create-shipments]').disabled",'retry quote');await clickReady('[data-testid=create-shipments]');await until(exists('[data-testid=shipments-table]'),'partial retry done');assert.equal(creates().filter(x=>x.body.receiverName==='Receiver One').length,1);assert.equal(creates().filter(x=>x.body.receiverName==='Receiver Two').length,2);pass('Retrying partial multi-receiver creation skips already accepted shipments');

  await navigate('/shipments/all/all/new');await until(exists('[data-testid=carrier-carrier-1]'),'new contact draft');await until(exists('[name=senderName]'),'new sender');await newContact('sender');await newContact('receiver','receivers.0.');await click('[data-testid=carrier-carrier-1]');await until(exists('textarea[name=description]'),'new parcel');await fillField('description','New contacts shipment');await click('[name=acceptExtraWeightTerms]');await until(exists('[data-testid=shipment-review]'),'new review');await clickReady('[data-testid=review-shipment-costs]');await until("!document.querySelector('[data-testid=create-shipments]').disabled",'new quote');
  users[0].balance=0;const createCount=creates().length;await clickReady('[data-testid=create-shipments]');await until("document.body.innerText.includes('balance')",'insufficient balance');assert.equal(creates().length,createCount);users[0].balance=10000;pass('Fresh wallet balance is checked before any contact or shipment creation');
  contactFailure=true;await clickReady('[data-testid=create-shipments]');await until("document.body.innerText.includes('Contact save failed')",'contact failure');assert.equal(creates().length,createCount);contactFailure=false;failCreateReceiver='New Receiver';await clickReady('[data-testid=create-shipments]');await until("document.body.innerText.includes('Receiver creation failed')",'shipment after contacts failed');const savedContacts=contactCreates;assert.equal(await evaluate("document.querySelector('[data-testid=create-shipments]').disabled"),true);failCreateReceiver='';await clickReady('[data-testid=review-shipment-costs]');await until("!document.querySelector('[data-testid=create-shipments]').disabled",'saved contact quote');await clickReady('[data-testid=create-shipments]');await until(exists('[data-testid=shipments-table]'),'new contact retry');assert.equal(contactCreates,savedContacts);assert.ok(creates().at(-1).body.senderId.startsWith('contact-created-'));assert.ok(creates().at(-1).body.receiverId.startsWith('contact-created-'));pass('Contact save and shipment failures preserve drafts and saved IDs across retries');

  await navigate('/shipments/all/all/new?returnFrom=shipment-3');await until(exists('[data-testid=carrier-carrier-1]'),'return');await until(exists('[name=senderName]'),'return sender');assert.equal(await evaluate("document.querySelector('[name=senderName]').value"),'Receiver 3');assert.equal(await evaluate("document.querySelector('[name=senderStreet]').value"),'Receiver Street');assert.equal(await evaluate("document.querySelector('[name=senderNationalAddress]').value"),'R123');await until(exists('[name=receiverName]'),'return receiver');assert.equal(await evaluate("document.querySelector('[name=receiverName]').value"),'Original Sender');await click('[data-testid=carrier-carrier-1]');await until(exists('[name=description]'),'return parcel');await until(exists('[data-testid=shipment-review]'),'return review');await clickReady('[data-testid=review-shipment-costs]');await until("!document.querySelector('[data-testid=create-shipments]').disabled",'return quote');const contactsBefore=contactCreates;asyncCreate=true;await clickReady('[data-testid=create-shipments]');await until(exists('[data-testid=shipments-table]'),'return accepted');asyncCreate=false;const returned=creates().at(-1);assert.equal(returned.body.returnedFromShipmentId,'shipment-3');assert.equal(returned.body.isCod,false);assert.equal(returned.body.userId,'merchant-1');assert.equal(returned.body.senderPhone,'+971-555987654');assert.equal(contactCreates,contactsBefore);pass('Returns swap complete contacts, preserve original linkage and accept asynchronous creation without contact duplication');
  await navigate('/shipping-price-calculator');await until(exists('[data-testid=carrier-carrier-1]'),'calculator');for(const prefix of ['sender','receiver']){await selectUser(prefix+'StateId','Riyadh');await selectUser(prefix+'CityId','Riyadh City');await fillField(prefix+'Street','Street');}await click('[data-testid=carrier-carrier-1]');await clickReady('[data-testid=review-shipment-costs]');await until(exists('[data-testid=shipment-cost-total]'),'calculator cost');await until("!document.querySelector('[data-testid=review-shipment-costs]').disabled",'review enabled');assert.equal(await evaluate("Boolean(document.querySelector('[data-testid=create-shipments]'))"),false);pass('Price calculator validates addresses and quotes without creating shipments');
  await screenshot('calculator-en-desktop');
  await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:languageScript.identifier});await evaluate("localStorage.setItem('my-language','ar')");await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await navigate('/shipments/all/all/new');await until(exists('[data-testid=carrier-carrier-1]'),'Arabic new');assert.equal(await evaluate('getComputedStyle(document.body).direction'),'rtl');await screenshot('shipment-ar-mobile');for(const id of ['receiver','carrier','parcel']){await evaluate(`document.querySelector('#shipment-section-${id}').scrollIntoView({block:'start'})`);await screenshot('shipment-ar-mobile-'+id);}await evaluate("document.querySelector('[data-testid=shipment-review]').scrollIntoView({block:'start'})");await screenshot('shipment-ar-mobile-summary');pass('Arabic RTL and mobile creation layout render correctly');
  assert.deepEqual(fixtureErrors,[]);assert.deepEqual(exceptions,[]);assert.equal(calls.some(x=>x.method==='DELETE'),false);fs.writeFileSync(path.join(output,'summary.json'),JSON.stringify({checks:passed,fixtureErrors,exceptions,calls},null,2));console.log(`${passed}/${passed} shipment browser checks passed; no uncaught exceptions.`);
}

main()
  .catch(async (error) => {
    try {
      await screenshot("failure");
      console.error(await evaluate("document.body.innerText"));
      fs.writeFileSync(
        path.join(output, "failure-calls.json"),
        JSON.stringify(calls, null, 2),
      );
    } catch {}
    console.error(error.stack);
    console.error("Uncaught browser exceptions:", exceptions);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      if (ws?.readyState === 1) await send("Browser.close");
    } catch {}
    ws?.close();
    edge?.kill();
    server?.close();
  });
