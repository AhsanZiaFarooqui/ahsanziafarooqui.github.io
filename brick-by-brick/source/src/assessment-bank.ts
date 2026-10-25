import type {Module,Skill,Visual} from './types.ts';
import {digital,timeWords} from './math.ts';

// Frozen blueprint v1: two parallel forms, independent of tutorial assignment.
// Each row is one scored item; concept totals never double-count an item.
export type Form='A'|'B';
export interface QuizItem {id:string;concept:Skill;prompt:string;visual:Visual;accessible:string;choices:{id:string;label:string}[];correct:string}
export const BLUEPRINT_VERSION='matched-8-v1';
function item(id:string,concept:Skill,prompt:string,visual:Visual,labels:string[],correct=0):QuizItem {
 const accessible=visual.kind==='clock'?`Clock with short thick hand ${Math.floor(visual.total/60)%12||12} plus ${visual.total%60}/60 of the way to the next number, and long thin hand at numeral ${visual.total%60/5||12}.`:visual.kind==='fraction'?`One whole divided into ${visual.d} equal outlined parts, ${visual.n} shaded.${visual.second?` A second whole of the same size has ${visual.second.d} equal parts, ${visual.second.n} shaded.`:''}`:'Text question.';
 return {id,concept,prompt,visual,accessible,choices:labels.map((label,k)=>({id:`c${k}`,label})),correct:`c${correct}`};
}
function timeForm(form:Form):QuizItem[] {
 const b=form==='B',prefix=`time-${form}`,h=b?9:6;
 const c=(hour:number,minute:number):Visual=>({kind:'clock',total:hour*60+minute});
 const q=(k:number,s:Skill,p:string,v:Visual,answers:string[])=>item(`${prefix}-${k}`,s,p,v,answers);
 const minute=b?20:10,late=b?45:35;
 return [
  q(1,'T1','Which hand tells us the minutes?',c(h,25),['The longer, thinner hand','The shorter, thicker hand','Both hands tell only hours']),
  q(2,'T2','How many minutes past does the long hand show?',c(h,minute),[`${minute} minutes`,`${minute/5} minutes`,`${60-minute} minutes`,`${minute+5} minutes`]),
  q(3,'T2','How many minutes past does the long hand show?',c(h,late),[`${late} minutes`,`${late/5} minutes`,`${60-late} minutes`,`${late-5} minutes`]),
  q(4,'T3','Which hour has already started?',c(h,40),[`${h}`,`${h+1}`,'8']),
  q(5,'T4','Which phrase matches this clock?',c(h,15),[timeWords(h*60+15),timeWords((h+1)*60+15),timeWords(h*60+45),timeWords(h*60+30)]),
  q(6,'T4',`Which digital time means quarter to ${h+1}?`,{kind:'none'},[digital(h*60+45),digital((h+1)*60+15),digital((h+1)*60+45),digital(h*60+15)]),
  q(7,'T5','What time does this clock show?',c(h,25),[digital(h*60+25),digital((h+1)*60+25),`${h}:05`,digital(h*60+35)]),
  q(8,'T5','What time does this clock show?',c(h,55),[digital(h*60+55),digital((h+1)*60+55),`${h}:11`,digital(h*60+5)])
 ];
}
function fractionForm(form:Form):QuizItem[] {
 const b=form==='B',prefix=`fractions-${form}`,n=b?4:3,d=b?5:7;
 const f=(n:number,d:number,second?:{n:number;d:number}):Visual=>({kind:'fraction',n,d,units:d*2,second});
 const q=(k:number,s:Skill,p:string,v:Visual,answers:string[])=>item(`${prefix}-${k}`,s,p,v,answers);
 return [
  q(1,'F1','Which parts belong to the whole strip?',f(n,d),[`All ${d} large parts`,`Only the ${n} shaded parts`,`Only the ${d-n} unshaded parts`]),
  q(2,'F1',b?'A strip is cut into five pieces of different sizes. Are these fifths?':'A strip is cut into seven pieces of different sizes. Are these sevenths?',{kind:'none'},['No. Fraction parts must be equal in size.','Yes. Counting the pieces is enough.','Yes. They belong to the same strip.']),
  q(3,'F2',`In ${n}/${d}, what does the bottom number ${d} tell us?`,{kind:'none'},[`The whole has ${d} equal parts`,`${d} parts are selected`,`${d} separate wholes`]),
  q(4,'F2',`In ${n}/${d}, what does the top number ${n} tell us?`,{kind:'none'},[`${n} equal parts are selected`,`The whole has ${n} equal parts`,`${n} separate wholes`]),
  q(5,'F3','What fraction of this whole is shaded?',f(n,d),[`${n}/${d}`,`${d}/${n}`,`${d-n}/${d}`,`${n}/${d+1}`]),
  q(6,'F3','What fraction of this whole is shaded?',f(2,b?7:5),[`2/${b?7:5}`,`${b?7:5}/2`,`${b?5:3}/${b?7:5}`,`2/${b?8:6}`]),
  q(7,'F4',`Which fraction is the same amount as ${b?'3/5':'2/5'}?`,{kind:'none'},[b?'6/10':'4/10',b?'3/10':'2/10',b?'6/5':'4/5','None: different numbers always mean different amounts']),
  q(8,'F5',`For the same whole, which is larger: ${b?'2/7 or 5/7':'2/5 or 4/5'}?`,{kind:'none'},[b?'5/7':'4/5',b?'2/7':'2/5','They are equal'])
 ];
}
export const quizForms:Record<Module,Record<Form,QuizItem[]>>={time:{A:timeForm('A'),B:timeForm('B')},fractions:{A:fractionForm('A'),B:fractionForm('B')}};
export const otherForm=(form:Form):Form=>form==='A'?'B':'A';
export function quizItem(id:string):QuizItem {const found=Object.values(quizForms).flatMap(forms=>Object.values(forms).flat()).find(i=>i.id===id);if(!found)throw Error('Unknown assessment item');return found;}
