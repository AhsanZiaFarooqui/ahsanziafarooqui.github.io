import {el,svg,button} from './dom.js?v=394f6e12dba5';
import {clockState,digital,timeWords,filledUnits} from './math.js?v=394f6e12dba5';
                                       
const point=(angle       ,r       )=>({x:160+Math.sin(angle*Math.PI/180)*r,y:160-Math.cos(angle*Math.PI/180)*r});
export function clock(total       ,options                                                                                  ={}) {
 const state=clockState(total);const box=el('div',{class:'clock-visual'});
 const face=svg('svg',{viewBox:'0 0 320 320',role:'img','aria-label':options.accessible||`Clock showing ${digital(total)}. Short orange hand: hour. Long blue hand: minutes.`});
 face.append(svg('circle',{cx:160,cy:160,r:151,fill:'#fffdf8',stroke:'#d9dfd6','stroke-width':3}));
 if(options.arc){const end=point(options.arc*6,140);face.append(svg('path',{d:`M160 160 L160 20 A140 140 0 ${options.arc>30?1:0} 1 ${end.x} ${end.y} Z`,fill:'#c9e8df'}));}
 for(let i=0;i<60;i++){const a=point(i*6,i%5?142:135),b=point(i*6,147);face.append(svg('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:i%5?'#939f99':'#344e4a','stroke-width':i%5?1.5:3}));}
 for(let i=1;i<=12;i++){const p=point(i*30,116);face.append(svg('text',{x:p.x,y:p.y+7,'text-anchor':'middle',fill:'#233f3b','font-size':23,'font-weight':650},String(i)));if(options.counts){const q=point(i*30,91);face.append(svg('text',{x:q.x,y:q.y+4,'text-anchor':'middle',fill:'#176a88','font-size':12},String(i===12?0:i*5)));}}
 face.append(svg('line',{x1:160,y1:174,x2:160,y2:82,stroke:'#b95a28','stroke-width':10,'stroke-linecap':'round',transform:`rotate(${state.hourAngle} 160 160)`,'data-hand':'hour','data-angle':state.hourAngle}));
 face.append(svg('line',{x1:160,y1:176,x2:160,y2:35,stroke:'#146584','stroke-width':5,'stroke-linecap':'round',transform:`rotate(${state.minuteAngle} 160 160)`,'data-hand':'minute','data-angle':state.minuteAngle}));
 face.append(svg('circle',{cx:160,cy:160,r:8,fill:'#233f3b'}));box.append(face);
 if(options.labels)box.append(el('div',{class:'hand-key'},el('span',{class:'hour-key'},'━ Short: hour'),el('span',{class:'minute-key'},'━ Long: minutes')));
 if(options.digital)box.append(el('p',{class:'digital'},digital(Math.round(total))),el('p',{class:'time-words'},timeWords(Math.round(total))));
 if(options.counts)box.append(minuteBricks(Math.floor(state.m)),el('p',{class:'visual-note'},'12 groups × 5 minutes = 60 minutes'));
 return box;
}
export function minuteBricks(minutes       ) {const strip=svg('svg',{viewBox:'0 0 600 42',role:'img','aria-label':`${minutes} of sixty minutes, arranged in twelve groups of five`});for(let g=0;g<12;g++){strip.append(svg('rect',{x:g*50+1,y:3,width:47,height:34,rx:4,fill:'#e5ebe6',stroke:'#9ea9a1'}));for(let u=0;u<5;u++)strip.append(svg('circle',{cx:g*50+6+u*9,cy:20,r:3.4,fill:g*5+u<minutes?'#247e70':'#f9faf6'}));}return strip;}
function strip(n       ,d       ,units       ,y       ,unequal=false,opacity=1) {
 const group=svg('g',{'data-whole-width':480,'data-filled-units':unequal?units/2:filledUnits(n,d,units)});const filled=unequal?240:480*n/d;
 group.append(svg('rect',{x:50,y,width:480,height:64,rx:7,fill:'#edf0e9',stroke:'#53665c','stroke-width':2}));
 if(filled)group.append(svg('rect',{x:50,y,width:filled,height:64,rx:5,fill:'#469184'}));
 for(let u=0;u<units;u++)group.append(svg('circle',{cx:50+(u+.5)*480/units,cy:y+32,r:Math.min(10,480/units/5),fill:u*480/units<filled?'#a1cfc0':'#fffdf6',stroke:'#688b80','stroke-width':1}));
 const boundaries=unequal?[.5,.75]:Array.from({length:d-1},(_,k)=>(k+1)/d);
 for(const b of boundaries)group.append(svg('line',{x1:50+b*480,x2:50+b*480,y1:y,y2:y+64,stroke:'#203f38','stroke-width':3,opacity}));
 return group;
}
export function fraction(v                                  ,accessible        ,divisionOpacity=1) {
 const box=el('div',{class:'fraction-visual'});const face=svg('svg',{viewBox:`0 0 580 ${v.second?260:160}`,role:'img','aria-label':accessible||(v.unequal?'One whole split into three unequal pieces: a shaded half and two unshaded quarters.':`One whole; ${v.n} of ${v.d} equal parts shaded${v.second?`; second equal-sized whole: ${v.second.n} of ${v.second.d}`:''}`)});
 face.append(svg('text',{x:50,y:24,fill:'#405b50','font-size':17},'ONE WHOLE'),svg('path',{d:'M50 40 V34 H530 V40',fill:'none',stroke:'#53665c','stroke-width':2}),strip(v.n,v.d,v.units,50,v.unequal,divisionOpacity));
 if(v.labels)face.append(svg('text',{x:290,y:143,'text-anchor':'middle',fill:'#233f3b','font-size':24,'font-weight':700},v.unequal?'Unequal pieces • shaded amount = 1/2':`${v.n}/${v.d}`));
 if(v.second){face.append(svg('text',{x:50,y:173,fill:'#405b50','font-size':15},'SAME-SIZED WHOLE'),strip(v.second.n,v.second.d,v.units,184,false,divisionOpacity));if(v.labels)box.append(el('p',{class:'fraction-equation'},`${v.n}/${v.d} ${v.n*v.second.d===v.second.n*v.d?'=':v.n*v.second.d>v.second.n*v.d?'>':'<'} ${v.second.n}/${v.second.d}`));}
 box.prepend(face);box.append(el('p',{class:'visual-note'},v.unequal?'Compare piece sizes, not just the number of pieces.':'Large outlined groups are the fraction pieces. Small studs show unit cells.'));
 return box;
}
export function visual(v       ,accessible        ,previous        ,progress=1)             {
 if(v.kind==='clock'){const total=previous?.kind==='clock'?previous.total+(v.total-previous.total)*progress:v.total;return clock(total,{...v,accessible});}
 if(v.kind==='fraction')return fraction(v,accessible,progress);
 return el('div',{class:'symbol-visual','aria-hidden':'true'},el('span',{},'Think it through'),el('span',{class:'tiny-bricks'},'▰ ▰ ▰'));
}
export function clockExplorer(){let total=180;const figure=el('div');const redraw=()=>figure.replaceChildren(clock(total,{labels:true,counts:true,digital:true}));redraw();return el('section',{class:'explorer'},el('h3',{},'Move time forward or back'),figure,el('div',{class:'button-row'},button('− 5 minutes',()=>{total-=5;redraw();},'secondary'),button('+ 5 minutes',()=>{total+=5;redraw();},'secondary'),button('+ 1 hour',()=>{total+=60;redraw();},'secondary')),el('p',{class:'small'},'The hands stay together, even when you pass twelve. An analogue clock alone does not tell us AM or PM.'));}
