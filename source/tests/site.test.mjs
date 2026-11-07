import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { build } from 'esbuild';
const pricingBuild = await build({entryPoints:['src/pricing.ts'],bundle:true,write:false,format:'esm',platform:'node'});
const {calculatePrice, sizeLabel, minOrderDate, cakes} = await import(`data:text/javascript;base64,${Buffer.from(pricingBuild.outputFiles[0].text).toString('base64')}`);
const app = (await build({entryPoints:['src/main.ts'],bundle:true,write:false,format:'iife',platform:'browser'})).outputFiles[0].text;
function setup(){
 const html = readFileSync('index.html','utf8').replace(/<script[^>]*>[\s\S]*?<\/script>/g,'');
 const dom = new JSDOM(html,{url:'https://example.github.io/kroshka/',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;
 w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
 w.HTMLElement.prototype.scrollIntoView=function(){};
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
 w.eval(app);return dom;
}
test('prices, weight limits, portion labels and calendar rollover',()=>{
 assert.equal(calculatePrice('chocolate',2,0),5600);
 assert.equal(calculatePrice('berry',3.5,800),12000);
 assert.equal(calculatePrice('cupcakes',12,800),5000);
 assert.equal(calculatePrice('cheesecake',1,0),3200);
 assert.throws(()=>calculatePrice('berry',2,0),RangeError);
 assert.throws(()=>calculatePrice('cupcakes',7,0),RangeError);
 assert.throws(()=>calculatePrice('chocolate',2.2,0),RangeError);
 assert.throws(()=>calculatePrice('chocolate',NaN,0),RangeError);
 assert.throws(()=>calculatePrice('chocolate',2,-800),RangeError);
 assert.match(sizeLabel('cupcakes',30),/5 наборов/);
 assert.equal(minOrderDate(new Date(2026,11,30,23,45)),'2027-01-02');
});
test('catalog filters and accessible pressed states',()=>{
 const dom=setup(),d=dom.window.document;
 d.querySelector('[data-filter="small"]').click();
 assert.equal(d.querySelectorAll('.cake-card:not([hidden])').length,1);
 assert.equal(d.querySelector('[data-filter="small"]').getAttribute('aria-pressed'),'true');
 assert.equal(d.querySelectorAll('[data-filter][aria-pressed="true"]').length,1);
 assert.match(d.querySelector('#catalog-status').textContent,/1/);
 d.querySelector('[data-filter="all"]').click();
 assert.equal(d.querySelectorAll('.cake-card:not([hidden])').length,4);dom.window.close();
});
test('dialog content, safe dismissal, focus return, card to calculator',async()=>{
 const dom=setup(),w=dom.window,d=w.document,trigger=d.querySelector('[data-cake="cupcakes"]');
 trigger.focus();trigger.click();
 assert.equal(d.querySelector('#cake-dialog').open,true);
 assert.match(d.querySelector('#cake-modal-title').textContent,/Маленькие/);
 d.querySelector('#cake-dialog [data-close]').click();assert.equal(d.activeElement,trigger);
 trigger.click();d.querySelector('#choose-cake').click();
 await new Promise(resolve=>w.setTimeout(resolve,60));
 assert.equal(d.querySelector('#cake-type').value,'cupcakes');
 assert.equal(d.querySelector('#cake-weight').min,'6');
 assert.equal(d.querySelector('#cake-weight').step,'6');
 assert.equal(d.activeElement,d.querySelector('#event-date'));dom.window.close();
});
test('tabs implement arrow keys, End, Home and roving tabindex',()=>{
 const dom=setup(),w=dom.window,d=w.document;
 const press=key=>d.querySelector('[role="tab"][aria-selected="true"]').dispatchEvent(new w.KeyboardEvent('keydown',{key,bubbles:true}));
 press('ArrowLeft');assert.equal(d.activeElement.id,'tab-vanilla');
 press('Home');assert.equal(d.activeElement.id,'tab-berry');
 press('End');assert.equal(d.activeElement.id,'tab-vanilla');
 assert.equal(d.querySelectorAll('[role="tab"][tabindex="0"]').length,1);
 assert.equal(d.querySelector('#flavor-panel').getAttribute('aria-labelledby'),'tab-vanilla');dom.window.close();
});
test('order recalculates, rejects past dates, escapes comment, and downloads',()=>{
 const dom=setup(),w=dom.window,d=w.document;
 const type=d.querySelector('#cake-type');type.value='berry';type.dispatchEvent(new w.Event('change'));
 const weight=d.querySelector('#cake-weight');weight.value='4';weight.dispatchEvent(new w.Event('input'));
 const decor=d.querySelector('input[name="decor"][value="800"]');decor.checked=true;decor.dispatchEvent(new w.Event('change'));
 assert.equal(d.querySelector('#price').value.replace(/\s/g,''),'13600₽');
 const date=d.querySelector('#event-date');date.value='2000-01-01';
 const form=d.querySelector('#order-form');form.dispatchEvent(new w.Event('submit',{cancelable:true}));
 assert.equal(d.querySelector('#summary-dialog').open,false);
 date.value=minOrderDate();date.dispatchEvent(new w.Event('input'));
 d.querySelector('#order-comment').value='<img src=x onerror=alert(1)>';
 form.dispatchEvent(new w.Event('submit',{cancelable:true}));
 assert.equal(d.querySelector('#summary-dialog').open,true);
 assert.match(d.querySelector('#summary-comment').textContent,/<img/);
 assert.equal(d.querySelector('#summary-comment img'),null);
 let downloaded=false;w.URL.createObjectURL=()=> 'blob:test';w.URL.revokeObjectURL=()=>{};
 w.HTMLAnchorElement.prototype.click=function(){downloaded=this.download==='kroshka-my-cake.txt';};
 d.querySelector('#download-order').click();assert.equal(downloaded,true);dom.window.close();
});
test('menu Escape and closing on navigation',()=>{
 const dom=setup(),w=dom.window,d=w.document,menu=d.querySelector('.menu-toggle');
 menu.click();assert.equal(menu.getAttribute('aria-expanded'),'true');
 d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
 assert.equal(menu.getAttribute('aria-expanded'),'false');assert.equal(d.activeElement,menu);
 menu.click();d.querySelector('#main-nav a').click();assert.equal(menu.getAttribute('aria-expanded'),'false');dom.window.close();
});
test('HTML has valid unique IDs, ARIA references, local links and packaged assets',()=>{
 const {window:w}=new JSDOM(readFileSync('dist/index.html','utf8'));const d=w.document;
 const ids=[...d.querySelectorAll('[id]')].map(x=>x.id);assert.equal(new Set(ids).size,ids.length);
 for(const el of d.querySelectorAll('[aria-labelledby],[aria-describedby],[aria-controls]')) for(const attr of ['aria-labelledby','aria-describedby','aria-controls']) for(const id of (el.getAttribute(attr)||'').split(' ').filter(Boolean)) assert.ok(d.getElementById(id),`Missing ARIA target ${id}`);
 for(const a of d.querySelectorAll('a[href^="#"]')) if(a.hash) assert.ok(d.getElementById(a.hash.slice(1)),a.hash);
 for(const el of d.querySelectorAll('img[src],script[src],link[href]')) {const value=el.getAttribute('src')||el.getAttribute('href');if(value.startsWith('./'))assert.ok(existsSync(`dist/${value.slice(2)}`),`Missing ${value}`);}
 assert.equal(d.querySelectorAll('h1').length,1);assert.equal(d.documentElement.lang,'ru');
 for(const img of d.querySelectorAll('img'))assert.ok(img.hasAttribute('alt'));
 for(const cake of Object.values(cakes))assert.ok(existsSync(`dist/assets/${cake.image}`));
 w.close();
});
test('axe semantic audit (jsdom; contrast/layout require real browser)',async()=>{
 const dom=setup(),w=dom.window;w.eval(readFileSync('node_modules/axe-core/axe.min.js','utf8'));
 w.HTMLCanvasElement.prototype.getContext=()=>null;
 const results=await w.axe.run(w.document,{rules:{'color-contrast':{enabled:false}}});
 assert.equal(results.violations.length,0,JSON.stringify(results.violations.map(x=>({id:x.id,help:x.help,nodes:x.nodes.map(n=>n.target)}))));
 w.close();
});
