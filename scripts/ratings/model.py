"""Deterministic, descriptive 2026 ability model. No name-specific overrides."""
import math
from collections import defaultdict

def percentile(value, reference):
    if not reference:
        return 0.5
    return (sum(v < value for v in reference) + 0.5 * sum(v == value for v in reference)) / len(reference)

def reliability(minutes, config):
    return minutes / (minutes + config['shrinkage_minutes'])

def blend(observed, prior, minutes, config):
    r = reliability(minutes, config)
    return r * observed + (1-r) * prior

def rate_universe(players, histories, prices, team_games, config, reputation=None):
    groups = defaultdict(list)
    for p in players:
        groups[p['position']].append(p)
    price_groups = {pos:[prices.get(p['player_id']) for p in ps if prices.get(p['player_id']) is not None] for pos,ps in groups.items()}
    raw, totals, used = {}, {}, {}
    fields = ['MP','T','TA','C','CM','PG','PGM','YC','RC','TW','TC','I','O','LB','LC','MG','PC','DG','DGM','LT','LS','LE','TK','MT','E','TB','SW','K_50_22']
    for p in players:
        h = histories[p['player_id']]
        valid = [m for m in h if m['MP'] > 0]
        used[p['player_id']] = valid
        totals[p['player_id']] = {k:sum(m[k] for m in valid) for k in fields}
    pooled = {}
    for pos, ps in groups.items():
        tk=sum(totals[p['player_id']]['TK'] for p in ps); mt=sum(totals[p['player_id']]['MT'] for p in ps)
        pooled[pos] = tk/(tk+mt) if tk+mt else .85
    all_totals=list(totals.values())
    goals=sum(t['C']+t['PG'] for t in all_totals)
    attempts=goals+sum(t['CM']+t['PGM'] for t in all_totals)
    kick_prior=goals/attempts if attempts else .75
    for p in players:
        pid=p['player_id']; t=totals[pid]; m=t['MP']; n=len(used[pid]); pos=p['position']
        per=lambda k: t[k]*80/m if m else 0
        success=(t['TK']+config['tackle_prior_attempts']*pooled[pos])/(t['TK']+t['MT']+config['tackle_prior_attempts'])
        # Rates are bounded with within-position percentile ranking downstream.
        attack=.025*per('MG')+.8*per('TB')+1.5*per('LB')+1.4*per('TA')+.8*per('LC')+.3*per('O')+.6*per('T')
        if pos in ['scrum_half','fly_half']:
            attack=.02*per('MG')+.5*per('TB')+per('LB')+2.5*per('TA')+1.8*per('LC')+.3*per('O')+.4*per('T')
        defence=.45*per('TK')+2.2*per('TW')+1.2*per('I')+12*(success-pooled[pos])-.6*per('MT')
        work=.6*per('TK')+.02*per('MG')+.5*per('O')+.5*per('TW')
        set_piece=None
        if pos in ['prop','hooker','lock','loose_forward']:
            lw={'prop':.1,'hooker':.75,'lock':1,'loose_forward':.7}[pos]
            sw={'prop':1,'hooker':.25,'lock':.2,'loose_forward':.1}[pos]
            set_piece=lw*per('LT')+sw*per('SW')+2*per('LS')-1.5*per('LE')
        ga=t['C']+t['PG']+t['CM']+t['PGM']
        kicking=(t['C']+t['PG']+config['kicking_prior_attempts']*kick_prior)/(ga+config['kicking_prior_attempts']) if ga>=config['minimum_kicking_attempts'] else None
        discipline=-(per('PC')+.5*per('E')+2*per('YC')+5*per('RC'))
        games=team_games[p['squad_id']]
        engine=.65*(m/(80*games) if games else 0)+.35*(m/(80*n) if n else 0)
        impact=2*per('T')+1.7*per('TA')+1.4*per('TW')+per('LB')+per('I')+.5*per('LS')
        raw[pid]=dict(zip(config['attributes'],[attack,defence,work,set_piece,kicking,discipline,engine,impact]))
    refs={}
    for pos,ps in groups.items():
        for a in config['attributes']:
            pool=players if a=='kicking' else ps
            refs[(pos,a)]=[raw[p['player_id']][a] for p in pool if totals[p['player_id']]['MP']>=config['reference_minutes'] and raw[p['player_id']][a] is not None]
    reputation = reputation or {"players":[],"tiers":{}}
    rep_by_id={r["player_id"]:r for r in reputation["players"]}
    result=[]
    for p in players:
        pid=p['player_id'];pos=p['position'];t=totals[pid];m=t['MP'];h=histories[pid]
        pq=percentile(prices[pid],price_groups[pos]) if pid in prices else .5
        prior=config['prior_floor']+config['prior_span']*pq
        attrs={}; detail={}; w=config['weights'][pos]
        for i,a in enumerate(config['attributes']):
            v=raw[pid][a]
            if v is None:
                attrs[a]=None;detail[a]={'raw':None,'percentile':None,'weight':w[i]};continue
            q=percentile(v,refs[(pos,a)]) if m else .5
            observed=config['score_floor']+config['score_span']*q
            val=blend(observed,prior,m,config)
            attrs[a]=round(val)
            detail[a]={'raw':round(v,6),'percentile':round(q*100,1) if m else None,'weight':w[i],'unrounded':round(val,6)}
        denom=sum(w[i] for i,a in enumerate(config['attributes']) if attrs[a] is not None)
        ca=sum(w[i]*detail[a]['unrounded'] for i,a in enumerate(config['attributes']) if attrs[a] is not None)/denom
        statistical_ca = ca
        game_ca = max(45,min(97,config['display_anchor'] + config['display_slope']*(ca-config['display_centre'])))
        rep = rep_by_id.get(pid)
        established = None
        if rep:
            assert rep['name']==p['name'], 'Reputation ID/name mismatch'
            established = reputation['tiers'][rep['tier']] - reputation['older_award_discount_per_year']*(reputation['reference_year']-rep['year'])
            evidence = m/(m+config['reputation_minutes'])
            change=max(-config['reputation_max_season_change'],min(config['reputation_max_season_change'],evidence*(game_ca-established)))
            game_ca=established+change
        # Shift the observed attribute shape onto the CA scale; do not create missing skills.
        for a in config['attributes']:
            if attrs[a] is not None:
                detail[a]['statistical_unrounded']=detail[a]['unrounded']
                detail[a]['unrounded']=max(35,min(99,game_ca+config['display_slope']*(detail[a]['unrounded']-statistical_ca)))
        for _ in range(12):
            actual=sum(w[i]*detail[a]['unrounded'] for i,a in enumerate(config['attributes']) if attrs[a] is not None)/denom
            delta=game_ca-actual
            if abs(delta)<.00001:break
            for a in config['attributes']:
                if attrs[a] is not None:detail[a]['unrounded']=max(35,min(99,detail[a]['unrounded']+delta))
        for a in config['attributes']:
            if attrs[a] is not None:
                attrs[a]=round(detail[a]['unrounded']);detail[a]['unrounded']=round(detail[a]['unrounded'],6)
        ca=sum(w[i]*detail[a]['unrounded'] for i,a in enumerate(config['attributes']) if attrs[a] is not None)/denom
        flags=[]
        if rep:flags.append(f"Established-ability prior: {rep['year']} World Rugby {rep['tier'].replace('_',' ')}. The numeric prior is a game-design estimate.")
        if not m:flags.append('No playing-time evidence; prior only')
        elif m<240:flags.append('Small sample: fewer than 240 minutes')
        if any(x['MP']==0 for x in h):flags.append('Zero-minute source rows excluded from rate calculations')
        if pos in ['prop','hooker','lock','loose_forward']:flags.append('Set piece uses involvement proxies')
        if raw[pid]['kicking'] is None:flags.append('Goal kicking unassessed: fewer than 5 attempts')
        confidence='High' if m>=640 else 'Medium' if m>=240 else 'Low'
        recent=sorted(h,key=lambda x:(x['round_number'],x['match_id']))[-5:]
        result.append({**p,'statistical_ability':round(statistical_ca,2),'established_prior':established,'reputation':rep,'overall':round(ca),'overall_unrounded':round(ca,6),'attributes':attrs,'rating_detail':detail,'minutes':m,'played_appearances':len(used[pid]),'source_appearances':len(h),'confidence':confidence,'evidence_weight':round(reliability(m,config)*100,1),'prior_rating':round(prior,2),'opening_price':prices.get(pid),'totals':t,'recent':recent,'history':sorted(h,key=lambda x:x['round_number']),'flags':flags,'age':None,'date_of_birth':None,'nationality':None,'all_blacks_eligible':None,'north_south_region':'UNKNOWN','potential':None,'fitness':None,'morale':None,'contract':None,'form':None})
    return result
