export const STORAGE_KEY = 'baby-playbook-family-v1';
export const STAGES = {before:'Before he arrives',newborn:'Birth–3 months',infant:'3–6 months',older:'6–12 months',toddler:'1–3 years',preschool:'3 years & up'};
export function escapeHTML(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export function dateOnly(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
export function parseDate(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return null;const [y,m,d]=value.split('-').map(Number);const v=new Date(y,m-1,d,12);return v.getFullYear()===y&&v.getMonth()===m-1&&v.getDate()===d?v:null;}
export function ageInfo(profile={},now=new Date()){
 const date=parseDate(profile.date);
 if(profile.type!=='birth'||!date||dateOnly(date)>dateOnly(now))return {stage:'before',label:STAGES.before,months:0,days:0};
 const days=Math.floor((Date.UTC(now.getFullYear(),now.getMonth(),now.getDate())-Date.UTC(date.getFullYear(),date.getMonth(),date.getDate()))/86400000);
 const months=(now.getFullYear()-date.getFullYear())*12+now.getMonth()-date.getMonth()-(now.getDate()<date.getDate()?1:0);
 const stage=months<3?'newborn':months<6?'infant':months<12?'older':months<36?'toddler':'preschool';
 const label=days<14?`${days} ${days===1?'day':'days'} old`:months<3?`${Math.floor(days/7)} weeks old`:months<24?`${months} months old`:`${Math.floor(months/12)} years${months%12?`, ${months%12} months`:''} old`;
 return {stage,label,months,days};
}
export function validProfile(profile,now=new Date()){
 if(!['due','birth'].includes(profile.type))return 'Choose a due date or birth date.';
 if(!parseDate(profile.date))return 'Enter a valid date.';
 if(profile.type==='birth'&&profile.date>dateOnly(now))return 'A birth date cannot be in the future. Choose due date if you are preparing.';
 return '';
}
const object=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
function strings(value){return Object.fromEntries(Object.entries(object(value)).filter(([k,v])=>!['__proto__','constructor','prototype'].includes(k)&&typeof v==='string').map(([k,v])=>[k,v.slice(0,3000)]));}
export function normalizeState(value){const v=object(value);return {profile:strings(v.profile),contacts:strings(v.contacts),handoff:strings(v.handoff),faithPlan:strings(v.faithPlan),favorites:Array.isArray(v.favorites)?[...new Set(v.favorites.filter(x=>typeof x==='string').slice(0,500))]:[],checks:Object.fromEntries(Object.entries(object(v.checks)).filter(([k,v])=>typeof v==='boolean'&&!['__proto__','constructor','prototype'].includes(k))),theme:v.theme==='dark'?'dark':'light'};}
export function readState(storage){try{return {state:normalizeState(JSON.parse(storage.getItem(STORAGE_KEY)||'{}')),error:null};}catch(e){return {state:normalizeState({}),error:'Saved details could not be read. Changes may not persist in this browser.'};}}
export function writeState(storage,state){try{storage.setItem(STORAGE_KEY,JSON.stringify(normalizeState(state)));return true;}catch{return false;}}
export function telephone(value){const clean=String(value||'').replace(/[^\d+]/g,'');return clean.replace(/(?!^)\+/g,'');}
export function flatten(sections){return sections.flatMap(s=>s.groups.flatMap(g=>g.items.map(item=>({...item,sectionId:s.id,sectionName:s.name,group:g.label}))));}
const synonyms={poop:['stool','diaper'],poo:['stool','diaper'],wee:['wet diaper'],pee:['wet diaper'],nappy:['diaper'],temperature:['fever'],sick:['illness','fever'],choking:['choke','breathing'],cry:['crying'],prayer:['pray','blessing'],church:['mass','baptism'],bottle:['milk','feeding'],tired:['sleep'],spitup:['spit-up','reflux'],tantrum:['frustration','limits'],dad:['father','dad'],mum:['mother','partner'],mom:['mother','partner']};
export function matchesQuery(item,query){const text=[item.t,item.lead,item.title,item.action,item.detail,item.sectionName,...(item.fields||[]).map(f=>f.v),...(item.chips||[]).map(c=>c.v)].join(' ').toLowerCase();return query.toLowerCase().trim().split(/\s+/).filter(Boolean).every(word=>[word,...(synonyms[word]||[])].some(term=>text.includes(term)));}
export function faithForStage(card,stage){const order=['before','newborn','infant','older','toddler','preschool'];const continuing=['daily-blessing','scripture-minute','saint-story'];return card.stage==='all'||card.stage===stage||(stage==='preschool'&&card.stage==='toddler')||(continuing.includes(card.id)&&order.indexOf(stage)>=order.indexOf(card.stage));}
export function toggleFavorite(state,id){state.favorites=state.favorites.includes(id)?state.favorites.filter(x=>x!==id):[...state.favorites,id];}
export function formatMoment(value){const d=new Date(value);return value&&!Number.isNaN(d.getTime())?d.toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'Not recorded';}
export function handoffText(state){const h=state.handoff;return [`Baby Playbook · ${state.profile.name||'Our baby boy'}`,`Saved: ${formatMoment(h.updatedAt)}`,`Next on duty: ${h.next||'Not set'}`,`Last feed: ${formatMoment(h.feedTime)}${h.feedNote?' · '+h.feedNote:''}`,`Last diaper: ${formatMoment(h.diaperTime)}${h.diaperNote?' · '+h.diaperNote:''}`,`Last sleep: ${formatMoment(h.sleepTime)}${h.sleepNote?' · '+h.sleepNote:''}`,`What helped / next parent needs to know: ${h.notes||'Not recorded'}`].join('\n');}
