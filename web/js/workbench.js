import {COLORS,LAYERS,format as f,percent as pct,escape as esc} from './config.js';
import {bars} from './charts.js';
import {ElectoralMap} from './map.js';

// Presentation state only; municipal indicators and source data are never filtered here.
const state={layer:'leader',coverage:'all',fills:true,borders:true,tab:'summary',selected:null};
const options=(items,value)=>items.map(([id,label])=>`<option value="${id}" ${String(id)===String(value)?'selected':''}>${esc(label)}</option>`).join('');
const heading=text=>`<h2 class="control-title">${text}</h2>`;
export function mountWorkbench({host,data,geometry,mode,openSection,onCompare}){
 const e=data.elections[0],records=new Map(e.records.filter(r=>r.section>0).map(r=>[r.section,r]));
 const contexts=new Map(data.context.map(c=>[c.section,c]));
 const ids=[...new Set([...records.keys(),...contexts.keys()])].sort((a,b)=>a-b);
 host.innerHTML=`<div class="console-page-heading"><div><span class="eyebrow">ANÁLISIS ELECTORAL · ZAPOPAN 2024</span><h1>${mode==='mapa'?'Cartografía electoral':'Resumen ejecutivo electoral'}</h1></div><span>Indicadores municipales · controles aplicados solo al mapa</span></div><div class="workbench"><aside class="control-panel" aria-label="Controles cartográficos"><section>${heading('Capas cartográficas')}<label class="switch-line"><input id="map-fills" type="checkbox" ${state.fills?'checked':''}><span>Votación por sección</span><b>2024</b></label><label class="switch-line"><input id="map-borders" type="checkbox" ${state.borders?'checked':''}><span>Límites seccionales</span><b>${geometry.features.length}</b></label></section><section>${heading('Variable electoral')}<label class="sr-only" for="layer-select">Capa del mapa</label><select id="layer-select">${options(Object.entries(LAYERS),state.layer)}</select><p class="control-note">Mayor emblema: votos individuales, sin redistribución de coaliciones.</p></section><section>${heading('Cobertura cartográfica')}<label class="sr-only" for="map-coverage">Filtrar polígonos</label><select id="map-coverage">${options([['all','Todos los polígonos'],['results','Con resultados 2024'],['missing','Sin resultados 2024']],state.coverage)}</select><p class="control-note" id="map-visible-count"></p></section><section>${heading('Consulta de sección')}<label class="sr-only" for="map-section-select">Seleccionar sección</label><select id="map-section-select"><option value="">Seleccionar sección…</option>${options(ids.map(id=>[id,`${id}${!contexts.has(id)?' · sin polígono':!records.has(id)?' · sin resultados':''}`]),state.selected)}</select></section><section>${heading('Leyenda de la variable')}<div id="control-legend"></div></section><section>${heading('Exportación y navegación')}<a class="console-button" href="./data/sections.csv" download>↓ Resultados 2024 · CSV</a><a class="console-button" href="./data/sections.geojson" download>↓ Secciones · GeoJSON</a><button class="console-button" id="reset-extent">⊡ Restablecer extensión</button></section><section>${heading('Trazabilidad del análisis')}<ol class="method-steps"><li><b>Fuente electoral</b><span>Casillas de Zapopan · entidad 14, municipio 120.</span></li><li><b>Integración seccional</b><span>Suma por sección y validación de componentes.</span></li><li><b>Representación territorial</b><span>Unión exacta por identificador geográfico.</span></li></ol><a href="#fuentes" class="text-link">Fuentes y metodología →</a></section></aside><section class="map-stage" aria-label="Mapa electoral de Zapopan"><div class="stage-header"><span class="stage-indicator"></span><strong id="map-layer-title">${esc(LAYERS[state.layer])}</strong><span>EPSG:4326</span></div><div id="electoral-map"></div><div class="stage-footer"><span>Geometría local · vigencia no documentada</span><span>14 secciones con resultados sin polígono</span></div></section><aside class="analysis-panel" aria-label="Análisis de resultados"><div class="analysis-tabs" role="tablist" aria-label="Panel de análisis">${[['summary','Resumen'],['parties','Emblemas'],['detail','Detalle']].map(([id,label])=>`<button role="tab" id="tab-${id}" aria-controls="analysis-content" data-analysis-tab="${id}" aria-selected="${state.tab===id}">${label}</button>`).join('')}</div><div id="analysis-content" role="tabpanel"></div></aside></div>`;
 const root=host.querySelector('.workbench'),content=root.querySelector('#analysis-content');
 const map=new ElectoralMap(root.querySelector('#electoral-map'),geometry,e,id=>selectSection(id),state.layer);
 root.querySelector('#control-legend').append(map.legend);
 function selectSection(id){state.selected=id;state.tab='detail';root.querySelector('#map-section-select').value=String(id);renderSide();}
 function detail(){
  if(state.selected==null)return `${heading('Detalle de sección')}<div class="detail-placeholder"><span>⌖</span><h3>Sin sección seleccionada</h3><p>Selecciona un polígono del mapa o un identificador en el panel de control.</p></div>`;
  const r=records.get(state.selected),c=contexts.get(state.selected),o=r?.original,v=r?.calculated;
  return `${heading('Ficha territorial')}<div class="inline-section-title"><small>ZAPOPAN · MUNICIPIO 120</small><h3>Sección ${state.selected}</h3><span class="chip">${c?'Con polígono':'Sin polígono'}</span> <span class="chip">${r?'Resultados 2024':'Sin resultados'}</span></div>${!r?'<p class="notice">La geometría no tiene resultados en el archivo de 2024. No representa cero votos.</p>':''}${!c?'<p class="notice">Resultado disponible en tabla. No existe polígono para esta sección en la cartografía aportada.</p>':''}<div class="inline-metrics"><div><strong>${f(o?.total)}</strong><small>Votos totales</small></div><div><strong>${pct(v?.turnout)}</strong><small>Participación</small></div><div><strong>${f(o?.nominal)}</strong><small>Lista nominal</small></div><div><strong>${v?.leader??(v?.tie?'Empate':'N/D')}</strong><small>Mayor emblema</small></div></div>${r?`<div class="inline-party-list">${e.parties.map(p=>`<div><span><i class="dot" style="background:${COLORS[p]}"></i>${p}</span><b>${f(o.parties[p])}</b><small>${pct(v.shares[p])}</small></div>`).join('')}</div><p class="control-note">Votos individuales; no equivale a resultado por candidatura.</p><button class="console-button primary" id="open-full-detail">Abrir ficha y fuentes ↗</button><button class="console-button" id="compare-selected">Comparar con otra sección →</button><p class="control-note">Fuente ${r.source} · ${r.recordCount} filas de origen. Consulta la ficha completa para ver la numeración.</p>`:'<button class="console-button" id="open-full-detail">Ver contexto y fuente ↗</button>'}`;
 }
 function renderSide(){
  root.querySelectorAll('[data-analysis-tab]').forEach(b=>{b.setAttribute('aria-selected',String(b.dataset.analysisTab===state.tab));b.tabIndex=b.dataset.analysisTab===state.tab?0:-1;});
  content.setAttribute('aria-labelledby',`tab-${state.tab}`);
  if(state.tab==='detail'){content.innerHTML=detail();return;}
  if(state.tab==='parties'){content.innerHTML=`${heading('Votos por emblema · 2024')}${bars(e)}<p class="control-note">* Suma parcial. El porcentaje utiliza solo secciones con dato completo del emblema; la cobertura se indica bajo cada barra.</p><a class="console-button" href="#emblemas">Análisis completo por emblema →</a>`;return;}
  const total=geometry.features.length,mapped=e.coverage.mapped,percent=mapped/total*100;
  const sections=e.records.filter(r=>r.section>0&&r.quality==='verified');const sum=k=>sections.reduce((n,r)=>n+r.original[k],0);
  content.innerHTML=`${heading('Cobertura de resultados')}<div class="coverage-donut" style="--coverage:${percent}%" role="img" aria-label="${mapped} de ${total} polígonos tienen resultados"><div><strong>${mapped}<small>/${total}</small></strong><span>POLÍGONOS CON DATOS</span></div></div><div class="donut-legend"><span><i class="dot" style="background:var(--cyan)"></i>Con resultados</span><span><i class="dot" style="background:#33455f"></i>Sin resultados</span></div><div class="inline-metrics"><div><strong>${mapped}</strong><small>Con resultados y mapa</small></div><div><strong>${total-mapped}</strong><small>Polígonos sin resultados</small></div><div><strong class="amber">${e.coverage.missingGeometry.length}</strong><small>Resultados sin polígono</small></div><div><strong>${e.coverage.sections}</strong><small>Secciones con resultados</small></div></div>${heading('Composición de la votación')}<div class="summary-stats"><div><span>Votos válidos</span><b>${f(sum('valid'))}</b></div><div><span>Votos nulos</span><b>${f(sum('nullVotes'))}</b></div><div><span>No registrados</span><b>${f(sum('unregistered'))}</b></div><div><span>Total secciones positivas</span><b>${f(e.summary.total)}</b></div></div>${heading('Control de calidad')}<div class="quality-item"><b>27 votos fuera del agregado</b><p>Registros de sección 0, conservados por separado.</p></div><div class="quality-item"><b>Participación comparable</b><p>Excluye casillas especiales con lista nominal cero. Los resultados de votación sí las incluyen.</p></div><a href="#fuentes" class="text-link">Consultar metodología →</a>`;
 }
 function applyMapControls(){
  let visible=0;
  map.group.classList.toggle('outline-only',!state.fills);map.group.classList.toggle('no-boundaries',!state.borders);
  for(const path of map.paths){const has=records.has(+path.dataset.section);const show=(state.coverage==='all'||(state.coverage==='results'?has:!has))&&(state.fills||state.borders);path.style.display=show?'':'none';if(show)visible++;}
  root.querySelector('#map-visible-count').textContent=`${visible} de ${geometry.features.length} polígonos visibles. Los indicadores municipales no cambian.`;
 }
 root.addEventListener('change',ev=>{
  const id=ev.target.id;
  if(id==='layer-select'){state.layer=ev.target.value;map.layer=state.layer;map.paint();root.querySelector('#map-layer-title').textContent=LAYERS[state.layer];}
  if(id==='map-coverage')state.coverage=ev.target.value;
  if(id==='map-fills')state.fills=ev.target.checked;
  if(id==='map-borders')state.borders=ev.target.checked;
  if(id==='map-section-select'&&ev.target.value)map.select(+ev.target.value);
  applyMapControls();
 });
 root.addEventListener('click',ev=>{
  const tab=ev.target.closest('[data-analysis-tab]');if(tab){state.tab=tab.dataset.analysisTab;renderSide();}
  if(ev.target.closest('#reset-extent'))map.zoom('reset');
  if(ev.target.closest('#open-full-detail'))openSection(state.selected);
  if(ev.target.closest('#compare-selected'))onCompare(state.selected);
 });
 root.querySelector('.analysis-tabs').addEventListener('keydown',ev=>{
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(ev.key))return;
  const tabs=['summary','parties','detail'];let i=tabs.indexOf(state.tab);
  i=ev.key==='Home'?0:ev.key==='End'?2:(i+(ev.key==='ArrowRight'?1:2))%3;
  state.tab=tabs[i];renderSide();root.querySelector(`#tab-${state.tab}`).focus();ev.preventDefault();
 });
 map.paths.forEach(path=>path.classList.toggle('selected',+path.dataset.section===state.selected));
 applyMapControls();renderSide();
}
