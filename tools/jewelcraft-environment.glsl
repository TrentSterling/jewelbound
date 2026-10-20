vec3 environment(vec3 r){
 r=safeUnit(r);
 float up=clamp(r.y*.5+.5,0.0,1.0);
 vec3 sky=mix(vec3(.012,.009,.023),vec3(.14,.12,.23),up);
 float key=pow(max(dot(r,safeUnit(vec3(-.65,.85,1.0))),0.0),26.0);
 float rim=pow(max(dot(r,safeUnit(vec3(.85,.28,.5))),0.0),48.0);
 float crown=pow(max(dot(r,safeUnit(vec3(-.2,1.0,-.2))),0.0),20.0);
 float strip=pow(max(1.0-abs(dot(r,safeUnit(vec3(.4,.25,.85)))),0.0),70.0)*pow(max(r.y+.4,0.0),2.0);
 return sky+vec3(2.8,2.45,1.85)*key+vec3(.65,.58,1.6)*rim+vec3(.9,.68,.32)*crown+vec3(.3,.34,.55)*strip;
}
