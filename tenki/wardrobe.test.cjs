const fs=require('fs');
const path=require('path');
const vm=require('vm');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const root=__dirname;
function node(id='') {
  return {id,value:'',hidden:false,disabled:false,checked:false,textContent:'',innerHTML:'',attributes:{},children:[],events:{},options:[],
    addEventListener(type,fn){(this.events[type] ||= []).push(fn)},
    async emit(type,event={}){for(const fn of this.events[type] || []) await fn(event)},
    setAttribute(key,value){this.attributes[key]=String(value)},
    replaceChildren(...children){this.children=children},appendChild(child){this.children.push(child)},
    add(option){this.options.push(option)},requestSubmit(){},focus(){this.focused=true},scrollIntoView(){this.scrolled=true}};
}
function setup({app=false}={}) {
  const elements=new Map();
  const get=id => { if(!elements.has(id))elements.set(id,node(id));return elements.get(id); };
  const radioGroups={};
  for(const group of ['editor-top','editor-shoes']) {
    radioGroups[group]=[0,1].map(index => {
      const item=node();item.name=group;item.value=String(index);let checked=index===0;
      Object.defineProperty(item,'checked',{get:()=>checked,set:value=>{if(value)for(const other of radioGroups[group])if(other!==item)other.checked=false;checked=value}});
      return item;
    });
  }
  const labels={};
  get('outfit-editor').querySelector=selector => {
    if(selector==='.editor-preview')return get('preview');
    const radio=selector.match(/input\[name="([^"]+)"\](?:\[value="([01])"\]|:checked)/);
    if(radio)return radio[2]===undefined?radioGroups[radio[1]].find(r=>r.checked):radioGroups[radio[1]][Number(radio[2])];
    if(selector.startsWith('[data-'))return labels[selector] ||= node();
    throw Error('Unexpected selector '+selector);
  };
  get('outfit-editor').querySelectorAll=() => Object.values(radioGroups).flat();
  get('form').querySelector=() => get('submit');
  get('planner').querySelector=() => get('summary');
  get('result').querySelector=() => get('result-title');
  get('gender').value='female';get('result').hidden=true;
  const images=[];
  class Image { constructor(){images.push(this)} set src(value){this.source=value}get src(){return this.source} }
  const window=node('window');
  window.dispatchEvent=event => {for(const fn of window.events[event.type] || [])fn(event)};
  let temperature=19,rain=false,fail=false;
  const context=vm.createContext({window,document:{getElementById:get,createElement:()=>node()},Image,Option:function(text,value){this.text=text;this.value=value},
    localStorage:{getItem(){return null},setItem(){}},navigator:{},matchMedia:()=>({matches:true}),
    CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail}},Date,Intl,URL,URLSearchParams,
    fetch:async()=>{if(fail)throw Error('offline');return {ok:true,json:async()=>({hourly:{time:[new Date(Date.now()+3600000).toISOString()],temperature_2m:[temperature],apparent_temperature:[temperature],wind_speed_10m:[2],relative_humidity_2m:[60],weather_code:[rain?61:0],precipitation_probability:[rain?80:0]}})}}});
  vm.runInContext(fs.readFileSync(path.join(root,'wardrobe-catalog.js'),'utf8'),context);
  if(app)vm.runInContext(fs.readFileSync(path.join(root,'app.js'),'utf8'),context);
  vm.runInContext(fs.readFileSync(path.join(root,'outfit-editor.js'),'utf8'),context);
  return {get,radioGroups,labels,images,window,catalog:window.OutfitWardrobe,context,
    forecast:async(temp,isRain=false)=>{temperature=temp;rain=isRain;await get('form').emit('submit',{preventDefault(){}})},
    failForecast:async()=>{fail=true;await get('form').emit('submit',{preventDefault(){}})},
    complete:()=>{const img=images.at(-1);img.onload();return img}};
}
async function main(){
  const ui=setup();const {catalog,get,images,radioGroups}=ui;
  const temperatures=[-2,2,7,12,15,19,22,25,28,32];
  assert.equal(catalog.tiers.length,10);
  temperatures.forEach((temp,index)=>assert.equal(catalog.forTemperature(temp).id,'tier'+String(index+1).padStart(2,'0')));
  [0,5,10,14,17,20,23,26,30].forEach((temp,index)=>assert.equal(catalog.forTemperature(temp).id,catalog.tiers[index+1].id,'boundary '+temp));
  assert.throws(()=>catalog.forTemperature(NaN));assert.throws(()=>catalog.imagePath('tier99'));
  assert.throws(()=>catalog.imagePath('tier01',2,0));
  assert.equal(images.length,1,'initial render loads one choice, no bulk preloading');ui.complete();
  const paths=new Set();
  for(const tier of catalog.tiers){
    get('editor-tier').value=tier.id;await get('editor-tier').emit('change');ui.complete();
    for(const top of [0,1])for(const shoes of [0,1]){
      radioGroups['editor-top'][top].checked=true;await radioGroups['editor-top'][top].emit('change');
      radioGroups['editor-shoes'][shoes].checked=true;await radioGroups['editor-shoes'][shoes].emit('change');
      assert.equal(images.at(-1).src,catalog.imagePath(tier.id,top,shoes));ui.complete();
      assert.equal(get('editor-image').src,catalog.imagePath(tier.id,top,shoes));
      assert.equal(radioGroups['editor-top'].find(r=>r.checked).value,String(top),'shoe change preserves top');
      assert.equal(radioGroups['editor-shoes'].find(r=>r.checked).value,String(shoes));
      assert.ok(get('editor-image').alt.includes(tier.topLabels[top]));
      paths.add(catalog.imagePath(tier.id,top,shoes));
    }
  }
  assert.equal(paths.size,40);
  // Rapid changes cannot replace the latest successful selection with an older image.
  radioGroups['editor-top'][0].checked=true;await radioGroups['editor-top'][0].emit('change');const older=images.at(-1);
  radioGroups['editor-shoes'][0].checked=true;await radioGroups['editor-shoes'][0].emit('change');const latest=ui.complete();
  older.onload();assert.equal(get('editor-image').src,latest.src);
  // Error restores the exact prior tier, top and shoe choices.
  get('editor-tier').value='tier01';await get('editor-tier').emit('change');images.at(-1).onerror();
  assert.equal(get('editor-tier').value,'tier10');assert.equal(get('preview').attributes['aria-busy'],'false');
  await get('retry-outfit').emit('click');assert.equal(images.at(-1).src,catalog.imagePath('tier01',0,0));ui.complete();assert.equal(get('editor-tier').value,'tier01');
  get('editor-tier').value='tier10';await get('editor-tier').emit('change');ui.complete();
  await get('reset-outfit').emit('click');ui.complete();
  assert.equal(get('editor-image').src,catalog.imagePath('tier10',0,0));
  catalog.forecastTierId='tier03';ui.window.dispatchEvent({type:'outfitforecast'});
  assert.equal(get('editor-tier').value,'tier10','forecast preserves user edits');
  await get('use-weather-outfit').emit('click');ui.complete();assert.equal(get('editor-tier').value,'tier03');
  catalog.forecastTierId='tier04';ui.window.dispatchEvent({type:'outfitforecast'});ui.complete();assert.equal(get('editor-tier').value,'tier04');
  get('result').hidden=true;await get('return-weather').emit('click');assert.equal(get('planner').open,true);assert.equal(get('summary').focused,true);
  const fresh=setup();fresh.images.at(-1).onerror();assert.equal(fresh.get('editor-image').hidden,true);assert.equal(fresh.get('retry-outfit').hidden,false);
  await fresh.get('retry-outfit').emit('click');fresh.complete();assert.equal(fresh.get('editor-image').hidden,false);
  // Forecast routes all ten temperatures directly to the matching female image, including rain.
  const app=setup({app:true});app.complete();
  for(let index=0;index<temperatures.length;index++){
    const before=app.images.length;await app.forecast(temperatures[index],true);
    const expected=app.catalog.imagePath(app.catalog.tiers[index].id);
    assert.equal(app.images[before].src,expected,'female recommendation '+index);
    app.images[before].onload();assert.equal(app.get('illustration').children[0].src,expected);
    assert.equal(app.get('rain-reference').hidden,false);assert.equal(app.get('outfit-number').textContent,String(index+1).padStart(2,'0')+' / 10');
  }
  const raceStart=app.images.length;await app.forecast(12,false);const stale=app.images[raceStart];
  app.get('gender').value='male';await app.get('gender').emit('change');stale.onload();
  assert.ok(app.get('illustration').innerHTML.startsWith('<svg'));assert.equal(app.get('rain-reference').hidden,true);
  app.get('gender').value='female';await app.get('gender').emit('change');const failed=app.images.at(-1);failed.onerror();
  assert.equal(app.get('illustration').attributes['aria-busy'],'false');
  const message=app.get('illustration').children[0];assert.ok(message.textContent.includes('読み込めません'));
  await message.children[0].emit('click');assert.equal(app.images.at(-1).src,app.catalog.imagePath('tier04'));app.images.at(-1).onload();
  await app.failForecast();assert.ok(app.get('status').textContent.includes('取得できません'));assert.equal(app.get('submit').disabled,false);
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');const css=fs.readFileSync(path.join(root,'style.css'),'utf8');
  assert.ok(!html.includes('季節のコーデを見比べる'));assert.ok(!html.includes('class="comparison'));assert.ok(!css.includes('.comparison'));
  assert.ok(html.indexOf('wardrobe-catalog.js')<html.indexOf('src="app.js"'));
  const absent=[];const hashes=new Map();
  for(const source of paths){
    const file=path.join(root,source);
    if(!fs.existsSync(file)){absent.push(source);continue;}
    const bytes=fs.readFileSync(file);assert.equal(bytes.subarray(1,4).toString(),'PNG',source);assert.ok(bytes.length>100000,source+' actual image size');
    const hash=crypto.createHash('sha256').update(bytes).digest('hex');assert.ok(!hashes.has(hash),'Duplicated outfit image: '+source+' and '+hashes.get(hash));hashes.set(hash,source);
  }
  if(absent.length) {
    if(process.argv.includes('--allow-pending-assets'))console.log('Pending image files: '+absent.length);
    else assert.fail('Missing image files: '+absent.join(', '));
  }
  for(const name of ['assets-cold.json','assets-warm.json']){
    const manifest=path.join(root,'images','wardrobe',name);
    if(!fs.existsSync(manifest)){if(!process.argv.includes('--allow-pending-assets'))assert.fail('Missing manifest: '+name);continue;}
    for(const row of JSON.parse(fs.readFileSync(manifest,'utf8').replace(/^\uFEFF/,''))){
      const tier=catalog.getTier(row.id);assert.deepEqual(Array.from(tier.topLabels),row.topLabels);assert.deepEqual(Array.from(tier.shoeLabels),row.shoeLabels);
    }
  }
  console.log('PASS: 10 temperature thresholds, 40 combinations, independent controls, image races/errors/reset, forecast synchronization, rain, male SVG, offline behavior, section removal.');
}
main().catch(error=>{console.error(error);process.exitCode=1});
