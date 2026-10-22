import unittest,json,pathlib,sys,sqlite3,csv,tempfile,shutil,hashlib,contextlib,io
ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from ratings.model import percentile,reliability,blend
from import_2026 import import_data

class Foundations(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.u=json.loads((ROOT/'data/generated/universe.json').read_text())
        cls.config=json.loads((ROOT/'scripts/ratings/config.json').read_text())
    def test_all_players_and_source_identity_retained(self):
        raw=list(csv.DictReader(io.StringIO((ROOT/'data/raw/players.csv').read_text())))
        self.assertEqual(len(self.u['players']),454)
        self.assertEqual({p['player_id'] for p in self.u['players']},{p['player_id'] for p in raw})
        self.assertEqual(len(self.u['teams']),11)
        for p in self.u['players']:
            original=next(r for r in raw if r['player_id']==p['player_id'])
            self.assertEqual(p['name'],original['full_name']);self.assertEqual(p['squad_id'],original['squad_id'])
    def test_nullable_facts_not_fabricated(self):
        for p in self.u['players']:
            for key in ['age','potential','all_blacks_eligible','contract','fitness','morale','nationality']:
                self.assertIsNone(p[key])
            self.assertEqual(p['north_south_region'],'UNKNOWN')
    def test_zero_sample_and_nonapplicable_attributes(self):
        for p in self.u['players']:
            if not p['minutes']:
                self.assertLessEqual(p['overall'],89 if p.get('reputation') else 76);self.assertGreaterEqual(p['overall'],55)
                self.assertEqual(p['evidence_weight'],0)
            if p['position'] in ['scrum_half','fly_half','center','outside_back']:
                self.assertIsNone(p['attributes']['set_piece'])
            self.assertTrue(1<=p['overall']<=100)
    def test_low_sample_cannot_override_prior_with_extreme_rate(self):
        self.assertLess(blend(96,67,20,self.config),69)
        self.assertGreater(blend(96,67,800,self.config),blend(96,67,160,self.config))
        self.assertEqual(reliability(0,self.config),0)
        self.assertEqual(reliability(320,self.config),.5)
    def test_rank_ties_and_monotonicity(self):
        self.assertEqual(percentile(3,[3,3,3]),.5)
        self.assertLess(percentile(1,[1,2,3]),percentile(3,[1,2,3]))
    def test_database_integrity_and_full_source_tables(self):
        db=sqlite3.connect(ROOT/'data/generated/career.sqlite')
        self.assertEqual(db.execute('PRAGMA integrity_check').fetchone()[0],'ok')
        self.assertEqual(db.execute('PRAGMA foreign_key_check').fetchall(),[])
        for table,count in self.u['audit']['counts'].items():
            self.assertEqual(db.execute('SELECT COUNT(*) FROM '+table).fetchone()[0],count)
        self.assertEqual(db.execute('SELECT COUNT(*) FROM player_state').fetchone()[0],454)
        db.close()
    def test_80_exported_leaders_correctly_ordered(self):
        rows=list(csv.DictReader(io.StringIO((ROOT/'data/generated/top-10-by-position.csv').read_text())))
        self.assertEqual(len(rows),80)
        for pos,label in self.u['positions'].items():
            expected=sorted([p for p in self.u['players'] if p['position']==pos],key=lambda p:(-p['overall_unrounded'],p['player_id']))[:10]
            actual=[r['player_id'] for r in rows if r['position']==label]
            self.assertEqual(actual,[p['player_id'] for p in expected])
    def test_repeated_import_is_byte_deterministic(self):
        targets=['universe.json','career.sqlite','top-10-by-position.csv','audit.json']
        before={p:hashlib.sha256((ROOT/'data/generated'/p).read_bytes()).hexdigest() for p in targets}
        with contextlib.redirect_stdout(io.StringIO()):import_data(ROOT/'data/raw')
        after={p:hashlib.sha256((ROOT/'data/generated'/p).read_bytes()).hexdigest() for p in targets}
        self.assertEqual(before,after)
    def test_duplicate_import_is_rejected_before_database_write(self):
        original=(ROOT/'data/generated/career.sqlite').read_bytes()
        with tempfile.TemporaryDirectory() as tmp:
            source=pathlib.Path(tmp)
            for p in (ROOT/'data/raw').iterdir():shutil.copy(p,source/p.name)
            p=source/'players.csv'
            with p.open('a') as f:f.write(p.read_text().splitlines()[1]+'\n')
            with self.assertRaisesRegex(ValueError,'Duplicate primary key'):import_data(source)
        self.assertEqual(original,(ROOT/'data/generated/career.sqlite').read_bytes())

if __name__=='__main__':unittest.main(verbosity=2)
