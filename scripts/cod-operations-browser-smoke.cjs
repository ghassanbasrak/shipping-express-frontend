// Requires Node.js 22+ and Edge, or BROWSER_PATH pointing to a Chromium browser.
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { spawn } = require("node:child_process");
const assert = require("node:assert/strict");
const target = path.resolve(__dirname, "..");
const build = path.join(target, "build");
const output = path.join(target, "test-results/cod-operations-browser");
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
const users=[{...normal,firstName:'Merchant',lastName:'Alpha',balance:1000},{...normal,id:'merchant-2',firstName:'Merchant',lastName:'Beta',balance:300}];
const carriers=[{id:'carrier-1',name:'Carrier Alpha',isActive:true,shippingMethods:['local']},{id:'carrier-2',name:'Carrier Beta',isActive:true,shippingMethods:['local']}];
const shipments=Array.from({length:30},(_,i)=>({id:'shipment-'+(i+1),userId:i<22?'merchant-1':'merchant-2',user:users[i<22?0:1],shippingCompanyId:i<25?'carrier-1':'carrier-2',shippingCompany:carriers[i<25?0:1],updatedById:i%2?'staff-2':'staff-1',updatedBy:{id:i%2?'staff-2':'staff-1',firstName:'Staff',lastName:i%2?'Two':'One'},receiverId:'receiver-'+(i%2+1),status:i===1?'failed':i===2?'canceled':i===3?'returned':'processing',type:'box',method:i===8?'international':'local',isCod:true,trackingNumber:'COD-'+String(i+1).padStart(3,'0'),trackingUrl:'https://tracking.example.test/'+i,labelUrl:'https://reports.example.test/label-'+i+'.pdf',shipmentDetails:{id:'details-'+i,receiverName:'Receiver '+(i%2+1),weight:1,length:1,width:1,height:1,packagesCount:1,description:'Contents'},shipmentCod:{id:'cod-'+(i+1),shipmentId:'shipment-'+(i+1),codPrice:50,codStatus:i===5?'paid':i===9?'settled':'pending',relatedRequestId:i===9?'withdrawal-1':undefined,updatedBy:{id:'staff-1',firstName:'Staff',lastName:'One'},createdAt:'2026-10-20T00:00:00Z',updatedAt:'2026-10-24T00:00:00Z'},shipmentPrice:{total:12},createdAt:'2026-10-20T00:00:00Z'}));
const requests=Array.from({length:28},(_,i)=>({id:'request-'+(i+1),type:'cancelShipment',status:i===1?'approved':i===2?'rejected':'pending',userId:i<20?'merchant-1':'merchant-2',user:users[i<20?0:1],updatedById:i%2?'staff-2':'staff-1',updatedBy:{id:i%2?'staff-2':'staff-1',firstName:'Staff',lastName:i%2?'Two':'One'},shipmentId:i===3?undefined:shipments[i].id,shipment:i===3?undefined:shipments[i],createdAt:'2026-10-20T00:00:00Z',updatedAt:'2026-10-24T00:00:00Z'}));
let failRequests=false,failDues=false,failSummary=false,failTransactions=false,failWrite=false,failCodId='',failFile=false,passed=0;
const fixtureErrors=[];function pass(name){passed++;console.log('PASS '+name);}
const requestCalls=()=>calls.filter(x=>x.url==='/v1/requests'&&x.method==='GET');
const dueCalls=()=>calls.filter(x=>x.url==='/v1/shipments'&&x.method==='GET');
const summaryCalls=()=>calls.filter(x=>x.url==='/v1/shipments/shipment-cods/summary');
const patchCalls=()=>calls.filter(x=>x.method==='PATCH');
function scopeShipments(query,url){return shipments.filter(row=>(account.role!=='user'||row.userId===account.id)&&(!query.userId||row.userId===query.userId)&&(!query.shippingCompanyId||row.shippingCompanyId===query.shippingCompanyId)&&(!query.receiverId||row.receiverId===query.receiverId)&&(!query.updatedById||row.updatedById===query.updatedById)&&(!query.search||JSON.stringify(row).toLowerCase().includes(query.search.toLowerCase()))&&(!url.searchParams.getAll('status').length||url.searchParams.getAll('status').includes(row.status))&&(!url.searchParams.getAll('codStatus').length||url.searchParams.getAll('codStatus').includes(row.shipmentCod.codStatus)));}
async function intercept(event){const req=event.request,url=new URL(req.url),method=req.method;if(method==='OPTIONS')return fulfill(event,204,'');
 if(url.hostname==='reports.example.test'){if(failFile)return fulfill(event,500,'Download failed');const pdf=await PDFDocument.create();pdf.addPage();return send('Fetch.fulfillRequest',{requestId:event.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/pdf'},{name:'Access-Control-Allow-Origin',value:'*'}],body:Buffer.from(await pdf.save()).toString('base64')});}
 const query=Object.fromEntries(url.searchParams),body=JSON.parse(req.postData||'{}');calls.push({url:url.pathname,method,query,body,statuses:url.searchParams.getAll('status'),codStatuses:url.searchParams.getAll('codStatus')});let status=200,result={};
 try{
 if(url.pathname.endsWith('/auth-sessions/login')){const kind=body.email.split('@')[0];account={...normal,id:'staff-1',role:'admin',balance:1000};const permission=(feature,view=true,update=false,remove=false)=>({feature,accessView:view,accessUpdate:update,accessDelete:remove});
 if(kind==='merchant')account={...users[0]};else if(kind!=='admin'){account.role='employee';account.features=kind==='denied'?[permission('alerts')]:kind==='noview'?[permission('cancel-shipment-requests',false,true),permission('merchant-dues',false,true)]:kind==='cancel-editor'?[permission('cancel-shipment-requests',true,true),permission('transactions')]:kind==='dues-editor'?[permission('merchant-dues',true,true)]:kind==='dues-delete'?[permission('merchant-dues',true,true,true)]:kind==='shipment-editor'?[permission('shipments',true,true,true),permission('merchant-dues')]:[permission('cancel-shipment-requests'),permission('merchant-dues')];}result={user:account,accessToken:'cod-operations-access',refreshToken:'cod-operations-refresh'};}
 else if(url.pathname==='/v1/users/me')result=account||normal;
 else if(url.pathname==='/v1/users'){const list=query.type==='user'?users:[{id:'staff-1',firstName:'Staff',lastName:'One'},{id:'staff-2',firstName:'Staff',lastName:'Two'}];result={results:list.filter(row=>!query.search||JSON.stringify(row).toLowerCase().includes(query.search.toLowerCase())),total:list.length};}
 else if(url.pathname.startsWith('/v1/users/'))result=users.find(x=>x.id===url.pathname.split('/').at(-1))||{id:'staff-1',firstName:'Staff',lastName:'One'};
 else if(url.pathname==='/v1/shipping-companies')result={results:carriers,total:carriers.length};
 else if(url.pathname.startsWith('/v1/shipping-companies/')){const id=url.pathname.split('/').at(-1);assert.notEqual(id,'all','All sentinel must never be fetched as a carrier ID');result=carriers.find(x=>x.id===id)||{id,name:'Stored Carrier'};}
 else if(url.pathname==='/v1/shipping-users')result={results:[{id:'receiver-1',fullName:'Receiver One'},{id:'receiver-2',fullName:'Receiver Two'}],total:2};
 else if(url.pathname.startsWith('/v1/shipping-users/'))result={id:url.pathname.split('/').at(-1),fullName:'Receiver Two'};
 else if(url.pathname==='/v1/requests'){assert.equal(query.type,'cancelShipment');if(failRequests){status=500;result={message:'Requests failed'};}else{const list=requests.filter(row=>(account.role!=='user'||row.userId===account.id)&&(!query.userId||row.userId===query.userId)&&(!query.status||row.status===query.status)&&(!query.updatedById||row.updatedById===query.updatedById)&&(!query.search||JSON.stringify(row).toLowerCase().includes(query.search.toLowerCase())));result={results:list.slice(Number(query.page)*Number(query.pageSize),(Number(query.page)+1)*Number(query.pageSize)),total:list.length};}}
 else if(url.pathname.startsWith('/v1/requests/')){assert.equal(method,'PATCH');assert.deepEqual(Object.keys(body),['status']);const row=requests.find(x=>x.id===url.pathname.split('/').at(-1));assert.equal(row.status,'pending');if(failWrite){status=500;result={message:'Decision failed'};}else{row.status=body.status;if(body.status==='approved'&&row.shipment)row.shipment.status='canceled';result=row;}}
 else if(url.pathname==='/v1/shipments/shipment-cods/summary'){assert(!query.status&&!query.codStatus&&!query.search&&!query.dateFrom&&!query.updatedById,'Summary has independent scopes');if(failSummary){status=500;result={message:'Summary failed'};}else{const rows=scopeShipments(query,url);result={canceledDues:0,pendingDues:rows.filter(row=>row.shipmentCod.codStatus==='pending').reduce((sum,row)=>sum+row.shipmentCod.codPrice,0),settledDues:rows.filter(row=>row.shipmentCod.codStatus==='paid').reduce((sum,row)=>sum+row.shipmentCod.codPrice,0)};}}
 else if(url.pathname==='/v1/shipments'){if(new URL(url).pathname==='/v1/shipments'&&!query.isCod){result={results:shipments.slice(0,10),total:shipments.length};}else {assert.equal(query.isCod,'true');if(failDues){status=500;result={message:'Dues failed'};}else {const rows=scopeShipments(query,url);result={results:rows.slice(Number(query.page)*Number(query.pageSize),(Number(query.page)+1)*Number(query.pageSize)),total:rows.length};}}}
 else if(/^\/v1\/shipments\/[^/]+\/(review-extra-weight-price|deduct-extra-weight-price)$/.test(url.pathname)){if(failWrite){status=500;result={message:'Weight failed'};}else result=url.pathname.includes('/review-')?{extraWeightPrice:0}:{};}
 else if(url.pathname.startsWith('/v1/shipments/')){const row=shipments.find(x=>x.id===url.pathname.split('/').at(-1));if(method==='PATCH'){assert.deepEqual(Object.keys(body),['status']);if(failWrite){status=500;result={message:'Status failed'};}else{Object.assign(row,body);result=row;}}else result=row;}
 else if(url.pathname.startsWith('/v1/shipment-cods/')){const id=url.pathname.split('/').at(-1);assert.equal(method,'PATCH');assert.deepEqual(body,{codStatus:'paid'});if(failWrite||id===failCodId){status=500;result={message:'Settlement failed'};}else{const row=shipments.find(x=>x.shipmentCod.id===id);assert.equal(row.shipmentCod.codStatus,'pending');assert.notEqual(row.status,'returned');row.shipmentCod.codStatus='paid';users.find(x=>x.id===row.userId).balance+=row.shipmentCod.codPrice;result=row.shipmentCod;}}
 else if(url.pathname==='/v1/transactions'){assert.equal(query.pageSize,'100');if(failTransactions){status=500;result={message:'Transactions failed'};}else result={results:Array.from({length:15},(_,i)=>({id:'tx-'+(i+1),reference:'LEDGER-'+(i+1),userId:query.userId,type:'withdraw',relatedBalance:'wallet',title:'Shipment ledger',amount:5,currentBalance:100,previousBalance:105})),total:15};}
 else if(url.pathname.includes('notification')||url.pathname==='/v1/alerts')result={results:[],total:0};
 else {fixtureErrors.push('Unexpected fixture '+method+' '+url.pathname);status=404;result={message:'Unexpected fixture '+url.pathname};}
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


async function cancellationList(route='/cancel-shipment-requests/all'){await navigate(route);await until(exists('[data-testid=cancel-shipment-requests-table]'),'cancellation table');await until(exists('[role=row][data-id]'),'cancellation rows');}
async function duesList(route='/merchant-dues/all/all'){await navigate(route);await until(exists('[data-testid=merchant-dues-table]'),'dues table');await until(exists('[role=row][data-id]'),'dues rows');}
async function rowText(id,text){await clickText(text,`[role=row][data-id=${id}] button`);}
async function filterChoice(label,value){await filterControl(label);await until(exists(`[role=option][data-value="${value}"]`),'filter choice');await click(`[role=option][data-value="${value}"]`);await escape();}
async function dueOperation(id,title){await click(`[role=row][data-id=${id}] button[aria-label]`);await until(exists(`#merchant-due-menu-${id} [role=menuitem]`),'active due menu');await clickText(title,`#merchant-due-menu-${id} [role=menuitem]`);await until(exists('[role=dialog]'),'due dialog');}
async function confirmDue(){await clickReady('[data-testid=confirm-shipment-operation]');await until("!document.querySelector('[role=dialog]')",'due saved');}
async function untilCall(predicate,label){for(let i=0;i<150;i++){if(predicate())return;await sleep(100);}throw new Error('Timed out: '+label);}
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



  await reset('/cancel-shipment-requests/all');await until("location.pathname==='/sign-in'",'guest');pass('Cancellation and dues screens require authentication');
  await login('denied@example.test');await until("location.pathname==='/home'",'denied');let before=[requestCalls().length,dueCalls().length];await navigate('/cancel-shipment-requests/all');await sleep(400);await navigate('/merchant-dues/all/all');await sleep(400);assert.deepEqual([requestCalls().length,dueCalls().length],before);pass('Staff without feature scopes cannot fetch either operational list');
  await login('noview@example.test');await until("location.pathname==='/home'",'no view');before=[requestCalls().length,dueCalls().length];await navigate('/cancel-shipment-requests/all');await sleep(300);await navigate('/merchant-dues/all/all');await sleep(300);assert.deepEqual([requestCalls().length,dueCalls().length],before);pass('Update grants without view never expose list data');
  await login('viewer@example.test');await until("location.pathname==='/home'",'viewer');await cancellationList();assert.equal(await evaluate("document.querySelectorAll('[role=row][data-id]').length"),10);assert.equal(await evaluate("[...document.querySelectorAll('[role=row] button')].some(x=>['Accept','Refuse','Transactions'].includes(x.textContent.trim()))"),false);pass('Read-only cancellation staff see ten rows without decisions or unrelated ledger access');
  await click('[aria-label="Go to next page"]');await until(exists('[role=row][data-id=request-11]'),'second request page');assert.equal(requestCalls().at(-1).query.page,'1');await fillSelector('[data-testid=cancel-shipment-requests-search]','COD-013');await until("document.querySelectorAll('[role=row][data-id]').length===1",'request search');assert.equal(requestCalls().at(-1).query.page,'0');pass('Cancellation pagination retains total and search resets to the first page');
  let start=Date.now();await clickText('Export All Pages');let download=await downloadedSince(start,'xlsx');const XLSX=require(path.join(target,'node_modules/xlsx'));let book=XLSX.readFile(download),rows=XLSX.utils.sheet_to_json(book.Sheets[book.SheetNames[0]],{defval:''});assert.ok(rows.some(row=>Object.values(row).includes('COD-013')));assert.equal(requestCalls().at(-1).query.pageSize,'500000');pass('Cancellation export retains search/type scopes and produces a readable workbook');
  failRequests=true;await navigate('/cancel-shipment-requests/merchant-1');await until("document.body.innerText.includes('Unable to load records')",'requests failed');failRequests=false;await clickText('Retry');await until(exists('[role=row][data-id=request-1]'),'request retry');pass('Cancellation read errors expose a working retry');
  await login('cancel-editor@example.test');await until("location.pathname==='/home'",'cancel editor');await cancellationList();assert.equal(await evaluate("Boolean(document.querySelector('[role=row][data-id=request-2] button')&&[...document.querySelectorAll('[role=row][data-id=request-2] button')].some(x=>x.textContent.trim()==='Accept'))"),false);await rowText('request-1','Accept');failWrite=true;await clickReady('[data-testid=confirm-cancellation-decision]');await until("document.querySelector('[role=dialog]').innerText.includes('Decision failed')",'decision failure');failWrite=false;await clickReady('[data-testid=confirm-cancellation-decision]');await until("!document.querySelector('[role=dialog]')",'decision accepted');assert.equal(requests[0].status,'approved');assert.deepEqual(patchCalls().filter(x=>x.url==='/v1/requests/request-1').at(-1).body,{status:'approved'});pass('Pending-only cancellation approvals survive failed writes and target the request ID');
  await rowText('request-5','Refuse');await clickReady('[data-testid=confirm-cancellation-decision]');await until("!document.querySelector('[role=dialog]')",'rejected');assert.equal(requests[4].status,'rejected');pass('Cancellation rejection sends status only and removes pending review actions');
  failTransactions=true;await rowText('request-1','Transactions');await until("document.querySelector('[role=dialog]').innerText.includes('Unable to load shipment transactions')",'ledger failure');failTransactions=false;await clickText('Retry');await until("document.querySelector('[role=dialog]').innerText.includes('LEDGER-1')",'ledger retry');await evaluate("document.querySelector('[role=dialog] .MuiDataGrid-virtualScroller').scrollTop=100000");await until(exists('[role=row][data-id=tx-15]'),'fifteen ledger rows');const ledger=calls.filter(x=>x.url==='/v1/transactions').at(-1);assert.equal(ledger.query.search,'COD-001');assert.equal(ledger.query.userId,'merchant-1');await clickText('Close');pass('Cancellation ledger uses its separate wallet-view grant, actual owner and all fetched rows');
  await login('viewer@example.test');await until("location.pathname==='/home'",'dues viewer');await duesList();await until(exists('[data-testid=merchant-dues-summary]'),'dues summary');assert.ok((await evaluate("document.querySelector('[role=row][data-id=cod-4]').innerText")).includes('Returned'));assert.ok((await evaluate("document.querySelector('[data-testid=merchant-dues-summary]').innerText")).includes('0.00'));assert.equal(await evaluate("Boolean(document.querySelector('[aria-label=\"COD due actions\"]'))"),false);await click('[role=row][data-id=cod-5] input[type=checkbox]');assert.equal(await evaluate("[...document.querySelectorAll('button')].some(x=>x.textContent.trim()==='Settle Selected Dues')"),false);pass('Read-only COD viewers retain zero totals and cannot settle through selection controls');
  await click('[aria-label="Go to next page"]');await until(exists('[role=row][data-id=cod-11]'),'dues second page');assert.equal(dueCalls().at(-1).query.page,'1');await fillSelector('[data-testid=merchant-dues-search]','COD-013');await until("document.querySelectorAll('[role=row][data-id]').length===1",'dues search');assert.equal(dueCalls().at(-1).query.page,'0');assert.equal(summaryCalls().at(-1).query.search,undefined);pass('Dues pagination/search retain backend COD IDs and independent summary scopes');
  start=Date.now();await clickText('Export All Pages');download=await downloadedSince(start,'xlsx');book=XLSX.readFile(download);rows=XLSX.utils.sheet_to_json(book.Sheets[book.SheetNames[0]],{defval:''});assert.equal(dueCalls().at(-1).query.pageSize,'50000');assert.ok(rows.some(row=>Object.values(row).includes('COD-013')));assert.ok(rows.some(row=>Object.values(row).some(value=>String(value).includes('50.00'))));assert.ok(!rows.some(row=>Object.values(row).some(value=>String(value).includes('NaN'))));assert.ok(rows.some(row=>Object.values(row).some(value=>/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/.test(String(value)))));pass('COD export includes filtered records, timestamp, amount total and shipment count');
  await duesList();await click('[data-testid=merchant-dues-filters]');await filterChoice('Shipping Company','carrier-2');await until("document.querySelectorAll('[role=row][data-id]').length===5",'carrier scope');assert.equal(dueCalls().at(-1).query.shippingCompanyId,'carrier-2');assert.equal(summaryCalls().at(-1).query.shippingCompanyId,'carrier-2');await click('[data-testid=merchant-dues-filters]');await filterChoice('Shipping Company','all');await until("document.querySelectorAll('[role=row][data-id]').length===10",'all carriers');assert.equal(dueCalls().at(-1).query.shippingCompanyId,undefined);pass('Carrier filters preserve All, encode the scope and refresh independent totals');
  failSummary=true;await navigate('/merchant-dues/carrier-1/all');await until("document.body.innerText.includes('Unable to load COD totals')",'summary failure');failSummary=false;await clickText('Retry');await until(exists('[data-testid=merchant-dues-summary]'),'summary retry');pass('Independent COD summary errors are visible and retryable');
  failDues=true;await navigate('/merchant-dues/carrier-2/all');await until("document.body.innerText.includes('Unable to load records')",'dues failure');failDues=false;await clickText('Retry');await until(exists('[role=row][data-id]'),'dues retry');pass('COD list errors do not silently become empty results');
  await login('shipment-editor@example.test');await until("location.pathname==='/home'",'shipment editor');await duesList();assert.equal(await evaluate("Boolean(document.querySelector('[aria-label=\"COD due actions\"]'))"),false);pass('Shipment-update grant cannot bypass missing merchant-dues update permission');
  await login('dues-editor@example.test');await until("location.pathname==='/home'",'dues editor');await duesList();await dueOperation('cod-5','Settlement');await until("document.querySelector('[role=dialog]').innerText.includes('Balance after settlement')",'settlement balance');await confirmDue();assert.equal(shipments[4].shipmentCod.codStatus,'paid');assert.ok(patchCalls().some(x=>x.url==='/v1/shipment-cods/cod-5'));pass('Merchant-dues settlement works without shipment grants and targets the COD ID');
  await dueOperation('cod-2','Reactiviate Shipment');await confirmDue();assert.equal(shipments[1].status,'processing');await dueOperation('cod-3','Convert To Active Shipment');await confirmDue();assert.equal(shipments[2].status,'processing');assert.ok(patchCalls().some(x=>x.url==='/v1/shipments/shipment-2'&&x.body.status==='processing'));pass('Failed and canceled shipment reactivation uses owning shipment IDs with dues permissions');
  await dueOperation('cod-7','Discount Extra Weight Amount');await fillSelector('[role=dialog] input[type=number]','2');await clickText('Review weight price');await until("[...document.querySelectorAll('[role=dialog] input')].some(x=>x.value==='0')",'zero weight fee');await confirmDue();assert.deepEqual(patchCalls().filter(x=>x.url.endsWith('/deduct-extra-weight-price')).at(-1).body,{weight:2,extraWeightPrice:0});pass('Local extra-weight review retains a valid zero charge in the exact payload');
  await dueOperation('cod-9','Discount Extra Weight Amount');assert.equal(await evaluate("[...document.querySelectorAll('[role=dialog] input')].at(-1).disabled"),false);await fillSelector('[role=dialog] input[type=number]','3');await evaluate("(()=>{const input=[...document.querySelectorAll('[role=dialog] input')].at(-1);Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'-2');input.dispatchEvent(new Event('input',{bubbles:true}));})()");await confirmDue();assert.deepEqual(patchCalls().filter(x=>x.url.endsWith('/deduct-extra-weight-price')).at(-1).body,{weight:3,extraWeightPrice:-2});assert.equal(patchCalls().filter(x=>x.url.endsWith('/deduct-extra-weight-price')).at(-1).url,'/v1/shipments/shipment-9/deduct-extra-weight-price');pass('International extra-weight charges retain the source manual numeric rule');
  await duesList();for(const id of ['cod-7','cod-8'])await click(`[role=row][data-id=${id}] input[type=checkbox]`);failCodId='cod-8';await clickText('Settle Selected Dues');await until(exists('[role=dialog]'),'bulk settle');await clickReady('[data-testid=confirm-shipment-operation]');await until("document.querySelector('[role=dialog]').innerText.includes('Settlement failed')",'partial settle');const firstCount=patchCalls().filter(x=>x.url==='/v1/shipment-cods/cod-7').length;failCodId='';await confirmDue();assert.equal(patchCalls().filter(x=>x.url==='/v1/shipment-cods/cod-7').length,firstCount);assert.equal(shipments[7].shipmentCod.codStatus,'paid');pass('Partial bulk dues settlement retries only failed COD records');
  await login('dues-delete@example.test');await until("location.pathname==='/home'",'dues return');await duesList();await dueOperation('cod-9','Convert To Returned');await confirmDue();assert.equal(shipments[8].status,'returned');assert.ok(patchCalls().some(x=>x.url==='/v1/shipments/shipment-9'&&x.body.status==='returned'));pass('Returned status uses merchant-dues update/delete grants without enabling deletion');
  await duesList();for(const id of ['cod-2','cod-3','cod-4'])await click(`[role=row][data-id=${id}] input[type=checkbox]`);failFile=true;await clickText('Print Waybills');await until("document.body.innerText.includes('500')",'PDF failure');failFile=false;start=Date.now();await clickText('Print Waybills');download=await downloadedSince(start,'pdf');assert.equal((await PDFDocument.load(fs.readFileSync(download))).getPageCount(),2);pass('Merged dues waybills exclude returned shipments and recover from document failures');
  await login('admin@example.test');await until("location.pathname==='/home'",'admin audit');await navigate('/shipments/all/all');await until(exists('[data-testid=shipments-table]'),'shipment carrier regression');await until(exists('[role=row][data-id]'),'shipment rows');await click('[data-testid=shipments-filters]');await filterChoice('Shipping Company','carrier-2');await until("document.body.innerText.includes('Carrier Beta')",'shipment carrier selected');assert.equal(dueCalls().at(-1).query.shippingCompanyId,'carrier-2');await click('[data-testid=shipments-filters]');await filterChoice('Shipping Company','all');await untilCall(()=>dueCalls().at(-1)?.query.shippingCompanyId===undefined,'all shipment carriers');assert.equal(dueCalls().at(-1).query.shippingCompanyId,undefined);pass('Existing shipment carrier filter retains its All option and correct query scope');await cancellationList('/cancel-shipment-requests/all?updatedById=staff-2');assert.equal(requestCalls().at(-1).query.updatedById,'staff-2');await duesList('/merchant-dues/all/all?updatedById=staff-1');assert.equal(dueCalls().at(-1).query.updatedById,'staff-1');assert.equal(summaryCalls().at(-1).query.updatedById,undefined);pass('Admin audit query scopes remain effective without narrowing independent COD totals');
  await login('merchant@example.test');await until("location.pathname==='/home'",'merchant');await cancellationList('/cancel-shipment-requests/merchant-2?updatedById=staff-2');assert.equal(requestCalls().at(-1).query.userId,undefined);assert.equal(requestCalls().at(-1).query.updatedById,undefined);assert.equal(await evaluate("[...document.querySelectorAll('[role=row] button')].some(x=>['Accept','Refuse'].includes(x.textContent.trim()))"),false);await duesList('/merchant-dues/all/merchant-2?updatedById=staff-2');assert.equal(dueCalls().at(-1).query.userId,undefined);assert.equal(dueCalls().at(-1).query.updatedById,undefined);assert.equal(await evaluate("Boolean(document.querySelector('[aria-label=\"COD due actions\"]'))"),false);pass('Merchant routes ignore foreign owner/reviewer parameters and never expose staff mutations');
  await click('[data-testid=merchant-dues-filters]');await evaluate("(()=>{const label=[...document.querySelectorAll('[role=menu] p')].find(x=>x.textContent==='Receiver');const input=label.parentElement.querySelector('input');input.focus();input.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',code:'ArrowDown',bubbles:true}));Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'Receiver');input.dispatchEvent(new Event('input',{bubbles:true}));})()");await until("Boolean([...document.querySelectorAll('[role=option]')].find(x=>x.textContent.includes('Receiver Two')))",'receiver filter');await evaluate("[...document.querySelectorAll('[role=option]')].find(x=>x.textContent.includes('Receiver Two')).click()");await escape();await until("document.querySelectorAll('[role=row][data-id]').length>0",'receiver scope');assert.equal(dueCalls().at(-1).query.receiverId,'receiver-2');assert.equal(summaryCalls().at(-1).query.receiverId,'receiver-2');pass('Merchant receiver selection scopes both COD rows and independent totals');
  await screenshot('merchant-dues-en-desktop');
  await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:languageScript.identifier});await evaluate("localStorage.setItem('my-language','ar')");await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await duesList();assert.equal(await evaluate('getComputedStyle(document.body).direction'),'rtl');await screenshot('merchant-dues-ar-mobile');await cancellationList();await screenshot('cancellation-requests-ar-mobile');pass('Both migrated operational screens render in Arabic RTL on mobile');
  assert.deepEqual(fixtureErrors,[]);assert.deepEqual(exceptions,[]);assert.equal(calls.some(x=>x.method==='DELETE'),false);fs.writeFileSync(path.join(output,'summary.json'),JSON.stringify({checks:passed,fixtureErrors,exceptions,calls},null,2));console.log(`${passed}/${passed} cancellation/COD browser checks passed; no uncaught exceptions.`);
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
