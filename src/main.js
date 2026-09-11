import './style.css';

const state={layer:'traffic', selected:'FC Road', sim:false};
const app=document.querySelector('#app');

app.innerHTML=`
<div class="app">
  <header class="topbar">
    <div class="brand"><div class="mark">UD</div><div><div class="brandname">URBAN DNA</div><div class="tag">CITY INTELLIGENCE • SIMULATION • DECISION SUPPORT</div></div></div>
    <nav><button class="active">MAP</button><button>ANALYSIS</button><button id="scenarioNav">SCENARIO LAB</button><button>INSIGHTS</button></nav>
    <div class="search"><span>⌕</span><input id="search" placeholder="Search location • FC Road, Pune"/></div>
    <div class="topmeta"><b>PUNE, MH</b><span>☁ 26°C</span><span id="clock"></span></div>
  </header>
  <main class="mapwrap">
    <div id="mapError" class="maperror hidden"></div>
    <div id="map3d"></div>
    <div class="vignette"></div>
    <aside class="layers glass">
      <div class="eyebrow">CITY LAYERS</div>
      <h2>Urban systems</h2>
      <div class="layerlist" id="layers"></div>
      <div class="legend" id="legend"></div>
    </aside>
    <aside class="road glass">
      <div class="eyebrow">SELECTED CORRIDOR</div><h1>FC Road</h1>
      <div class="tabs"><span class="active">LIVE DATA</span><span>DETAILS</span><span>NEARBY</span></div>
      <div class="stats"><div><small>TRAFFIC</small><strong class="danger">Heavy</strong></div><div><small>AVG SPEED</small><strong>18 km/h</strong></div><div><small>VEHICLES / MIN</small><strong>1,240</strong></div><div><small>TRAVEL TIME</small><strong class="warn">+31%</strong></div><div><small>AQI</small><strong>118</strong></div><div><small>ROAD CAPACITY</small><strong>82%</strong></div></div>
      <button class="diagnose" id="diagnose">◎ Diagnose corridor</button>
    </aside>
    <div class="compass glass">N</div>
    <div class="mapcontrols glass"><button>+</button><button>−</button><button id="reset">⌖</button><button id="sat">3D</button></div>
    <div class="mapstatus"><span class="dot"></span> GOOGLE 3D CITY • LIVE MAP</div>
    <div class="metrics" id="metrics"></div>
  </main>
  <section class="below" id="scenario">
    <div class="panel scenario"><div class="eyebrow">SCENARIO LAB</div><h2>Test an urban intervention</h2><p>Close FC Road for two hours and observe how the network responds.</p><div class="scenario-row"><select id="event"><option>FC Road closure</option><option>Heavy rain / flooding</option><option>Major accident</option><option>Public event</option></select><button id="run">RUN SIMULATION</button></div><div class="impactline" id="impactline"><span>BASELINE</span><b>Ready for what-if analysis</b></div></div>
    <div class="panel"><div class="eyebrow">PREDICTED IMPACT</div><h2 id="impactTitle">Network response</h2><div class="impactgrid"><div><small>TRAVEL TIME</small><b id="travel">+31%</b></div><div><small>AFFECTED ROADS</small><b id="roads">17</b></div><div><small>REROUTED VEHICLES</small><b id="vehicles">8,420</b></div><div><small>AQI CHANGE</small><b id="aqi">+7%</b></div></div></div>
    <div class="panel ask"><div class="eyebrow">ASK URBAN DNA</div><h2>City intelligence</h2><div class="askbox"><input id="question" placeholder="Why is FC Road congested?"/><button id="ask">ASK</button></div><div class="answer" id="answer">Ask a question about traffic, AQI, population, transit or a scenario.</div></div>
  </section>
  <footer>URBAN DNA <span>•</span> Decision support for connected cities <span class="footerRight">DATA: GOOGLE 3D + URBAN DNA ANALYTICS</span></footer>
</div>`;

