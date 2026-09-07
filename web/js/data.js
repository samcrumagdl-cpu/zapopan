export async function loadData(){
  const responses=await Promise.all(['observatory.json','sections.geojson'].map(p=>fetch(new URL(`../data/${p}`,import.meta.url))));
  if(responses.some(r=>!r.ok))throw new Error('No se pudieron leer los archivos locales. Inicia el proyecto con un servidor HTTP.');
  const [data,geometry]=await Promise.all(responses.map(r=>r.json()));
  if(data.schemaVersion!==1||data.elections.length!==1||data.elections[0].year!==2024)throw new Error('Esta demo requiere exclusivamente los datos de 2024. Regenera los archivos y recarga la página.');
  return {data,geometry};
}
export const validRecords=e=>e.records.filter(r=>r.section>0&&r.quality==='verified');
export function partyStats(e,party){
  const all=validRecords(e),rows=all.filter(r=>r.original.parties[party]!=null);
  const votes=rows.reduce((a,r)=>a+r.original.parties[party],0),denominator=rows.reduce((a,r)=>a+r.original.total,0);
  return {party,votes:rows.length?votes:null,share:denominator?votes/denominator*100:null,covered:rows.length,sections:all.length,complete:rows.length===all.length};
}
export function compareSections(election,sectionA,sectionB){
  const find=id=>election.records.find(r=>r.section===Number(id)&&r.section>0);
  const a=find(sectionA),b=find(sectionB);
  if(!a||!b)throw new Error('La sección seleccionada no tiene resultados en 2024.');
  const diff=(x,y)=>x==null||y==null?null:y-x;
  const parties=election.parties.map(party=>{
    const votesA=a.original.parties[party],votesB=b.original.parties[party];
    const shareA=a.calculated.shares[party],shareB=b.calculated.shares[party];
    return {party,votesA,votesB,shareA,shareB,deltaVotes:diff(votesA,votesB),deltaShare:diff(shareA,shareB)};
  });
  return {a,b,parties};
}
