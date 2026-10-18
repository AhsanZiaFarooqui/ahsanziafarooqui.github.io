"""Recompute synthetic case evidence from CSV fixtures; Python 3.10+, stdlib only.

Reference data are supplied ground truth for this exercise, not recovered from the
corrupt export. This script never deduplicates conflicts or imputes missing data.
"""
import csv
from collections import Counter, defaultdict
from datetime import date
from decimal import Decimal
from pathlib import Path

ROOT = Path(__file__).resolve().parent / 'assets'


def require(condition, message):
    # Explicit checks remain active under python -O.
    if not condition:
        raise ValueError(message)


def rows(name):
    with (ROOT / name).open(newline='', encoding='utf-8-sig') as stream:
        reader = csv.DictReader(stream)
        data = list(reader)
    require(data and all(None not in row and None not in row.values() for row in data),
            f'{name}: empty or malformed CSV')
    return data


def number(value):
    result = Decimal(value)
    require(result.is_finite(), f'Nonfinite value: {value}')
    return result


def panel_checks(data):
    keys = Counter((row['circle'], row['year']) for row in data)
    return ([key for key, count in keys.items() if count > 1],
            [row for row in data if not row['tax_collection_m_pkrs'].strip()])


def validate_reference(data):
    require(len(data) == 40 and panel_checks(data) == ([], []),
            'Reference panel must have 40 unique, complete circle-years')
    circles = defaultdict(list)
    for row in data:
        require(row['treated'] in ('0', '1'), 'Treatment must be binary')
        require(row['year'] in ('2023', '2024'), 'Unexpected panel year')
        require(number(row['tax_collection_m_pkrs']) >= 0, 'Negative collections')
        circles[row['circle']].append(row)
    require(len(circles) == 20, 'Expected 20 assignment units')
    for records in circles.values():
        require({row['year'] for row in records} == {'2023', '2024'}, 'Unbalanced circle')
        require(len({row['treated'] for row in records}) == 1, 'Treatment changes within circle')
    require(Counter(records[0]['treated'] for records in circles.values()) == {'0': 10, '1': 10},
            'Expected ten circles in each group')


def mean(data, treated, year):
    values = [number(row['tax_collection_m_pkrs']) for row in data
              if row['treated'] == str(treated) and row['year'] == str(year)]
    require(len(values) == 10, 'Expected ten circles per group-year')
    return sum(values) / len(values)


def route(instrument, answers):
    """Trace supplied answers; only answers to already-asked items affect routing."""
    visited, known = [], {}
    for item in instrument:
        rule = item['asked_if']
        def matches(clause):
            operator = '!=' if '!=' in clause else '='
            key, value = clause.split(operator)
            return key in known and ((known[key] != value) if operator == '!=' else (known[key] == value))
        if rule == 'Everyone' or all(matches(clause) for clause in rule.split(' AND ')):
            key = item['question_id']
            visited.append(key)
            if key in answers:
                known[key] = answers[key]
    return visited


