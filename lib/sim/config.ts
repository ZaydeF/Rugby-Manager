export {ENGINE_VERSION,CONFIG} from '../../data/packs/super-rugby/simulation.ts';
export const DEFAULT_TACTICS={tempo:1,width:1,risk:1,territory:1,phaseStyle:1,offloads:1,lineSpeed:1,breakdown:1,defensiveWidth:1};
export const TACTIC_OPTIONS={
 tempo:['Slow','Balanced','Fast'],width:['Narrow','Balanced','Wide'],risk:['Conservative','Balanced','Aggressive'],
 territory:['Keep ball','Balanced','Kick for territory'],phaseStyle:['Forwards','Balanced','Backline'],offloads:['Low','Normal','High'],
 lineSpeed:['Conservative','Balanced','Aggressive'],breakdown:['Low','Balanced','High'],defensiveWidth:['Narrow','Balanced','Wide'],
};
export const SLOTS=[
 ['Loosehead','prop'],['Hooker','hooker'],['Tighthead','prop'],['Lock','lock'],['Lock','lock'],['Blindside','loose_forward'],['Openside','loose_forward'],['Number eight','loose_forward'],['Scrum-half','scrum_half'],['Fly-half','fly_half'],['Left wing','outside_back'],['Inside centre','center'],['Outside centre','center'],['Right wing','outside_back'],['Fullback','outside_back'],
 ['Hooker cover','hooker'],['Prop cover','prop'],['Prop cover','prop'],['Lock / back-row cover','lock|loose_forward'],['Back-row / lock cover','loose_forward|lock'],['Scrum-half cover','scrum_half'],['Fly-half cover','fly_half'],['Outside cover','outside_back|center'],
] as const;
export const FORWARDS=['prop','hooker','lock','loose_forward'];
