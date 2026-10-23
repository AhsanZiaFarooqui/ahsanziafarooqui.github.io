                                                                      
                                                                                                     
export function animation(state         ,action                ,count       )          {
 switch(action.type){
 case 'pause':return {...state,playing:false};
 case 'play':return state.step===count-1&&state.elapsed>=4000?{step:0,elapsed:0,playing:true}:{...state,playing:true};
 case 'replay':return {step:0,elapsed:0,playing:true};
 case 'next':return {step:Math.min(count-1,state.step+1),elapsed:1200,playing:false};
 case 'previous':return {step:Math.max(0,state.step-1),elapsed:1200,playing:false};
 case 'tick':{if(!state.playing)return state;let elapsed=state.elapsed+Math.max(0,Math.min(action.ms,250)),step=state.step;if(elapsed>=4000){if(step===count-1)return {step,elapsed:4000,playing:false};step++;elapsed=0;}return {step,elapsed,playing:true};}
 }
}
