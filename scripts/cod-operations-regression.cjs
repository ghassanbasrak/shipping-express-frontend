const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const target = path.resolve(__dirname, "..");
const ts = require(path.join(target, "node_modules/typescript"));
const zod = require(path.join(target, "node_modules/zod"));
const { createApi } = require(
  path.join(target, "node_modules/@reduxjs/toolkit/query/react"),
);
const { configureStore } = require(
  path.join(target, "node_modules/@reduxjs/toolkit"),
);
function load(file, imports = {}, globals = {}) {
  const exports = {};
  const js = ts.transpileModule(
    fs.readFileSync(path.join(target, file), "utf8").replace(/import\.meta\.env/g,"({})"),
    {
      fileName:file,
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
        jsx: ts.JsxEmit.ReactJSX,
      },
    },
  ).outputText;
  vm.runInNewContext(
    js,
    {
      exports,
      Date,
      Number,
      URL,
      console, structuredClone, crypto:require("node:crypto").webcrypto, Blob, Uint8Array, ArrayBuffer, setTimeout, clearTimeout,
      require: (name) => {
        if (name in imports) return imports[name];
        if (name === "zod") return zod;
        if (name === "react/jsx-runtime")
          return require(path.join(target, "node_modules/react/jsx-runtime"));
        throw new Error("Unexpected import " + name);
      },
      ...globals,
    },
    { filename: file },
  );
  return exports;
}



