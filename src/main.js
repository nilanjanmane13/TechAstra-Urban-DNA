import './style.css';

// -----------------------------------------------------------------------------
// Auth gate: this page is only reachable once server.js confirms a session
// (see pageGate in server.js), but we double-check client-side too and wire
// up the logout button + user greeting in the topbar.
// -----------------------------------------------------------------------------
let currentUser = null;
(async function loadSession() {
  try {
    const r = await fetch('/api/auth/me');
    const d = await r.json();
    if (!d?.user) { window.location.replace('/login.html'); return; }
    currentUser = d.user;
    const el = document.querySelector('#userGreeting');
    if (el) el.textContent = currentUser.name.split(' ')[0];
  } catch {
    window.location.replace('/login.html');
  }
})();

const state = { layer: 'traffic', selected: 'FC Road', sim: false };
let map = null;
let mapLib = null;
let activeLayerElements = [];
const app = document.querySelector('#app');

app.innerHTML = `
<div class="app">
  <header class="topbar">
    <div class="brand"><div class="mark">UD</div><div><div class="brandname">URBAN DNA</div><div class="tag">CITY INTELLIGENCE • SIMULATION • DECISION SUPPORT</div></div></div>
    <nav><button class="active">MAP</button><button id="scenarioNav">SCENARIO LAB</button></nav>
    <div class="search"><span id="searchBtn">⌕</span><input id="search" placeholder="Search any place • try 'Mumbai' or 'Paris'"/></div>
    <div class="topmeta"><b>PUNE, MH</b><span>☁ 26°C</span><span id="clock"></span><span id="userGreeting" class="userchip"></span><button id="logout" class="logoutbtn">LOG OUT</button></div>
  </header>
  <main class="mapwrap">
    <div id="mapError" class="maperror hidden"></div>
    <div id="map3d"></div>
    <div class="vignette"></div>
    <div class="clickhint glass" id="clickhint">Click anywhere on the map to inspect that road</div>
    <aside class="layers glass">
      <div class="eyebrow">CITY LAYERS</div>
      <h2>Urban systems</h2>
      <div class="layerlist" id="layers"></div>
      <div class="legend" id="legend"></div>
      <div class="layerdata" id="layerdata"></div>
    </aside>
    <aside class="road glass">
      <div class="eyebrow" id="corridorEyebrow">SELECTED CORRIDOR</div><h1 id="corridorTitle">FC Road</h1>
      <div class="tabs"><span class="active">LIVE DATA</span><span>DETAILS</span><span>NEARBY</span></div>
      <div class="stats" id="corridorStats">
        <div><small>TRAFFIC</small><strong class="danger" id="statTraffic">Heavy</strong></div>
        <div><small>AVG SPEED</small><strong id="statSpeed">18 km/h</strong></div>
        <div><small>VEHICLES / MIN</small><strong id="statVehicles">1,240</strong></div>
        <div><small>TRAVEL TIME</small><strong class="warn" id="statTravel">+31%</strong></div>
        <div><small>AQI</small><strong id="statAqi">118</strong></div>
        <div><small>ROAD CAPACITY</small><strong id="statCapacity">82%</strong></div>
      </div>
      <div class="altroute hidden" id="altRoute">
        <div class="eyebrow">ALTERNATE ROUTE</div>
        <div class="altline"><span id="altLabel">Lighter traffic</span><b id="altSaved">-18%</b></div>
      </div>
      <button class="diagnose" id="diagnose">◎ Diagnose corridor</button>
    </aside>
    <div class="compass glass">N</div>
    <div class="mapcontrols glass"><button id="zoomIn">+</button><button id="zoomOut">−</button><button id="reset">⌖</button><button id="sat">3D</button></div>
    <div class="mapstatus"><span class="dot"></span> GOOGLE 3D CITY • LIVE MAP</div>
    <div class="metrics" id="metrics"></div>
  </main>
  <section class="below" id="scenario">
    <div class="panel scenario"><div class="eyebrow">SCENARIO LAB</div><h2>Test an urban intervention</h2><p>Change a city condition and observe how the network responds on the map.</p><div class="scenario-row"><select id="event"><option>FC Road closure</option><option>Heavy rain / flooding</option><option>Major accident</option><option>Public event</option></select><button id="run">RUN SIMULATION</button></div><div class="impactline" id="impactline"><span>BASELINE</span><b>Ready for what-if analysis</b></div></div>
    <div class="panel"><div class="eyebrow">PREDICTED IMPACT</div><h2 id="impactTitle">Network response</h2><div class="impactgrid"><div><small>TRAVEL TIME</small><b id="travel">+31%</b></div><div><small>AFFECTED ROADS</small><b id="roads">17</b></div><div><small>REROUTED VEHICLES</small><b id="vehicles">8,420</b></div><div><small>AQI CHANGE</small><b id="aqi">+7%</b></div></div></div>
    <div class="panel ask"><div class="eyebrow">ASK URBAN DNA</div><h2>City intelligence</h2><div class="askbox"><input id="question" placeholder="Why is FC Road congested?"/><button id="ask">ASK</button></div><div class="answer" id="answer">Ask a question about traffic, AQI, population, transit or a scenario.</div></div>
  </section>
  <footer>URBAN DNA <span>•</span> Decision support for connected cities <span class="footerRight">DATA: GOOGLE 3D + URBAN DNA ANALYTICS</span></footer>
</div>`;