const layers=[['traffic','Traffic','Heavy'],['aqi','Air Quality','118 AQI'],['population','Population','1.82M'],['transit','Public Transport','72%'],['green','Green Cover','38%'],['heat','Temperature','26°C'],['water','Water / Flood','Low'],['health','Healthcare','84%'],['infra','Infrastructure','Good'],['energy','Energy','High']];
const layerEl=document.querySelector('#layers');
layerEl.innerHTML=layers.map(([id,name,val],i)=>`<button class="layer ${i===0?'selected':''}" data-layer="${id}"><span class="swatch ${id}"></span><span>${name}</span><em>${val}</em></button>`).join('');
const legendEl=document.querySelector('#legend');
const legends={traffic:'FREE FLOW  •  MODERATE  •  HEAVY  •  CRITICAL',aqi:'GOOD  •  MODERATE  •  POOR  •  HAZARDOUS',population:'LOW  →  MEDIUM  →  HIGH',transit:'BUS  •  AUTO  •  METRO',green:'LOW  →  HIGH COVER',heat:'COOL  →  EXTREME',water:'LOW  →  SEVERE',health:'ACCESSIBLE  →  LIMITED',infra:'GOOD  →  CRITICAL',energy:'LOW  →  HIGH DEMAND'};
function setLayer(id){state.layer=id;document.querySelectorAll('.layer').forEach(b=>b.classList.toggle('selected',b.dataset.layer===id));legendEl.textContent=legends[id]||'';}
setLayer('traffic');
document.querySelectorAll('.layer').forEach(b=>b.onclick=()=>setLayer(b.dataset.layer));

document.querySelector('#metrics').innerHTML=[['TRAFFIC','Heavy','+18%'],['AQI','118','Moderate'],['POPULATION','1.82M','Central zone'],['PUBLIC TRANSPORT','72%','Coverage'],['GREEN COVER','38%','Area'],['TEMPERATURE','26°C','+2.1°C anomaly']].map(x=>`<div class="metric glass"><small>${x[0]}</small><b>${x[1]}</b><span>${x[2]}</span></div>`).join('');


const urbanCityData = {
  city: 'Pune, Maharashtra',
  selectedCorridor: 'FC Road',
  traffic: 'Heavy',
  averageSpeedKmh: 18,
  vehiclesPerMinute: 1240,
  travelTimeChange: '+31%',
  aqi: 118,
  population: '1.82M',
  publicTransportCoverage: '72%',
  greenCover: '38%',
  temperatureC: 26,
  roadCapacity: '82%',
  waterFloodRisk: 'Low',
  healthcareAccessibility: '84%',
  infrastructure: 'Good',
  energyDemand: 'High'
};

function setAiBusy(busy, label='ANALYZING...'){
  const answer=document.querySelector('#answer');
  const askBtn=document.querySelector('#ask');
  const diagBtn=document.querySelector('#diagnose');
  if(askBtn){askBtn.disabled=busy; askBtn.textContent=busy?'...':'ASK';}
  if(diagBtn){diagBtn.disabled=busy; diagBtn.textContent=busy?label:'◎ Diagnose corridor';}
  if(busy) answer.innerHTML='<span class="aiPulse">Urban DNA is analyzing the connected city factors with NVIDIA AI…</span>';
}

