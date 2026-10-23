let apiBase='';
export const configurationReady=fetch('./config.json').then(r=>r.ok?r.json():{}).then(config=>{if(typeof config.aiEndpoint==='string'&&/^https:\/\/[a-z0-9-]+\.[a-z0-9-]+\.workers\.dev\/?$/i.test(config.aiEndpoint))apiBase=config.aiEndpoint.replace(/\/$/,'');}).catch(()=>{});
export async function apiUrl(path:string){await configurationReady;return apiBase?apiBase+path:new URL('.'+path,import.meta.url).href;}