document.querySelector('#logout').onclick = async () => {
  try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
  window.location.href = '/login.html';
};

const layers = [
 ['traffic','Traffic','Heavy'],['aqi','Air Quality','118 AQI'],['population','Population','1.82M'],['transit','Public Transport','72%'],['green','Green Cover','38%'],['heat','Temperature','26°C'],['water','Water / Flood','Low'],['health','Healthcare','84%'],['infra','Infrastructure','Good'],['energy','Energy','High']
];
const layerInfo = {
 traffic:{value:'Heavy',sub:'Network speed 18 km/h',note:'Road corridors are colored by congestion intensity. Red = critical, orange = heavy, yellow = moderate, green = free flow.',bars:[['FC Road',94],['JM Road',82],['Shivajinagar',69]]},
 aqi:{value:'118',sub:'US AQI • regional exposure',note:'Each region is filled by AQI band: green 0–50, yellow 51–100, orange 101–150, red 151+.',bars:[['Deccan',72],['FC Road',118],['Camp',164]]},
 population:{value:'1.82M',sub:'Estimated residents by zone',note:'Map zones change from green to yellow to orange to red as population density increases.',bars:[['Kothrud',46],['Deccan',68],['Shivajinagar',91]]},
 transit:{value:'72%',sub:'Public transport coverage',note:'Blue metro corridors and cyan bus corridors show where public transport serves the city.',bars:[['Metro',88],['Bus',72],['Auto access',64]]},
 green:{value:'38%',sub:'Green cover by area',note:'Green polygons mark parks, tree belts and high-cover neighborhoods.',bars:[['Aundh',76],['Kothrud',69],['Camp',31]]},
 heat:{value:'26°C',sub:'+2.1°C anomaly',note:'Heat-island regions are shown from cool blue through yellow and orange to hot red.',bars:[['Kothrud',38],['Deccan',61],['Camp',84]]},
 water:{value:'LOW',sub:'Flood risk now',note:'Blue surfaces identify drainage corridors; cyan-to-red zones show increasing flood exposure.',bars:[['Mula-Mutha',92],['FC Road',24],['Camp',48]]},
 health:{value:'84%',sub:'Access within 15 min',note:'Hospital markers and service-radius rings show healthcare accessibility gaps.',bars:[['Deccan',92],['Shivajinagar',84],['Kothrud',61]]},
 infra:{value:'GOOD',sub:'Network condition',note:'Infrastructure corridors are color-coded by condition and capacity stress.',bars:[['Arterials',78],['Collectors',64],['Local roads',51]]},
 energy:{value:'HIGH',sub:'Demand intensity',note:'Energy-demand zones show where electricity load is concentrated across the city.',bars:[['Commercial core',93],['Deccan',79],['Kothrud',58]]}
};

