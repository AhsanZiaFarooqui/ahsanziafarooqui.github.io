import {writeFile} from 'node:fs/promises';
import {assessment,concepts,formItems} from '../src/assessment.ts';
import {curriculum} from '../src/curriculum.ts';
const blueprint=`# Fixed assessment blueprint and answer key

Version: comparison-v2. Two topics; two forms per topic; eight items per form; three choices plus “I’m not sure”. Every correct response scores one; every incorrect or uncertain response scores zero. Missing items are not responses. A score is missing until all eight items are submitted.

Forms A and B are designed to match concepts, formats, approximate difficulty and reading demand. They are **not psychometrically validated**. Pilot them, review item-level performance and form-order effects, and freeze a version before a real trial. Do not revise items midway without documenting a new version and the affected sessions.

Each form samples two items from each row:

| Topic | Concept | Item positions |
| --- | --- | --- |
${(['time','fractions'] as const).flatMap(topic=>concepts[topic].map((c,i)=>`| ${topic} | ${c} | ${i*2+1}, ${i*2+2} |`)).join('\n')}

Independent fair random draws assign A→B or B→A at session creation and standard or AI at completion of the initial quiz. Both arms receive the same fixed final form for a given initial form. The draws are 1:1 probabilities, not forced equal totals in small samples.

Teaching uses separate worked-* and guided-* pools in curriculum.ts. No scored clock time, scored fraction picture, equivalence target, or comparison pair is used as a tutorial example. Conceptual overlap is intentional: the same learning objectives must be taught. Basic hand roles and definitions necessarily recur. Guided practice uses teaching values and explanations, never scored item IDs. AI chooses only checked content from these pools.

Descriptions below specify the visual, including non-answer-revealing clock positions for screen readers. Visual labels and instructional notes are removed during scored questions. No correctness feedback, hints, or answer keys appear until the final quiz is complete.
`;
let body=blueprint;
for(const topic of ['time','fractions'] as const)for(const form of ['A','B'] as const){body+=`\n## ${topic} — Form ${form}\n`;for(const q of formItems(topic,form)){body+=`\n### ${q.id}: ${concepts[topic][q.concept]}\n\n${q.prompt}\n\nVisual description: ${q.description}\n\n${q.options.map((o,i)=>`${i+1}. ${o}`).join('\n')}\n4. I’m not sure.\n\n**Answer: ${q.answer+1}. ${q.options[q.answer]}**\n\n${q.explanation}\n`;}}
await writeFile('docs/assessment-blueprint-and-keys.md',body);
await writeFile('docs/study-assessment.json',JSON.stringify({version:'comparison-v2',psychometricallyValidated:false,items:assessment},null,2));
let lessons='# Standard concepts tutorial and separate teaching pools\n\nVersion: comparison-v2. Fixed order is the order below within each topic. Each segment shows its fixed explanation, first worked example, three captioned steps and its first guided task. Alternative wording is available only when requested. No initial response is passed to the standard tutorial. Both arms have the same renderer, captions, play/pause/replay/step controls, hints, reflection controls and exactly four guided opportunities. Plan approximately 6–10 minutes of instruction in either arm; pilot actual timing before fixing a trial protocol. No audio is used in either comparison arm.\n\nThe AI package can reorder the four concepts by initial errors, select a checked wording and visual emphasis, and select one of the two guided tasks per segment. It still shows all three core steps and covers all four concepts. Reflection is an optional unscored clarification, not an additional scored practice opportunity.\n';
for(const s of curriculum){lessons+=`\n## ${s.id}: ${s.title}\n\n${s.explanation}\n\nAlternative: ${s.alternative}\n\nReflection: ${s.clarify}\n`;for(const e of s.steps)lessons+=`\n- ${e.id}: ${e.caption} Visual: ${JSON.stringify(e.visual)}\n`;lessons+='\nGuided pool (standard uses item 1; AI selects one):\n';s.practice.forEach((p,i)=>{lessons+=`\n${i+1}. **${p.id}** ${p.prompt}\n\n   Choices: ${p.options.join(' / ')}. Answer: ${p.options[p.answer]}. ${p.explanation}\n\n   Visual: ${JSON.stringify(p.visual)}\n`;});}
await writeFile('docs/standard-tutorial-content.md',lessons);
console.log('Wrote fixed forms, answer keys, blueprint and standard teaching content.');
