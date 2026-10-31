// 体感温度の10段階は予報と着せ替えで共有する。
const outfits = window.OutfitWardrobe.tiers;
const locations = [ ['札幌',43.0618,141.3545],['青森',40.8244,140.74],['盛岡',39.7036,141.1527],['仙台',38.2682,140.8694],['秋田',39.7200,140.1026],['山形',38.2404,140.3633],['福島',37.7608,140.4747],['水戸',36.3658,140.4712],['宇都宮',36.5551,139.8828],['前橋',36.3911,139.0608],['さいたま',35.8617,139.6455],['千葉',35.6074,140.1065],['東京',35.6762,139.6503],['横浜',35.4437,139.6380],['新潟',37.9161,139.0364],['富山',36.6953,137.2113],['金沢',36.5947,136.6256],['福井',36.0652,136.2216],['甲府',35.6639,138.5684],['長野',36.6513,138.1810],['岐阜',35.3912,136.7223],['静岡',34.9756,138.3828],['名古屋',35.1815,136.9066],['津',34.7303,136.5086],['大津',35.0045,135.8686],['京都',35.0116,135.7681],['大阪',34.6937,135.5023],['神戸',34.6901,135.1955],['奈良',34.6851,135.8048],['和歌山',34.2261,135.1675],['鳥取',35.5011,134.2351],['松江',35.4723,133.0505],['岡山',34.6551,133.9195],['広島',34.3853,132.4553],['山口',34.1859,131.4714],['徳島',34.0658,134.5593],['高松',34.3401,134.0434],['松山',33.8392,132.7657],['高知',33.5597,133.5311],['福岡',33.5904,130.4017],['佐賀',33.2494,130.2988],['長崎',32.7503,129.8777],['熊本',32.8031,130.7079],['大分',33.2382,131.6126],['宮崎',31.9111,131.4239],['鹿児島',31.5966,130.5571],['那覇',26.2124,127.6809] ].map(([name,lat,lon])=>({name,lat,lon}));
const $ = id => document.getElementById(id);
const storage = {get(){try{return JSON.parse(localStorage.getItem('soratofuku-location'))}catch{return null}},set(value){try{localStorage.setItem('soratofuku-location',JSON.stringify(value))}catch{}}};
let displayedOutfit = null;
let displayedRain = false;
const genderStorageKey = 'soratofuku-gender';
try { const savedGender = localStorage.getItem(genderStorageKey); if (savedGender === 'male' || savedGender === 'female') $('gender').value = savedGender; } catch {}
$('gender').addEventListener('change', () => { try { localStorage.setItem(genderStorageKey, $('gender').value); } catch {} if (displayedOutfit) { renderRecommendedOutfit(displayedOutfit); } });
let current = storage.get();
const hadSavedLocation = !!current;
if (!current || !Number.isFinite(current.lat) || !Number.isFinite(current.lon)) current = locations[12];
function populate(){ $('location').replaceChildren(); if(current.name==='現在地'){const o=new Option('現在地','current');$('location').add(o)} locations.forEach((p,i)=>$('location').add(new Option(p.name,String(i)))); $('location').value=current.name==='現在地'?'current':String(Math.max(0,locations.findIndex(p=>p.name===current.name))); }
function localValue(d){const pad=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`}
const now=new Date(); $('start').value=localValue(now); $('end').value=localValue(new Date(now.getTime()+6*3600000)); populate();
let locationRevision = 0;
$('location').addEventListener('change',()=>{locationRevision++;if($('location').value!=='current'){current=locations[Number($('location').value)];storage.set(current)}});
function getLocation(auto = false){
  if(!navigator.geolocation){if(!auto) $('status').textContent='このブラウザでは現在地を利用できません。地域を選択してください。';return}
  const revision=++locationRevision;
  if(!auto) $('status').textContent='現在地を確認しています…';
  navigator.geolocation.getCurrentPosition(p=>{
    if(revision!==locationRevision)return;
    current={name:'現在地',lat:p.coords.latitude,lon:p.coords.longitude};storage.set(current);populate();
    if(auto) $('form').requestSubmit();
    else $('status').textContent='現在地を設定しました。服装をチェックしてください。';
  },()=>{if(!auto && revision===locationRevision) $('status').textContent='現在地を取得できませんでした。地域を選択してください。'}, {timeout:10000,maximumAge:600000});
}
$('geo').addEventListener('click',()=>getLocation());
function art(o){ const short=o.kind==='short', coat=o.kind==='coat', jacket=o.kind==='jacket', female=$('gender').value==='female';return `<svg viewBox="0 0 220 310" role="img" aria-label="${o.title}のイラスト"><ellipse cx="110" cy="292" rx="64" ry="7" fill="#d9e4d5"/>${female?'<path d="M82 183 L138 183 L152 254 Q110 264 68 254Z" fill="#727f79"/><path d="M88 256 L101 256 L101 276 L88 276Z M119 256 L132 256 L132 276 L119 276Z" fill="#d6b9a1"/>':'<path d="M78 183 L142 183 L145 267 Q143 277 134 277 L115 277 L110 209 L105 277 L85 277 Q76 276 76 267Z" fill="#727f79"/>'}<path d="M82 268 L105 269 L105 280 Q100 286 76 284 Q72 281 82 268 M115 269 L139 268 Q148 280 144 284 L117 284Z" fill="#4e5e56"/><path d="M91 40 Q110 27 129 40 L137 55 L155 61 L${short?172:168} ${short?105:139} L${short?151:147} ${short?112:146} L145 105 L${coat?150:145} ${coat?203:184} Q110 194 ${coat?70:75} ${coat?203:184} L75 105 L73 ${short?112:146} L${short?48:52} ${short?105:139} L65 61 L83 55Z" fill="${o.color}" stroke="#536d60" stroke-opacity=".25" stroke-width="2"/><path d="M90 41 Q110 57 130 41 L124 61 Q110 68 96 61Z" fill="${o.layer}"/>${jacket||coat?`<path d="M99 60 L121 60 L128 ${coat?196:182} L92 ${coat?196:182}Z" fill="${o.layer}"/><path d="M91 54 L103 75 L96 85 L105 ${coat?197:182} M129 54 L117 75 L124 85 L115 ${coat?197:182}" fill="none" stroke="#647a6d" stroke-opacity=".5" stroke-width="2"/>`:''}${o.kind==='shirt'?'<path d="M110 63 V183 M105 82 h2 M105 99 h2 M105 116 h2 M105 133 h2" stroke="#81988a" stroke-width="2"/>':''}${o.scarf?'<path d="M88 49 Q110 38 132 49 L130 65 Q112 70 93 63 L98 108 L83 109 L79 61Z" fill="#e7d4b5" stroke="#cfbda3" stroke-width="2"/>':''}<path d="M76 181 Q110 188 144 181" fill="none" stroke="#65796c" stroke-opacity=".25"/></svg>`}

let recommendationRevision = 0;
function renderRecommendedOutfit(outfit) {
  const target = $('illustration');
  const revision = ++recommendationRevision;
  $('outfit-number').textContent = String(outfits.indexOf(outfit)+1).padStart(2,'0') + ' / 10';
  $('outfit-range').textContent = '選択時間の最低体感温度：' + outfit.range;
  $('rain-reference').hidden = !displayedRain || $('gender').value !== 'female';
  target.setAttribute('aria-busy','false');
  if ($('gender').value !== 'female') { target.innerHTML = art(outfit); return; }
  const waiting = document.createElement('p');
  waiting.className = 'image-message';
  waiting.textContent = 'イラストを読み込んでいます…';
  target.replaceChildren(waiting);
  target.setAttribute('aria-busy','true');
  const next = new Image();
  next.alt = outfit.title + '：' + outfit.topLabels[0] + 'と' + outfit.shoeLabels[0] + 'の参考コーディネート';
  next.decoding = 'async';
  next.onload = () => {
    if (revision !== recommendationRevision) return;
    target.replaceChildren(next);
    target.setAttribute('aria-busy','false');
  };
  next.onerror = () => {
    if (revision !== recommendationRevision) return;
    waiting.textContent = 'イラストを読み込めませんでした。';
    const retry = document.createElement('button');
    retry.type = 'button'; retry.textContent = '画像を再読み込み';
    retry.addEventListener('click',() => renderRecommendedOutfit(outfit));
    waiting.appendChild(retry);
    target.setAttribute('aria-busy','false');
  };
  next.src = window.OutfitWardrobe.imagePath(outfit.id);
}

function weather(code){if(code>=95)return ['☈','雷雨'];if((code>=71&&code<=77)||(code>=85&&code<=86))return ['❄','雪'];if((code>=51&&code<=67)||(code>=80&&code<=82))return ['☂','雨'];if(code>=45&&code<=48)return ['☁','霧'];if(code>=3)return ['☁','くもり'];if(code>=1)return ['⛅','晴れ時々くもり'];return ['☀','晴れ']}
function fmt(d){return new Intl.DateTimeFormat('ja-JP',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(d)}
let requestId=0;
$('form').addEventListener('submit',async e=>{e.preventDefault();const start=new Date($('start').value),end=new Date($('end').value),now=new Date();if(isNaN(start)||isNaN(end)||end<=start){$('status').textContent='終了時刻は開始時刻より後にしてください。';return}if(start<new Date(now.getFullYear(),now.getMonth(),now.getDate())||end.getTime()>now.getTime()+6*86400000){$('status').textContent='今日から約6日先までの時間を選んでください。';return}const id=++requestId, location={...current};$('status').textContent='天気予報を取得しています…';$('form').querySelector('.submit').disabled=true;try{const url=new URL('https://api.open-meteo.com/v1/forecast');url.search=new URLSearchParams({latitude:location.lat,longitude:location.lon,hourly:'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m',wind_speed_unit:'ms',timezone:'Asia/Tokyo',forecast_days:'7'});const res=await fetch(url);if(!res.ok)throw Error('API error');const data=await res.json();const h=data.hourly;const selected=h.time.map((t,i)=>({time:new Date(t),i})).filter(x=>x.time.getTime()<=end.getTime() && x.time.getTime()+3600000>start.getTime());if(!selected.length)throw Error('no data');const vals=key=>selected.map(x=>h[key][x.i]).filter(Number.isFinite);const temperatures=vals('temperature_2m'), apparent=vals('apparent_temperature'),winds=vals('wind_speed_10m'),humidities=vals('relative_humidity_2m'),codes=vals('weather_code'),rain=vals('precipitation_probability');if(!temperatures.length||!apparent.length||!winds.length||!humidities.length||!codes.length)throw Error('missing data');const min=Math.min(...temperatures),max=Math.max(...temperatures),feels=Math.min(...apparent),wind=Math.max(...winds),humidity=Math.round(humidities.reduce((a,b)=>a+b,0)/humidities.length),code=Math.max(...codes),prob=rain.length?Math.max(...rain):0;const outfit=window.OutfitWardrobe.forTemperature(feels),w=weather(code);let tips=[];if(code>=95)tips.push('雷雨に注意し、安全な場所で過ごしましょう。');else if((code>=51&&code<=86)||prob>=50)tips.push('雨や雪に備えて、傘や濡れにくい靴があると安心です。');if(wind>=7)tips.push('風が強めです。風を通しにくい上着がおすすめ。');if(humidity>=75&&max>=24)tips.push('湿度が高め。通気性のよい素材が快適です。');if(max-min>=5)tips.push('時間帯で気温が変わるため、脱ぎ着できる服が便利です。');if(max>=30)tips.push('暑さ対策に、こまめな水分補給を。');if(!tips.length)tips.push('体感に合わせて、羽織りものなどで調整してください。');if(id!==requestId)return;displayedRain=(codes.some(c=>(c>=51&&c<=67)||(c>=80&&c<=82)||c>=95)||prob>=50);displayedOutfit=outfit;renderRecommendedOutfit(outfit);window.OutfitWardrobe.forecastTierId=outfit.id;window.dispatchEvent(new CustomEvent('outfitforecast',{detail:{tierId:outfit.id}}));$('outfit-title').textContent=outfit.title;$('outfit-description').textContent=outfit.description;$('weather-icon').textContent=w[0];$('weather-label').textContent=w[1];$('temperature').textContent=`${Math.round(min)}〜${Math.round(max)}°C`;$('wind').textContent=`${wind.toFixed(1)} m/s`;$('humidity').textContent=`${humidity}%`;$('tips').textContent=tips.join(' ');$('result-period').textContent=`${location.name}　${fmt(start)} 〜 ${fmt(end)}`;$('result').hidden=false;$('empty').hidden=true;$('status').textContent='';}catch(err){if(id===requestId)$('status').textContent='天気予報を取得できませんでした。通信状態と日時を確認して、もう一度お試しください。'}finally{if(id===requestId)$('form').querySelector('.submit').disabled=false}});


// 初期値で表示し、初回の現在地取得に成功した場合はその地点で更新する。
$('form').requestSubmit();
if (!hadSavedLocation) getLocation(true);





// 結果から予定の設定へ移動する。
$('change-conditions').addEventListener('click', () => {
  const planner = $('planner');
  planner.open = true;
  const summary = planner.querySelector('summary');
  summary.focus({ preventScroll: true });
  planner.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
});