const layerEl = document.querySelector('#layers');
layerEl.innerHTML = layers.map(([id,name,val],i)=>`<button class="layer ${i===0?'selected':''}" data-layer="${id}"><span class="swatch ${id}"></span><span>${name}</span><em>${val}</em></button>`).join('');
const legendEl = document.querySelector('#legend');
const layerDataEl = document.querySelector('#layerdata');
const legends = {traffic:'FREE FLOW  •  MODERATE  •  HEAVY  •  CRITICAL',aqi:'GOOD  •  MODERATE  •  POOR  •  HAZARDOUS',population:'LOW  →  MEDIUM  →  HIGH',transit:'BUS  •  METRO  •  AUTO',green:'LOW  →  HIGH COVER',heat:'COOL  →  EXTREME',water:'LOW  →  SEVERE',health:'ACCESSIBLE  →  LIMITED',infra:'GOOD  →  CRITICAL',energy:'LOW  →  HIGH DEMAND'};
function renderLayerData(id){const d=layerInfo[id];layerDataEl.innerHTML=`<div class="layerdata-head"><span>LIVE LAYER READOUT</span><b>${d.value}</b><small>${d.sub}</small></div><div class="layerbars">${d.bars.map(([n,v])=>`<div class="layerbar"><span>${n}</span><i><em style="width:${v}%"></em></i><b>${v}</b></div>`).join('')}</div><div class="layernote">${d.note}</div>`;}

// -----------------------------------------------------------------------------
// EFFICIENT LAYERS: previously every layer switch destroyed and rebuilt every
// 3D element from scratch, even when re-selecting a layer you'd already
// visited. We now build each layer's elements once, cache them, and simply
// detach/attach the cached group on switch - no geometry, color, or path
// recomputation on repeat visits.
// -----------------------------------------------------------------------------
const layerElementCache = new Map(); // id -> [Element,...]
let visibleLayerId = null;

function setLayer(id){
 state.layer = id;
 document.querySelectorAll('.layer').forEach(b=>b.classList.toggle('selected', b.dataset.layer===id));
 legendEl.textContent = legends[id] || '';
 renderLayerData(id);
 if (map) renderMapLayer(id);
}
setLayer('traffic');
document.querySelectorAll('.layer').forEach(b=>b.onclick=()=>setLayer(b.dataset.layer));

document.querySelector('#metrics').innerHTML = [['TRAFFIC','Heavy','+18%'],['AQI','118','Moderate'],['POPULATION','1.82M','Central zone'],['PUBLIC TRANSPORT','72%','Coverage'],['GREEN COVER','38%','Area'],['TEMPERATURE','26°C','+2.1°C anomaly']].map(x=>`<div class="metric glass"><small>${x[0]}</small><b>${x[1]}</b><span>${x[2]}</span></div>`).join('');

