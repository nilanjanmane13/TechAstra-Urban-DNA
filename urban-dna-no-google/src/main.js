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
    <div class="mapstatus"><span class="dot"></span> URBAN DNA • 3D CITY MODEL</div>
    <div class="metrics" id="metrics"></div>
  </main>
  <section class="below" id="scenario">
    <div class="panel scenario"><div class="eyebrow">SCENARIO LAB</div><h2>Test an urban intervention</h2><p>Close FC Road for two hours and observe how the network responds.</p><div class="scenario-row"><select id="event"><option>FC Road closure</option><option>Heavy rain / flooding</option><option>Major accident</option><option>Public event</option></select><button id="run">RUN SIMULATION</button></div><div class="impactline" id="impactline"><span>BASELINE</span><b>Ready for what-if analysis</b></div></div>
    <div class="panel"><div class="eyebrow">PREDICTED IMPACT</div><h2 id="impactTitle">Network response</h2><div class="impactgrid"><div><small>TRAVEL TIME</small><b id="travel">+31%</b></div><div><small>AFFECTED ROADS</small><b id="roads">17</b></div><div><small>REROUTED VEHICLES</small><b id="vehicles">8,420</b></div><div><small>AQI CHANGE</small><b id="aqi">+7%</b></div></div></div>
    <div class="panel ask"><div class="eyebrow">ASK URBAN DNA</div><h2>City intelligence</h2><div class="askbox"><input id="question" placeholder="Why is FC Road congested?"/><button id="ask">ASK</button></div><div class="answer" id="answer">Ask a question about traffic, AQI, population, transit or a scenario.</div></div>
  </section>
  <footer>URBAN DNA <span>•</span> Decision support for connected cities <span class="footerRight">DATA: OPEN CITY MODEL + URBAN DNA ANALYTICS</span></footer>
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

let scene, camera, renderer, cityGroup, roadGroup, trafficGroup, layerGroup;
let cameraTarget={x:0,y:0,z:0}, cameraYaw=0.72, cameraPitch=0.72, cameraDistance=105;
let selectedLayer='traffic', animationId;

function initUrban3D(){
  const host=document.querySelector('#map3d');
  host.innerHTML='';
  scene=new THREE.Scene();
  scene.background=new THREE.Color(0x12181b);
  scene.fog=new THREE.FogExp2(0x12181b,0.007);

  camera=new THREE.PerspectiveCamera(52, host.clientWidth/host.clientHeight,0.1,1000);
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.setSize(host.clientWidth,host.clientHeight);
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);

  const hemi=new THREE.HemisphereLight(0xbfd8df,0x172017,2.0); scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xfff0cf,3.0); sun.position.set(-40,80,35); sun.castShadow=true; scene.add(sun);

  cityGroup=new THREE.Group(); scene.add(cityGroup);
  roadGroup=new THREE.Group(); cityGroup.add(roadGroup);
  layerGroup=new THREE.Group(); cityGroup.add(layerGroup);
  trafficGroup=new THREE.Group(); cityGroup.add(trafficGroup);

  createGround();
  createRoadNetwork();
  createBuildings();
  createParksAndTrees();
  createTransit();
  createTraffic();
  createSignals();
  createAtmosphere();
  createLabels();
  applyLayer('traffic');
  setup3DControls(host);
  window.addEventListener('resize',resize3D);
  animate3D();
}

