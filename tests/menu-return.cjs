const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../tools/jewelcraft-menu-return.js'),'utf8');
function fixture(width=320){
 const calls=[],m={x:12,y:12,w:width-24,h:296,body:{x:30,y:158,w:width-60,h:115}},r={left:width-121,top:12,right:width-12,bottom:52,width:109,height:40},summary={parentElement:{open:false},getBoundingClientRect:()=>r};
 class CabinetUI{drawPanel(token){this.text('Your announcer',33,33,23,'ivory','left',m.w-133,.12,true);this.button('announcer-back','Audio',m.x+m.w-94,m.y+12,76,37,'original-meta');this.button('other','Other',30,180,260,42);this.text('Body',30,160,17,'ivory','left',260);if(token==='throw')throw Error('render error');return token;}}
 vm.runInNewContext(source,{CabinetUI,document:{querySelector:()=>summary}});
 const ui=new CabinetUI();Object.assign(ui,{app:{panelOpen:true,expedition:{run:{id:'retained'}}},panelLayout:()=>m,measure:(s,h)=>s.length*h*.56,text:(...args)=>calls.push(['text',...args]),button:(...args)=>calls.push(['button',...args])});return{ui,calls,m,r,summary};
}
test('colliding header keeps full heading, original action metadata and target size',()=>{
 for(const width of [320,390,568]){const f=fixture(width),state=JSON.stringify(f.ui.app);assert.equal(f.ui.drawPanel('retained-return'),'retained-return');const b=f.calls.find(c=>c[0]==='button');assert.deepEqual(b.slice(1,3),['announcer-back','Audio']);assert.deepEqual(b.slice(5),[76,37,'original-meta']);assert.equal(b[3]+76+6,f.r.left);assert.equal(b[4],24);assert.equal(f.ui.menuReturnClearance.header.rows.join(' '),'Your announcer');assert.ok(f.ui.menuReturnClearance.header.font>=12);assert.equal(JSON.stringify(f.ui.app),state);assert.deepEqual(f.calls.slice(-2),[['button','other','Other',30,180,260,42],['text','Body',30,160,17,'ivory','left',260]]);}
});
test('scoped renderer hooks restore after successful and failed draws',()=>{for(const token of ['ok','throw']){const f=fixture(),text=f.ui.text,button=f.ui.button;if(token==='throw')assert.throws(()=>f.ui.drawPanel(token),/render error/);else f.ui.drawPanel(token);assert.equal(f.ui.text,text);assert.equal(f.ui.button,button);}});
test('photo, closed panel, open About, hidden and noncolliding controls preserve exact calls',()=>{
 for(const amend of [f=>f.ui.app.expedition.photo={},f=>f.ui.app.panelOpen=false,f=>f.summary.parentElement.open=true,f=>f.r.width=0,f=>f.r.top=200,f=>f.r.left=999]){const f=fixture();amend(f);f.ui.drawPanel('ok');assert.equal(f.ui.menuReturnClearance,null);assert.deepEqual(f.calls[0],['text','Your announcer',33,33,23,'ivory','left',163,.12,true]);assert.deepEqual(f.calls[1],['button','announcer-back','Audio',214,24,76,37,'original-meta']);}
});
test('current DOM geometry is remeasured and no stale clearance survives resize',()=>{const f=fixture(568);f.ui.drawPanel();const x=f.ui.menuReturnClearance.back.x;f.r.left-=20;f.ui.drawPanel();assert.equal(f.ui.menuReturnClearance.back.x,x-20);f.r.top=200;f.ui.drawPanel();assert.equal(f.ui.menuReturnClearance,null);});
