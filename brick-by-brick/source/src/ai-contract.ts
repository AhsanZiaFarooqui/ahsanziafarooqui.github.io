import {tutorialById,tutorials} from './tutorials.ts';
import {items} from './bank.ts';
import type {Visual} from './types.ts';
export interface AiInput {conceptId:string;itemId?:string;response?:string;skillEvidence?:{skill:string;status:string};learnerText?:string}
export interface AiOutput {conceptId:string;explanation:string;visualAction:'clock-example'|'fraction-example';visualParameters:{exampleId:string;total:number;n:number;d:number;units:number};stepCaptions:string[];followUpItemId:string}
export interface AiResult {mode:'live'|'built-in';reason:string;output:AiOutput}
export function examples(conceptId:string) {return tutorialById(conceptId).steps.map((s,k)=>({id:`${conceptId}:${k}`,visual:s.visual,caption:s.caption}));}
export function parameters(example:{id:string;visual:Visual}) {const v=example.visual;return {exampleId:example.id,total:v.kind==='clock'?v.total:0,n:v.kind==='fraction'?v.n:0,d:v.kind==='fraction'?v.d:0,units:v.kind==='fraction'?v.units:0};}
export function fallback(conceptId:string,reason='Built-in explanation mode'):AiResult {const t=tutorialById(conceptId),example=examples(conceptId).at(-1)!;return {mode:'built-in',reason,output:{conceptId,explanation:t.alternative,visualAction:t.module==='time'?'clock-example':'fraction-example',visualParameters:parameters(example),stepCaptions:[example.caption],followUpItemId:items.find(i=>i.phases.includes('guided')&&i.skills.includes(t.skill))!.id}};}
export function trustedAiVisual(output:AiOutput) {return examples(output.conceptId).find(e=>e.id===output.visualParameters.exampleId)!.visual;}
const plain=(s:unknown,max:number):s is string=>typeof s==='string'&&s.length>0&&s.length<=max&&!/[<>]|https?:\/\/|\b(?:api[_ -]?key|system prompt)\b/i.test(s);
export function validOutput(value:unknown,conceptId:string):value is AiOutput {
 if(!value||typeof value!=='object')return false;const v=value as AiOutput,t=tutorialById(conceptId);
 if(Object.keys(v).sort().join(',')!==['conceptId','explanation','visualAction','visualParameters','stepCaptions','followUpItemId'].sort().join(','))return false;
 if(v.conceptId!==conceptId||!plain(v.explanation,550)||v.visualAction!==(t.module==='time'?'clock-example':'fraction-example'))return false;
 if(!Array.isArray(v.stepCaptions)||v.stepCaptions.length<1||v.stepCaptions.length>4||!v.stepCaptions.every(s=>plain(s,180)))return false;
 const example=examples(conceptId).find(e=>e.id===v.visualParameters?.exampleId);if(!example)return false;
 const expected=parameters(example);if(Object.keys(v.visualParameters).length!==5||Object.entries(expected).some(([k,x])=>v.visualParameters[k as keyof typeof expected]!==x))return false;
 const follow=items.find(i=>i.id===v.followUpItemId);return !!follow&&follow.module===t.module&&follow.skills.includes(t.skill)&&follow.phases.includes('guided');
}
export function validInput(v:unknown):v is AiInput {
 if(!v||typeof v!=='object')return false;const a=v as AiInput;
 if(Object.keys(a).some(k=>!['conceptId','itemId','response','skillEvidence','learnerText'].includes(k)))return false;
 const t=tutorials.find(t=>t.id===a.conceptId);if(!t)return false;
 if(a.itemId&&!items.some(i=>i.id===a.itemId&&i.module===t.module))return false;
 if(a.response!==undefined&&!['correct','incorrect','uncertain','skipped'].includes(a.response))return false;
 if(a.learnerText!==undefined&&(typeof a.learnerText!=='string'||a.learnerText.length>300))return false;
 if(a.skillEvidence&&(Object.keys(a.skillEvidence).length!==2||a.skillEvidence.skill!==t.skill||!['insufficient evidence','uncertain','likely difficulty','evidence of understanding'].includes(a.skillEvidence.status)))return false;
 return true;
}
export function safeLearnerText(text:string) {return text.replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g,'[removed]').replace(/(?:\+?\d[\d\s()-]{6,}\d)/g,'[removed]').replace(/https?:\/\/\S+/gi,'[removed]').slice(0,300);}
