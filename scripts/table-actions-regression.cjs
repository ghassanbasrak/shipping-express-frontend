const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
const jsx = require('react/jsx-runtime');
function load(file, imports={}) {
 const exports={}; vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8').replace(/import\.meta\.env/g,'({})'),{
   compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,target:ts.ScriptTarget.ES2022}
 }).outputText,{exports,require:name=>{if(name==='react/jsx-runtime')return jsx;if(name in imports)return imports[name];throw Error('Unexpected import '+name);}});return exports;
}
const permissions=load('src/app/auth/permissions.ts'), roles=load('src/app/auth/userRoles.tsx').default;
const shipments=load('src/app/main/shipments-app/Utils.ts',{'src/app/auth/user':{userRoles:roles},'src/app/auth/permissions':permissions,'../shipment-users-app/Utils':load('src/app/main/shipment-users-app/Utils.ts'),'../countries-app/Utils':{displayName:v=>v?.en||v?.ar||v||''}});
const dues=load('src/app/main/merchant-dues-app/Utils.ts',{'src/app/auth/permissions':permissions,'../shipments-app/Utils':shipments});
const table={TableDataTypes:{normal:0,money:1,date:2,actions:3}};
const shared={'src/app/auth/permissions':permissions,'react-router-dom':{Link:'Link'},'@mui/material':{Typography:'Typography'},'app/shared-components/custom-table/Utils':table};
const shipmentFields=load('src/app/main/shipments-app/shared-components/ShipmentFields.tsx',{...shared,'../Utils':shipments});
const dueFields=load('src/app/main/merchant-dues-app/shared-components/MerchantDueFields.tsx',{...shared,'moment':{__esModule:true,default:()=>({format:()=>''})},'../Utils':dues});
let checks=0;const check=(name,fn)=>{fn();checks++;console.log('PASS '+name)};
const admin={id:'staff',role:'admin'}, viewer={id:'viewer',role:'employee',features:[{feature:'shipments',accessView:true},{feature:'merchant-dues',accessView:true}]}, merchant={id:'owner',role:'user'};
const row={id:'shipment',userId:'owner',method:'international',status:'processing',trackingNumber:'TRACK',trackingUrl:'https://tracking.example/track',labelUrl:'https://files.example/label.pdf',imageUrl:'https://files.example/image.png',isCod:true,shipmentCod:{id:'cod',codStatus:'pending',codPrice:100},shippingCompany:{id:'carrier',serviceName:'smsa'}};
check('Every project action column uses shared actions definitions without renderCell',()=>{
 let count=0;function scan(dir){for(const file of fs.readdirSync(dir,{withFileTypes:true})){const path=dir+'/'+file.name;if(file.isDirectory())scan(path);else if(/\.[jt]sx?$/.test(path)){const source=ts.createSourceFile(path,fs.readFileSync(path,'utf8'),99,true,ts.ScriptKind.TSX);function visit(node){if(ts.isObjectLiteralExpression(node)){const properties=node.properties.filter(ts.isPropertyAssignment);const action=properties.some(p=>p.name.getText(source)==='id'&&/^["']actions["']$/.test(p.initializer.getText(source)))||properties.some(p=>p.name.getText(source)==='type'&&p.initializer.getText(source)==='TableDataTypes.actions');if(action){count++;assert(!properties.some(p=>p.name.getText(source)==='renderCell'),path);assert(properties.some(p=>p.name.getText(source)==='actions'),path);assert(properties.some(p=>p.name.getText(source)==='type'&&p.initializer.getText(source)==='TableDataTypes.actions'),path);}}ts.forEachChild(node,visit);}visit(source);}}}scan('src/app/main');assert(count>=15);console.log('Audited '+count+' action column definitions');
});
check('Shipment action availability preserves view-only and staff update permissions',()=>{
 const value=shipmentFields.toShipmentTableRow(row,viewer);assert(value.actionAccess.label);assert(value.actionAccess.invoiceDocument);assert(value.actionAccess.image);for(const key of ['settle','processing','delivered','returned','weight','invoice'])assert.equal(value.actionAccess[key],false,key);
 const full=shipmentFields.toShipmentTableRow(row,admin);assert(full.actionAccess.weight);assert(full.actionAccess.invoice);assert(full.actionAccess.delivered);
});
check('Merchant ownership and failed status continue to restrict shipment actions',()=>{
 assert.equal(shipmentFields.toShipmentTableRow({...row,status:'failed'},merchant).actionAccess.view,false);
 assert.equal(shipmentFields.toShipmentTableRow({...row,status:'failed'},merchant).actionAccess.label,false);
 assert.equal(shipmentFields.toShipmentTableRow({...row,userId:'foreign'},merchant).actionAccess.returnShipment,false);
});
check('Shipment table actions forward the chosen record and operation to dialogs',()=>{
 const selected=[];const actions=shipmentFields.default(k=>k,admin,'carrier-scope','international',{onDocument:(r,mode)=>selected.push([r.id,mode]),onOperation:(r,operation)=>selected.push([r.id,operation])}).find(f=>f.id==='actions');
 assert.equal(actions.type,table.TableDataTypes.actions);assert.equal(actions.actions[0].linkGetter(row),'/shipments/carrier-scope/international/shipment');
 actions.actions.find(a=>a.title==='LABEL').onActionClick(row);actions.actions.find(a=>a.title==='INVOICE').onActionClick(row);actions.actions.find(a=>a.title==='OPERATION_WEIGHT').onActionClick(row);
 assert.deepEqual(selected,[['shipment','label'],['shipment','invoice'],['shipment','weight']]);assert.equal(actions.actions.find(a=>a.title==='TRACKING').target,'_blank');
});
check('Merchant due actions retain the original permission scope and selected shipment',()=>{
 const due={id:'due',userId:'owner',shipmentId:'shipment',shipment:row,codStatus:'pending',codPrice:100};const value=dueFields.toMerchantDueTableRow(due,viewer);assert.equal(value.actionAccess.weight,false);assert.equal(value.actionAccess.settle,false);
 let selected;const actions=dueFields.default(k=>k,admin,(r,operation)=>selected=[r.id,operation]).find(f=>f.id==='actions');actions.actions.find(a=>a.title==='DISCOUNT_EXTRA_WEIGHT').onActionClick(due);assert.deepEqual(selected,['due','weight']);assert.equal(actions.actions.find(a=>a.title==='TRACK').linkGetter(due),row.trackingUrl);
});
check('Table availability mapping leaves cached server records untouched',()=>{
 const before=JSON.stringify(row);shipmentFields.toShipmentTableRow(Object.freeze(row),admin);assert.equal(JSON.stringify(row),before);assert.equal('actionAccess' in row,false);
});
check('Storage search is passed to the toolbar search slot without nested controls',()=>{
 const header=load('src/app/main/storage-app/shared/StorageHeader.tsx',{
  '@mui/material':{Typography:'Typography'},'react-router-dom':{Link:'Link'},'@mui/material/styles':{useTheme:()=>({direction:'ltr'})},'@fuse/core/FuseSvgIcon':{__esModule:true,default:'Icon'},
  'react-i18next':{useTranslation:()=>({t:k=>k})},'app/shared-components/feature-header/FeatureHeader':{__esModule:true,default:'Header',FeatureHeaderRow:'Row',FeatureHeaderHeading:'Heading',FeatureHeaderActions:'Actions',FeatureHeaderToolbar:'Toolbar'},
 }).default({title:'Storage',search:'search-input',toolbar:'filter-buttons',back:false});
 const toolbar=header.props.children.find(c=>c?.type==='Toolbar');assert.equal(toolbar.props.search,'search-input');assert.equal(toolbar.props.children,'filter-buttons');
});
check('A shipment document action opens and closes its table-owned dialog',()=>{
 const state=[], effects=[];let cursor=0,closed=false;
 const names=['Alert','Button','Dialog','DialogActions','DialogContent','DialogTitle','LinearProgress','Table','TableBody','TableCell','TableHead','TableRow','Typography'];
 const component=load('src/app/main/shipments-app/shared-components/ShipmentDocuments.tsx',{
  react:{useState:initial=>{const index=cursor++;if(!(index in state))state[index]=initial;return[state[index],value=>state[index]=value]},useRef:()=>({current:null}),useEffect:fn=>effects.push(fn)},
  '@mui/material':Object.fromEntries(names.map(name=>[name,name])), 'react-i18next':{useTranslation:()=>({t:k=>k})},
  'app/store/hooks':{useAppSelector:()=>merchant}, 'src/app/auth/user/store/userSlice':{selectUser:()=>merchant},
  'src/app/main/utils/currencyFormatter':{__esModule:true,default:v=>String(v)},
  '../ShipmentsApi':{useLazyGetShipmentLabelQuery:()=>[()=>{throw Error('Existing label must not refetch')}],useLazyGetShipmentQuery:()=>[()=>{throw Error('Existing label must not refetch')}]},
  '../Utils':shipments,'./documents':{},
 }).default;
 component({row,initialMode:'label',onClose:()=>closed=true});effects[0]();cursor=0;
 const tree=component({row,initialMode:'label',onClose:()=>closed=true});
 assert.equal(tree.props.children[0],false);const dialog=tree.props.children.find(child=>child?.type==='Dialog');assert.equal(dialog.props.open,true);dialog.props.onClose();assert(closed);
});
console.log(checks+' table action and toolbar checks passed');
