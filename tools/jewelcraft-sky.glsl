vec3 skyColor(vec2 uv,float aspect,float clock){
 vec2 q=(uv-vec2(.5,.48))*vec2(aspect,1.0);
 vec3 col=mix(vec3(.010,.007,.021),vec3(.002,.003,.010),smoothstep(.15,.95,uv.y));
 vec2 violet=q-vec2(-.52,.05);
 vec2 amber=q-vec2(.62,-.08);
 col+=vec3(.035,.017,.072)*exp(-dot(violet,violet)*4.2);
 col+=vec3(.055,.028,.010)*exp(-dot(amber,amber)*5.4);
 float mist=noise21(uv*vec2(7.0,9.0)+vec2(clock*.004,0.0));
 float grain=noise21(uv*vec2(22.0,28.0)+vec2(0.0,clock*.003));
 col+=vec3(.005,.004,.011)*smoothstep(.45,.9,mist+grain*.2);
 vec2 lattice=uv*vec2(420.0*aspect,420.0);
 float dust=step(.9992,hash21(floor(lattice)))*pow(max(0.0,1.0-length(fract(lattice)-vec2(.5))*2.0),3.0);
 col+=vec3(.22,.17,.11)*dust;
 float vignette=clamp(1.0-dot(q,q)*.27,.35,1.0);
 return col*vignette;
}