const plain=value=>JSON.parse(JSON.stringify(value));
const permissions=load('src/app/auth/permissions.ts'),contacts=load('src/app/main/shipment-users-app/Utils.ts');
const shipment=load('src/app/main/shipments-app/Utils.ts',{'src/app/auth/permissions':permissions,'../shipment-users-app/Utils':contacts,'../countries-app/Utils':{displayName:value=>typeof value==='string'?value:value?.en||value?.ar||''}});
const cancellation=load('src/app/main/cancel-shipment-requests-app/Utils.ts',{'src/app/auth/permissions':permissions});
const dues=load('src/app/main/merchant-dues-app/Utils.ts',{'src/app/auth/permissions':permissions,'../shipments-app/Utils':shipment});
const viewer={id:'viewer',role:'employee',features:[{feature:'cancel-shipment-requests',accessView:true},{feature:'merchant-dues',accessView:true}]};
const cancelEditor={id:'cancel-editor',role:'employee',features:[{feature:'cancel-shipment-requests',accessView:true,accessUpdate:true}]};
const duesEditor={id:'dues-editor',role:'employee',features:[{feature:'merchant-dues',accessView:true,accessUpdate:true}]};
const merchant={id:'owner',role:'user'},pending={id:'request',userId:'owner',status:'pending',shipment:{id:'shipment',trackingNumber:'TRACK'}};
const raw={id:'shipment',userId:'owner',user:{id:'owner',firstName:'Merchant'},updatedById:'staff',isCod:true,status:'processing',receiverId:'receiver',shipmentDetails:{id:'detail',receiverName:'Receiver'},shipmentCod:{id:'cod',shipmentId:'shipment',codStatus:'pending',codPrice:50,relatedRequestId:'withdrawal',updatedById:'reviewer',updatedBy:{id:'reviewer',firstName:'Reviewer'}}};
let passed=0;async function check(name,run){await run();passed++;console.log('PASS '+name);}
async function main(){
 await check('cancellation enum values and titles preserve the backend decision contract',()=>{assert.deepEqual(plain(cancellation.cancelShipmentRequestStatus),{pending:'pending',confirmed:'approved',refused:'rejected'});for(const value of ['pending','approved','rejected']){assert(cancellation.toCancelShipmentRequestStatusTitle(value));assert(cancellation.toCancelShipmentRequestStatusColor(value));}});
 await check('cancellation review requires its own view/update grants and pending status',()=>{assert.equal(cancellation.canReviewCancellationRequest(viewer,pending),false);assert.equal(cancellation.canReviewCancellationRequest(cancelEditor,pending),true);assert.equal(cancellation.canReviewCancellationRequest(cancelEditor,{...pending,status:'approved'}),false);assert.equal(cancellation.canReviewCancellationRequest(merchant,pending),false);assert.equal(cancellation.canReviewCancellationRequest({role:'employee',features:[{feature:'cancel-shipment-requests',accessUpdate:true}]},pending),false);});
 await check('cancellation ledger uses wallet transaction-view grant independently of shipment grants',()=>{assert.equal(cancellation.canViewCancellationTransactions(viewer,pending),false);const wallet={...viewer,features:[...viewer.features,{feature:'transactions',accessView:true}]};assert.equal(cancellation.canViewCancellationTransactions(wallet,pending),true);assert.equal(cancellation.canViewCancellationTransactions({...viewer,features:[...viewer.features,{feature:'cod-transactions',accessView:true}]},pending),false);assert.equal(cancellation.canViewCancellationTransactions(wallet,{...pending,shipment:{id:'shipment'}}),false);});
 await check('merchant cancellation ledger never accepts a foreign owner',()=>{assert.equal(cancellation.canViewCancellationTransactions(merchant,pending),true);assert.equal(cancellation.canViewCancellationTransactions(merchant,{...pending,userId:'foreign'}),false);});
 await check('COD rows preserve parent shipment and child COD identities without cache mutation',()=>{const source=structuredClone(raw);Object.freeze(source.shipmentDetails);Object.freeze(source.shipmentCod);Object.freeze(source);const row=dues.toMerchantDue(source);assert.equal(row.id,'cod');assert.equal(row.shipmentId,'shipment');assert.equal(row.shipment.id,'shipment');assert.equal(row.shipment.receiverName,'Receiver');assert.equal(row.updatedBy.id,'reviewer');assert.equal(row.relatedRequestId,'withdrawal');assert.equal(source.shipmentDetails.id,'detail');});
 await check('non-COD or missing-COD records cannot become payable rows',()=>{assert.equal(dues.toMerchantDue({...raw,isCod:false}),null);assert.equal(dues.toMerchantDue({...raw,shipmentCod:undefined}),null);assert.equal(dues.toMerchantDue({...raw,shipmentCod:{codStatus:'pending'}}),null);});
 await check('settlement snapshots target COD IDs while shipment operations retain owning shipment IDs',()=>{const row=dues.toMerchantDue(raw),snapshot=dues.toMerchantDueShipment(row);assert.equal(snapshot.id,'shipment');assert.equal(snapshot.shipmentCod.id,'cod');assert.equal(snapshot.userId,'owner');assert.equal(snapshot.shipmentCod.codPrice,50);snapshot.shipmentCod.codPrice=2;assert.equal(row.codPrice,50);});
 await check('merchant-dues staff can act without unrelated shipments permissions',()=>{const row=dues.toMerchantDue(raw);assert.equal(shipment.canUpdateShipment(duesEditor),false);assert.equal(dues.canUpdateMerchantDues(duesEditor),true);assert.equal(dues.canSettleMerchantDue(duesEditor,row),true);assert.equal(shipment.canSettleShipment(duesEditor,raw),false);assert.equal(shipment.canSettleShipment(duesEditor,raw,'merchant-dues'),true);});
 await check('shipment grants cannot bypass missing merchant-dues grants',()=>{const user={id:'staff',role:'employee',features:[{feature:'shipments',accessView:true,accessUpdate:true},{feature:'merchant-dues',accessView:true}]};assert.equal(shipment.canUpdateShipment(user),true);assert.equal(dues.canSettleMerchantDue(user,dues.toMerchantDue(raw)),false);assert.equal(dues.canUpdateMerchantDues(user),false);});
 await check('COD returned status requires merchant-dues update and delete',()=>{const row=dues.toMerchantDue(raw);assert.equal(dues.canReturnMerchantDue(duesEditor,row),false);const user={...duesEditor,features:[{feature:'merchant-dues',accessView:true,accessUpdate:true,accessDelete:true}]};assert.equal(dues.canReturnMerchantDue(user,row),true);assert.equal(dues.canReturnMerchantDue(user,dues.toMerchantDue({...raw,status:'returned'})),false);});
 await check('paid/returned/merchant COD records are never eligible for settlement',()=>{assert.equal(dues.canSettleMerchantDue(merchant,dues.toMerchantDue(raw)),false);assert.equal(dues.canSettleMerchantDue(duesEditor,dues.toMerchantDue({...raw,status:'returned'})),false);assert.equal(dues.canSettleMerchantDue(duesEditor,dues.toMerchantDue({...raw,shipmentCod:{...raw.shipmentCod,codStatus:'paid'}})),false);assert.equal(dues.canSettleMerchantDue(viewer,dues.toMerchantDue(raw)),false);});
 await check('original shipment permissions remain unchanged when the context is omitted',()=>{const staff={role:'employee',features:[{feature:'shipments',accessView:true,accessUpdate:true,accessDelete:true}]};assert.equal(shipment.canSettleShipment(staff,raw),true);assert.equal(shipment.canReturnShipmentStatus(staff,raw),true);assert.equal(shipment.canReturnShipmentStatus(staff,raw,'merchant-dues'),false);});
 const table=load('src/app/shared-components/custom-table/Utils.ts',{'src/app/main/utils/currencyFormatter':value=>String(value),moment:()=>({format:value=>value}),'src/app/main/utils/localeString':value=>typeof value==='string'?value:value?.en||''});
 await check('shared table resolves nested shipment statuses and carrier names for display',()=>{assert.equal(table.customTableValueGetter({id:'shipment.status'},{shipment:{status:'returned'}},undefined,key=>key),'returned');assert.equal(table.customTableValueGetter({id:'shippingCompany.name'},{shippingCompany:{name:'Carrier'}},undefined,key=>key),'Carrier');assert.equal(table.customTableValueGetter({id:'shipment.status',valueGetter:()=> 'override'},{},undefined,key=>key),'override');});
 await check('shared nested lookup retains zero, false and empty values without breaking missing paths',()=>{for(const value of [0,false,''])assert.equal(table.getFilterField({nested:{value}},'nested.value'),value);assert.equal(table.getFilterField({nested:null},'nested.value'),undefined);assert.equal(table.customTableValueGetter({id:'price.total'},{price:{total:0}},undefined,key=>key),0);});
 const toolkit=require(path.join(target,'node_modules/@reduxjs/toolkit'));
 const imports={'@reduxjs/toolkit':toolkit,'app/store/lazyLoadedSlices':{rootReducer:toolkit.combineSlices()}};
 const cancelSlice=load('src/app/main/cancel-shipment-requests-app/store/cancelShipmentRequestsSlice.js',imports),duesSlice=load('src/app/main/merchant-dues-app/store/merchantDuesSlice.js',imports);
 await check('both JavaScript slices retain ten-row pagination and reset pages for scope changes',()=>{for(const [slice,prefix,fields] of [[cancelSlice,'CancelShipmentRequests',['SearchText','UserIdFilter','UpdatedByIdFilter','StatusFilter']],[duesSlice,'MerchantDues',['SearchText','UserIdFilter','UpdatedByIdFilter','ShippingCompanyIdFilter','ShipmentReceiverIdFilter','ShipmentStatusFilters','ShipmentPaymentStatusFilter']]]){let value=slice.default(undefined,slice['new'+prefix+'Instance']({instanceKey:'key'}));assert.equal(value.pageSize,10);for(const field of fields){value=slice.default(value,slice['set'+prefix+'Page'](4));value=slice.default(value,slice['set'+prefix+field](field.endsWith('Filters')?['pending']:field.includes('PaymentStatus')?['pending']:'value'));assert.equal(value.page,0);}assert.equal(value.instanceKey,'key');}});
 await check('invalid dates retain previous valid bounds and block query/export scope broadening',()=>{for(const [slice,prefix,utils] of [[cancelSlice,'CancelShipmentRequests',cancellation],[duesSlice,'MerchantDues',dues]]){let value=slice.default(undefined,slice['set'+prefix+'DateFromFilter'](new Date('2026-01-01')));value=slice.default(value,slice['set'+prefix+'DateFromFilter'](new Date('invalid')));assert.equal(value.dateFromFilter,'2026-01-01T00:00:00.000Z');assert.equal(utils.datesValid(value),false);value=slice.default(value,slice['set'+prefix+'DateFromFilter'](null));assert.equal(utils.datesValid(value),true);assert.equal(utils.datesValid({dateFromFilter:'2026-10-01',dateToFilter:'2026-01-01'}),false);assert.equal(utils.datesValid({dateFromFilter:'invalid'}),false);}});
 const captured=[];let failWrite=false;const api=createApi({reducerPath:'codOperationsTest',keepUnusedDataFor:0,endpoints:()=>({}),baseQuery:async req=>{captured.push(req);if(failWrite&&req.method==='PATCH')return {error:{status:500,data:{message:'Write failed'}}};return {data:req.url.endsWith('/summary')?{canceledDues:0,pendingDues:50,settledDues:0}:req.method==='PATCH'?{id:'request',status:req.data.status}:{results:[],total:0}};}});
 for(const file of ['cancel-shipment-requests-app/CancelShipmentRequestsApi.ts','merchant-dues-app/MerchantDuesApi.ts','shipments-app/ShipmentsApi.ts'])load('src/app/main/'+file,{'app/store/apiService':{apiService:api}});
 const store=configureStore({reducer:{[api.reducerPath]:api.reducer},middleware:get=>get().concat(api.middleware)}),handles=[];
 async function request(name,arg,keep=false){const handle=store.dispatch(api.endpoints[name].initiate(arg,{forceRefetch:true}));handles.push(handle);try{return await handle.unwrap();}finally{if(!keep)handle.unsubscribe?.();}}
 try{
 await check('cancellation requests preserve fixed type, filters and 500000-row export scope',async()=>{await request('getCancelShipmentRequests',{page:2,pageSize:10,searchText:'A & B + #',statusFilter:'pending',userIdFilter:'owner',updatedByIdFilter:'reviewer',dateFromFilter:'2026-01-01',dateToFilter:'2026-10-01'});assert.deepEqual(plain(captured.at(-1).params),{page:2,pageSize:10,type:'cancelShipment',search:'A & B + #',status:'pending',userId:'owner',updatedById:'reviewer',dateFrom:'2026-01-01',dateTo:'2026-10-01'});await request('getCancelShipmentRequests',{page:0,pageSize:500000,searchText:'A & B + #',statusFilter:'pending'});assert.equal(captured.at(-1).params.pageSize,500000);assert.equal(captured.at(-1).params.type,'cancelShipment');});
 await check('all cancellation filter sentinels omit owner/reviewer/status parameters',async()=>{await request('getCancelShipmentRequests',{page:0,pageSize:10,userIdFilter:'all',updatedByIdFilter:'all',statusFilter:'all'});assert.deepEqual(plain(captured.at(-1).params),{page:0,pageSize:10,type:'cancelShipment'});});
 await check('cancellation decisions patch only status at the actual request ID',async()=>{await request('setCancelShipmentRequestStatus',{id:'actual-request',shipmentId:'actual-shipment',status:'approved'});assert.equal(captured.at(-1).url,'v1/requests/actual-request');assert.equal(captured.at(-1).method,'PATCH');assert.deepEqual(plain(captured.at(-1).data),{status:'approved'});});
 await check('failed cancellation decisions reject and remain retryable',async()=>{failWrite=true;await assert.rejects(()=>request('setCancelShipmentRequestStatus',{id:'actual-request',status:'rejected'}));failWrite=false;await request('setCancelShipmentRequestStatus',{id:'actual-request',status:'rejected'});assert.deepEqual(plain(captured.at(-1).data),{status:'rejected'});});
 await check('COD list uses original shipments endpoint and repeated status/payment arrays',async()=>{await request('getMerchantDues',{page:3,pageSize:10,searchText:'CODE & #',shippingCompanyIdFilter:'carrier',userIdFilter:'owner',updatedByIdFilter:'reviewer',shipmentReceiverIdFilter:'receiver',shipmentStatusFilters:['processing','delivered'],shipmentPaymentStatusFilter:['pending','paid'],dateFromFilter:'2026-01-01',dateToFilter:'2026-10-01'});const req=captured.at(-1);assert.equal(req.url,'v1/shipments');assert.deepEqual(plain(req.params),{isCod:true,page:3,pageSize:10,search:'CODE & #',shippingCompanyId:'carrier',userId:'owner',updatedById:'reviewer',status:['processing','delivered'],codStatus:['pending','paid'],receiverId:'receiver',dateFrom:'2026-01-01',dateTo:'2026-10-01'});assert.equal(req.paramsSerializer.indexes,null);});
 await check('COD export starts at zero and omits all sentinels and empty arrays',async()=>{await request('getMerchantDues',{page:0,pageSize:50000,shippingCompanyIdFilter:'all',userIdFilter:'all',updatedByIdFilter:'all',shipmentStatusFilters:[],shipmentPaymentStatusFilter:[]});assert.deepEqual(plain(captured.at(-1).params),{isCod:true,page:0,pageSize:50000});});
 await check('COD summary keeps only carrier/account/receiver scopes and retains zero totals',async()=>{const result=await request('getMerchantDuesSummary',{shippingCompanyIdFilter:'carrier',userIdFilter:'owner',shipmentReceiverIdFilter:'receiver',searchText:'ignored',dateFromFilter:'ignored',shipmentStatusFilters:['pending']});assert.equal(captured.at(-1).url,'v1/shipments/shipment-cods/summary');assert.deepEqual(plain(captured.at(-1).params),{shippingCompanyId:'carrier',userId:'owner',receiverId:'receiver'});assert.equal(result.canceledDues,0);assert.equal(result.settledDues,0);});
 await check('account fallback queries use the selected stored account ID',async()=>{await request('getMerchantDuesUser','owner');assert.equal(captured.at(-1).url,'v1/users/owner');await request('getCancelShipmentRequestsUser','other');assert.equal(captured.at(-1).url,'v1/users/other');});
 await check('shipment cancellation creation invalidates the migrated request list',async()=>{await request('getCancelShipmentRequests',{page:0,pageSize:10},true);const count=()=>captured.filter(x=>x.url==='v1/requests'&&!x.method).length,before=count();await request('requestShipmentCancellation',{shipmentId:'shipment',userId:'owner'});await new Promise(resolve=>setTimeout(resolve,10));assert.equal(count(),before+1);});
 await check('COD settlement invalidates both the dues list and independent summary',async()=>{await request('getMerchantDues',{page:0,pageSize:10},true);await request('getMerchantDuesSummary',{},true);const list=()=>captured.filter(x=>x.url==='v1/shipments'&&!x.method).length,summary=()=>captured.filter(x=>x.url==='v1/shipments/shipment-cods/summary').length,before=[list(),summary()];await request('settleShipmentCod','cod');await new Promise(resolve=>setTimeout(resolve,10));assert.equal(list(),before[0]+1);assert.equal(summary(),before[1]+1);assert(captured.some(req=>req.url==='v1/shipment-cods/cod'&&req.data?.codStatus==='paid'));});
 await check('approved cancellation refreshes requests, shipment-based COD rows and summary',async()=>{const count=()=>captured.filter(x=>!x.method).length,before=count();await request('setCancelShipmentRequestStatus',{id:'request',shipmentId:'shipment',status:'approved'});await new Promise(resolve=>setTimeout(resolve,10));assert(count()>=before+3);});
 }finally{handles.forEach(handle=>handle.unsubscribe?.());store.dispatch(api.util.resetApiState());}
 console.log(`${passed}/${passed} cancellation/COD operations regression checks passed.`);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
