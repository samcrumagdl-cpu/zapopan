import {COLORS,LAYERS,format,percent,escape} from './config.js';
const NS='http://www.w3.org/2000/svg';
export class ElectoralMap {
 constructor(host,geometry,election,onSelect,layer='leader'){
  this.host=host;this.election=election;this.layer=layer;this.records=new Map(election.records.map(r=>[r.section,r]));this.onSelect=onSelect;
  host.innerHTML=`<div class="map-canvas"><svg role="group" aria-label="Mapa interactivo de secciones electorales de Zapopan" viewBox="0 0 850 560"><defs><pattern id="map-grid" width="42" height="42" patternUnits="userSpaceOnUse"><path d="M 42 0 L 0 0 0 42" fill="none" stroke="#ccd6d1" stroke-width=".6"/></pattern></defs><rect width="850" height="560" fill="url(#map-grid)"/><g class="map-shapes"></g></svg><div class="map-north">N<span>↑</span></div><div class="map-tools"><button data-zoom="in" aria-label="Acercar mapa">+</button><button data-zoom="out" aria-label="Alejar mapa">−</button><button data-zoom="reset" aria-label="Restablecer mapa">⌂</button></div><div class="map-tip">Selecciona una sección · arrastra para navegar</div><div class="map-hover" role="status"></div></div><div class="map-legend" aria-label="Leyenda del mapa"></div>`;
  this.svg=host.querySelector('svg');this.group=host.querySelector('.map-shapes');this.hover=host.querySelector('.map-hover');this.legend=host.querySelector('.map-legend');
  const project=([x,y])=>[x*Math.cos(20.8*Math.PI/180),-y];
  const allPoints=geometry.features.flatMap(f=>f.geometry.coordinates.flat(2)).map(project);
  const xs=allPoints.map(p=>p[0]),ys=allPoints.map(p=>p[1]);let xmin=Infinity,xmax=-Infinity,ymin=Infinity,ymax=-Infinity;
  for(const x of xs){xmin=Math.min(xmin,x);xmax=Math.max(xmax,x);}for(const y of ys){ymin=Math.min(ymin,y);ymax=Math.max(ymax,y);}
  const scale=Math.min(760/(xmax-xmin),490/(ymax-ymin));const point=p=>{const [x,y]=project(p);return [45+(x-xmin)*scale+(760-(xmax-xmin)*scale)/2,30+(y-ymin)*scale];};
  this.paths=[];
  for(const f of geometry.features){
   const p=document.createElementNS(NS,'path');p.setAttribute('d',f.geometry.coordinates.map(poly=>poly.map(ring=>ring.map((v,i)=>`${i?'L':'M'}${point(v).map(n=>n.toFixed(2)).join(',')}`).join('')+'Z').join('')).join(''));
   p.setAttribute('fill-rule','evenodd');p.setAttribute('vector-effect','non-scaling-stroke');p.dataset.section=f.id;p.setAttribute('tabindex','0');p.setAttribute('role','button');p.setAttribute('aria-label',`Sección ${f.id}`);
   p.addEventListener('click',()=>{if(!this.dragged)this.select(f.id);});p.addEventListener('keydown',ev=>{if(['Enter',' '].includes(ev.key)){ev.preventDefault();this.select(f.id);}});
   p.addEventListener('pointerenter',()=>{this.hover.textContent=`Sección ${f.id} · ${this.valueLabel(f.id)}`;});p.addEventListener('focus',()=>{this.hover.textContent=`Sección ${f.id} · ${this.valueLabel(f.id)}`;});
   this.group.append(p);this.paths.push(p);
  }
  this.view={x:0,y:0,w:850,h:560};
  host.querySelectorAll('[data-zoom]').forEach(b=>b.addEventListener('click',()=>this.zoom(b.dataset.zoom)));
  this.svg.addEventListener('wheel',ev=>{ev.preventDefault();this.zoom(ev.deltaY<0?'in':'out');},{passive:false});
  this.svg.addEventListener('pointerdown',ev=>{if(ev.button!==0)return;this.dragged=false;this.drag={x:ev.clientX,y:ev.clientY,view:{...this.view}};});
  this.svg.addEventListener('pointermove',ev=>{if(!this.drag)return;const dx=ev.clientX-this.drag.x,dy=ev.clientY-this.drag.y;if(Math.abs(dx)+Math.abs(dy)>5)this.dragged=true;if(!this.dragged)return;this.svg.setPointerCapture(ev.pointerId);const box=this.svg.getBoundingClientRect(),factor=Math.max(this.view.w/box.width,this.view.h/box.height);this.view.x=this.drag.view.x-dx*factor;this.view.y=this.drag.view.y-dy*factor;this.applyView();});
  this.svg.addEventListener('pointerup',()=>{this.drag=null;});this.svg.addEventListener('pointercancel',()=>{this.drag=null;});
  this.paint();
 }
 select(id){this.paths.forEach(p=>p.classList.toggle('selected',+p.dataset.section===id));this.onSelect(id);}
 zoom(action){if(action==='reset'){this.view={x:0,y:0,w:850,h:560};}else{const k=action==='in'?.72:1/.72,w=Math.max(25,Math.min(1700,this.view.w*k)),h=w*560/850;this.view={x:this.view.x+(this.view.w-w)/2,y:this.view.y+(this.view.h-h)/2,w,h};}this.applyView();}
 applyView(){this.svg.setAttribute('viewBox',`${this.view.x} ${this.view.y} ${this.view.w} ${this.view.h}`);}
 valueLabel(id){const r=this.records.get(id);if(!r)return 'Sin resultados';if(r.quality!=='verified')return 'En revisión';const c=r.calculated;return this.layer==='leader'?(c.leader??(c.tie?'Empate':'Emblemas incompletos')):this.layer==='turnout'?percent(c.turnout):this.layer==='gap'?(c.emblemGapPP==null?'N/D':`${format(c.emblemGapPP,1)} pp`):this.layer==='votes'?`${format(r.original.total)} votos`:'Con resultados';}
 paint(){
  const scales={turnout:{limits:[40,50,60,70],colors:['#e0ece9','#b3d2c8','#7cafa2','#448c7e','#22665b'],labels:['<40%','40–<50%','50–<60%','60–<70%','≥70%']},gap:{limits:[5,10,20,30],colors:['#f8e7cf','#eac797','#dba16a','#bd7851','#94543d'],labels:['<5 pp','5–<10 pp','10–<20 pp','20–<30 pp','≥30 pp']},votes:{limits:[500,1000,2000,4000],colors:['#e2e8ef','#b9cbdc','#88a6c0','#547e9f','#315878'],labels:['<500','500–999','1,000–1,999','2,000–3,999','≥4,000']}};
  const scale=scales[this.layer];
  for(const p of this.paths){const id=+p.dataset.section,r=this.records.get(id);let color='#d8deda';
   if(r?.quality==='review')color='#b9b2a5';else if(r){if(this.layer==='leader')color=COLORS[r.calculated.leader]||'#d8deda';else if(this.layer==='coverage')color='#548b79';else{const value=this.layer==='turnout'?r.calculated.turnout:this.layer==='gap'?r.calculated.emblemGapPP:r.original.total;if(value!=null){let i=scale.limits.findIndex(n=>value<n);if(i<0)i=scale.colors.length-1;color=scale.colors[i];}}}
   p.setAttribute('fill',color);p.setAttribute('aria-label',`Sección ${id}: ${this.valueLabel(id)}`);
  }
  let items=this.layer==='leader'?[...new Set(this.election.records.map(r=>r.calculated.leader).filter(Boolean))].sort().map(p=>[COLORS[p],p]):this.layer==='coverage'?[['#548b79','Con resultados']]:scale.colors.map((c,i)=>[c,scale.labels[i]]);
  items.push(['#d8deda','Sin dato'],['#b9b2a5','En revisión']);
  this.legend.innerHTML=items.map(([c,l])=>`<span><i style="background:${c}"></i>${escape(l)}</span>`).join('');
 }
}
