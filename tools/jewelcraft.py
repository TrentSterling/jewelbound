"""Apply Jewelbound's presentation layer after the preserved source pipeline.

Only rendering, UI presentation and branded welcome selection may change here.
Board rules, networking, storage, controls, timing and audio bytes stay intact.
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]

def apply(html):
    def rep(old, new, count=1):
        nonlocal html
        actual = html.count(old)
        if actual != count:
            raise ValueError(f'Jewelcraft expected {count}, got {actual}: {old[:100]}')
        html = html.replace(old, new)

    def section(start, end, replacement):
        nonlocal html
        assert html.count(start) == 1 and html.count(end) == 1
        a, b = html.index(start), html.index(end)
        html = html[:a] + replacement.rstrip() + '\n' + html[b:]

    section('function buildWorld(renderer){', ' const worldMesh=renderer.createMesh(g.data());',
            (ROOT/'tools/jewelcraft-world.js').read_text(encoding='utf-8'))
    section('vec3 environment(vec3 r){', '// V2.6: finite analytic reflection rig.',
            (ROOT/'tools/jewelcraft-environment.glsl').read_text(encoding='utf-8'))
    section('vec3 skyColor(vec2 uv,float aspect,float clock){', 'vec3 tone(vec3 x)',
            (ROOT/'tools/jewelcraft-sky.glsl').read_text(encoding='utf-8'))
    rep("const GEM_COLORS=['#f40838','#1652ff','#0bc979','#a02cf0','#ffc124','#c1e4ff'].map(color);",
        "const GEM_COLORS=['#ed2458','#3162ed','#18c584','#a149e9','#eebc32','#d0e8ff'].map(color);")
    rep('base*(0.025+ndl*0.16+facet*0.27+core*0.025)+base*internal*(0.30+cut*0.70)',
        'base*(0.055+ndl*0.20+facet*0.32+core*0.065)+base*internal*(0.26+cut*0.66)')
    rep('vec3(1.0,0.94,0.80)*spec*2.0', 'vec3(1.0,0.94,0.84)*spec*1.75')
    rep('return mix(col,vec3(0.07,0.14,0.18),fog);', 'return mix(col,vec3(0.010,0.008,0.022),fog);')
    rep("const crown=renderer.createMesh(gemGeometry(1,7).data(),4);", "const crown=renderer.createMesh(gemGeometry(5,7).data(),4);")
    rep("color('#429dff'),this.juice*.32", "color('#ae8bdd'),this.juice*.32")
    # Twelve existing payoff rays become warm/lavender crystal light, preserving
    # their event timing, intensity, particle counts and comfort switches.
    rep('vec3 col=0.55+0.45*cos(6.2831*(fi*0.137+t*0.18+vec3(0.0,0.33,0.67)));',
        'vec3 col=mix(vec3(1.0,0.68,0.28),vec3(0.60,0.43,1.0),0.5+0.5*sin(fi*1.7));')
    rep('let col=0.55+0.45*cos(6.2831*(fi*0.137+t*0.18+vec3f(0.0,0.33,0.67)));',
        'let col=mix(vec3f(1.0,0.68,0.28),vec3f(0.60,0.43,1.0),0.5+0.5*sin(fi*1.7));')
    rep('float d=(length(q)-0.80)*70.0;', 'float d=(max(abs(q.x),abs(q.y))*0.924+min(abs(q.x),abs(q.y))*0.383-0.80)*70.0;')
    rep('float d=(length(q)-0.72)*24.0;', 'float d=(max(abs(q.x),abs(q.y))*0.924+min(abs(q.x),abs(q.y))*0.383-0.72)*24.0;')
    rep("'#010a10',0,.76", "'#03030b',0,.84")
    rep("this.text('Cabinet controls'", "this.text('The atelier'")
    rep("[['welcome-back','Welcome back'],['dazzling','Big combo'],['team','Team Resonance']]",
        "[['brilliant','Crystal voice'],['dazzling','Big combo'],['team','Team Resonance']]")
    rep("window.gemsTogether=app;", "window.jewelbound=app;")
    rep("link.download='gems-together-'", "link.download='jewelbound-'")
    rep('const x=bt.x,w=bt.w,yy=bt.y+bt.h+12,f=', 'const x=16,w=a.cssWidth-32,yy=bt.y+bt.h+12,f=')
    rep("wordmark:'JEWELBOUND',version:'3.3.7'", "wordmark:'JEWELBOUND',version:'3.3.25'")
    # B005: one shared camera target keeps scene, picking and stable HUD aligned.
    rep('framing=cabinetFraming(w,h),z=framing.distance;const stable=matMul(perspective(42*PI/180,aspect,.1,150),lookAt([0,.62,z],[0,0,0],[0,1,0]));',
        'framing=cabinetFraming(w,h),z=framing.distance,targetY=framing.targetY||0;const stable=matMul(perspective(42*PI/180,aspect,.1,150),lookAt([0,.62+targetY,z],[0,targetY,0],[0,1,0]));')
    rep('updateCamera(){const aspect=this.cssWidth/this.cssHeight,tan=Math.tan(42/2*PI/180),z=cabinetFraming(this.cssWidth,this.cssHeight).distance;',
        'updateCamera(){const framing=cabinetFraming(this.cssWidth,this.cssHeight),targetY=framing.targetY||0,aspect=this.cssWidth/this.cssHeight,tan=Math.tan(42/2*PI/180),z=framing.distance;')
    rep('this.eye=[sx,.62+sy,z*(1-.045*(this.punch||0))];this.target=[0,0,0];',
        'this.eye=[sx,.62+targetY+sy,z*(1-.045*(this.punch||0))];this.target=[0,targetY,0];')
    # Photo mode has its own orbit and export layout, without the play controls.
    rep('const z=cabinetFraming(this.cssWidth,this.cssHeight).distance*p.zoom;',
        'const z=jewelcraftOriginalFraming(this.cssWidth,this.cssHeight).distance*p.zoom;')
    rep('nh=h<460?34:43,ny=Math.max(5,top-nh-5);',
        'nh=h<460?34:43,ny=framing.targetY===undefined?Math.max(5,top-nh-5):5;')
    # B010: anchor the narrow title and reclaim the score strip for the tray.
    rep('titleY=Math.max(10,top-93);', 'titleY=framing.narrowFit?10:Math.max(10,top-93);')
    score_start='   const sw=Math.min(w-28,Math.max(310,right-left)),sy=Math.max(titleY+47,top-42);'
    score_end="this.text(a.best.toLocaleString('en-US'),w/2+sw/2-14,sy+10,14,UI_ART.text,'right',sw*.28);"
    score_a=html.index(score_start);score_b=html.index(score_end,score_a)+len(score_end)
    score_original=html[score_a:score_b]
    rep(score_original,'   if(framing.narrowFit)this.narrowScorePlaque(left,top,right,bottom);else{'+score_original+'}')
    # B001: stage arrivals use the existing title plaque. Keep the ordinary stage
    # HUD, event lifetime, scenery, sound and effects; remove only the board cover.
    rep("this.plaque(w/2-nw/2,ny,nw,nh);this.text(GAME_BRAND.wordmark,w/2,ny+9,h<460?18:23,UI_ART.highlight,'center',nw-34,.12,true);",
        "this.titlePlaque(w/2-nw/2,ny,nw,nh,h<460?18:23);")
    rep("this.plaque(w/2-nw/2,titleY,nw,40);this.text(GAME_BRAND.wordmark,w/2,titleY+11,21,UI_ART.highlight,'center',nw-30,.12,true);",
        "this.titlePlaque(w/2-nw/2,titleY,nw,40,21);")
    banner_start=' const {cx,cy,bw}=this.boardBox(),inn=clamp(age/.35,0,1),out=clamp((age-(L-.4))/.4,0,1)'
    assert html.count(banner_start)==1
    a=html.index(banner_start)
    b=html.index('p.opacity=1;};',a)+len('p.opacity=1;};')
    html=html[:a]+' // Arrival text is rendered by titlePlaque above the board.\n};'+html[b:]
    rep('const lift=this.sc&&a.time-this.sc.birth<2.6?bw*.2:0,', 'const lift=0,')
    # B002: retain challenge details, relocating only when short-screen controls
    # occupy their old position below the score plaque.
    rep('if(this.plaqueAt){const [x,y,w,h]=this.plaqueAt,compact=a.cssHeight<460,yy=y+h+(compact?100:116);this.text(label,',
        'if(this.plaqueAt){const {x,y:yy,w,relocated}=this.challengeStatusLayout(),compact=a.cssHeight<460;if(relocated)this.plaque(x-8,yy-8,w+16,54);this.text(label,')
    rep("else{const {cx,bw}=this.boardBox(),y=this.boardRect.y+this.boardRect.h+9;this.text(label+' / '+(hasGhost?'ghost '+gs:detail),cx,y,11,UI_ART.highlight,'center',bw-8,.12,true);}",
        "else this.challengeInlineStatus(label,detail,hasGhost,gs);")
    # B015: retain original toast clocks, fitting and fade; resolve only its drawing.
    rep("this.plaque(tx,ty,tw,32);this.text(text,tx+tw/2,ty+9,13,UI_ART.highlight,'center',tw-20);",'this.playNotice(text,tx,ty,tw);')
    # B016: keep puzzle seals in their own projected cells.
    rep("p.box(q[0]-3,q[1]+19,6,6,'#ffe27a',2);",'this.drawPuzzleTarget(i,q);')
    # B017: retain original AA control rectangles when reserving portrait footer space.
    rep('ry=Math.min(h-57,bottom+28);if(a.aaCompare)','ry=Math.min(h-57,(framing.portraitFooter?.originalBottom??bottom)+28);if(a.aaCompare)')
    presentation='\n'.join((ROOT/('tools/'+name)).read_text(encoding='utf-8') for name in ['jewelcraft-ui.js','jewelcraft-stage.js','jewelcraft-challenge.js','jewelcraft-hint.js','jewelcraft-framing.js','jewelcraft-results.js','jewelcraft-status.js','jewelcraft-title-clearance.js','jewelcraft-narrow-score.js','jewelcraft-narrow-results.js','jewelcraft-menu-return.js','jewelcraft-notice.js','jewelcraft-target.js','jewelcraft-footer.js'])
    rep('(async function boot(){', presentation+'\n(async function boot(){')
    # Add a sampled glyph branch to each native UI backend. Existing analytic
    # shapes and their clipping/batching are untouched.
    rep('out vec4 frag;\nvoid main(){vec2 p=abs(vLocal)', 'out vec4 frag;uniform sampler2D uGlyphAtlas;\nvoid main(){vec2 p=abs(vLocal)')
    rep('void main(){vec2 p=abs(vLocal),h=vRect.zw-vec2(1.5);', '''void main(){
 if(vShape.x>1.5){vec2 uv=vLocal/(vRect.zw*2.0)+vec2(.5);float a=texture(uGlyphAtlas,vStyle.xy+uv*vStyle.zw).a*vPaint.a;frag=vec4(vPaint.rgb*a,a);return;}
 vec2 p=abs(vLocal),h=vRect.zw-vec2(1.5);''')
    rep('@group(0) @binding(0) var<uniform> Uv:U;', '@group(0) @binding(0) var<uniform> Uv:U; @group(0) @binding(1) var glyphAtlas:texture_2d<f32>; @group(0) @binding(2) var glyphSampler:sampler;')
    rep('let aa=max(fwidth(sd),.7);let alpha=', '''let aa=max(fwidth(sd),.7);
 if(i.shape.x>1.5){let uv=i.local/(i.rect.zw*2.0)+vec2f(.5);let a=textureSampleLevel(glyphAtlas,glyphSampler,i.style.xy+uv*i.style.zw,0.0).a*i.paint.a;return vec4f(i.paint.rgb*a,a);}
 let alpha=''')
    rep('async init(){const r=this.r;', 'async init(){const r=this.r;this.prepareTypography();')
    rep('if(r.gl){const g=r.gl;this.program=r.program(UI_VS_GL,UI_FS_GL);', '''if(r.gl){const g=r.gl;
 this.atlasTexture=g.createTexture();g.bindTexture(g.TEXTURE_2D,this.atlasTexture);g.texImage2D(g.TEXTURE_2D,0,g.RGBA,g.RGBA,g.UNSIGNED_BYTE,this.glyphCanvas);
 g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MAG_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_S,g.CLAMP_TO_EDGE);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_T,g.CLAMP_TO_EDGE);
 this.program=r.program(UI_VS_GL,UI_FS_GL);''')
    rep('else{const d=r.device;this.buffer=d.createBuffer', '''else{const d=r.device;
 this.atlasTexture=d.createTexture({size:[1536,1344],format:'rgba8unorm',usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT});
 d.queue.copyExternalImageToTexture({source:this.glyphCanvas},{texture:this.atlasTexture},[1536,1344]);
 this.atlasSampler=d.createSampler({minFilter:'linear',magFilter:'linear'});this.buffer=d.createBuffer''')
    rep("entries:[{binding:0,resource:{buffer:this.uniform}}]", "entries:[{binding:0,resource:{buffer:this.uniform}},{binding:1,resource:this.atlasTexture.createView()},{binding:2,resource:this.atlasSampler}]")
    rep("g.useProgram(this.program);g.uniform2f", "g.useProgram(this.program);g.activeTexture(g.TEXTURE0);g.bindTexture(g.TEXTURE_2D,this.atlasTexture);g.uniform1i(r.loc(this.program,'uGlyphAtlas'),0);g.uniform2f")
    rep('og-image.png?v=3', 'og-image.png?v=4', 2)
    css='''<style id="jewelcraft-theme">
html,body{background:#080810}#loading{background:radial-gradient(ellipse at 50% 42%,#221a32,#070810 70%)}
#load-inner h2{color:#f5e8c9;letter-spacing:.22em}#load-inner svg{color:#c6afe9;filter:drop-shadow(0 0 24px #8a66bc55)}
#load-status{color:#c3b9cf}#load-bar:after{background:#d2b785}
#trontAbout{--about-surface:#10101c!important;--about-accent:#bda77b!important}
#trontAbout>summary{background:#11111e;border-color:#776447;border-radius:3px;color:#efe7d7}
#trontAbout>.tront-discovery{background:#10101c;border-color:#776447}
#trontAbout .tront-discovery__heading h2{font-family:Georgia,serif;font-weight:400;letter-spacing:.04em;color:#f5e8c9}
</style>'''
    rep('</head>', css+'</head>')
    return html

if __name__ == '__main__':
    target=ROOT/'index.html'
    target.write_text(apply(target.read_text(encoding='utf-8')),encoding='utf-8',newline='\n')