async function askUrbanDNA(question, scenario=null){
  setAiBusy(true);
  try{
    const response=await fetch('/api/urban-ai',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({question,cityData:urbanCityData,scenario})
    });
    const data=await response.json();
    if(!response.ok) throw new Error(data?.error||'NVIDIA AI request failed');
    document.querySelector('#answer').innerHTML=`<b>Urban DNA • NVIDIA AI</b><div class="aiResponse">${formatAiText(data.answer)}</div>`;
    return data.answer;
  }catch(error){
    document.querySelector('#answer').innerHTML=`<b>Urban DNA:</b> AI connection failed.<br><small>${escapeHtml(error.message)}</small>`;
    console.error(error);
  }finally{
    setAiBusy(false);
  }
}
function escapeHtml(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function formatAiText(value){
  return escapeHtml(value).replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>');
}

let map=null;

// Official Google Maps JavaScript API dynamic bootstrap loader.
// It guarantees that google.maps.importLibrary('maps3d') is available
// before the 3D map is initialized.
function loadGoogle(){
 const key=import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
 if(!key){showError('Google Maps API key is missing. Add VITE_GOOGLE_MAPS_API_KEY to .env.local.');return;}

 // Load the Maps JavaScript API with the 3D library explicitly enabled.
 // The global callback fires only after Google has finished initializing.
 if(window.google?.maps?.maps3d?.Map3DElement){
   initGoogle();
   return;
 }

 window.urbanDnaGoogleReady=()=>initGoogle();
 const s=document.createElement('script');
 s.async=true;
 s.defer=true;
 s.src=`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&loading=async&libraries=maps3d&callback=urbanDnaGoogleReady`;
 s.onerror=()=>showError('Google Maps could not load. Check the API key, billing, Maps JavaScript API, 3D Maps availability and allowed localhost referrer.');
 document.head.appendChild(s);
}

async function initGoogle(){
 try{
   const {Map3DElement,Marker3DElement,Polyline3DElement}=await google.maps.importLibrary('maps3d');
   if(!Map3DElement) throw new Error('Google Maps 3D library did not return Map3DElement.');

   map=new Map3DElement({
     center:{lat:18.5204,lng:73.8567,altitude:900},
     range:4200,
     tilt:67.5,
     heading:330,
     mode:'HYBRID',
     defaultUIHidden:true
   });
   document.querySelector('#map3d').append(map);
   addUrbanOverlays(Marker3DElement,Polyline3DElement);
 }catch(e){
   console.error(e);
   showError('Google 3D could not initialize. '+(e?.message||'Check the Maps JavaScript API, billing and 3D Maps access for this key.'));
 }
}

function addUrbanOverlays(Marker3D,Polyline3D){
 const roadPath=[
   {lat:18.5209,lng:73.8436,altitude:6},
   {lat:18.5215,lng:73.8490,altitude:7},
   {lat:18.5230,lng:73.8550,altitude:8},
   {lat:18.5245,lng:73.8620,altitude:8},
   {lat:18.5255,lng:73.8690,altitude:7}
 ];
 const route=new Polyline3D({
   path:roadPath,
   strokeColor:'#ff4057',
   strokeWidth:8,
   outerColor:'#ff4057',
   outerWidth:0.35,
   altitudeMode:'CLAMP_TO_GROUND'
 });
 map.append(route);
 [[18.5204,73.8567,'FC ROAD'],[18.5234,73.8497,'DECCAN'],[18.527,73.862,'METRO']].forEach(([lat,lng,label])=>{
   const m=new Marker3D({position:{lat,lng,altitude:40},label,sizePreserved:true});
   map.append(m);
 });
}
function showError(msg){const e=document.querySelector('#mapError');e.textContent=msg;e.classList.remove('hidden');}
loadGoogle();

function tick(){document.querySelector('#clock').textContent=new Date().toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});}tick();setInterval(tick,1000);

document.querySelector('#reset').onclick=()=>{if(map){map.center={lat:18.5204,lng:73.8567,altitude:900};map.range=4200;map.tilt=67.5;map.heading=330;}};
document.querySelector('#sat').onclick=()=>{if(map)map.mode=map.mode==='HYBRID'?'SATELLITE':'HYBRID';};
document.querySelector('#run').onclick=async()=>{
  state.sim=!state.sim;
  const b=document.querySelector('#run');
  b.textContent=state.sim?'RESET SCENARIO':'RUN SIMULATION';
  document.querySelector('#impactline').innerHTML=state.sim?'<span class="dangerText">SIMULATED</span><b>FC Road closed • NVIDIA AI analyzing redistribution</b>':'<span>BASELINE</span><b>Ready for what-if analysis</b>';
  document.querySelector('#travel').textContent=state.sim?'+46%':'+31%';
  document.querySelector('#roads').textContent=state.sim?'23':'17';
  document.querySelector('#vehicles').textContent=state.sim?'11,280':'8,420';
  document.querySelector('#aqi').textContent=state.sim?'+12%':'+7%';
  if(state.sim){
    await askUrbanDNA('Simulate the consequences of closing FC Road for two hours. Explain traffic redistribution, travel-time effects, AQI implications, vulnerable areas, and the best mitigation actions.',{
      event:'FC Road closure',
      duration:'2 hours',
      status:'hypothetical what-if scenario'
    });
  } else {
    document.querySelector('#answer').innerHTML='Scenario reset. Ask Urban DNA to analyze the baseline city state.';
  }
};
document.querySelector('#ask').onclick=async()=>{
  const q=document.querySelector('#question').value.trim()||'Why is FC Road congested?';
  await askUrbanDNA(q);
};
document.querySelector('#diagnose').onclick=async()=>{
  document.querySelector('#answer').scrollIntoView({behavior:'smooth',block:'center'});
  await askUrbanDNA('Diagnose FC Road as an urban system. Identify the most likely interacting drivers of congestion from the supplied city data, explain the relationships between traffic, road capacity, transit, AQI and population, and recommend interventions.');
};
document.querySelector('#scenarioNav').onclick=()=>document.querySelector('#scenario').scrollIntoView({behavior:'smooth'});
