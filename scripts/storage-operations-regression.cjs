// Contract and state simulations only. No network, browser, card, or live backend writes.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'),
  Module = require('node:module'), esbuild = require('esbuild'), axios = require('axios');
const root = path.resolve(__dirname, '..'), output = path.join(root, 'test-results/storage-operations');
fs.mkdirSync(output, { recursive: true });
const memory = new Map();
global.localStorage = { getItem: k => memory.get(k) ?? null, setItem: (k,v) => memory.set(k,v), removeItem: k => memory.delete(k) };
global.window = { location: { origin: 'http://localhost:3000' } };
const stub = path.join(output, 'api-stub.ts');
fs.writeFileSync(stub, 'export const apiService={enhanceEndpoints(){return this},injectEndpoints(options){return {endpointDefinitions:options.endpoints({query:v=>v,mutation:v=>v})}}};');
const bundle = esbuild.buildSync({ stdin: { contents: `
 export * from './src/app/demo/demoApi';
 export * from './src/app/main/storage-app/Utils';
 export * from './src/app/main/storage-app/models/StorageSchemas';
 export * from './src/app/main/storage-subscriptions-app/Utils';
 export {default as StorageApi} from './src/app/main/storage-app/StorageApi';
 export {default as SubscriptionApi} from './src/app/main/storage-subscriptions-app/StorageSubscriptionsApi';
 `, resolveDir: root }, bundle: true, platform: 'node', format: 'cjs', write: false,
 external: ['axios', 'axios-mock-adapter', 'jspdf', 'xlsx'], alias: { 'app/store/apiService': stub },
 define: { 'import.meta.env': JSON.stringify({ VITE_DEMO_MODE: 'true', VITE_BASE_URL: 'https://demo.invalid' }) } });
