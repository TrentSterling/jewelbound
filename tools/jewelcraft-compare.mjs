// Assemble captured pixels into labeled review sheets; original PNGs are untouched.
// node tools/jewelcraft-compare.mjs [left capture label] [right capture label]
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,statSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {launch,until,sleep} from './cdp.mjs';
const [left='gems-together',right='after']=process.argv.slice(2);
for(const label of [left,right])assert.match(label,/^[a-z-]+$/);
const root=resolve('tools/out/jewelcraft');
const source=JSON.parse(readFileSync(`${root}/${left}/capture.json`));
const target=JSON.parse(readFileSync(`${root}/${right}/capture.json`));
for(let i=0;i<source.length;i++){
 assert.deepEqual(source[i].viewport,target[i].viewport);
 assert.deepEqual(source[i].state,target[i].state,'Comparison must show the same board state');
 assert.deepEqual(source[i].pair,target[i].pair);
}
const stamp=new Date().toISOString().replace(/[:.]/g,'-');
const out=resolve(root,'comparisons',stamp);mkdirSync(out,{recursive:true});
const receipts=[];
for(const [view,mode] of [['desktop','board'],['desktop','play'],['phone','board'],['phone','play'],['landscape','board']]){
 const {viewport:[w,h]}=source.find(x=>x.name===view),W=w*2+72,H=h+178;
 const cards=[['GEMS TOGETHER',left],['JEWELBOUND',right]].map(([title,label])=>{
  const file=`${root}/${label}/${view}-${mode}.png`,captured=statSync(file).mtime.toISOString();
  return `<section><h2>${title}</h2><p>Captured ${captured}</p><img src="${pathToFileURL(file).href}" width="${w}" height="${h}"></section>`;
 });
 const html=`<!doctype html><meta charset="utf-8"><title>Jewelbound comparison</title><style>*{box-sizing:border-box}body{margin:0;padding:24px;background:#080a12;color:#ede9e0;font:16px Arial,sans-serif}header{height:72px}h1{font:28px Georgia,serif;margin:0 0 10px}header p,section p{color:#bdb7c8;margin:0}main{display:flex;gap:24px}h2{font-size:19px;letter-spacing:2px;margin:0 0 7px}section p{font-size:13px;margin-bottom:14px}img{display:block}</style><header><h1>Same game, two art directions</h1><p>${view} ${w} x ${h} / ${mode} / seed 1 / one real pointer swap / score 150</p></header><main>${cards.join('')}</main>`;
 const file=`${out}/${view}-${mode}.html`;writeFileSync(file,html);
 const page=await launch({port:9775,width:W,height:H});
 try{
  await page.goto(pathToFileURL(file).href);
  await until(()=>page.eval('[...document.images].every(i=>i.complete&&i.naturalWidth>0)'),{timeout:10000});
  const png=`${out}/${view}-${mode}.png`;await page.shot(png);receipts.push(png);
 }finally{page.kill();await sleep(800);}
}
writeFileSync(`${out}/comparison.json`,JSON.stringify({createdUtc:new Date().toISOString(),left,right,matched:true,images:receipts},null,2));
console.log(JSON.stringify({out,matched:true,images:receipts},null,2));
