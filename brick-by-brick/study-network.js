// The static site uses its configured Worker; local Node development keeps same-origin APIs.
export function resolveStudyBase(config        ,hostname       )        {
 if(!hostname||hostname==='localhost'||hostname==='127.0.0.1')return '';
 const endpoint=(config                         )?.aiEndpoint;
 return typeof endpoint==='string'&&/^https:\/\/[a-z0-9-]+\.[a-z0-9-]+\.workers\.dev\/?$/i.test(endpoint)?endpoint.replace(/\/$/,''):'';
}
let studyBase='';
const moduleUrl=new URL(import.meta.url);
const ready=fetch(`./config.json?v=${moduleUrl.searchParams.get('v')||'local'}`,{cache:'no-store'}).then(r=>r.ok?r.json():{}).then(config=>{studyBase=resolveStudyBase(config,moduleUrl.hostname);}).catch(()=>{});
export async function studyRequest(path       ,init            ={})                  {
 await ready;if(!/^\/api\/study-(status|explain|verify|enable)$/.test(path))throw Error('Unsupported study endpoint');
 const headers=new Headers(init.headers);
 if(studyBase&&path==='/api/study-status'){try{const token=localStorage.getItem('brick:study-verification:'+studyBase);if(token)headers.set('X-Study-Token',token);}catch{}}
 return fetch(studyBase+path,{...init,headers,cache:'no-store'});
}
export async function rememberStudyVerification(result                            ){await ready;if(studyBase&&typeof result.verificationToken==='string')localStorage.setItem('brick:study-verification:'+studyBase,result.verificationToken);}