function mat(color,rough=.85,metal=0){return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});}
function box(w,h,d,material,x,y,z){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y+h/2,z);m.castShadow=true;m.receiveShadow=true;return m;}
function createGround(){
  const ground=box(180,0.5,150,mat(0x18221f),0,-.5,0);ground.receiveShadow=true;cityGroup.add(ground);
  const grid=new THREE.GridHelper(170,34,0x30443e,0x25332f);grid.position.y=.03;grid.material.transparent=true;grid.material.opacity=.35;cityGroup.add(grid);
}
function road(x,z,w,d,rotation=0,major=false){
  const r=box(w,.12,d,mat(major?0x263136:0x20282b),x,.02,z);r.rotation.y=rotation;roadGroup.add(r);
  const lineMat=mat(0xd9c76a);
  if(w>d){
    for(let p=-w/2+5;p<w/2;p+=9){const l=box(3,.03,.11,lineMat,x+p,.16,z);l.rotation.y=rotation;roadGroup.add(l);}
  }else{for(let p=-d/2+5;p<d/2;p+=9){const l=box(.11,.03,3,lineMat,x,.16,z+p);l.rotation.y=rotation;roadGroup.add(l);}}
}
function createRoadNetwork(){
  road(0,0,175,8,0,true); road(0,0,8,145,0,true);
  road(-42,0,8,145);road(42,0,8,145);road(0,-42,175,7);road(0,42,175,7);
  road(-70,-20,55,5,.18);road(65,18,60,5,-.16);road(-58,53,50,5,.12);road(55,-58,65,5,.2);
  // FC Road highlighted corridor
  const pts=[[-62,-9],[-42,-5],[-20,-3],[0,0],[22,3],[44,7],[66,12]];
  const curve=new THREE.CatmullRomCurve3(pts.map(([x,z])=>new THREE.Vector3(x,.28,z)),false,'catmullrom',.3);
  const geo=new THREE.TubeGeometry(curve,80,.22,8,false);
  const mesh=new THREE.Mesh(geo,mat(0xff4057,.5,.1));mesh.userData={urbanLayer:'traffic',fcRoad:true};roadGroup.add(mesh);
}
function createBuildings(){
  const rng=(a,b)=>a+Math.random()*(b-a);
  const zones=[[-68,-55,7],[-25,-55,8],[25,-55,9],[66,-55,6],[-67,15,8],[-25,17,12],[25,17,10],[66,18,8],[-65,63,7],[-22,62,6],[25,62,8],[66,60,5]];
  zones.forEach(([cx,cz,n])=>{
    for(let i=0;i<n;i++){
      const x=cx+rng(-14,14),z=cz+rng(-13,13),w=rng(4,9),d=rng(4,9),h=rng(5,24)*(Math.random()>.72?1.7:1);
      const density=h>28?.75:.35;
      const colors=[0x71828a,0x56666e,0x8b8376,0x6e7472,0x7b6e64];
      const b=box(w,h,d,mat(colors[Math.floor(Math.random()*colors.length)],.82),x,.18,z);
      b.userData={urbanLayer:'population',population:Math.random()};
      cityGroup.add(b);
      // rooftop detail
      if(h>20){const roof=box(w*.22,1.3,d*.22,mat(0x343d3f),x,.18+h,z);cityGroup.add(roof);}
    }
  });
}
function createParksAndTrees(){
  const parks=[[-47,47,22,13],[47,-42,18,14],[-73,25,12,16]];
  parks.forEach(([x,z,w,d])=>{const p=box(w,.18,d,mat(0x315c43),x,.16,z);cityGroup.add(p);for(let i=0;i<18;i++)addTree(x+(Math.random()-.5)*w,z+(Math.random()-.5)*d);});
  for(let i=0;i<60;i++){const x=(Math.random()-.5)*150,z=(Math.random()-.5)*120;if(Math.abs(x)<8||Math.abs(z)<8)continue;addTree(x,z);}
}
function addTree(x,z){const g=new THREE.Group();const trunk=box(.35,2,.35,mat(0x554236),0,0,0);const crown=new THREE.Mesh(new THREE.SphereGeometry(1.5+Math.random(),8,6),mat(0x3c784c));crown.position.y=3;g.add(trunk,crown);g.position.set(x,.2,z);g.userData={urbanLayer:'green'};cityGroup.add(g);}
function createTransit(){
  const metro=new THREE.Mesh(new THREE.TorusGeometry(53,.35,8,96),mat(0x4daeff,.45,.25));metro.rotation.x=Math.PI/2;metro.position.y=.55;metro.scale.z=.72;metro.userData={urbanLayer:'transit'};cityGroup.add(metro);
  [[-38,-38],[38,-38],[38,38],[-38,38],[0,0]].forEach(([x,z])=>{const s=box(2,.7,2,mat(0x58c2ff),x,.4,z);s.userData={urbanLayer:'transit'};cityGroup.add(s);});
}
function createTraffic(){
  const colors=[0xf4f0df,0x4ca7c7,0xd94f5c,0x252b30,0xe5b94b];
  for(let i=0;i<48;i++){
    const car=box(1.1,.65,2.2,mat(colors[i%colors.length],.65,.05),0,0,0);
    car.userData={t:i/48,route:i%2?'h':'v',speed:.15+Math.random()*.12};trafficGroup.add(car);
  }
}
function createSignals(){
  [[-4,-4],[4,4],[-4,4],[4,-4],[-42,0],[42,0]].forEach(([x,z])=>{const g=new THREE.Group();g.add(box(.25,3,.25,mat(0x3c4649),0,0,0));const lamp=new THREE.Mesh(new THREE.SphereGeometry(.35,10,8),mat(0xff4057));lamp.position.y=3.3;g.add(lamp);g.position.set(x,.2,z);g.userData={urbanLayer:'traffic'};cityGroup.add(g);});
}
function createAtmosphere(){
  const geo=new THREE.SphereGeometry(22,32,20);const aqi=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:0xb7a33e,transparent:true,opacity:.055,depthWrite:false}));aqi.scale.set(3.2,.55,2.2);aqi.position.set(5,18,0);aqi.userData={urbanLayer:'aqi'};layerGroup.add(aqi);
  const heat=new THREE.Mesh(new THREE.SphereGeometry(18,28,18),new THREE.MeshBasicMaterial({color:0xff713d,transparent:true,opacity:.035,depthWrite:false}));heat.scale.set(3.5,.45,2.5);heat.position.set(0,13,-8);heat.userData={urbanLayer:'heat'};layerGroup.add(heat);
}
function createLabels(){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;const ctx=canvas.getContext('2d');ctx.fillStyle='rgba(5,12,15,.75)';ctx.fillRect(0,0,1024,256);ctx.fillStyle='#74fff1';ctx.font='bold 58px Arial';ctx.fillText('FC ROAD',48,95);ctx.fillStyle='#a7b5b8';ctx.font='30px monospace';ctx.fillText('URBAN DNA • PUNE',48,145);const tex=new THREE.CanvasTexture(canvas);const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true}));sprite.scale.set(22,5.5,1);sprite.position.set(3,7,3);cityGroup.add(sprite);
}
function applyLayer(id){
  selectedLayer=id;
  document.querySelectorAll('.layer').forEach(b=>b.classList.toggle('selected',b.dataset.layer===id));
  // Base visibility remains; selected layer gets emphasis.
  cityGroup.traverse(o=>{if(o.userData?.urbanLayer){o.material && (o.material.opacity = (o.userData.urbanLayer===id)?1:(id==='traffic'&&o.userData.urbanLayer==='traffic'?1:.88));}});
  if(id==='population'){
    cityGroup.traverse(o=>{if(o.userData?.urbanLayer==='population'&&o.material){const p=o.userData.population; o.material.color.set(p<.25?0x53d67b:p<.5?0xd7d34f:p<.75?0xf28c3c:0xe54b55);}});
  }
  if(id==='aqi') layerGroup.visible=true;
  if(id==='heat') layerGroup.visible=true;
  legendEl.textContent=legends[id]||'';
}
function setup3DControls(host){
  let dragging=false,lastX=0,lastY=0;
  renderer.domElement.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId);});
  renderer.domElement.addEventListener('pointermove',e=>{if(!dragging)return;cameraYaw-=(e.clientX-lastX)*.008;cameraPitch=Math.max(.38,Math.min(1.25,cameraPitch+(e.clientY-lastY)*.006));lastX=e.clientX;lastY=e.clientY;});
  renderer.domElement.addEventListener('pointerup',()=>dragging=false);
  renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();cameraDistance=Math.max(45,Math.min(160,cameraDistance+e.deltaY*.06));},{passive:false});
  renderer.domElement.addEventListener('dblclick',()=>reset3D());
}
function updateCamera(){
  const cp=Math.cos(cameraPitch),sp=Math.sin(cameraPitch);camera.position.set(cameraTarget.x+cameraDistance*Math.sin(cameraYaw)*cp,cameraTarget.y+cameraDistance*sp,cameraTarget.z+cameraDistance*Math.cos(cameraYaw)*cp);camera.lookAt(cameraTarget.x,cameraTarget.y,cameraTarget.z);}
function animate3D(){
  animationId=requestAnimationFrame(animate3D);
  const t=performance.now()*.001;
  trafficGroup.children.forEach((car,i)=>{const u=(car.userData.t+t*car.userData.speed)%1;if(car.userData.route==='h'){car.position.set(-82+u*164,.35,Math.sin(i)*1.1);car.rotation.y=0;}else{car.position.set(Math.cos(i)*1.2,.35,-68+u*136);car.rotation.y=Math.PI/2;}});
  layerGroup.children.forEach((o,i)=>{o.position.y += Math.sin(t*.7+i)*.002;});
  updateCamera();renderer.render(scene,camera);
}
function resize3D(){const host=document.querySelector('#map3d');if(!renderer)return;camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight);}
function reset3D(){cameraTarget={x:0,y:0,z:0};cameraYaw=.72;cameraPitch=.72;cameraDistance=105;}

initUrban3D();

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
