const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
const exportsObject = {};
let values = {}, lastValue, codeWrite, fieldError;
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/shared-components/custom-phone-number/CustomPhoneNumber.tsx','utf8'), {
 compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true }
}).outputText, { exports: exportsObject, require: name => ({
 'react/jsx-runtime': require('react/jsx-runtime'),
 'react-hook-form': { Controller: 'Controller', useFormContext: () => ({ control:{},watch:key=>values[key],setValue:(...args)=>codeWrite=args,getFieldState:()=>({}) }) },
 'react-i18next': { useTranslation:()=>({t:k=>k,i18n:{language:'en'}}) },
 'mui-phone-input': { __esModule:true,default:'PhoneInput' },
})[name] });
function input(props, value) { return exportsObject.default(props).props.render({field:{value,onChange:v=>lastValue=v,onBlur:()=>{}},fieldState:{error:fieldError}}).props; }
let checks=0; function check(name,fn){fn();checks++;console.log('PASS '+name)};
check('Shared phone input preserves disabled, required and size props',()=>{const p=input({name:'phone',disabled:true,required:false,size:'small'},'+966-555123456');assert(p.disabled);assert.equal(p.required,false);assert.equal(p.size,'small');assert.equal(p.value,'+966555123456');});
check('Warehouse phone round-trips dial-code and national serialization',()=>{const p=input({name:'pickup.phone',serialized:true},'+966-555123456');p.onChange({countryCode:'966',areaCode:'55',phoneNumber:'5123456'});assert.equal(lastValue,'+966-555123456');});
check('Split phone forms preserve country and national fields on country change',()=>{values={phoneCountry:'+966'};const p=input({name:'phone',codeName:'phoneCountry'},'555123456');assert.equal(p.value,'+966555123456');p.onChange({countryCode:'971',areaCode:'50',phoneNumber:'1234567'});assert.equal(lastValue,'501234567');assert.equal(codeWrite[0],'phoneCountry');assert.equal(codeWrite[1],'+971');assert.equal(codeWrite[2].shouldValidate,true);});
check('Validation messages are supplied to the shared input',()=>{fieldError={message:'invalid'};const p=input({name:'phone'},'');assert(p.error);assert.equal(p.helperText,'invalid');fieldError=undefined;});
check('Existing unsplit callers preserve E164 behavior',()=>{const p=input({name:'phone'},'+15551234567');p.onChange({countryCode:'1',areaCode:'555',phoneNumber:'1234567'});assert.equal(lastValue,'+15551234567');});
check('Raw phone libraries are confined to the shared component',()=>{function scan(dir){for(const f of fs.readdirSync(dir,{withFileTypes:true})){const path=dir+'/'+f.name;if(f.isDirectory())scan(path);else if(/\.[jt]sx?$/.test(path)&&!path.includes('/custom-phone-number/'))assert(!/from ["'](?:mui-phone-input|mui-tel-input|react-phone-input-2|react-intl-tel-input)["']/.test(fs.readFileSync(path,'utf8')),path);}}scan('src/app');});
console.log(checks+' phone-input checks passed');
