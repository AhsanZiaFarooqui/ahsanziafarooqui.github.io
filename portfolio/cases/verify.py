"""Reproduce calculations for fictional research-evaluation case studies. Standard library only."""
import csv
from pathlib import Path
from collections import Counter
root=Path(__file__).resolve().parent/'assets'
def rows(name):
    with (root/name).open(newline='',encoding='utf8') as f:return list(csv.DictReader(f))
def panel_checks(data):
    keys=Counter((x['circle'],x['year']) for x in data)
    dups=[key for key,n in keys.items() if n>1]
    blanks=[x for x in data if not x['tax_collection_m_pkrs'].strip()]
    return dups,blanks
def mean(data,t,y):
    a=[float(x['tax_collection_m_pkrs']) for x in data if int(x['treated'])==t and int(x['year'])==y]
    assert len(a)==10
    return sum(a)/len(a)
def run():
    clean=rows('circle_panel.csv');dirty=rows('circle_panel_dirty.csv')
    assert len(clean)==40 and panel_checks(clean)==([],[])
    assert set(panel_checks(dirty)[0])=={('T03','2024'),('C04','2024')}
    assert len(panel_checks(dirty)[1])==1
    t0,t1,c0,c1=mean(clean,1,2023),mean(clean,1,2024),mean(clean,0,2023),mean(clean,0,2024)
    assert (t0,t1,c0,c1)==(80,110,75,90)
    assert t1-c1==20 and (t1-t0)-(c1-c0)==15
    survey=rows('survey_revised.csv');rules={x['question_id']:x['asked_if'] for x in survey}
    assert len(survey)==9 and rules['Q5']=='Q4=Yes' and rules['Q7']=='S1=No'
    assert all(x['asked_if']=='Everyone' for x in rows('survey_draft.csv'))
    assert 96/150==.64 and abs(96/180-8/15)<1e-12
    assert abs((1.5+2.2+1.8+.9)-6.4)<1e-12
    assert 2500-20*4*20==900 and 27*5*25*.85==2868.75
    print('Case-study checks passed: survey, panel, budget, capacity.')
if __name__=='__main__':run()
