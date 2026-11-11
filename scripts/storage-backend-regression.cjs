// Real comparison operation/controller and quote admission; infrastructure is isolated.
const assert=require("node:assert/strict"), fs=require("node:fs"), path=require("node:path"), Module=require("node:module"), esbuild=require("esbuild");
const root=path.resolve(__dirname,".."), backend=process.env.STORAGE_BACKEND_DIR||path.join(process.env.USERPROFILE,"Desktop/Node.Js Projects/shipping-express-backend"), output=path.join(root,"test-results/storage");
fs.mkdirSync(output,{recursive:true});
const quotes=[], jobs=[];let checks=0;
const companies=[
 {id:"cheap",name:"Cheap",serviceName:"smsa",isActive:true,shippingMethods:["local"]},
 {id:"normal",name:"Normal",serviceName:"smsa",isActive:true,shippingMethods:["local"]},
 {id:"international",name:"International",serviceName:"dhl",isActive:true,shippingMethods:["international"]},
 {id:"failed",name:"Failed pricing",serviceName:"other",isActive:true,shippingMethods:["local"]},
];
function pass(name){checks++;console.log("PASS "+name);}
function mappingModel(field){
 const documents=companies.map(company=>({shippingCompanyId:company.id,[field]:field.replace("Id",""),name:company.id+" "+field,isActive:true,deletedAt:null,get(key){return this[key];}}));
 const query=(distinct)=>{
  let rows=[...documents],key;
  const chain={where(value){key=value;return chain;},equals(value){rows=rows.filter(row=>row[key]===value);return chain;},in(values){rows=rows.filter(row=>values.includes(row[key]));return chain;},then(resolve,reject){return Promise.resolve(distinct?[...new Set(rows.map(row=>row.shippingCompanyId))]:rows).then(resolve,reject);}};
  return chain;
 };
 return {distinct:()=>query(true),find:()=>query(false)};
}
global.__comparisonFixture={
 Operation:class{execute(input){return this.run(input);}},
 ShipmentMethod:{local:"local",international:"international"},InvalidPackageDimensionsError:Error,
 shippingCompanyRepository:{findBy:async()=>companies},
 shipmentCountryRepository:{model:mappingModel("countryId")},shipmentStateRepository:{model:mappingModel("stateId")},shipmentCityRepository:{model:mappingModel("cityId")},
 checkNewLocalShipment:async(input,company)=>{if(company.id==="failed")throw new Error("Provider pricing unavailable");return {subtotal:company.id==="cheap"?10:20,total:company.id==="cheap"?10:20};},
 checkNewInternationalShipment:async()=>({subtotal:40,total:40}),
 shipmentQuoteRepository:{model:{create:async(data)=>{const row={...structuredClone(data),id:String(quotes.length+1).padStart(24,"0"),consumedAt:null,save:async()=>{}};quotes.push(row);return row;},findOne:async(filter)=>quotes.find(row=>row.id===filter._id&&row.userId===filter.userId&&row.shippingCompanyId===filter.shippingCompanyId&&row.expiresAt>filter.expiresAt.$gt&&row.consumedAt===null)}},
 logger:{warn:()=>{},error:()=>{},info:()=>{}},userAuthenticated:()=>{},validator:()=>{},schema:{reviewCompanies:{}},
 userLockingService:{withUserLock:async(_,run)=>run()},userRepository:{findById:async(id)=>({id,balance:1000})},shippingUserRepository:{},
 jobProcessor:{bullQueue:{add:async(name,data)=>jobs.push({name,data})}},PlatformType:{external:"external"},UserShippingType:{sender:"sender",receiver:"receiver"},InsufficientBalanceError:Error,
 // Some local branches contain the separate proposed storage helper. This test
 // covers comparison/quote binding, not its unimplemented warehouse contract.
 resolveWarehouseShipment:async(value)=>value,
};
function compile(source){
 const code=esbuild.buildSync({stdin:{contents:"const {"+Object.keys(global.__comparisonFixture).join(",")+"}=globalThis.__comparisonFixture;\n"+source,loader:"ts",resolveDir:root},bundle:true,write:false,platform:"node",format:"cjs"}).outputFiles[0].text;
 const mod=new Module(path.join(root,"scripts/comparison-source-fixture.cjs"));mod.filename=path.join(root,"scripts/comparison-source-fixture.cjs");mod._compile(code,mod.filename);return mod.exports;
}
function source(file){return fs.readFileSync(path.join(backend,file),"utf8").replace(/^import[\s\S]*?from ['"][^'"]+['"]\r?\n/gm,"");}
async function main(){
 const operation=compile(source("src/operations/v1/shipments/review-shipment-companies.ts")).reviewShipmentCompanies;
 global.__comparisonFixture.reviewShipmentCompanies=operation;
 const controller=fs.readFileSync(path.join(backend,"src/api/controllers/v1/shipments.ts"),"utf8"),start=controller.indexOf("export const reviewShipmentWithCompanies"),end=controller.indexOf("export const ",start+20);
 const review=compile(controller.slice(start,end)).reviewShipmentWithCompanies.at(-1),queue=compile(source("src/operations/v1/shipments/add-shipment-to-queue.ts")).addShipmentToQueue;
 const payload={method:"local",senderName:"Sender",senderPhone:"+966-555123456",senderCountryId:"country",senderStateId:"state",senderCityId:"city",senderCountryName:"Canonical country",senderStateName:"Canonical state",senderCityName:"Canonical city",receiverName:"Receiver",receiverPhone:"+966-555123457",receiverCountryId:"country",receiverStateId:"state",receiverCityId:"city",description:"Owned stock",weight:1,length:1,width:1,height:1,warehouseId:"warehouse",products:[{title:"Product",price:5,quantity:2,warehouseProductId:"stock"}]};
 async function price(body=payload){let response;await review({valid:{body:structuredClone(body)},request:{user:{id:"merchant"}},ok:value=>response=value});return response;}
 const response=await price();
 assert.deepEqual(response.suitableCompanies.map(row=>row.shippingCompany.id),["cheap","normal"]);
 assert(response.suitableCompanies.every(row=>row.quoteId));assert.equal(response.unsuitableCompanies.length,2);
 pass("Actual companies controller returns all sorted prices and booking IDs in one response");
 assert.equal(response.unsuitableCompanies.find(row=>row.shippingCompany.id==="international").reasons[0].code,"METHOD_NOT_SUPPORTED");
 assert.equal(response.unsuitableCompanies.find(row=>row.shippingCompany.id==="failed").reasons[0].code,"PRICING_FAILED");
 pass("Actual comparison preserves method and pricing rejection codes and messages");
 const stored=quotes[0];assert.deepEqual(stored.requestData,payload);assert.equal(stored.providerInput.senderCityName,"cheap cityId");assert.equal(stored.requestData.senderCityName,"Canonical city");assert(!("userId" in stored.requestData));assert(!("shippingCompanyId" in stored.requestData));
 pass("Stored comparison quote binds canonical input separately from provider mapping names and retains stock IDs");
 await queue.execute({...payload,userId:"merchant",shippingCompanyId:"cheap",quoteId:stored.id});assert.equal(jobs.length,1);assert.equal(jobs[0].data.shipmentPrice.total,10);assert.equal(jobs[0].data.providerInput.senderCityName,"cheap cityId");
 pass("Actual queue accepts the unchanged comparison body with the selected carrier and its quote");
 await assert.rejects(()=>queue.execute({...payload,userId:"merchant",shippingCompanyId:"cheap",quoteId:stored.id}),/invalid/);assert.equal(jobs.length,1);
 pass("A consumed comparison quote cannot create a second job");
 const fresh=(await price()).suitableCompanies[0];
 for(const patch of [{receiverName:"Changed"},{products:[{...payload.products[0],quantity:3}]}])await assert.rejects(()=>queue.execute({...payload,...patch,userId:"merchant",shippingCompanyId:"cheap",quoteId:fresh.quoteId}),/changed/);
 for(const patch of [{userId:"foreign"},{shippingCompanyId:"normal"}])await assert.rejects(()=>queue.execute({...payload,userId:"merchant",shippingCompanyId:"cheap",quoteId:fresh.quoteId,...patch}),/invalid/);
 pass("Comparison quote admission rejects changed receiver/quantity, foreign owner and wrong carrier");
 const saved={...payload,receiverId:"saved-receiver"};const renewal=(await price(saved)).suitableCompanies.find(row=>row.shippingCompany.id==="cheap");await queue.execute({...saved,userId:"merchant",shippingCompanyId:"cheap",quoteId:renewal.quoteId});assert.equal(jobs.length,2);
 pass("Newly saved contact IDs are bound through companies review before queueing");
 const missing=await price({...payload,receiverCityId:"uncovered"});assert.equal(missing.suitableCompanies.length,0);assert(missing.unsuitableCompanies.every(row=>row.reasons.some(reason=>reason.code==="RECEIVER_CITY_NOT_SUPPORTED")));
 pass("Actual company review returns receiver coverage failures rather than a selectable price");
 fs.writeFileSync(path.join(output,"backend-operations.json"),JSON.stringify({checks,scope:"Actual companies operation/controller and queue source with pricing/database/auth/locking/queue dependencies isolated. No warehouse authority, MongoDB, Redis, gateway or carrier runtime acceptance."},null,2));
}
main().catch(error=>{console.error(error.stack||String(error));process.exitCode=1;});
