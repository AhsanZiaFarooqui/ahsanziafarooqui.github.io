export const mod = (n       ,d       ) => ((n%d)+d)%d;
export function clockState(total       ) {const t=mod(total,720), h=Math.floor(t/60), m=t%60; return {h:h||12,m,minuteAngle:6*m,hourAngle:30*h+.5*m};}
export function digital(total       ) {const {h,m}=clockState(total);return `${h}:${String(m).padStart(2,'0')}`;}
export function timeWords(total       ) {const {h,m}=clockState(total); const next=h%12+1; if(!m)return `${h} o’clock`; if(m===15)return `quarter past ${h}`;if(m===30)return `half past ${h}`;if(m===45)return `quarter to ${next}`;return m<30?`${m} minutes past ${h}`:`${60-m} minutes to ${next}`;}
export function validFraction(n       ,d       ) {return Number.isInteger(n)&&Number.isInteger(d)&&d>0&&d<=60&&n>=0&&n<=d;}
export function compare(a       ,b       ,c       ,d       ) {if(!validFraction(a,b)||!validFraction(c,d))throw Error('Invalid fraction');return Math.sign(a*d-c*b);}
export const equivalent = (a       ,b       ,c       ,d       ) => compare(a,b,c,d)===0;
export function filledUnits(n       ,d       ,units       ) {if(!validFraction(n,d)||!Number.isInteger(units)||units%d!==0)throw Error('Unequal unit subdivision');return n*(units/d);}
export function shuffle   (values    ,random           =Math.random) {const a=[...values];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export const score = (correct       ,choice       )                       => correct===choice?'correct':'incorrect';