const mod = new Module(path.join(root, 'scripts/storage-operations-bundle.cjs')); mod.filename = mod.id; mod.paths = module.paths; mod._compile(bundle.outputFiles[0].text, mod.filename);
const api = mod.exports; let mock, checks = 0; const results = [];
const check = (name, fn) => { fn(); checks++; results.push(name); console.log('PASS '+name); };
const identity = value => localStorage.setItem('ashamco-demo-identity', value);
const snapshot = () => JSON.parse(memory.get('ashamco-demo-data-v1'));
async function call(url, method='get', data, status=200, params) {
 const response = await axios({ url, method, data, params, validateStatus: () => true });
 assert.equal(response.status, status, method+' '+url+' '+JSON.stringify(response.data)); return response.data;
}
async function main() {
 mock = api.installDemoApi();
 const types = Object.values(api.storageType), endpoint = api.StorageApi.endpointDefinitions, sub = api.SubscriptionApi.endpointDefinitions;
 check('Storage type values are closed and shared by products, warehouses and plans', () => assert.deepEqual(types, ['standard','dry','chilled','frozen']));
 check('Every enum has a title and color helper', () => {
   for(const value of types) { assert.notEqual(api.toStorageTypeTitle(value), 'UNKNOWN_STORAGE_TYPE'); assert(api.toStorageTypeColor(value)); }
   for(const value of Object.values(api.supplyStatuses)) { assert(api.toSupplyStatusTitle(value)); assert(api.toSupplyStatusColor(value)); }
   for(const value of Object.values(api.storageSubscriptionStatus)) { assert(api.toStorageSubscriptionStatusTitle(value)); assert(api.toStorageSubscriptionStatusColor(value)); }
 });
 const warehouse = (await call('v1/warehouses/admin'))[0], plans = await call('v1/storage/plans/admin');
 const data = api.warehouseSaveValues({ ...warehouse, name: ' QA warehouse ', storageTypes: [api.storageType.dry] });
 check('Warehouse payload excludes retired address and retains complete pickup', () => { assert(!('address' in data)); assert.equal(data.pickup.phone, warehouse.pickup.phone); assert.deepEqual(data.storageTypes, ['dry']); });
 const created = await call('v1/warehouses','post',data,201);
 check('Warehouse create persists pickup without address in the demo contract', () => assert(api.warehousePickupWasSaved(created, data)));
 const updated = await call('v1/warehouses/'+created.id,'patch',{...data, pickup:{...data.pickup,phone:'+966-501234567'}});
 check('Warehouse update keeps the same ID and revised pickup', () => { assert.equal(updated.id,created.id); assert.equal(updated.pickup.phone,'+966-501234567'); });
 check('Dropped pickup or storage capabilities cannot report a complete save', () => { assert(!api.warehousePickupWasSaved({...created,pickup:undefined},data)); assert(!api.storageTypesWereSaved(undefined,data.storageTypes)); assert(api.storageTypesWereSaved(created.storageTypes,data.storageTypes)); });
 check('Warehouse type validation rejects unknown or empty capabilities', () => { assert(!api.warehouseSchema(k=>k).safeParse({...data,storageTypes:['arbitrary']}).success); assert(!api.warehouseSchema(k=>k).safeParse({...data,storageTypes:[]}).success); });
 const planData = api.storagePlanSaveValues({ name:'Free QA',price:10,discountPrice:0,durationDays:7,featuresText:'Exact benefit\nSecond benefit',storageTypes:[api.storageType.dry],isActive:true });
 check('Plan features remain prose and storage types have their own array', () => { assert.deepEqual(planData.features,['Exact benefit','Second benefit']); assert.deepEqual(planData.storageTypes,['dry']); assert.equal(planData.discountPrice,0); });
 const free = await call('v1/storage/plans','post',planData,201);
 check('Invalid discount and product quantity are rejected', () => { assert(!api.storagePlanSchema(k=>k).safeParse({...planData,featuresText:'x',discountPrice:11}).success); assert(!api.storageProductSchema(k=>k).safeParse({userId:'u',warehouseId:'w',name:'x',quantity:-1,unitPrice:5,storageType:'dry'}).success); });
 check('Allowed supply types are the plan and warehouse intersection', () => { assert.deepEqual(api.supportedStorageTypes({storageTypes:['dry','chilled']},{storageTypes:['dry','frozen']}),['dry']); assert.deepEqual(api.supportedStorageTypes({features:['dry']},{storageTypes:['dry']}),[]); });
 check('New endpoints keep merchant scope server-owned', () => {
   assert.equal(sub.getStorageSubscriptions.query({admin:true,userId:'cache'}).url,'v1/storage/subscriptions/admin');
   assert.deepEqual(sub.getStorageSubscriptions.query({userId:'cache'}),{url:'v1/storage/subscriptions'});
   assert.deepEqual(sub.verifyStoragePayment.query({paymentId:'internal',userId:'cache'}),{url:'v1/payments/internal/check-status',method:'POST',data:{}});
   assert.equal(endpoint.getStorageProducts.query({admin:true,userId:'cache'}).url,'v1/storage/products/admin');
 });
 identity('merchant');
 await call('v1/storage/products','get',undefined,403);
 check('Unsubscribed merchants cannot read usable inventory', () => assert.equal(api.hasActiveStorageSubscription(null,'demo-merchant'),false));
 await call('v1/storage/subscriptions/admin','get',undefined,403);
 await call('v1/storage/subscriptions/admin','post',{userId:'demo-merchant',planId:free.id,operation:'subscribe'},403);
 check('Merchant cannot list or create admin subscriptions', () => {});
 const checkout = await call('v1/storage/subscriptions/checkout','post',{planId:free.id,operation:api.storageSubscriptionOperation.subscribe},201);
 check('Free subscription activates without hosted payment or wallet deduction', () => { assert.equal(checkout.checkoutUrl,null); assert.equal(checkout.payment.paymentMethodType,'free'); assert(checkout.subscription); });
 const current = await call('v1/storage/subscriptions/current');
 const history = await call('v1/storage/subscriptions');
 check('Merchant history includes all model fields and populated plan/payment/account', () => { assert.equal(history.length,1); for(const key of ['id','userId','planId','paymentId','status','price','startsAt','endsAt','plan','payment','user']) assert(history[0][key] !== undefined,key); assert(api.hasActiveStorageSubscription(current,'demo-merchant')); assert(!api.hasActiveStorageSubscription(current,'foreign')); });
 const product = { name:'QA dry product',sku:'qa-1',quantity:4,unitPrice:12,storageType:api.storageType.dry };
 const request = await call('v1/storage/supply-requests','post',{warehouseId:created.id,products:[product]},201);
 check('New product requests are pending and do not immediately increase inventory', () => assert.equal(request.status,api.supplyStatuses.pending));
 await call('v1/storage/supply-requests','post',{warehouseId:created.id,products:[{...product,storageType:api.storageType.chilled}]},400);
 check('Unsupported warehouse and plan types cannot be supplied', () => {});
 identity('admin');
 await call('v1/storage/supply-requests/admin/'+request.id+'/status','patch',{status:api.supplyStatuses.approved});
 let products = await call('v1/storage/products/admin'); assert.equal(products.length,0);
 check('Approval alone never creates stock', () => {});
 await call('v1/storage/supply-requests/admin/'+request.id+'/status','patch',{status:api.supplyStatuses.received});
 products = await call('v1/storage/products/admin'); const stored = products[0];
 check('Receipt adds stock once with full account and warehouse populations', () => { assert.equal(stored.quantity,4); assert(stored.user.id); assert(stored.warehouse.pickup); });
 await call('v1/storage/supply-requests/admin/'+request.id+'/status','patch',{status:api.supplyStatuses.received},400);
 check('Repeated received transition is refused', () => {});
 identity('merchant');
 const existingForm = { warehouseId:created.id,products:[{mode:api.supplyProductMode.existing,warehouseProductId:stored.id,name:stored.name,sku:stored.sku,storageType:stored.storageType,quantity:3,unitPrice:null}] };
 const existingPayload = api.supplySaveValues(existingForm);
 check('Existing product wire payload has only ID and quantity when price is omitted', () => assert.deepEqual(existingPayload.products,[{warehouseProductId:stored.id,quantity:3}]));
 const more = await call('v1/storage/supply-requests','post',existingPayload,201);
 identity('admin');
 await call('v1/storage/supply-requests/admin/'+more.id+'/status','patch',{status:'approved'});
 await call('v1/storage/supply-requests/admin/'+more.id+'/status','patch',{status:'received'});
 products = await call('v1/storage/products/admin');
 check('Existing product adds quantity and preserves omitted price', () => { assert.equal(products[0].quantity,7); assert.equal(products[0].unitPrice,12); });
 identity('merchant');
 const zeroPayload=api.supplySaveValues({...existingForm,products:[{...existingForm.products[0],unitPrice:0,quantity:2}]});
 check('Explicit zero replacement price is preserved', () => assert.equal(zeroPayload.products[0].unitPrice,0));
 const zero = await call('v1/storage/supply-requests','post',zeroPayload,201);
 identity('admin'); await call('v1/storage/supply-requests/admin/'+zero.id+'/status','patch',{status:'approved'}); await call('v1/storage/supply-requests/admin/'+zero.id+'/status','patch',{status:'received'});
 products = await call('v1/storage/products/admin');
 check('Receipt applies an explicit zero price', () => { assert.equal(products[0].quantity,9); assert.equal(products[0].unitPrice,0); });
 const edit = {...products[0],name:'Edited',quantity:8,unitPrice:7}; delete edit.user; delete edit.warehouse;
 const edited = await call('v1/storage/products/admin/'+stored.id,'patch',edit);
 check('Admin can edit every editable product field', () => { assert.equal(edited.name,'Edited'); assert.equal(edited.quantity,8); assert.equal(edited.unitPrice,7); });
 identity('merchant'); await call('v1/storage/products/admin/'+stored.id,'patch',edit,403);
 check('Merchant cannot use admin product editing', () => {});
 await call('v1/storage/supply-requests','post',{warehouseId:created.id,products:[{warehouseProductId:'foreign',quantity:1}]},400);
 check('Missing or foreign existing products are refused', () => {});
 identity('admin'); await call('v1/storage/products/admin/'+stored.id,'patch',{...edit,quantity:0}); identity('merchant');
 const emptyVisible = await call('v1/storage/products','get',undefined,200,{includeEmpty:true});
 const availableOnly = await call('v1/storage/products');
 check('Supply selection includes empty stock while shipment availability stays positive-only',()=>{assert(emptyVisible.some(p=>p.id===stored.id&&p.quantity===0));assert(!availableOnly.some(p=>p.id===stored.id));assert.equal(endpoint.getStorageProducts.query({userId:'cache',includeEmpty:true}).params.includeEmpty,true);});
 const renewed = await call('v1/storage/subscriptions/checkout','post',{planId:free.id,operation:'renew'},201);
 check('Renewal preserves remaining time and creates a separate history row', () => { assert(Date.parse(renewed.subscription.endsAt) > Date.parse(current.endsAt)); assert.notEqual(renewed.subscription.id,current.id); });
 const upgrade = await call('v1/storage/subscriptions/checkout','post',{planId:plans[1].id,operation:'upgrade'},201);
 check('Paid upgrade returns a hosted link and leaves current entitlement unchanged until verified', () => { assert(upgrade.checkoutUrl); assert.equal(upgrade.payment.status,'pending'); });
 assert.equal((await call('v1/storage/subscriptions/current')).id,renewed.subscription.id);
 await call('v1/payments/'+upgrade.payment.id+'/demo-complete','post',{paymentMethodType:'mada'});
 await call('v1/payments/'+upgrade.payment.id+'/check-status','post',{});
 const after = await call('v1/storage/subscriptions/current');
 await call('v1/payments/'+upgrade.payment.id+'/check-status','post',{});
 check('Verified upgrade activates matching plan exactly once', () => { assert.equal(after.planId,plans[1].id); assert.equal(after.paymentId,upgrade.payment.id); });
 const afterHistory = await call('v1/storage/subscriptions'); assert.equal(afterHistory.filter(r=>r.paymentId===upgrade.payment.id).length,1);
 identity('admin');
 const immediate = await call('v1/storage/subscriptions/admin','post',{userId:'demo-merchant',planId:plans[1].id,operation:'renew'},201);
 check('Admin renewal activates immediately without merchant payment', () => { assert.equal(immediate.status,'active'); assert.equal(immediate.userId,'demo-merchant'); });
 const rejected=await call('v1/storage/subscriptions/admin','post',{userId:'missing',planId:free.id,operation:'subscribe'},404);
 check('Admin cannot subscribe nonexistent accounts', () => assert(rejected.message));
 check('Subscription expiry and ownership both gate warehouse shipments', () => { assert(!api.hasActiveStorageSubscription({...after,endsAt:new Date(Date.now()-1).toISOString()},'demo-merchant')); assert(!api.hasActiveStorageSubscription(after,'foreign')); });
 fs.writeFileSync(path.join(output,'result.json'),JSON.stringify({checks,results,scope:'Isolated frontend/demo contracts; live backend acceptance pending'},null,2));
 console.log(checks+' storage operations checks passed');
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>mock?.restore());
