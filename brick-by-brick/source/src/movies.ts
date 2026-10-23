export interface MovieScene {kind:'clock'|'fraction'|'duration';label:string;caption:string;seconds:number;total?:number;from?:number;focus?:string;arc?:number;n?:number;d?:number;units?:number;n2?:number;d2?:number;equation?:string;unequal?:number;subdivide?:number}
export interface Movie {id:string;title:string;scenes:MovieScene[]}
const scene=(caption:string,label:string,values:Omit<MovieScene,'caption'|'label'|'seconds'>):MovieScene=>({...values,caption,label,seconds:Math.max(7,Math.ceil(caption.split(/\s+/).length/2)+2)});
const c=(caption:string,label:string,total:number,focus='',from=total,arc=0)=>scene(caption,label,{kind:'clock',total,from,focus,arc});
const f=(caption:string,label:string,n:number,d:number,units=8,extra:Partial<MovieScene>={})=>scene(caption,label,{kind:'fraction',n,d,units,...extra});
export const movies:Movie[]=[
 {id:'hands',title:'Meet the two hands',scenes:[
 c('A clock has two hands. Let’s give each hand just one job.','TWO HANDS\nTWO JOBS',180),
 c('Find the short orange hand. It points to three. Its job is to tell us the hour.','SHORT HAND\nHOUR',180,'hour'),
 c('Now find the long blue hand. Its job is to tell us the minutes.','LONG HAND\nMINUTES',180,'minute'),
 c('When the long hand points straight up to twelve, there are zero minutes past the hour.','TWELVE\n0 MINUTES',180,'minute'),
 c('Short hand at three. Long hand at twelve. Put those together: three o’clock.','3 O’CLOCK',180),
 c('Your turn: point to the hour hand. Then point to the minute hand. Pause the video if you like.','POINT TO\nEACH HAND',180)]},
 {id:'fives',title:'Count the minutes in fives',scenes:[
 c('Start with the long blue hand at twelve. We have counted zero minutes.','START HERE\n0 MINUTES',180,'minute'),
 c('Move to one. We passed five little ticks. That is five minutes, not one minute.','1 GROUP\n5 MINUTES',185,'count',180),
 c('Move to two. Another five minutes. Five plus five makes ten.','2 GROUPS\n10 MINUTES',190,'count',185),
 c('Move to three. Count with me: five, ten, fifteen. The number three means fifteen minutes.','3 GROUPS\n15 MINUTES',195,'count',190),
 c('Keep counting to six: twenty, twenty-five, thirty. Six groups of five make thirty minutes.','6 GROUPS\n30 MINUTES',210,'count',195),
 c('Remember: use the clock number to count groups of five. Do not read it as the number of minutes.','COUNT IN\nFIVES',215,'count',210)]},
 {id:'moving-hour',title:'Why the hour hand moves',scenes:[
 c('Imagine the hour hand walking from three to four. At three o’clock, its journey starts at three.','START AT 3',180,'hour'),
 c('Fifteen minutes pass. Watch the short hand move a little towards four. It does not stay still.','A LITTLE\nPAST 3',195,'hour',180),
 c('Thirty minutes pass. The short hand is now halfway from three to four. The hour is still three.','HALFWAY\nTO 4',210,'hour',195),
 c('At three forty-five, it is nearly at four. But it has not reached four yet.','NEARLY 4\nSTILL HOUR 3',225,'hour',210),
 c('Now it reaches four. Only now has the next hour started: four o’clock.','NOW IT IS\n4 O’CLOCK',240,'hour',225),
 c('Between two numbers, choose the hour the short hand has already passed.','PASSED 4\nHOUR IS 4',275,'hour',240)]},
 {id:'half-past',title:'What does half past mean?',scenes:[
 c('A whole hour is sixty minutes. The long hand makes one complete trip around the clock.','ONE HOUR\n60 MINUTES',180,'minute'),
 c('Half of sixty is thirty. So half an hour is thirty minutes.','HALF AN HOUR\n30 MINUTES',210,'minute',180,30),
 c('After half a trip, the long hand reaches six. Thirty minutes have passed.','LONG HAND\nAT SIX',210,'count',210,30),
 c('The short hand has passed three. It is halfway to four. The hour is still three.','SHORT HAND\nPAST THREE',210,'hour'),
 c('Say it together: half past three. That means thirty minutes after three: three thirty.','HALF PAST 3\n3:30',210)]},
 {id:'quarters',title:'Quarter past or quarter to?',scenes:[
 c('An hour has sixty minutes. A quarter of an hour is fifteen minutes.','ONE QUARTER\n15 MINUTES',195,'minute',180,15),
 c('Here, fifteen minutes have passed since three. We say quarter past three. Past means after.','QUARTER\nPAST THREE',195,'minute'),
 c('Now watch the long hand travel to nine. Forty-five minutes have passed since three.','45 MINUTES\nHAVE PASSED',225,'minute',195,45),
 c('There are fifteen minutes left before four. Count the last three groups: five, ten, fifteen.','15 MINUTES\nLEFT TO FOUR',225,'count'),
 c('We say quarter to four. To means before the next hour. The clock still reads three forty-five.','QUARTER\nTO FOUR',225),
 c('Past looks back to the hour that started. To looks ahead to the next hour.','PAST = AFTER\nTO = BEFORE',225)]},
 {id:'read-time',title:'Read a clock in two small steps',scenes:[
 c('Let’s read this clock together. We will use one hand at a time.','ONE HAND\nAT A TIME',275),
 c('First, find the short orange hand. It has passed four, but it has not reached five.','STEP 1\nFIND THE HOUR',275,'hour'),
 c('So the hour is four. Keep that number in your mind.','THE HOUR\nIS FOUR',275,'hour'),
 c('Next, look at the long blue hand. It points to seven. Count seven groups of five.','STEP 2\nCOUNT MINUTES',275,'count'),
 c('Five, ten, fifteen, twenty, twenty-five, thirty, thirty-five. That gives us thirty-five minutes.','7 GROUPS\n35 MINUTES',275,'count'),
 c('Join the answers: four hours and thirty-five minutes. We read the time as four thirty-five.','PUT TOGETHER\n4:35',275)]},
 {id:'whole',title:'First, find the whole',scenes:[
 f('This entire brick strip is one whole. Look from its left edge all the way to its right edge.','THIS IS\nONE WHOLE',1,1),
 f('Now divide the same strip into four equal pieces. The whole has not become bigger or smaller.','SAME WHOLE\n4 EQUAL PARTS',4,4,8,{subdivide:1}),
 f('Colour just one piece green. That piece is part of the whole.','ONE PART\nIS GREEN',1,4),
 f('The pale pieces still belong to the whole. The whole includes all four pieces, not only the green one.','GREEN + PALE\nMAKE THE WHOLE',1,4),
 f('One of four equal pieces is green. We call that one quarter of the whole.','ONE QUARTER\nOF THE WHOLE',1,4)]},
 {id:'equal-parts',title:'Pieces must be the same size',scenes:[
 f('Look carefully. There are three pieces, but the green piece is much bigger than each pale piece.','LOOK AT\nTHE SIZES',1,3,4,{unequal:1}),
 f('We cannot call this one third just because one of three pieces is green. The pieces are not equal.','NOT\nONE THIRD',1,3,4,{unequal:1}),
 f('The green piece covers half the whole strip. The two pale pieces together cover the other half.','GREEN COVERS\nONE HALF',1,3,4,{unequal:1}),
 f('Split the big green piece into two equal pieces. Now all four pieces have the same size.','NOW THERE ARE\n4 EQUAL PARTS',2,4,4,{subdivide:1}),
 f('Two of four equal pieces are green. Two quarters cover the same amount as one half.','SAME AMOUNT\n2/4 = 1/2',2,4,4,{equation:'2/4 = 1/2'})]},
 {id:'fraction-symbols',title:'What do the two numbers mean?',scenes:[
 f('Look at the large outlined pieces. The little bumps help bricks join; we are not counting bumps as pieces.','COUNT THE\nLARGE PIECES',0,4),
 f('Count all the equal pieces: one, two, three, four. Four tells us how the whole is divided.','ALL PIECES\nBOTTOM: 4',0,4,8),
 f('The bottom number is four. Its name is denominator. It tells us there are four equal pieces in the whole.','DENOMINATOR\nBOTTOM NUMBER',0,4),
 f('Now count the green pieces: one, two, three. Three goes on top. We call it the numerator.','NUMERATOR\nTOP: 3',3,4),
 f('Read the fraction: three quarters. Three green pieces out of four equal pieces altogether.','3 GREEN\n4 ALTOGETHER',3,4)]},
 {id:'picture-fraction',title:'Turn a picture into a fraction',scenes:[
 f('First, find one whole strip. Count its large outlined pieces. Keep the little bumps out of your count.','FIND\nTHE WHOLE',0,6,12),
 f('There are six equal large pieces. Write six at the bottom of the fraction.','6 ALTOGETHER\nBOTTOM: 6',0,6,12),
 f('Now count only the green large pieces. There are two. Write two at the top.','2 GREEN\nTOP: 2',2,6,12),
 f('Two green pieces out of six equal pieces. That is two sixths, written two over six.','TWO SIXTHS\n2/6',2,6,12),
 f('Try this picture. Four large pieces are green. The whole still has six equal pieces. That is four sixths.','FOUR SIXTHS\n4/6',4,6,12)]},
 {id:'half-quarters',title:'How can one half equal two quarters?',scenes:[
 f('One of two equal pieces is green. We call it one half. Watch where the green colour ends.','ONE HALF\n1/2',1,2),
 f('Imagine drawing a line through the middle of each big piece. We do not add or remove any green.','SPLIT EACH\nBIG PIECE',1,2),
 f('Now the whole has four equal pieces. Two are green. The green edge has stayed in exactly the same place.','TWO QUARTERS\n2/4',2,4,8,{subdivide:1}),
 f('Compare the strips. Same whole. Same green length. Different numbers: one half and two quarters.','SAME GREEN\nAMOUNT',1,2,8,{n2:2,d2:4,equation:'1/2 = 2/4'}),
 f('Cutting a piece into smaller parts changes the piece count. It does not change the amount you have.','DIFFERENT PARTS\nSAME AMOUNT',2,4,8,{equation:'1/2 = 2/4'})]},
 {id:'third-sixths',title:'One third becomes two sixths',scenes:[
 f('This whole has three equal large pieces. One is green. We have one third.','ONE THIRD\n1/3',1,3,12),
 f('Watch the green edge. Split every large piece into two smaller equal pieces.','SPLIT EACH\nTHIRD IN TWO',1,3,12),
 f('Now there are six equal pieces altogether. Two of them are green. We have two sixths.','TWO SIXTHS\n2/6',2,6,12,{subdivide:1}),
 f('The shaded length has not changed. One third and two sixths are two names for the same amount.','SAME AMOUNT\n1/3 = 2/6',1,3,12,{n2:2,d2:6,equation:'1/3 = 2/6'}),
 f('Remember to split every piece, including the pale ones. Both numbers change together.','SPLIT\nEVERY PIECE',2,6,12)]},
 {id:'compare',title:'Which is bigger: a half or a quarter?',scenes:[
 f('We need two wholes of the same size. These strips start and end at the same places.','FIRST: CHECK\nTHE WHOLES',0,2,8,{n2:0,d2:4,equation:'The wholes are the SAME SIZE'}),
 f('Split the top whole into two equal pieces. One piece is one half. Colour it green.','TOP STRIP\nONE HALF',1,2,8,{n2:0,d2:4,equation:'Top: 1/2'}),
 f('Split the bottom whole into four equal pieces. One piece is one quarter. Colour it green.','BOTTOM STRIP\nONE QUARTER',1,2,8,{n2:1,d2:4,equation:'Top: 1/2     Bottom: 1/4'}),
 f('Compare the green lengths. The half reaches farther. One half is bigger than one quarter of the same whole.','THE HALF\nIS BIGGER',1,2,8,{n2:1,d2:4,equation:'1/2 is bigger than 1/4'}),
 f('More equal pieces in the same whole makes each piece smaller. A bigger bottom number does not mean a bigger piece.','MORE PIECES\nSMALLER PIECES',1,2,8,{n2:1,d2:4,equation:'Always compare the SAME WHOLE'})]},
 {id:'hour-fractions',title:'Fractions of one hour',scenes:[
 c('Let’s measure an amount of time. We start at twelve and watch how many minutes pass.','MEASURE\nA DURATION',0,'minute'),
 c('Fifteen minutes is a quarter of the trip around the clock. Fifteen minutes is one quarter of an hour.','15 MINUTES\n1/4 HOUR',15,'minute',0,15),
 c('Thirty minutes is half the trip. Thirty minutes is one half of an hour.','30 MINUTES\n1/2 HOUR',30,'minute',15,30),
 c('Forty-five minutes is three quarters of the trip. That duration is three quarters of an hour.','45 MINUTES\n3/4 HOUR',45,'minute',30,45),
 c('But quarter to four names a clock reading: three forty-five. It means fifteen minutes remain until four.','CLOCK READING\nQUARTER TO 4',225,'minute'),
 c('An amount of time and a clock reading answer different questions: how long, and what time?','HOW LONG?\nWHAT TIME?',225)]}
];
export const movieById=(id:string)=>{const movie=movies.find(m=>m.id===id);if(!movie)throw Error('Unknown movie');return movie;};
export function chapterStarts(movie:Movie){let time=0;return movie.scenes.map(s=>{const start=time;time+=s.seconds;return start;});}
export function chapterAt(movie:Movie,time:number){const starts=chapterStarts(movie);let i=0;for(let k=0;k<starts.length;k++)if(time>=starts[k])i=k;return i;}
