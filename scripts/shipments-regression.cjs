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


const plain=value=>JSON.parse(JSON.stringify(value)),base='src/app/main/shipments-app/';
const permissions=load('src/app/auth/permissions.ts'),contacts=load('src/app/main/shipment-users-app/Utils.ts');
const utils=load(base+'Utils.ts',{'src/app/auth/permissions':permissions,'../shipment-users-app/Utils':contacts,'../countries-app/Utils':{displayName:value=>typeof value==='string'?value:value?.en||value?.ar||''}});
const model=load(base+'models/ShipmentModel.ts',{'../Utils':utils});
const validators=load('src/app/main/utils/validations.ts',{'src/i18n':{t:key=>key},validator:require(path.join(target,'node_modules/validator'))});
const schemas=load(base+'models/ShipmentSchema.ts',{'../Utils':utils,'src/app/main/utils/validations':validators});
const schema=mode=>schemas.shipmentSchema(key=>key,mode);
const carrier={id:'carrier',name:'Carrier',isActive:true,hasState:true,isEnglish:true,serviceName:'aramex',shippingMethods:['local','international','cashOnDelivery']};
function valid(mode='create'){const value=model.default({shippingCompanyId:'carrier',shippingCompany:carrier,description:'Boxes',acceptExtraWeightTerms:true});for(const prefix of ['sender','receiver'])Object.assign(value,{[prefix+'Id']:'new',[prefix+'Name']:'Valid Person',[prefix+'Phone']:'555123456',[prefix+'StateId']:'s',[prefix+'StateName']:'Carrier State',[prefix+'CityId']:'c',[prefix+'CityName']:'Carrier City',[prefix+'Street']:'Street',[prefix+'NationalAddress']:'ABC123',[prefix+'ZipCode']:'12345'});value.receivers=[{...model.newShipmentReceiver(),...Object.fromEntries(Object.entries(value).filter(([key])=>key.startsWith('receiver')))}];return value;}
let passed=0;async function check(name,run){await run();passed++;console.log('PASS '+name);}
async function main(){
 await check('new draft contacts are independent and do not mutate source/populated entities',()=>{const a=valid(),b=valid();a.receivers[0].receiverName='Changed';assert.notEqual(a.receivers[0].key,b.receivers[0].key);assert.equal(b.receivers[0].receiverName,'Valid Person');assert.equal(schema().safeParse(b).success,true);});
 await check('decompression preserves shipment identity and frozen cache data',()=>{const raw=Object.freeze({id:'root',shipmentDetails:Object.freeze({id:'detail',description:'Box'}),shipmentCod:Object.freeze({id:'cod',codPrice:100}),shipmentProducts:[{title:'Item',price:7}]});const flat=utils.decompressShipment(raw);assert.equal(flat.id,'root');flat.products[0].price=10;assert.equal(raw.shipmentProducts[0].price,7);assert.equal(utils.decompressShipment({_id:'mongo'}).id,'mongo');});
 await check('whitelisted payload omits populations, metadata, local images, new IDs and inactive products',()=>{const value=valid();Object.assign(value,{id:'stale',userId:'foreign',status:'delivered',imageUrl:'image',products:[{title:'Ignored',price:5}]});const result=utils.compressShipment(value);for(const key of ['id','userId','status','shippingCompany','receivers','imageUrl','products','senderId','receiverId'])assert.equal(result[key],undefined);assert.equal(result.senderPhone,'+966-555123456');});
 await check('national address, sender prefix and Arabic phone digits retain source contract',()=>{const value=valid();value.senderPhone='٥٥٥١٢٣٤٥٦';value.senderNamePrefix='Store';const result=utils.compressShipment(value);assert.equal(result.senderPhone,'+966-555123456');assert.ok(result.senderName.startsWith('Store '));assert.equal(result.senderStreet,'Street'+contacts.nationalAddressSeparator+'ABC123');value.senderName=result.senderName;assert.equal(utils.compressShipment(value).senderName,result.senderName);});
 await check('saved contacts round-trip phone and national address without duplication',()=>{const contact={id:'saved',fullName:'Saved',phone:'+966-555123456',address:{countryId:'country',stateId:'state',cityId:'city',street:'Street'+contacts.nationalAddressSeparator+'ABC'}};const form={...valid(),...utils.savedShipmentContact(contact,'sender')};const payload=utils.shipmentContactValues(form,'sender');assert.equal(payload.address.street,contact.address.street);assert.equal(payload.phone,contact.phone);assert.equal(payload.userId,undefined);});
 await check('commercial customs products preserve title/price-only wire contract',()=>{const value=valid();Object.assign(value,{method:'international',imageUrl:'image',isCommercial:true,products:[{id:'nested',title:'Product',price:10,quantity:4}],couponCodeId:'coupon',couponCode:'SAVE'});const result=utils.compressShipment(value);assert.deepEqual(plain(result.products),[{title:'Product',price:10}]);assert.equal(result.imageUrl,'image');assert.equal(result.couponCodeId,'coupon');});
 await check('no-state carriers omit stale state names and IDs',()=>{const value=valid();value.shippingCompany={...carrier,hasState:false};const result=utils.compressShipment(value);assert.equal(result.senderStateId,undefined);assert.equal(result.receiverStateName,undefined);});
 await check('carrier mappings use matching names and never leak another carrier mapping',()=>{const value={name:{en:'Normal'},shipmentCities:[{shippingCompanyId:'other',name:'Wrong'},{shippingCompanyId:'carrier',name:'Correct'}]};assert.equal(utils.shippingGeoName(value,'carrier','city'),'Correct');assert.equal(utils.shippingGeoName(value,'missing','city'),'');assert.equal(utils.shippingGeoName(value,'carrier','country'),'Normal');});
 await check('normal creation validates every receiver and requires at least one',()=>{const value=valid();value.receivers.push({...value.receivers[0],key:'second',receiverPhone:''});let result=schema().safeParse(value);assert.equal(result.success,false);assert(result.error.issues.some(x=>x.path.join('.')==='receivers.1.receiverPhone'));value.receivers=[];assert.equal(schema().safeParse(value).success,false);});
 await check('geography requires carrier mappings, conditional state and international postal codes',()=>{for(const key of ['senderCityName','senderStateName']){const value=valid();value[key]='';assert.equal(schema().safeParse(value).success,false);}const value=valid();value.method='international';value.imageUrl='image';value.senderZipCode='';assert.equal(schema().safeParse(value).success,false);});
 await check('carrier is chosen after addresses: missing carrier reports only the carrier, and coverage is detected from mappings',()=>{const section=load(base+'shipment/sectionUtils.ts',{'../Utils':utils});const value=valid();value.shippingCompanyId='';value.shippingCompany=null;value.senderCityName='';const result=schema().safeParse(value);assert(result.error.issues.some(x=>x.path[0]==='shippingCompanyId'));assert(!result.error.issues.some(x=>x.path[0]==='senderCityId'));const city={shipmentCities:[{shippingCompanyId:'other',name:'Other'}]},state={shipmentStates:[{shippingCompanyId:'carrier',name:'S'}]};assert.equal(section.carrierMissesAddress({id:'carrier',hasState:true},{senderCity:city,senderState:state,receivers:[]}),true);assert.equal(section.carrierMissesAddress({id:'other',hasState:true},{senderCity:city,senderState:state,receivers:[]}),true);assert.equal(section.carrierMissesAddress({id:'other',hasState:false},{senderCity:city,senderState:state,receivers:[]}),false);assert.equal(section.carrierMissesAddress({id:'carrier'},{senderCity:{},receivers:[{receiverCity:{shipmentCities:[]}}]}),false);assert.equal(section.sectionOfField('receivers'),'receiver');assert.equal(section.sectionOfField('shippingCompanyId'),'carrier');assert.equal(section.sectionOfField('couponCode'),'payment');assert.equal(section.sectionOfField('weight'),'parcel');});
 await check('phone, name, street, terms and image rules prevent incomplete shipment requests',()=>{for(const patch of [{senderPhone:'123'},{senderName:'X'},{senderName:'عربي'},{senderStreet:'x'.repeat(46)},{acceptExtraWeightTerms:false},{type:'document',imageUrl:''}])assert.equal(schema().safeParse({...valid(),...patch}).success,false);});
 await check('normal packages allow six while returns and calculator retain maximum two',()=>{const value=valid();value.packagesCount=6;assert.equal(schema().safeParse(value).success,true);assert.equal(schema('return').safeParse(value).success,false);assert.equal(schema('calculator').safeParse(value).success,false);value.packagesCount=7;assert.equal(schema().safeParse(value).success,false);});
 await check('volumetric minimum follows Aramex divisor and rejects fractional actual weights',()=>{const value=valid();Object.assign(value,{length:20,width:20,height:20,weight:1});assert.equal(utils.shipmentVolumetricWeight(value),2);assert.equal(schema().safeParse(value).success,false);value.weight=2;assert.equal(schema().safeParse(value).success,true);value.weight=2.5;assert.equal(schema().safeParse(value).success,false);});
 await check('COD requires supported local method and positive amount',()=>{for(const patch of [{isCod:true,codPrice:0},{isCod:true,codPrice:20,method:'international',imageUrl:'image'},{isCod:true,codPrice:20,shippingCompany:{...carrier,shippingMethods:['local']}}])assert.equal(schema().safeParse({...valid(),...patch}).success,false);assert.equal(schema().safeParse({...valid(),isCod:true,codPrice:20}).success,true);});
 await check('calculator skips identities, national-address, image and description while retaining address requirements',()=>{const value=valid();Object.assign(value,{senderName:'',senderPhone:'',receiverName:'',receiverPhone:'',senderNationalAddress:'',receiverNationalAddress:'',description:'',acceptExtraWeightTerms:false});assert.equal(schema('calculator').safeParse(value).success,true);value.receiverCityId='';assert.equal(schema('calculator').safeParse(value).success,false);});
 await check('returns swap contacts and dial codes, clear carrier and force non-COD linkage',()=>{const value={...valid(),id:'original',senderPhone:'+966-555123456',receiverPhone:'+971-555987654',senderStreet:'Origin'+contacts.nationalAddressSeparator+'A',receiverStreet:'Destination'+contacts.nationalAddressSeparator+'B',isCod:true,codPrice:50};const result=utils.generateReturnedShipment(value);assert.equal(result.senderStreet,'Destination');assert.equal(result.senderNationalAddress,'B');assert.equal(result.senderPhoneCountry,'+971');assert.equal(result.returnedFromShipmentId,'original');assert.equal(result.isCod,false);assert.equal(result.shippingCompanyId,'');assert.equal(result.senderId,'new');assert.equal(result.receiverId,'new');});
 await check('return creation never exposes or serializes inactive COD collection',()=>{const value=valid();Object.assign(value,{returnedFromShipmentId:'source',isCod:true,codPrice:99});assert.equal(utils.compressShipment(value).isCod,false);assert.equal(utils.compressShipment(value).codPrice,undefined);assert.equal(schema('return').safeParse(value).success,false);});
 const merchant={id:'owner',role:'user'},viewer={id:'viewer',role:'employee',features:[{feature:'shipments',accessView:true}]},editor={id:'editor',role:'employee',features:[{feature:'shipments',accessView:true,accessUpdate:true}]},admin={id:'admin',role:'admin'};
 const row={id:'s',userId:'owner',isCod:true,status:'processing',trackingNumber:'TRACK',shipmentCod:{id:'cod',codStatus:'pending'}};
 await check('view/create/update grants remain distinct for staff and merchant operations',()=>{assert.equal(utils.canViewShipments(viewer),true);assert.equal(utils.canCreateShipment(viewer),false);assert.equal(utils.canUpdateShipment(viewer),false);assert.equal(utils.canUpdateShipment(merchant),false);assert.equal(utils.canUpdateShipment(editor),true);assert.equal(utils.canViewShipments({role:'employee',features:[{feature:'shipments',accessUpdate:true}]}),false);});
 await check('returned status requires update and delete, settlement requires pending nonreturned COD',()=>{assert.equal(utils.canReturnShipmentStatus(editor,row),false);assert.equal(utils.canReturnShipmentStatus(admin,row),true);assert.equal(utils.canSettleShipment(editor,row),true);assert.equal(utils.canSettleShipment(editor,{...row,status:'returned'}),false);assert.equal(utils.canSettleShipment(editor,{...row,shipmentCod:{id:'cod',codStatus:'paid'}}),false);});
 await check('cancellation and return creation require merchant ownership and existing tracking',()=>{assert.equal(utils.canRequestShipmentCancel(merchant,row),true);assert.equal(utils.canRequestShipmentCancel({...merchant,id:'foreign'},row),false);assert.equal(utils.canRequestShipmentCancel(admin,row),false);assert.equal(utils.canGenerateReturnedShipment(merchant,{...row,returnedShipmentId:'return'}),false);assert.equal(utils.canGenerateReturnedShipment(merchant,row),true);});
 const toolkit=require(path.join(target,'node_modules/@reduxjs/toolkit'));
 const slice=load(base+'store/shipmentsSlice.js',{'@reduxjs/toolkit':toolkit,'app/store/lazyLoadedSlices':{rootReducer:toolkit.combineSlices()}});
 await check('JavaScript slice preserves filter scopes while resetting pagination',()=>{let value=slice.default(undefined,slice.newShipmentsInstance({shippingCompanyIdFilter:'carrier'}));for(const key of ['SearchText','MerchantIdFilter','SenderIdFilter','ReceiverIdFilter','ClosedInvoiceFilter','IsReturnedFilter','ShippingTypeFilter','ShipmentTypeFilter']){value=slice.default(value,slice.setShipmentsPage(3));value=slice.default(value,slice['setShipments'+key]('value'));assert.equal(value.page,0);}assert.equal(value.shippingCompanyIdFilter,'carrier');});
 const captured=[],api=createApi({reducerPath:'shipmentTest',keepUnusedDataFor:0,endpoints:()=>({}),baseQuery:async request=>{captured.push(request);return {data:request.url.endsWith('/review')?{total:12}:request.url==='v1/shipments'&&request.method==='POST'?{message:'Accepted'}:{results:[],total:0}};}});
 load(base+'ShipmentsApi.ts',{'app/store/apiService':{apiService:api}});
 const store=configureStore({reducer:{[api.reducerPath]:api.reducer},middleware:get=>get().concat(api.middleware)}),handles=[];
 const request=async(name,arg)=>{const handle=store.dispatch(api.endpoints[name].initiate(arg,{forceRefetch:true}));handles.push(handle);try{return await handle.unwrap();}finally{handle.unsubscribe?.();}};
 try{
 await check('list/export contracts preserve scopes, repeated statuses and COD method distinction',async()=>{await request('getShipments',{page:2,pageSize:10,searchText:'A & B',shippingTypeFilter:'local',shippingCompanyIdFilter:'carrier',statusFilters:['pending','delivered'],paymentStatusFilter:['pending','paid'],merchantIdFilter:'owner',updatedByIdFilter:'staff',senderIdFilter:'sender',receiverIdFilter:'receiver',closedInvoiceFilter:'false',isReturnedFilter:'true',dateFromFilter:'2026-01-01',dateToFilter:'2026-10-01'});const req=captured.at(-1);assert.equal(req.url,'v1/shipments');assert.equal(req.params.isCod,false);assert.equal(req.params.method,'local');assert.deepEqual(plain(req.params.status),['pending','delivered']);assert.equal(req.params.closedInvoice,'false');assert.equal(req.params.userId,'owner');assert.equal(req.params.senderId,'sender');assert.equal(req.paramsSerializer.indexes,null);await request('getShipments',{page:0,pageSize:50000,shippingTypeFilter:'cashOnDelivery'});assert.equal(captured.at(-1).params.isCod,true);assert.equal(captured.at(-1).params.method,undefined);});
 await check('all sentinels omit inactive filters, summary uses account scope only',async()=>{await request('getShipments',{page:0,pageSize:10,shippingCompanyIdFilter:'all',shippingTypeFilter:'all',statusFilters:[],paymentStatusFilter:[]});assert.deepEqual(plain(captured.at(-1).params),{page:0,pageSize:10});await request('getShipmentsSummary','owner');assert.deepEqual(plain(captured.at(-1)),{url:'v1/shipments/shipment/summary',params:{userId:'owner'}});});
 await check('review and creation are plain independent mutations and retain async acceptance',async()=>{const payload=utils.compressShipment(valid());await request('reviewShipment',{...payload,userId:'owner'});assert.equal(captured.at(-1).url,'v1/shipments/review');assert.equal(captured.at(-1).data.userId,'owner');const result=await request('createShipment',payload);assert.equal(result.message,'Accepted');assert.equal(captured.at(-1).data.userId,undefined);});
 await check('status/invoice/weight writes use actual shipment ID and exact editable payload',async()=>{for(const [name,arg,url,data] of [['setShipmentStatus',{id:'actual',status:'delivered'},'v1/shipments/actual',{status:'delivered'}],['attachShipmentInvoice',{id:'actual',closeInvoiceNumber:'INV'},'v1/shipments/actual',{closeInvoiceNumber:'INV'}],['reviewShipmentExtraWeight',{id:'actual',weight:8},'v1/shipments/actual/review-extra-weight-price',{weight:8}],['deductShipmentExtraWeight',{id:'actual',weight:8,extraWeightPrice:0},'v1/shipments/actual/deduct-extra-weight-price',{weight:8,extraWeightPrice:0}]]){await request(name,arg);assert.equal(captured.at(-1).url,url);assert.deepEqual(plain(captured.at(-1).data),data);}});
 await check('cancellation and settlement retain original request type and COD endpoint',async()=>{await request('requestShipmentCancellation',{shipmentId:'actual',userId:'owner'});assert.deepEqual(plain(captured.at(-1).data),{type:'cancelShipment',status:'pending',shipmentId:'actual',userId:'owner'});await request('settleShipmentCod','cod-id');assert.equal(captured.at(-1).url,'v1/shipment-cods/cod-id');assert.deepEqual(plain(captured.at(-1).data),{codStatus:'paid'});});
 await check('tracking, label and detail-ledger contracts remain independent and correctly scoped',async()=>{await request('syncShipmentTracking','actual');assert.equal(captured.at(-1).url,'v1/shipments/shipment/tracking/actual');await request('getShipmentLabel',{shipmentId:'actual',trackingNumber:'TRACK'});assert.equal(captured.at(-1).params.shipmentId,'actual');await request('getShipmentTransactions',{trackingNumber:'TRACK',userId:'owner'});assert.deepEqual(plain(captured.at(-1).params),{page:0,pageSize:100,search:'TRACK',userId:'owner'});});
 }finally{for(const handle of handles)handle.unsubscribe?.();store.dispatch(api.util.resetApiState());}
 const pdfLib=require(path.join(target,'node_modules/pdf-lib')),pdf=await pdfLib.PDFDocument.create();pdf.addPage();const bytes=await pdf.save();let fail=false;
 const docs=load(base+'shared-components/documents.ts',{'pdf-lib':pdfLib},{fetch:async()=>({ok:!fail,status:fail?500:200,blob:async()=>new Blob([bytes],{type:'application/pdf'})})});
 await check('merged waybills include every PDF page',async()=>{const blob=await docs.mergeShipmentLabels(['one','two']);assert.equal((await pdfLib.PDFDocument.load(await blob.arrayBuffer())).getPageCount(),2);});
 await check('failed/empty document batches reject instead of downloading partial waybills',async()=>{fail=true;await assert.rejects(()=>docs.mergeShipmentLabels(['one','two']),/500/);await assert.rejects(()=>docs.mergeShipmentLabels([]),/No shipment/);});
 console.log(`${passed}/${passed} shipments regression checks passed.`);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
