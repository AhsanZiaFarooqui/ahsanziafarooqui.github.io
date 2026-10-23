export type Module = 'time' | 'fractions';
export type Skill = 'T1'|'T2'|'T3'|'T4'|'T5'|'F1'|'F2'|'F3'|'F4'|'F5';
export type Outcome = 'correct'|'incorrect'|'uncertain'|'skipped';
export type Phase = 'diagnostic'|'guided'|'independent'|'revisit';
export type Visual = {kind:'clock'; total:number; labels?:boolean; counts?:boolean; digital?:boolean; arc?:number} | {kind:'fraction'; n:number; d:number; units:number; second?:{n:number;d:number}; unequal?:boolean; labels?:boolean} | {kind:'none'};
export interface Choice {id:string; label:string; misconception?:string; meaning?:string}
export interface Item {id:string; module:Module; skills:Skill[]; tags:string[]; prompt:string; visual:Visual; format:'choice'; choices:Choice[]; correct:string; slip:number; guess:number; difficulty:'starting'|'connecting'; family:string; phases:Phase[]; accessible:string; hint:string}
export interface Observation {itemId:string; outcome:Outcome; choiceId?:string; hints:boolean; phase:Phase; tutorialId?:string; time:string; prior:number[]; posterior:number[]; reason:string; misconception?:string}
export interface LessonStep {caption:string; visual:Visual}
export interface Tutorial {id:string; module:Module; title:string; skill:Skill; prerequisite?:Skill; steps:LessonStep[]; alternative:string}
export interface Session {id:string; module:Module; started:string; posterior:number[]; observations:Observation[]; stage:'diagnostic'|'tutorial'|'guided'|'independent'|'result'|'revisit'; currentItemId?:string; selectionReason:string; tutorialId?:string; tutorialReason?:string; diagnosticSnapshot?:number[]; stopReason?:string; incomplete:boolean; checkPrior:number[]; attempts:number; taught:string[]; evaluation:boolean; revisitAfter?:string; feedback?:string; completed?:string}
