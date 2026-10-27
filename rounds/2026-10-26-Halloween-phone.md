# Halloween portrait feedback follow-up

Local candidate only. The reviewed `8c7f40c5a905137941643a5bd003a1a40370ae33`
checkpoint remains preserved as branch `halloween-reviewed-8c7f40c`.

The desktop flock was outside the narrow portrait viewport. Phones now emit at
most three small opaque bats per side along the visible outer rails. Their size
and location use the union of the current camera and stable playable aperture;
inverse plane projection keeps the mesh inside those measured gutters through
camera punch. No stale HUD rectangles, new textures, meshes or render passes.
Desktop, photo and Classic rendering retain the prior behavior. Panels, AA
comparison, finished runs and reduced motion suppress portrait flights.

Validation: all 111 source/CPU tests pass. The new projection test uses the actual
camera/framing functions at 320x568, 320x720, 390x664 and 390x844, through punch
1.2. Independent technical review additionally checked 432 camera/time cases and
41,472 projected jewel bounds with conservative landing/hover scaling: no bat
intersections. Independent art review approved active, peak, reduced and settled
views at 320x568 and 390x844 on WebGPU and WebGL2. At 320px the payoff is deliberately
subtle. An existing achievement/About overlap also occurs in the preserved
baseline and is unaffected.

Eight actual-render comparison configurations preserve exact board snapshots
and resource counts against the reviewed candidate. Six bats remain visible at
peak, zero remain in reduced/settled views. Classic PNGs match byte-for-byte when
both fixtures use the same simulation and wall-effect clocks. Earlier naive
pixel assertions failed because the existing visual effects also use wall time;
the final capture controls both clocks without modifying production code.

Phone active-flight costs: 30 draws and 30 cached resources for both versions;
the new phone path uses six bat instances versus up to twelve before. Seventy
synchronized WebGPU measurements after twenty warmups gave median/p95 3.1/4.4ms
before, 3.6/4.7ms after. These bounded headless samples are not real-time FPS.

The silent 390x844 matched clip shows preserved candidate left, phone polish
right. At 4 seconds it cuts forward 60 simulation seconds to a settled board,
then shows 4 seconds ready for the next move. The capture is deterministic
direct-state renderer output, with automatic animation disabled and a shared
wall-effect clock; it is not performance footage. Real elapsed time is retained
separately for the timing samples.

Input/focus/live-WebAudio release gates remain pending and unchanged. No push,
PR, CI, deployment or live-release verification was performed for this follow-up.