let googleLoading = false;
function loadGoogle(){
 const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
 if(!key){showError('Google Maps API key is missing. Add VITE_GOOGLE_MAPS_API_KEY to .env.local.');return;}
 if(map) return;
 if(googleLoading) return;
 googleLoading = true;

 window.urbanDnaGoogleReady = async () => {
   try { await initGoogle(); }
   finally { googleLoading = false; }
 };

 const existing = document.getElementById('google-maps-js');
 if (existing) return;

 const s = document.createElement('script');
 s.id = 'google-maps-js';
 s.async = true;
 s.defer = true;
 s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&loading=async&libraries=maps3d,geocoding&callback=urbanDnaGoogleReady`;
 s.onerror = () => {
   googleLoading = false;
   showError('Google Maps could not load. Check the API key, Maps JavaScript API, 3D Maps access and localhost referrer.');
 };
 document.head.appendChild(s);
}

let geocoder = null;

async function initGoogle(){
 if (map) return;
 try {
   mapLib = await google.maps.importLibrary('maps3d');
   const { Map3DElement } = mapLib;
   if (!Map3DElement) throw new Error('Google Maps 3D library did not return Map3DElement.');
   map = new Map3DElement({center:{lat:18.5204,lng:73.8567,altitude:1100},range:4300,tilt:67.5,heading:330,mode:'HYBRID',defaultUIHidden:true});
   document.querySelector('#map3d').append(map);
   addBaseRoute();
   renderMapLayer(state.layer);
   attachClickHandling();

   try {
     const geoLib = await google.maps.importLibrary('geocoding');
     geocoder = new geoLib.Geocoder();
   } catch (e) {
     console.warn('Geocoding library unavailable, search will be limited.', e);
   }
 } catch (e) {
   console.error(e);
   showError('Google 3D could not initialize. ' + (e?.message || 'Check the Maps JavaScript API and 3D Maps access.'));
 }
}

const zones = {
 deccan:[{lat:18.5148,lng:73.8418},{lat:18.5194,lng:73.8410},{lat:18.5226,lng:73.8472},{lat:18.5197,lng:73.8523},{lat:18.5141,lng:73.8504}],
 fcroad:[{lat:18.5198,lng:73.8504},{lat:18.5235,lng:73.8500},{lat:18.5262,lng:73.8554},{lat:18.5243,lng:73.8611},{lat:18.5200,lng:73.8600}],
 shivajinagar:[{lat:18.5262,lng:73.8474},{lat:18.5322,lng:73.8469},{lat:18.5342,lng:73.8542},{lat:18.5300,lng:73.8591},{lat:18.5244,lng:73.8554}],
 jm:[{lat:18.5240,lng:73.8595},{lat:18.5300,lng:73.8592},{lat:18.5328,lng:73.8664},{lat:18.5270,lng:73.8700},{lat:18.5220,lng:73.8651}],
 camp:[{lat:18.5094,lng:73.8694},{lat:18.5148,lng:73.8672},{lat:18.5201,lng:73.8738},{lat:18.5164,lng:73.8790},{lat:18.5102,lng:73.8760}],
 kothrud:[{lat:18.4968,lng:73.8018},{lat:18.5030,lng:73.7998},{lat:18.5102,lng:73.8060},{lat:18.5080,lng:73.8150},{lat:18.5000,lng:73.8142}],
 aundh:[{lat:18.5480,lng:73.8070},{lat:18.5530,lng:73.8100},{lat:18.5552,lng:73.8182},{lat:18.5480,lng:73.8220},{lat:18.5435,lng:73.8150}],
 river:[{lat:18.5230,lng:73.8580},{lat:18.5220,lng:73.8620},{lat:18.5200,lng:73.8680},{lat:18.5160,lng:73.8730},{lat:18.5145,lng:73.8695},{lat:18.5180,lng:73.8630}]
};
const P = (name) => zones[name];
const line = (...pts) => pts.map(([lat,lng]) => ({lat,lng,altitude:7}));
const colors = {green:'#35d07f80',yellow:'#f1d34f80',orange:'#ff963d88',red:'#ff405788',blue:'#45a8ff80',cyan:'#36e0d180',purple:'#ba7cff80',gray:'#b9c4cc70'};

function addBaseRoute(){
 const { Polyline3DElement, Marker3DElement } = mapLib;
 const route = new Polyline3DElement({path:line([18.5209,73.8436],[18.5215,73.8490],[18.5230,73.8550],[18.5245,73.8620],[18.5255,73.8690]),strokeColor:'#ff4057',strokeWidth:9,outerColor:'#ff4057',outerWidth:.35,altitudeMode:'RELATIVE_TO_GROUND',drawsOccludedSegments:true,zIndex:20});
 map.append(route);
 const labels = [[18.5204,73.8567,'FC ROAD'],[18.5234,73.8497,'DECCAN'],[18.5270,73.8620,'METRO']];
 labels.forEach(([lat,lng,label]) => { const m=new Marker3DElement({position:{lat,lng,altitude:30},label,sizePreserved:true,zIndex:30}); map.append(m); });
}

function buildEl(factory){ const el = factory(); return el; }
function polygonEl(path,fill,stroke=fill,z=10){
 const { Polygon3DElement } = mapLib;
 return new Polygon3DElement({path,fillColor:fill,strokeColor:stroke,strokeWidth:3,altitudeMode:'RELATIVE_TO_GROUND',drawsOccludedSegments:true,zIndex:z});
}
function polylineEl(path,color,width=7,z=15){
 const { Polyline3DElement } = mapLib;
 return new Polyline3DElement({path,strokeColor:color,strokeWidth:width,outerColor:color,outerWidth:.28,altitudeMode:'RELATIVE_TO_GROUND',drawsOccludedSegments:true,zIndex:z});
}
function markerEl(lat,lng,label,altitude=35){
 const { Marker3DElement } = mapLib;
 return new Marker3DElement({position:{lat,lng,altitude},label,sizePreserved:true,zIndex:50});
}
function ringEl(lat,lng,color){
 const { Polygon3DElement } = mapLib;
 const pts=[]; for(let i=0;i<28;i++){const a=i*Math.PI*2/28; pts.push({lat:lat+Math.sin(a)*.0042,lng:lng+Math.cos(a)*.0042});}
 return polygonEl(pts,color,color,12);
}

// Builds the element list for a layer ONCE. Called only on cache miss.
function buildLayerElements(id){
 const els = [];
 const add = (el) => { els.push(el); return el; };
 if (id==='traffic'){
   add(polygonEl(P('deccan'),colors.yellow)); add(polygonEl(P('fcroad'),colors.red)); add(polygonEl(P('shivajinagar'),colors.orange)); add(polygonEl(P('jm'),colors.orange)); add(polygonEl(P('camp'),colors.red)); add(polygonEl(P('kothrud'),colors.green));
   add(polylineEl(line([18.5204,73.8430],[18.5220,73.8500],[18.5245,73.8580],[18.5275,73.8675]),'#ff4057',10));
   add(polylineEl(line([18.5120,73.8400],[18.5160,73.8490],[18.5185,73.8600]),'#ff963d',8));
   add(polylineEl(line([18.5380,73.8450],[18.5330,73.8520],[18.5280,73.8600]),'#f1d34f',7));
   add(markerEl(18.5243,73.8567,'FC ROAD • 18 km/h'));
 } else if (id==='aqi'){
   add(polygonEl(P('deccan'),colors.green)); add(polygonEl(P('fcroad'),colors.yellow)); add(polygonEl(P('shivajinagar'),colors.yellow)); add(polygonEl(P('jm'),colors.orange)); add(polygonEl(P('camp'),colors.red)); add(polygonEl(P('kothrud'),colors.green)); add(polygonEl(P('aundh'),colors.green));
   add(markerEl(18.5240,73.8560,'AQI 118')); add(markerEl(18.5130,73.8730,'AQI 164')); add(markerEl(18.5010,73.8070,'AQI 48'));
 } else if (id==='population'){
   add(polygonEl(P('kothrud'),colors.green)); add(polygonEl(P('aundh'),colors.yellow)); add(polygonEl(P('deccan'),colors.yellow)); add(polygonEl(P('fcroad'),colors.orange)); add(polygonEl(P('shivajinagar'),colors.red)); add(polygonEl(P('jm'),colors.orange)); add(polygonEl(P('camp'),colors.red));
   add(markerEl(18.5300,73.8510,'HIGH • 91%')); add(markerEl(18.5240,73.8555,'MED • 68%')); add(markerEl(18.5030,73.8070,'LOW • 46%'));
 } else if (id==='transit'){
   add(polylineEl(line([18.4930,73.8150],[18.5070,73.8330],[18.5200,73.8500],[18.5320,73.8640],[18.5470,73.8790]),'#45a8ff',11));
   add(polylineEl(line([18.5010,73.8060],[18.5120,73.8260],[18.5210,73.8500],[18.5310,73.8690]),'#36e0d1',7));
   [[18.520,73.850,'BUS HUB'],[18.527,73.862,'METRO'],[18.511,73.833,'TRANSIT']].forEach(x=>add(markerEl(...x)));
 } else if (id==='green'){
   add(polygonEl(P('kothrud'),colors.green)); add(polygonEl(P('aundh'),'#36d86f90')); add(polygonEl(P('deccan'),'#58db8a70')); add(polygonEl(P('camp'),'#d8b64a45'));
   add(markerEl(18.503,73.807,'GREEN 69%')); add(markerEl(18.549,73.814,'GREEN 76%'));
 } else if (id==='heat'){
   add(polygonEl(P('kothrud'),colors.green)); add(polygonEl(P('aundh'),colors.yellow)); add(polygonEl(P('deccan'),colors.orange)); add(polygonEl(P('fcroad'),colors.orange)); add(polygonEl(P('shivajinagar'),colors.red)); add(polygonEl(P('camp'),colors.red)); add(polygonEl(P('jm'),colors.orange));
   add(markerEl(18.529,73.852,'31°C • HOT')); add(markerEl(18.512,73.873,'33°C • HOT')); add(markerEl(18.503,73.807,'25°C • COOL'));
 } else if (id==='water'){
   add(polygonEl(P('river'),'#269cff8a','#269cff')); add(polygonEl(P('camp'),'#3ea8ff66','#3ea8ff')); add(polygonEl(P('fcroad'),'#48b9ff35','#48b9ff'));
   add(polylineEl(line([18.548,73.870],[18.535,73.866],[18.522,73.861],[18.510,73.869]),'#45a8ff',12));
   add(markerEl(18.516,73.870,'FLOOD RISK • LOW'));
 } else if (id==='health'){
   [[18.5235,73.8500,'HOSPITAL • 0.9 km'],[18.5300,73.8660,'HOSPITAL • 1.4 km'],[18.5030,73.8070,'CLINIC • 2.2 km']].forEach(([a,b,c]) => { add(ringEl(a,b,'#ba7cff38')); add(markerEl(a,b,c)); });
   add(polygonEl(P('camp'),'#ba7cff30','#ba7cff'));
 } else if (id==='infra'){
   add(polylineEl(line([18.509,73.835],[18.516,73.849],[18.523,73.860],[18.530,73.875]),'#36e0d1',10));
   add(polylineEl(line([18.538,73.842],[18.530,73.851],[18.524,73.861]),'#f1d34f',8));
   add(polylineEl(line([18.500,73.806],[18.507,73.824],[18.516,73.840]),'#ff963d',7));
   add(polygonEl(P('fcroad'),'#36e0d12c','#36e0d1')); add(markerEl(18.523,73.858,'CAPACITY 82%'));
 } else if (id==='energy'){
   add(polygonEl(P('camp'),colors.red)); add(polygonEl(P('deccan'),colors.orange)); add(polygonEl(P('fcroad'),colors.orange)); add(polygonEl(P('shivajinagar'),colors.orange)); add(polygonEl(P('kothrud'),colors.yellow)); add(polygonEl(P('aundh'),colors.green));
   add(markerEl(18.514,73.873,'LOAD 93%')); add(markerEl(18.524,73.855,'LOAD 79%')); add(markerEl(18.503,73.807,'LOAD 58%'));
 }
 return els;
}

function renderMapLayer(id){
 if (!map || !mapLib) return;
 if (visibleLayerId === id) return; // already showing this layer - nothing to do
 if (visibleLayerId && layerElementCache.has(visibleLayerId)) {
   layerElementCache.get(visibleLayerId).forEach(el => { try { map.removeChild(el); } catch {} });
 }
 if (!layerElementCache.has(id)) {
   layerElementCache.set(id, buildLayerElements(id));
 }
 layerElementCache.get(id).forEach(el => map.append(el));
 visibleLayerId = id;
}

// -----------------------------------------------------------------------------
// SEARCH: geocode any place name and fly the camera there, then treat the
// resolved point as a click so the corridor panel populates immediately.
// -----------------------------------------------------------------------------
const searchInput = document.querySelector('#search');
async function runSearch(){
 const q = searchInput.value.trim();
 if (!q) return;
 if (!map) { showError('Map is still loading — try again in a moment.'); return; }
 if (!geocoder) {
   if (!google?.maps?.Geocoder) { showError('Search is unavailable: the Geocoding library did not load.'); return; }
   geocoder = new google.maps.Geocoder();
 }
 searchInput.classList.add('searching');
 try {
   const { results } = await geocoder.geocode({ address: q });
   if (!results || !results.length) { showError(`No results found for "${q}".`); return; }
   const loc = results[0].geometry.location;
   const lat = typeof loc.lat === 'function' ? loc.lat() : loc.lat;
   const lng = typeof loc.lng === 'function' ? loc.lng() : loc.lng;
   map.center = { lat, lng, altitude: 900 };
   map.range = 3800;
   map.tilt = 60;
   await handleMapClick(lat, lng, results[0].formatted_address);
 } catch (e) {
   console.error(e);
   showError('Search failed. Check the Geocoding API is enabled for this key.');
 } finally {
   searchInput.classList.remove('searching');
 }
}
searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') runSearch(); });
document.querySelector('#searchBtn').addEventListener('click', runSearch);

// -----------------------------------------------------------------------------
// INTERACTIVE ROADS: click anywhere on the 3D map (not just the few hardcoded
// Pune polygons) to select "that road" and see an alternate route. Data comes
// from /api/city-data, which deterministically generates + caches (in SQLite)
// consistent stats for any coordinate on Earth - so this works everywhere,
// not just one demo area.
// -----------------------------------------------------------------------------
let selectionElements = [];
function clearSelection(){
 selectionElements.forEach(el => { try { map.removeChild(el); } catch {} });
 selectionElements = [];
}

function extractLatLng(evt){
 // Different SDK versions / event shapes expose the click position differently;
 // try the documented ones defensively.
 const p = evt?.position || evt?.detail?.position || evt?.latLng || evt?.detail?.latLng;
 if (!p) return null;
 const lat = typeof p.lat === 'function' ? p.lat() : p.lat;
 const lng = typeof p.lng === 'function' ? p.lng() : p.lng;
 if (typeof lat !== 'number' || typeof lng !== 'number') return null;
 return { lat, lng };
}

function attachClickHandling(){
 if (!map) return;
 map.addEventListener('gmp-click', (evt) => {
   const pos = extractLatLng(evt);
   if (!pos) return;
   handleMapClick(pos.lat, pos.lng);
 });
}

async function handleMapClick(lat, lng, label){
 document.querySelector('#clickhint')?.classList.add('hidden');
 try {
   const r = await fetch('/api/city-data', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ lat, lng }),
   });
   if (r.status === 401) { window.location.replace('/login.html'); return; }
   const d = await r.json();
   if (!r.ok) { showError(d?.error || 'Could not load data for that spot.'); return; }
   drawSelection(d);
   updateCorridorPanel(d, label);
   state.selected = d.roadName;
 } catch (e) {
   console.error(e);
   showError('Could not reach the city-data service.');
 }
}

function drawSelection(d){
 if (!map || !mapLib) return;
 clearSelection();
 const mainPath = d.mainPath.map(p => ({ ...p, altitude: 12 }));
 const altPath = d.altPath.map(p => ({ ...p, altitude: 12 }));
 const mainColor = d.trafficTone === 'good' ? '#35d07f' : d.trafficTone === 'warn' ? '#f1d34f' : '#ff4057';
 const sel = polylineEl(mainPath, mainColor, 12, 60);
 const alt = polylineEl(altPath, '#45a8ff', 6, 55);
 const marker = markerEl(d.lat, d.lng, `${d.roadName} • SELECTED`, 40);
 [sel, alt, marker].forEach(el => { map.append(el); selectionElements.push(el); });
}

function updateCorridorPanel(d, label){
 document.querySelector('#corridorTitle').textContent = d.roadName;
 document.querySelector('#corridorEyebrow').textContent = label ? label.toUpperCase() : 'SELECTED CORRIDOR';
 const traffic = document.querySelector('#statTraffic');
 traffic.textContent = d.trafficLabel;
 traffic.className = d.trafficTone === 'good' ? '' : d.trafficTone === 'warn' ? 'warn' : 'danger';
 document.querySelector('#statSpeed').textContent = `${d.avgSpeed} km/h`;
 document.querySelector('#statVehicles').textContent = d.vehiclesPerMin.toLocaleString('en-IN');
 document.querySelector('#statTravel').textContent = `+${d.travelDelta}%`;
 document.querySelector('#statAqi').textContent = d.aqi;
 document.querySelector('#statCapacity').textContent = `${d.capacity}%`;

 const altBox = document.querySelector('#altRoute');
 altBox.classList.remove('hidden');
 document.querySelector('#altLabel').textContent = `${d.altLabel} • via ${Math.round(d.altTimeSavedPct)}% shorter wait`;
 document.querySelector('#altSaved').textContent = `-${d.altTimeSavedPct}%`;
}

loadGoogle();
function tick(){ document.querySelector('#clock').textContent = new Date().toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}); }
tick(); setInterval(tick,1000);

document.querySelector('#reset').onclick = () => { if (map) { map.center = {lat:18.5204,lng:73.8567,altitude:1100}; map.range=4300; map.tilt=67.5; map.heading=330; } };
document.querySelector('#sat').onclick = () => { if (map) map.mode = map.mode==='HYBRID' ? 'SATELLITE' : 'HYBRID'; };
document.querySelector('#zoomIn').onclick = () => { if (map) map.range = Math.max(300, map.range * 0.8); };
document.querySelector('#zoomOut').onclick = () => { if (map) map.range = Math.min(20000, map.range * 1.25); };

document.querySelector('#run').onclick = () => {
 state.sim = !state.sim;
 const b = document.querySelector('#run');
 b.textContent = state.sim ? 'RESET SCENARIO' : 'RUN SIMULATION';
 document.querySelector('#impactline').innerHTML = state.sim ? '<span class="dangerText">SIMULATED</span><b>FC Road closed • traffic redistributed</b>' : '<span>BASELINE</span><b>Ready for what-if analysis</b>';
 document.querySelector('#travel').textContent = state.sim ? '+46%' : '+31%';
 document.querySelector('#roads').textContent = state.sim ? '23' : '17';
 document.querySelector('#vehicles').textContent = state.sim ? '11,280' : '8,420';
 document.querySelector('#aqi').textContent = state.sim ? '+12%' : '+7%';
};

document.querySelector('#ask').onclick = async () => {
 const q = document.querySelector('#question').value.trim() || 'Why is FC Road congested?';
 const answer = document.querySelector('#answer');
 answer.innerHTML = '<span class="aiPulse">Analyzing city layers…</span>';
 try {
   const r = await fetch('/api/urban-ai', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ question:q, layer: state.layer, scenario: state.sim }) });
   if (r.status === 401) { window.location.replace('/login.html'); return; }
   const d = await r.json();
   answer.innerHTML = `<b>Urban DNA:</b> ${d.answer || 'The city model is ready.'}`;
 } catch {
   answer.innerHTML = `<b>Urban DNA:</b> ${q.includes('FC') ? 'FC Road is constrained by peak demand, limited alternate-route capacity and heavy vehicle volume.' : 'The selected layer shows interacting urban conditions. Switch layers to inspect their spatial impact.'}`;
 }
};
document.querySelector('#diagnose').onclick = () => { document.querySelector('#answer').scrollIntoView({behavior:'smooth',block:'center'}); document.querySelector('#question').value = `Explain ${state.layer} conditions around ${state.selected}`; document.querySelector('#ask').click(); };
document.querySelector('#scenarioNav').onclick = () => document.querySelector('#scenario').scrollIntoView({behavior:'smooth'});

function showError(msg){
 const el = document.querySelector('#mapError');
 if (!el) return;
 el.textContent = msg;
 el.classList.remove('hidden');
 clearTimeout(showError._t);
 showError._t = setTimeout(() => el.classList.add('hidden'), 6000);
}
