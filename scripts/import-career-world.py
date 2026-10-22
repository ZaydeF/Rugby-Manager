"""Reproducible, read-only import. Never use fantasy ratings to overwrite canonical ratings."""
import sqlite3,json,unicodedata,re,hashlib
from pathlib import Path
root=Path(__file__).resolve().parents[1];src=root/'data/packs/world/source-v075.sqlite'
c=sqlite3.connect(f'file:{src}?mode=ro',uri=True);c.row_factory=sqlite3.Row
rows=lambda t:[dict(r) for r in c.execute('SELECT * FROM '+t)]
indexed=lambda t:{r['player_id']:r for r in rows(t)}
base=rows('players');classes=indexed('classifications');attrs=indexed('player_attributes');pa=indexed('potential_profiles');sr=indexed('super_rugby_2026');members=rows('team_memberships');rep=rows('rep_pathway')
legacy=json.loads((root/'data/generated/universe.json').read_text());teams=[dict(t,competition='SR') for t in legacy['teams']]
npc=sorted({m['team_name'] for m in members if 'NPC' in m['competition_level'].upper()})
for i,n in enumerate(npc):teams.append(dict(id='npc-'+str(i+1),name=n,abbr=''.join(w[:3] for w in n.split())[:6].upper(),player_count=0,matches=10,average_rating=0,competition='NPC'))
tids={t['name']:t['id'] for t in teams};issues=[]
normalize=lambda s:re.sub('[^a-z0-9]+',' ',unicodedata.normalize('NFKD',s.lower()).encode('ascii','ignore').decode()).strip()
posmap={'back row':'loose_forward','loose forward':'loose_forward','outside back':'outside_back','centre':'center','midfield':'center','scrum half':'scrum_half','halfback':'scrum_half','fly half':'fly_half','first five':'fly_half'}
ratings={(r['player_id'],r['rating_type']):r['rating_value'] for r in rows('rating_overrides') if r['active']}
attrOverrides=[r for r in rows('attribute_overrides') if r['active']]
players=[];registrations=[]
for p in base:
 id=p['player_id'];cl=classes[id];a={k:v for k,v in attrs[id].items() if isinstance(v,(int,float)) and k!='player_id'}
 for r in attrOverrides:
  if r['player_id']==id:a[r['attribute_name']]=r['attribute_value']
 pos=(p['primary_position'] or sr.get(id,{}).get('position') or '').lower().replace('_',' ');pos=posmap.get(pos,pos)
 if pos not in ['prop','hooker','lock','loose_forward','scrum_half','fly_half','center','outside_back']:
  # An explicit unknown remains unavailable until corrected; never invent a real player's position.
  issues.append({'player':str(id),'name':p['full_name'],'issue':'Unverified playing position'});pos='unknown'
 ca=ratings.get((id,'CA'),cl['game_ca_prior']);profile=pa[id];centre=ratings.get((id,'PA'),profile['pa_center'])
 evidence=[r for r in rep if r['player_id']==id];tests=[r for r in evidence if r['evidence_class']=='TEST']
 nations={'All Blacks':'New Zealand','New Zealand':'New Zealand','Australia':'Australia','Fiji':'Fiji','Samoa':'Samoa','Tonga':'Tonga','USA':'USA'}
 nation=next((nations[r['rep_team']] for r in sorted(tests,key=lambda r:r.get('season') or 0,reverse=True) if r['rep_team'] in nations),None)
 if not nation and any('New Zealand' in r['rep_team'] or r['rep_team'].startswith(('NZ ','Māori All Blacks','Maori All Blacks','All Blacks XV')) for r in evidence):nation='New Zealand'
 candidate=[m for m in members if m['player_id']==id and m['team_name'] in tids and 'NPC' in m['competition_level'].upper()]
 candidate.sort(key=lambda m:(m['evidence_type']=='CURRENT_TEAM_PROFILE',m['season'] or 0),reverse=True)
 unique=list(dict.fromkeys(m['team_name'] for m in candidate));npcTeam=unique[0] if unique else None
 if len(unique)>1:
  issues.append({'player':str(id),'name':p['full_name'],'issue':'Conflicting NPC evidence','teams':unique,'provisional':npcTeam})
  if id==414:npcTeam=None # equally ranked conflicting evidence: no invented active registration
 srTeam=sr.get(id,{}).get('squad_name');srTeam=srTeam if srTeam in tids else None
 explicit=[m for m in members if m['player_id']==id and m['competition_level']=='SUPER_RUGBY' and m['team_name'] in tids]
 explicit.sort(key=lambda m:(m['evidence_type']=='USER_ROSTER_OVERRIDE',m['season'] or 0),reverse=True)
 if explicit:srTeam=explicit[0]['team_name']
 for comp,team,kind in [('SR',srTeam,'SUPER_RUGBY_CONTRACT'),('NPC',npcTeam,'NPC_AFFILIATION' if srTeam else 'NPC_CONTRACT')]:
  if team:registrations.append({'playerId':str(id),'teamId':tids[team],'competition':comp,'season':2026,'type':kind,'active':True,'priority':2 if comp=='SR' else 1})
 if not p['birth_date']:issues.append({'player':str(id),'name':p['full_name'],'issue':'Age only' if p['age'] else 'Age unknown'})
 players.append(dict(id=str(id),name=p['full_name'],position=pos,dob=p['birth_date'],age=p['age'],ageSource=p['dob_source'] or p['age_source'],ca=ca,paCentre=centre,paMin=min(profile['pa_min'],centre),paMax=max(profile['pa_max'],centre,ca),volatility=profile['potential_volatility'],boom=profile['boom_chance'],bust=profile['bust_chance'],rich=a,nation=nation,eligibilityEvidence=evidence,reputation=90 if tests else 45 if srTeam else 20,sourceOrigin=p['source_origin']))
for t in teams:
 ids={m['playerId'] for m in registrations if m['teamId']==t['id']};ps=[p for p in players if p['id'] in ids];t['player_count']=len(ps);t['average_rating']=round(sum(p['ca'] for p in ps)/max(1,len(ps)),1)
lookup={normalize(p['name']):p['id'] for p in players}
for a in rows('identity_aliases'):lookup[normalize(a['alias_name'])]=str(a['player_id'])
legacyMap={p['player_id']:lookup[normalize(p['name'])] for p in legacy['players'] if normalize(p['name']) in lookup}
out={'version':'world-v075','sourceSha256':hashlib.sha256(src.read_bytes()).hexdigest(),'players':players,'teams':teams,'memberships':registrations,'legacyIdMap':legacyMap}
(root/'data/packs/world/catalog.json').write_text(json.dumps(out,separators=(',',':')))
(root/'data/packs/world/import-audit.json').write_text(json.dumps({'players':len(players),'teams':len(teams),'memberships':len(registrations),'mappedLegacy':len(legacyMap),'issues':issues},indent=2))
assert len(players)==812 and len({p['id'] for p in players})==812
assert len(teams)==25,(len(teams),npc)
print('Imported',len(players),'canonical players;',len(registrations),'registrations;',len(issues),'data-quality notes')
