// TEST ONLY. Loaded explicitly by the HTTP test subprocess, never by the app.
globalThis.fetch=async(_url,options)=>{
 const request=JSON.parse(options.body),context=JSON.parse(request.input);
 return Response.json({output:[{content:[{type:'output_text',text:JSON.stringify({targetConcept:context.targetConcept,explanation:context.checkedExplanations.find(s=>s!==context.previousExplanation),visualExampleId:context.workedExamples[0].id,stepCaptions:context.workedExamples.map(e=>e.caption),guidedPracticeItemId:context.guidedPractice[0].id,followUpResponse:context.checkedFollowUps[0]})}]}]});
};
