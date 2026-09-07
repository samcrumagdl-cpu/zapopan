export const COLORS={MC:'#e4834e',MORENA:'#985568',PAN:'#447fa7',PRI:'#648e79',PRD:'#c8ab43',PVEM:'#8ca866',PT:'#b57466',NA:'#58a6af',PES:'#8f7ca6',RSP:'#ac7987',FM:'#bd77a1',SOMOS:'#70969c',HAGAMOS:'#747fbc',FUTURO:'#8573a8'};
export const PAGES={resumen:'Resumen ejecutivo',mapa:'Cartografía electoral',emblemas:'Análisis por emblema',comparador:'Comparativo seccional',secciones:'Consulta seccional',territorio:'Datos sociodemográficos',fuentes:'Fuentes y metodología'};
export const LAYERS={leader:'Mayor votación por emblema',turnout:'Participación',gap:'Diferencia entre emblemas',votes:'Votos totales',coverage:'Cobertura de resultados'};
export const format=(v,d=0)=>v==null?'N/D':new Intl.NumberFormat('es-MX',{maximumFractionDigits:d,minimumFractionDigits:d}).format(v);
export const percent=v=>v==null?'N/D':`${format(v,1)}%`;
export const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
