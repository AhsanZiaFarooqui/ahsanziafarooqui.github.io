// A deliberately small DOM harness for integration tests. It is NOT a layout engine or browser.
export class TestNode {
 tagName:string;attributes:Record<string,string>={};childNodes:TestNode[]=[];parentNode:TestNode|null=null;listeners:Record<string,((event:any)=>void)[]>={};value='';disabled=false;hidden=false;checked=false;data='';
 constructor(tag:string){this.tagName=tag.toLowerCase();}
 paused=true;ended=false;currentTime=0;
 play(){this.paused=false;this.dispatch('play');return Promise.resolve();}
 pause(){if(!this.paused){this.paused=true;this.dispatch('pause');}}
 get children(){return this.childNodes.filter(c=>c.tagName!=='#text');}
 get textContent():string{return this.tagName==='#text'?this.data:this.childNodes.map(c=>c.textContent).join('');}
 set textContent(value:string){this.replaceChildren(value);}
 get className(){return this.attributes.class||'';}set className(v:string){this.attributes.class=v;}
 setAttribute(key:string,value:string){this.attributes[key]=value;}getAttribute(key:string){return this.attributes[key]??null;}
 append(...nodes:(TestNode|string)[]){for(const n of nodes){const node=typeof n==='string'?text(n):n;node.parentNode=this;this.childNodes.push(node);}}
 prepend(...nodes:(TestNode|string)[]){const old=[...this.childNodes];this.childNodes=[];this.append(...nodes,...old);}
 replaceChildren(...nodes:(TestNode|string)[]){for(const n of this.childNodes)n.parentNode=null;this.childNodes=[];this.append(...nodes);}
 remove(){if(this.parentNode)this.parentNode.childNodes=this.parentNode.childNodes.filter(c=>c!==this);this.parentNode=null;}
 addEventListener(name:string,fn:(event:any)=>void){(this.listeners[name]??=[]).push(fn);}
 dispatch(name:string){if(name==='click'&&this.disabled)return;for(const fn of this.listeners[name]||[])fn({target:this});}
 click(){this.dispatch('click');}focus(){(globalThis as any).document.activeElement=this;}
 matches(selector:string){const attribute=selector.match(/^\[([^=\]]+)(?:=['"]?([^'"\]]+)['"]?)?\]$/);if(attribute)return attribute[2]===undefined?attribute[1] in this.attributes:this.attributes[attribute[1]]===attribute[2];if(selector.startsWith('.'))return this.className.split(' ').includes(selector.slice(1));if(selector.startsWith('#'))return this.attributes.id===selector.slice(1);return this.tagName===selector.toLowerCase();}
 querySelectorAll(selector:string):TestNode[]{const selectors=selector.split(',').map(s=>s.trim()),result:TestNode[]=[];for(const child of this.children){if(selectors.some(s=>child.matches(s)))result.push(child);result.push(...child.querySelectorAll(selector));}return result;}
 querySelector(selector:string){return this.querySelectorAll(selector)[0]||null;}
}
function text(v:string){const n=new TestNode('#text');n.data=v;return n;}
export function setupDom(){const body=new TestNode('body'),root=new TestNode('div');root.setAttribute('id','root');body.append(root);const data=new Map<string,string>([['unrelated-project','keep me']]);let rafId=0;const frames=new Map<number,(time:number)=>void>();let reduced=false;
 Object.assign(globalThis,{Node:TestNode,document:{body,activeElement:null,createElement:(tag:string)=>new TestNode(tag),createElementNS:(_ns:string,tag:string)=>new TestNode(tag),createTextNode:text,getElementById:(id:string)=>body.querySelector('#'+id)},localStorage:{getItem:(k:string)=>data.get(k)||null,setItem:(k:string,v:string)=>data.set(k,v),removeItem:(k:string)=>data.delete(k)},window:{scrollTo:()=>{}},matchMedia:()=>({matches:reduced}),requestAnimationFrame:(fn:(time:number)=>void)=>{frames.set(++rafId,fn);return rafId;},cancelAnimationFrame:(id:number)=>frames.delete(id),fetch:async(path:string)=>new Response(JSON.stringify(path==='/api/status'?{mode:'built-in'}:{}))});
 return {root,data,frames,setReduced:(v:boolean)=>{reduced=v;},tick:(time:number)=>{const pending=[...frames];frames.clear();for(const [,fn]of pending)fn(time);},button:(label:string)=>{const b=root.querySelectorAll('button').find(b=>b.textContent===label||b.textContent.includes(label));if(!b)throw Error(`Button missing: ${label}\n${root.textContent}`);return b;}};
}
