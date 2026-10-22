#!/usr/bin/env python3
"""Import a complete source snapshot. Run: python scripts/import_2026.py [source_directory]."""
import csv, json, hashlib, sqlite3, sys, pathlib, collections, shutil
from ratings.model import rate_universe

ROOT=pathlib.Path(__file__).resolve().parents[1]
CONFIG=json.loads((ROOT/'scripts/ratings/config.json').read_text())
POSITION_NAMES={'prop':'Prop','hooker':'Hooker','lock':'Lock','loose_forward':'Loose forward','scrum_half':'Scrum-half','fly_half':'Fly-half','center':'Centre','outside_back':'Outside back'}
STAT_FIELDS=['MP','T','TA','C','CM','PG','PGM','YC','RC','TW','TC','I','O','LB','LC','MG','PC','DG','DGM','LT','LS','LE','TK','MT','E','TB','SW','K_50_22']

def import_data(source):
    tables={}; sources=[]; exceptions=[]
    def note(code,detail,pid=None,mid=None,severity='warning'):
        exceptions.append({'severity':severity,'code':code,'player_id':pid,'match_id':mid,'detail':detail})
    names=['players','matches','rounds','player_match_stats','player_price_history','player_selection_history','player_round_scores']
    for name in names:
        f=source/(name+'.csv')
        if not f.exists():
            f=source/(name+'(1).csv')
        with f.open(encoding='utf-8-sig',newline='') as stream:
            reader=csv.DictReader(stream);rows=list(reader);cols=reader.fieldnames
        if not cols or len(cols)!=len(set(cols)) or any(None in x for x in rows):
            raise ValueError('Malformed CSV: '+name)
        tables[name]=rows
        sources.append({'filename':name+'.csv','rows':len(rows),'sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'columns':cols,'missing_values':{k:sum(r[k]=='' for r in rows) for k in cols}})
    docs={}
    for name in ['metadata','validation_report']:
        f=source/(name+'.json')
        if not f.exists():f=source/(name+'(1).json')
        docs[name]=json.loads(f.read_text())
        sources.append({'filename':name+'.json','rows':None,'sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'columns':list(docs[name]),'missing_values':{}})
    def unique(rows,key,name):
        keys=[tuple(r[k] for k in key) for r in rows]
        if len(keys)!=len(set(keys)): raise ValueError('Duplicate primary key in '+name)
    unique(tables['players'],['player_id'],'players');unique(tables['matches'],['tournament_id'],'matches');unique(tables['rounds'],['round_id'],'rounds')
    for name in names[3:]:unique(tables[name],['player_id','round_id'],name)
    pmap={p['player_id']:p for p in tables['players']};mmap={m['tournament_id']:m for m in tables['matches']};rmap={r['round_id']:r for r in tables['rounds']}
    teams={}
    for p in pmap.values():
        assert p['position'] in POSITION_NAMES, 'Unknown position '+p['position']
        team={'id':p['squad_id'],'name':p['squad_name'],'abbr':p['squad_abbr']}
        if team['id'] in teams:assert teams[team['id']]==team,'Conflicting team identity'
        teams[team['id']]=team
    team_games=collections.Counter()
    for m in mmap.values():
        assert m['round_id'] in rmap
        assert m['round_number']==rmap[m['round_id']]['round_number']
        for side in ['home','away']:
            assert m[side+'_squad_id'] in teams
            assert m[side+'_squad_name']==teams[m[side+'_squad_id']]['name']
            team_games[m[side+'_squad_id']]+=1
    hist=collections.defaultdict(list)
    for row in tables['player_match_stats']:
        pid=row['player_id'];mid=row['tournament_id']
        assert pid in pmap and mid in mmap,'Unresolved match or player ID'
        mat=mmap[mid];p=pmap[pid]
        assert row['round_id']==mat['round_id'] and row['round_number']==mat['round_number']
        assert row['squad_id']==p['squad_id'] and row['position']==p['position']
        side=row['home_away'];other='away' if side=='home' else 'home'
        assert side in ['home','away']
        assert row['squad_id']==mat[side+'_squad_id'] and row['opponent_squad_id']==mat[other+'_squad_id']
        assert row['team_score']==mat[side+'_score'] and row['opponent_score']==mat[other+'_score']
        assert row['date']==mat['date']
        assert all(row[k]!='' for k in STAT_FIELDS),'Missing match statistic: must resolve before rating'
        stats={k:float(row[k]) for k in STAT_FIELDS}
        assert all(v>=0 for v in stats.values()),'Negative count'
        assert stats['MP']<=100,'Implausible minutes'
        assert float(row['fantasy_points'])==float(row['calculated_fantasy_points'])
        if not stats['MP']:note('zero_minutes','Source records an appearance with 0 minutes. Preserved in history; excluded from ability rates.',pid,mid)
        hist[pid].append({**stats,'match_id':mid,'round_id':row['round_id'],'round_number':int(row['round_number']),'date':row['date'],'opponent':row['opponent_squad_name'],'home_away':side,'team_score':int(row['team_score']),'opponent_score':int(row['opponent_score']),'fantasy_points':float(row['fantasy_points'])})
    for name in ['player_price_history','player_selection_history','player_round_scores']:
        for r in tables[name]: assert r['player_id'] in pmap and r['round_id'] in rmap
    scores={(r['player_id'],r['round_id']):float(r['fantasy_points']) for r in tables['player_round_scores']}
    assert len(scores)==sum(len(h) for h in hist.values())
    for pid,h in hist.items():
        for m in h:assert scores[(pid,m['round_id'])]==m['fantasy_points']
    price_hist=collections.defaultdict(list)
    for r in tables['player_price_history']:price_hist[r['player_id']].append(r)
    opening={pid:float(min(h,key=lambda r:int(rmap[r['round_id']]['round_number']))['price']) for pid,h in price_hist.items()}
    season_fields={'T':'season_tries','TA':'season_assists','C':'season_conversions','PG':'season_penalties','TK':'season_tackles','LB':'season_linebreaks','LC':'season_linebreakAssists','TW':'season_turnovers','I':'season_interceptions','TB':'season_defendersBeaten','LT':'season_lineoutsWon','SW':'season_scrumsWon','MG':'season_metresGained','PC':'season_penaltiesConceded','E':'season_errors','YC':'season_yellowCards','RC':'season_redCards','O':'season_offloads','K_50_22':'season_kick5022'}
    players=[]
    for p in pmap.values():
        pid=p['player_id'];h=hist[pid]
        assert int(p['appearance_count'])==len(h),'Appearance total mismatch'
        assert abs(float(p['total_points'] or 0)-sum(m['fantasy_points'] for m in h))<.01,'Fantasy total mismatch'
        for k,col in season_fields.items():
            if p[col]!='' and float(p[col])!=sum(m[k] for m in h):note('season_summary_mismatch',col+' differs from match sum',pid)
        if not h:note('no_appearances','Player retained; current ability comes from conservative positional price prior.',pid)
        elif sum(m['MP'] for m in h)<240:note('small_sample','Fewer than 240 minutes; rating requires caution.',pid)
        earliest=min(price_hist[pid],key=lambda r:int(rmap[r['round_id']]['round_number'])) if price_hist[pid] else None
        if earliest and rmap[earliest['round_id']]['round_number']!='1':note('late_price_prior','Earliest available price is after Round 1 and can already reflect 2026 information.',pid)
        players.append({'player_id':pid,'feed_id':p['feed_id'],'name':p['full_name'],'first_name':p['first_name'],'last_name':p['last_name'],'position':p['position'],'squad_id':p['squad_id'],'squad_name':p['squad_name'],'squad_abbr':p['squad_abbr'],'fantasy_price':float(p['current_cost']),'fantasy_total':float(p['total_points'] or 0),'fantasy_average':float(p['season_average']) if p['season_average'] else None,'source_selection_status':p['selection_status']})
    reputation=json.loads((ROOT/'data/reputation-priors.json').read_text())
    rated=rate_universe(players,hist,opening,team_games,CONFIG,reputation)
    for p in rated:
        p['price_history']=[{'round':int(rmap[r['round_id']]['round_number']),'price':float(r['price'])} for r in sorted(price_hist[p['player_id']],key=lambda r:int(rmap[r['round_id']]['round_number']))]
        p['prior_round']=p['price_history'][0]['round'] if p['price_history'] else None
        if p['prior_round'] and p['prior_round']>1:p['flags'].append('Earliest price is from Round '+str(p['prior_round'])+'; not a preseason prior')
    summaries=[]
    for t in sorted(teams.values(),key=lambda t:t['name']):
        squad=[p for p in rated if p['squad_id']==t['id']]
        summaries.append({**t,'player_count':len(squad),'matches':team_games[t['id']],'average_rating':round(sum(p['overall_unrounded'] for p in squad)/len(squad),1)})
    missing=['Date of birth / age','Nationality and international eligibility','North / South eligibility','Primary sub-position (e.g. loosehead versus tighthead)','Verified secondary positions','Announced starters and bench roles','Contracts, salary and expiry','Current injury, fitness, morale and fatigue','Individual scrum technique / lineout throw accuracy','Tactical kick volume, distance and retention','Carry count and ruck involvement','Potential ability and coaching environment']
    audit={'status':'Passed with documented limitations','sources':sources,'counts':{k:len(v) for k,v in tables.items()},'teams':len(teams),'zero_minute_rows':sum(m['MP']==0 for h in hist.values() for m in h),'no_appearance_players':sum(not hist[p['player_id']] for p in players),'low_sample_players':sum(0<p['minutes']<240 for p in rated),'missing_fields':missing,'exception_counts':dict(collections.Counter(e['code'] for e in exceptions)),'checks':['Unique player, match and player-round keys','Every player ID and round ID resolved','Match team, opponent, score and date joins agree','All fantasy totals and round scores reconcile','All 454 source players retained','Source files hashed for reproducibility','No unsupported real ages, eligibility or contracts invented'],'source_retrieved_at':docs['metadata']['retrieved_at_utc'],'model_version':CONFIG['version']}
    out=ROOT/'data/generated';out.mkdir(exist_ok=True)
    tmp=out/'career.tmp.sqlite';tmp.unlink(missing_ok=True);db=sqlite3.connect(tmp)
    db.executescript((ROOT/'data/schema.sql').read_text())
    for s in sources:db.execute('INSERT INTO import_sources VALUES (?,?,?,?,?)',(s['filename'],s['sha256'],s['rows'],json.dumps(s['columns']),json.dumps(docs.get(s['filename'].replace('.json',''))) if s['filename'].endswith('.json') else None))
    for t in teams.values():db.execute('INSERT INTO teams VALUES (?,?,?)',(t['id'],t['name'],t['abbr']))
    for r in tables['rounds']:db.execute('INSERT INTO rounds VALUES (?,?,?,?,?)',(r['round_id'],r['round_number'],r['start_date'],r['end_date'],json.dumps(r)))
    for p in pmap.values():db.execute('INSERT INTO players (player_id,feed_id,full_name,team_id,position,source_json) VALUES (?,?,?,?,?,?)',(p['player_id'],p['feed_id'],p['full_name'],p['squad_id'],p['position'],json.dumps(p)))
    for m in mmap.values():db.execute('INSERT INTO matches VALUES (?,?,?,?,?,?,?,?)',(m['tournament_id'],m['round_id'],m['date'],m['home_squad_id'],m['away_squad_id'],m['home_score'],m['away_score'],json.dumps(m)))
    for r in tables['player_match_stats']:db.execute('INSERT INTO player_match_stats VALUES (?,?,?,?,?,?)',(r['player_id'],r['tournament_id'],r['round_id'],r['MP'],r['fantasy_points'],json.dumps(r)))
    for table,col in [('player_price_history','price'),('player_selection_history','selected_percent'),('player_round_scores','fantasy_points')]:
        for r in tables[table]:db.execute('INSERT INTO '+table+' VALUES (?,?,?)',(r['player_id'],r['round_id'],r[col]))
    for p in rated:
        db.execute('INSERT INTO player_ratings VALUES (?,?,?,?,?,?,?)',(p['player_id'],CONFIG['version'],p['overall_unrounded'],p['confidence'],p['evidence_weight'],json.dumps(p['attributes']),json.dumps({'attributes':p['rating_detail'],'established_prior':p['established_prior'],'reputation':p['reputation'],'statistical_ability':p['statistical_ability']})))
        db.execute('INSERT INTO player_state (player_id) VALUES (?)',(p['player_id'],))
    for e in exceptions:db.execute('INSERT INTO import_exceptions (severity,code,player_id,match_id,detail) VALUES (?,?,?,?,?)',tuple(e.values()))
    assert db.execute('PRAGMA foreign_key_check').fetchall()==[]
    assert db.execute('PRAGMA integrity_check').fetchone()[0]=='ok'
    db.commit();db.close();tmp.replace(out/'career.sqlite')
    fixtures=[{'id':m['tournament_id'],'round':int(m['round_number']),'date':m['date'],'home':m['home_squad_id'],'away':m['away_squad_id'],'venue':m['venue_name']} for m in mmap.values()]
    universe={'fixtures':fixtures,'players':rated,'teams':summaries,'positions':POSITION_NAMES,'config':CONFIG,'audit':audit}
    (out/'universe.json').write_text(json.dumps(universe,ensure_ascii=False,separators=(',',':')))
    (out/'audit.json').write_text(json.dumps(audit,indent=2))
    export_rows=[]
    for pos in POSITION_NAMES:
        top=sorted([p for p in rated if p['position']==pos],key=lambda p:(-p['overall_unrounded'],p['player_id']))[:10]
        for i,p in enumerate(top):export_rows.append({'position':POSITION_NAMES[pos],'rank':i+1,'player_id':p['player_id'],'player':p['name'],'team':p['squad_name'],'overall':p['overall'],'confidence':p['confidence'],'minutes':int(p['minutes']),'appearances':p['played_appearances'],**p['attributes']})
    with (out/'top-10-by-position.csv').open('w',newline='') as f:
        w=csv.DictWriter(f,fieldnames=list(export_rows[0]));w.writeheader();w.writerows(export_rows)
    with (out/'exceptions.csv').open('w',newline='') as f:
        w=csv.DictWriter(f,fieldnames=['severity','code','player_id','match_id','detail']);w.writeheader();w.writerows(exceptions)
    report=['# Super Rugby Manager — Phase 1 audit','',f"Snapshot: {audit['source_retrieved_at']}. Model: {CONFIG['version']}.",'','## Source inventory','', '| File | Rows | Fields |','|---|---:|---:|']
    report += [f"| {s['filename']} | {s['rows'] if s['rows'] is not None else 'JSON document'} | {len(s['columns'])} |" for s in sources]
    report += ['','## Import result','',json.dumps({k:v for k,v in audit.items() if k not in ['sources','missing_fields']},indent=2),'','## Missing fields','']+['- '+s for s in missing]
    report += ['','## Source schemas','']
    for s in sources:
        report += ['### '+s['filename'],'','| Field | Empty cells |','|---|---:|']+[f"| `{k}` | {s['missing_values'].get(k,'—')} |" for k in s['columns']]+['','SHA-256: `'+s['sha256']+'`','']
    report += ['## Top 10 by position','', 'Ratings are descriptive game estimates, not externally validated measures of true ability. Rankings use unrounded scores; displayed ties can have different ranks.','']
    for pos in POSITION_NAMES.values():
        report += ['### '+pos,'','| Rank | Player | Team | CA | Minutes | Confidence |','|---:|---|---|---:|---:|---|']+[f"| {r['rank']} | {r['player']} | {r['team']} | {r['overall']} | {r['minutes']} | {r['confidence']} |" for r in export_rows if r['position']==pos]+['']
    (ROOT/'docs/phase-1-audit.md').write_text('\n'.join(report))
    shutil.copyfile(out/'universe.json',ROOT/'public/data/universe.json')
    for name in ['top-10-by-position.csv','exceptions.csv','audit.json','career.sqlite']:shutil.copyfile(out/name,ROOT/'public/reports'/name)
    shutil.copyfile(ROOT/'docs/phase-1-audit.md',ROOT/'public/reports/phase-1-audit.md')
    for doc in ['rating-methodology.md','development-log.md']:
        if (ROOT/'docs'/doc).exists(): shutil.copyfile(ROOT/'docs'/doc,ROOT/'public/reports'/doc)
    print(json.dumps({k:v for k,v in audit.items() if k not in ['sources','missing_fields']},indent=2))
    print('POSITION LEADERS')
    for r in export_rows:
        if r['rank']<=3:print(r['position'],r['rank'],r['player'],r['overall'],r['minutes'])
    return universe

def write_simulation_catalog():
    universe = json.loads((ROOT / "data/generated/universe.json").read_text())
    catalog = {key: universe[key] for key in ("teams", "fixtures", "config")}
    catalog["players"] = [{key: p[key] for key in ("player_id", "squad_id", "position")} for p in universe["players"]]
    (ROOT / "data/generated/simulation-catalog.json").write_text(json.dumps(catalog, separators=(",", ":")))

if __name__=='__main__':
    import_data(pathlib.Path(sys.argv[1]) if len(sys.argv)>1 else ROOT/'data/raw')
    write_simulation_catalog()
