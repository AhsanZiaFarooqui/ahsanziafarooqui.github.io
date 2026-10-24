import {tutorialById,tutorials} from './tutorials.js?v=fe8d0075f5b4';
import {items} from './bank.js?v=fe8d0075f5b4';
                                       
                                                                                                                                           
                                                                                                                                                                                                                                           
                                                                                
export function examples(conceptId       ) {return tutorialById(conceptId).steps.map((s,k)=>({id:`${conceptId}:${k}`,visual:s.visual,caption:s.caption}));}
export function parameters(example                          ) {const v=example.visual;return {exampleId:example.id,total:v.kind==='clock'?v.total:0,n:v.kind==='fraction'?v.n:0,d:v.kind==='fraction'?v.d:0,units:v.kind==='fraction'?v.units:0};}
export function fallback(conceptId       ,reason='Built-in explanation mode')          {const t=tutorialById(conceptId),example=examples(conceptId).at(-1) ;return {mode:'built-in',reason,output:{conceptId,explanation:t.alternative,visualAction:t.module==='time'?'clock-example':'fraction-example',visualParameters:parameters(example),stepCaptions:[example.caption],followUpItemId:items.find(i=>i.phases.includes('guided')&&i.skills.includes(t.skill)) .id}};}
export function trustedAiVisual(output         ) {return examples(output.conceptId).find(e=>e.id===output.visualParameters.exampleId) .visual;}
const plain=(s        ,max       )            =>typeof s==='string'&&s.length>0&&s.length<=max&&!/[<>]|https?:\/\/|\b(?:api[_ -]?key|system prompt)\b/i.test(s);
export function validOutput(value        ,conceptId       )                   {
 if(!value||typeof value!=='object')return false;const v=value            ,t=tutorialById(conceptId);
 if(Object.keys(v).sort().join(',')!==['conceptId','explanation','visualAction','visualParameters','stepCaptions','followUpItemId'].sort().join(','))return false;
 if(v.conceptId!==conceptId||!plain(v.explanation,550)||v.visualAction!==(t.module==='time'?'clock-example':'fraction-example'))return false;
 if(!Array.isArray(v.stepCaptions)||v.stepCaptions.length<1||v.stepCaptions.length>4||!v.stepCaptions.every(s=>plain(s,180)))return false;
 const example=examples(conceptId).find(e=>e.id===v.visualParameters?.exampleId);if(!example)return false;
 const expected=parameters(example);if(Object.keys(v.visualParameters).length!==5||Object.entries(expected).some(([k,x])=>v.visualParameters[k                         ]!==x))return false;
 const follow=items.find(i=>i.id===v.followUpItemId);return !!follow&&follow.module===t.module&&follow.skills.includes(t.skill)&&follow.phases.includes('guided');
}
export function validInput(v        )              {
 if(!v||typeof v!=='object')return false;const a=v           ;
 if(Object.keys(a).some(k=>!['conceptId','itemId','response','skillEvidence','learnerText'].includes(k)))return false;
 const t=tutorials.find(t=>t.id===a.conceptId);if(!t)return false;
 if(a.itemId&&!items.some(i=>i.id===a.itemId&&i.module===t.module))return false;
 if(a.response!==undefined&&!['correct','incorrect','uncertain','skipped'].includes(a.response))return false;
 if(a.learnerText!==undefined&&(typeof a.learnerText!=='string'||a.learnerText.length>300))return false;
 if(a.skillEvidence&&(Object.keys(a.skillEvidence).length!==2||a.skillEvidence.skill!==t.skill||!['insufficient evidence','uncertain','likely difficulty','evidence of understanding'].includes(a.skillEvidence.status)))return false;
 return true;
}
export function safeLearnerText(text       ) {return text.replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g,'[removed]').replace(/(?:\+?\d[\d\s()-]{6,}\d)/g,'[removed]').replace(/https?:\/\/\S+/gi,'[removed]').slice(0,300);}
