import {apiUrl} from './runtime-config.js?v=01e72359e68d';
import {validOutput} from './ai-contract.js?v=01e72359e68d';
                                                                                        
// Adult-initiated test: one fixed maths example, no learner/session/history data.
export async function checkAiConnection(fetcher             =fetch)                         {
 const endpoint=await apiUrl('/api/explain');
 const result=(ok        ,code       ,message       )=>({ok,code,message,endpoint});
 try{
  const status=await fetcher(await apiUrl('/api/status'),{cache:'no-store',signal:AbortSignal.timeout(10000)});
  if(!status.ok)return result(false,`STATUS_HTTP_${status.status}`,`The connection status request returned HTTP ${status.status}.`);
  let state    ;try{state=await status.json();}catch{return result(false,'STATUS_NOT_JSON','The status address did not return JSON. Check the Worker code and website configuration.');}
  if(state.mode!=='configured')return result(false,'BINDING_NOT_CONFIGURED','The endpoint says AI is not configured. Check the Workers AI binding named AI.');
  const response=await fetcher(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({conceptId:'hands'}),signal:AbortSignal.timeout(18000)});
  if(!response.ok)return result(false,`EXPLAIN_HTTP_${response.status}`,`The explanation request returned HTTP ${response.status}. ${response.status===429?'Wait a minute before trying again.':response.status===403?'Check the allowed website origin in the Worker.':'Check the Worker deployment.'}`);
  let body    ;try{body=await response.json();}catch{return result(false,'EXPLAIN_NOT_JSON','The explanation address did not return JSON. Check the Worker code.');}
  if(!['live','built-in'].includes(body?.mode)||!validOutput(body.output,'hands'))return result(false,'RESPONSE_REJECTED','The response arrived but did not match the supported maths response format.');
  if(body.mode==='built-in')return result(false,'PROVIDER_FALLBACK',typeof body.reason==='string'?body.reason.slice(0,300):'Cloudflare returned the built-in explanation.');
  return result(true,'LIVE_VERIFIED','Live AI connection verified: a new response was received and its visual parameters passed validation. This does not verify every sentence the AI writes.');
 }catch(error){const timeout=error instanceof Error&&['TimeoutError','AbortError'].includes(error.name);return result(false,timeout?'BROWSER_TIMEOUT':'NETWORK_OR_CORS',timeout?'The request took too long. Try again in a moment.':'The browser could not reach the endpoint. Check the displayed address, internet connection, and Cloudflare CORS settings.');}
}
