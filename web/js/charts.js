import {COLORS,format,percent,escape} from './config.js';
import {partyStats} from './data.js';
export function bars(e,{limit=20}={}){
  const stats=e.parties.map(p=>partyStats(e,p)).sort((a,b)=>(b.votes??-1)-(a.votes??-1)).slice(0,limit);
  const max=Math.max(...stats.map(s=>s.votes||0),1);
  return `<div class="bar-chart">${stats.map(s=>`<div class="bar-row"><div class="bar-label"><span><i style="background:${COLORS[s.party]}"></i>${escape(s.party)}</span><strong>${format(s.votes)}${s.complete?'':'*'}</strong></div><div class="bar-track"><span style="width:${(s.votes||0)/max*100}%;background:${COLORS[s.party]}"></span></div><div class="bar-meta">${percent(s.share)} de votos en ${format(s.covered)} secciones con dato</div></div>`).join('')}</div>`;
}
export function composition(e){
  const records=e.records.filter(r=>r.section>0&&r.quality==='verified');
  const sum=field=>records.reduce((n,r)=>n+r.original[field],0);
  const values=[['Válidos',sum('valid'),'#487565'],['Nulos',sum('nullVotes'),'#dba16a'],['No registrados',sum('unregistered'),'#9aabb4']];
  return `<div class="vote-composition" role="img" aria-label="${values.map(([k,v])=>`${k}: ${format(v)}`).join('; ')}">${values.map(([k,v,c])=>`<span style="width:${v/e.summary.total*100}%;background:${c}" title="${k}: ${format(v)}"></span>`).join('')}</div><table><thead><tr><th>Tipo de voto</th><th>Votos</th><th>% total</th></tr></thead><tbody>${values.map(([k,v,c])=>`<tr><td><i class="dot" style="background:${c}"></i>${k}</td><td>${format(v)}</td><td>${percent(v/e.summary.total*100)}</td></tr>`).join('')}</tbody></table>`;
}
