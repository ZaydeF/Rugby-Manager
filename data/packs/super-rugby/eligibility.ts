export type Region='NORTH'|'SOUTH'|'UNKNOWN';
export type Eligibility={status:'eligible'|'ineligible'|'unverified';union:string;province:string|null;region:Region;basis:string;source:string|null;regionSource:string|null};
export const SOURCES={
 july25:'https://www.allblacks.com/news/all-blacks/all-blacks-squad-named-to-face-france',
 june26:'https://www.allblacks.com/news/all-blacks/2026-all-blacks-and-maori-all-blacks-squads-named-monday',
 islands20:'https://rugbyheartland.co.nz/wp/2020/08/18/squads-named-for-steinlager-north-v-south-match/',
 criteria:'https://www.sporty.co.nz/aru/newsarticle/92402?newsfeedId=972103',
 world:'https://www.world.rugby/organisation/governance/regulations/reg-8?lang=en',
 domestic:'https://www.nzrpa.co.nz/asset/850/RPC%20-%20NZR%20-%20Collective%20Agreement%202025.pdf'
};
export const south=new Set(['Canterbury','Tasman','Otago','Southland']);
export const north=new Set(['Northland','North Harbour','Auckland','Counties Manukau','Waikato','Bay of Plenty','Taranaki',"Hawke’s Bay",'Manawatu','Wellington']);
export function provinceRegion(province:string|null):Region{return province&&south.has(province)?'SOUTH':province&&north.has(province)?'NORTH':'UNKNOWN';}
// Explicit IDs, never franchise membership. National and first-province evidence are separate.
const national:Record<string,Eligibility>={};
function allow(ids:string,source:string,basis='Confirmed NZ representative selection; no automatic union switches simulated'){
 for(const id of ids.split(' '))national[id]={status:'eligible',union:'New Zealand',province:null,region:'UNKNOWN',basis,source,regionSource:null};
}
allow('5 12 14 25 26 34 80 83 84 92 95 96 98 99 102 108 109 115 128 129 133 134 141 142 148 154 166 180 192 196 197 208 209 213 219 221 226',SOURCES.july25);
allow('19 90 97 113 124 147 194 225 227',SOURCES.june26);
allow('7 17 20 22 100 118 137 138 158',SOURCES.islands20,'Named in the NZR 2020 North–South representative pool; national status held fixed in this simulation');
allow('116','https://www.allblacks.com/players/george-bell');
allow('117','https://www.allblacks.com/players/ethan-blackadder');
allow('123','https://crusaders.co.nz/latest/news/cullen-grace-confirms-move-to-welsh-club-scarlets/');
allow('139','https://crusaders.co.nz/chay-fihaki/','Confirmed All Blacks XV selection');
allow('215','https://www.hurricanes.co.nz/squad/player/brett-cameron');
allow('173 9 94 101 167 172 206 10 77 78 91 103 105 110 145 149 160 187 189 191 205','https://www.allblacks.com/news/all-blacks-xv-2025-squad-announced','Confirmed 2025 All Blacks XV selection');
allow('177','https://thehighlanders.co.nz/our-teams/highlanders-super-rugby/cameron-millar/','Confirmed NZ U20 representative and NZ development pathway; no union switch simulated');
allow('175','https://en.wikipedia.org/wiki/Dylan_Pledger','NZ-born player with confirmed NZ U20 pathway');
allow('453','https://crusaders.co.nz/latest/news/oli-mathis-signs-with-crusaders-for-2027-and-2028/','Confirmed NZ sevens representative');
allow('176','https://en.wikipedia.org/wiki/Andrew_Knewstubb','New Zealand Olympic sevens representative');
allow('184','https://thehighlanders.co.nz/our-teams/highlanders-super-rugby/jona-nareki/','Confirmed New Zealand sevens pathway');
function province(id:string,p:string,source:string){if(!national[id])throw Error('Province requires a national record');Object.assign(national[id],{province:p,region:provinceRegion(p),regionSource:source});}
for(const [p,ids] of Object.entries({Auckland:'5 7 14 17 20 34 158',Taranaki:'25 92 100',Waikato:'102 148',Wellington:'197',Tasman:'22 138 142 192',Canterbury:'133 137 219',Otago:'118'}))for(const id of ids.split(' '))province(id,p,SOURCES.islands20);
for(const [id,p,slug] of [
 ['12','Canterbury','sam-darry'],['19','Tasman','anton-segner'],['116','Canterbury','george-bell'],['117','Tasman','ethan-blackadder'],['134','Canterbury','tamaiti-williams'],['141','Tasman','noah-hotham'],['180','Tasman','timoci-tavatavanawai'],['196','Southland','pasilio-tosi'],
] )province(id,p,`https://www.allblacks.com/players/${slug}`);
province('80','Waikato',SOURCES.july25);province('83','Canterbury',SOURCES.july25);
province('166','Otago','https://thehighlanders.co.nz/our-teams/highlanders-super-rugby/fabian-holland/');
province('128','Otago','https://crusaders.co.nz/christian-lio-willie/');province('129','Canterbury','https://crusaders.co.nz/fletcher-newell/');
province('123','Canterbury','https://crusaders.co.nz/cullen-grace/');province('139','Canterbury','https://crusaders.co.nz/chay-fihaki/');
province('215','Canterbury','https://www.hurricanes.co.nz/squad/player/brett-cameron');province('227','Southland','https://www.hurricanes.co.nz/squad/player/joshua-moorby');
// Secondary biographies are explicitly linked where a primary first-province history is unavailable.
for(const [id,p,slug] of [['115','Canterbury','Scott_Barrett_(rugby_union)'],['154','Southland','Ethan_de_Groot'],['176','Canterbury','Andrew_Knewstubb'],['184','Otago','Jona_Nareki']])province(id,p,`https://en.wikipedia.org/wiki/${slug}`);
province('173','Hawke’s Bay','https://thehighlanders.co.nz/news/fakatava-signs-two-year-deal-with-highlanders/');
province('175','Otago','https://thehighlanders.co.nz/our-teams/highlanders-super-rugby/dylan-pledger/');
province('453','Waikato','https://crusaders.co.nz/latest/news/oli-mathis-signs-with-crusaders-for-2027-and-2028/');
province('177','Otago','https://en.wikipedia.org/wiki/Cam_Millar_(rugby_union)');
province('84','Waikato','https://chiefs.co.nz/player/samisoni-taukeiaho/');
province('147','Wellington','https://crusaders.co.nz/kyle-preston/');
province('172','Otago','https://en.wikipedia.org/wiki/Sean_Withy');
province('26','Taranaki','https://trfu.co.nz/blogs/news/taranaki-rugby-farewells-stephen-perofeta');
province('9','Taranaki','https://en.wikipedia.org/wiki/Bradley_Slater');
province('103','Taranaki','https://www.allblacks.com/players/josh-jacomb-x0248');
export const REAL_ELIGIBILITY:Readonly<Record<string,Eligibility>>=national;
province('194','Wellington','https://www.hurricanes.co.nz/squad/player/xavier-numia');
province('95','Waikato','https://www.allblacks.com/players/luke-jacobson');
province('108','Waikato','https://www.allblacks.com/players/quinn-tupaea');
province('221','Wellington','https://www.allblacks.com/players/billy-proctor');
province('213','Counties Manukau','https://www.allblacks.com/players/cameron-roigard');
province('226','Wellington','https://www.allblacks.com/players/ruben-love');
province('98','North Harbour','https://www.allblacks.com/players/wallace-sititi');
province('96','Waikato','https://www.allblacks.com/players/samipeni-finau');
province('109','Bay of Plenty','https://www.allblacks.com/players/emoni-narawa');
export const NZ_CONTRACT_CLUBS=new Set(['1','2','7','8','11','6']);
export const FRANCHISE_FALLBACK:Record<string,{name:string;union:string;region:Region}>={
 '1':{name:'Highlanders',union:'New Zealand',region:'SOUTH'},'2':{name:'Crusaders',union:'New Zealand',region:'SOUTH'},
 '7':{name:'Blues',union:'New Zealand',region:'NORTH'},'8':{name:'Chiefs',union:'New Zealand',region:'NORTH'},'11':{name:'Hurricanes',union:'New Zealand',region:'NORTH'},
 '3':{name:'Waratahs',union:'Australia',region:'UNKNOWN'},'4':{name:'Reds',union:'Australia',region:'UNKNOWN'},'9':{name:'Force',union:'Australia',region:'UNKNOWN'},'10':{name:'Brumbies',union:'Australia',region:'UNKNOWN'},
 '5':{name:'Drua',union:'Fiji',region:'UNKNOWN'},'6':{name:'Moana Pasifika',union:'Unverified',region:'NORTH'}
};
export const NON_NZ:Record<string,{union:string;source:string}>={
 '107':{union:'Australia',source:'https://chiefs.co.nz/player/lalakai-foketi-2/'},
};
