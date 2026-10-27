"""Strictly additive seasonal presentation. Run only after jewelcraft.apply."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def apply(html):
    def rep(old,new):
        nonlocal html
        assert html.count(old)==1, (old[:80],html.count(old))
        html=html.replace(old,new)
    seasonal='\n'.join((ROOT/'tools'/name).read_text(encoding='utf-8') for name in ['jewelcraft-haunted-assets.js','jewelcraft-haunt-beats.js','jewelcraft-halloween.js'])
    rep('(async function boot(){',seasonal+'\n(async function boot(){')
    # A saturated lapidary finish for seasonal carvings only. Both shader
    # backends are generated from this shared source; playable gems stay kind 2.
    rep('   }else if(kind>7.5&&kind<9.5){', '''   }else if(kind>10.5&&kind<11.5){
    col=base*(0.006+energy*0.65);
   }else if(kind>9.5&&kind<10.5){
    col=base*(0.18+0.44*ndl)+e*base*(0.055+fres*0.10)+base*spec*0.35+base*energy*0.5;
   }else if(kind>7.5&&kind<9.5){''')
    rep('this.world.worldMesh,this.world.islandMesh,...this.world.gemMeshes,this.world.crown,this.world.orbit,',
        "this.world.worldMesh,this.world.islandMesh,...this.world.gemMeshes,...(this.season==='halloween'?this.seasonMeshes():[this.world.crown,this.world.orbit]),")
    a=html.index("  }else if(this.tab==='beauty'){")
    b=html.index("  }else if(this.tab==='lab'){",a)
    block=html[a:b]
    import re
    revised=re.sub(r'y\+(\d+)',lambda m:'y+'+str(int(m[1])+68) if int(m[1])>=56 else m[0],block)
    revised=revised.replace("this.text('Living jewels',x,y+3", "this.text('Cabinet and jewels',x,y+3")
    revised=revised.replace("   this.slider('living-light'", "   this.button('jewelbound-season',a.season==='halloween'?'Halloween vault >':'Classic jewelcraft >',x,y+42,w,42);\n   this.slider('living-light'")
    rep(block,revised)
    return html