def run():
    clean, dirty = rows('circle_panel.csv'), rows('circle_panel_dirty.csv')
    validate_reference(clean)
    require(len(dirty) == 42, 'Dirty fixture should have 42 rows')
    duplicates, blanks = panel_checks(dirty)
    require(set(duplicates) == {('T03', '2024'), ('C04', '2024')} and len(blanks) == 1,
            'Unexpected corrupt-panel diagnostics')
    fields = ('circle', 'treated', 'year', 'tax_collection_m_pkrs')
    bag = lambda data: Counter(tuple(row[key] for key in fields) for row in data)
    additions = Counter({('T03', '1', '2024', '999'): 1, ('C04', '0', '2024', ''): 1})
    require(bag(dirty) == bag(clean) + additions, 'Dirty/reference provenance mismatch')
    t0, t1, c0, c1 = (mean(clean, t, y) for t, y in [(1, 2023), (1, 2024), (0, 2023), (0, 2024)])
    did = (t1 - t0) - (c1 - c0)
    require((t0, t1, c0, c1, t1-c1, did) == (80, 110, 75, 90, 20, 15), 'Panel claim mismatch')
    print(f'Panel: 20 circles, 40 reference rows; 42 dirty rows; duplicate keys {duplicates}; 1 blank')
    print(f'Means (million nominal PKR per circle): treated {t0} -> {t1}; comparison {c0} -> {c1}')
    print(f'Post contrast: {t1-c1}; descriptive DiD: {did}; aggregate change contrast: {did*10}')

    survey = rows('survey_revised.csv')
    require(len(survey) == 9 and len({row['question_id'] for row in survey}) == 9, 'Nine unique survey items required')
    for status in ('No', 'Prefer not to say'):
        require(route(survey, {'S0': status}) == ['S0'], 'Eligibility routing failed')
    for status in ('Do not remember', 'Prefer not to say'):
        require(route(survey, {'S0': 'Yes', 'S1': status}) == ['S0', 'S1'], 'Unknown use treated as nonuse')
    require(route(survey, {'S0': 'Yes', 'S1': 'No'}) == ['S0', 'S1', 'Q7'], 'Nonuser routing failed')
    require(route(survey, {'S0': 'Yes', 'S1': 'Yes', 'Q1': 'Cannot recall'}) == ['S0', 'S1', 'Q1'], 'Unknown service routing failed')
    for complaint in ('Yes', 'No', 'Do not remember'):
        path = route(survey, {'S0': 'Yes', 'S1': 'Yes', 'Q1': 'Bills', 'Q4': complaint})
        require(('Q5' in path) == (complaint == 'Yes') and 'Q7' not in path, 'Complaint gate failed')
    require(all(row['asked_if'] == 'Everyone' for row in rows('survey_draft.csv')), 'Original draft fixture changed')
    dispositions = rows('survey_dispositions.csv')
    require(len({r['disposition'] for r in dispositions}) == len(dispositions), 'Duplicate disposition')
    counts = {r['disposition']: int(r['count']) for r in dispositions}
    require(all(n >= 0 for n in counts.values()), 'Negative contact count')
    require(counts == {'eligible_complete': 96, 'eligible_not_complete': 54, 'ineligible': 20, 'eligibility_unknown': 30}, 'Disposition claim mismatch')
    known = counts['eligible_complete'] + counts['eligible_not_complete']
    conservative = known + counts['eligibility_unknown']
    print(f'Contacts: {sum(counts.values())}; known eligible {known}; unknown 30; ineligible 20')
    print(f'Completion proportions: 96/{known} = {96/known:.1%}; 96/{conservative} = {96/conservative:.1%} (not standardized response rates)')

    budget = sum(number(r['amount_m_pkrs']) for r in rows('project_budget.csv'))
    gap = budget - Decimal('5.8')  # funding ceiling from the fictional brief
    capacities = {r['scenario']: number(r['enumerators']) * number(r['completions_per_day']) * number(r['days']) * number(r['availability_factor']) for r in rows('project_capacity.csv')}
    require(budget == Decimal('6.4') and gap == Decimal('0.6'), 'Budget claim mismatch')
    require(capacities == {'draft': Decimal('1600'), 'illustrative_alternative': Decimal('2868.75')}, 'Capacity claim mismatch')
    schedule = {r['milestone']: date.fromisoformat(r['date']) for r in rows('project_schedule.csv')}
    require(schedule['pilot'] < schedule['contract'] and schedule['pilot'] < schedule['frame_delivery'], 'Date reversals missing')
    print(f'Budget: PKR {budget}m; ceiling 5.8m; gap {gap}m ({gap/Decimal("5.8"):.2%})')
    print(f'Capacity: {capacities["draft"]}; shortfall {2500-capacities["draft"]}; alternative {capacities["illustrative_alternative"]} (uncosted assumption)')
    print('Schedule: pilot precedes both contract and supplied frame; revision required')
    print('Case-study checks passed: survey, panel, budget, capacity. All fixtures are synthetic.')


if __name__ == '__main__':
    run()
