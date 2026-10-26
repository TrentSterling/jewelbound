# Haunted reliquary: substantial production art pass

Local, unreleased candidate built on preserved checkpoint
`96ca2dba65305fc2d497b4693885a0e8e16700d3`. Previous reviewed branches and Library
deliverables remain intact. Version remains 3.4.0 because this is one unreleased
Halloween content pass, not a sequence of public releases.

## Production changes

- Rebuilt amber lanterns: eight lobes, depressed crown, twisted stem, beveled jade
  leaves, copper mounts, thick stepped carving lips and recessed cavity floors.
- Rebuilt skulls: volumetric cranium, raised brow shelves, orbit walls, cheekbone
  ledges, narrow jaw, four broad tooth groups and a chased diadem. Mirrored normals
  face outward; cavity floors sit in front of their face backing.
- Rebuilt bats: substantial head/body, amber eye facets, thick leading edges and
  folded membrane planes. Hero ornaments use 308 triangles; flight uses 168 with
  the same silhouette/folds and a simplified rim.
- Wider crescent-backed crown, stronger corner finials, linked obsidian pilasters
  and brass lantern cradles. Removed hidden repeated pumpkin clusters and reduced
  the candle group to two seated crystals per side.
- Three earned cascade beats: x3 awakening (one pair), x4–5 procession (four pairs),
  x6+ or blast/prism eclipse (six pairs). Phone feedback caps at three per side.
  Each has a distinct attack, stagger, spread, lift and release. Upgrades blend
  over 180ms without restarting the original 2.2-second deadline.
- Opaque material 11 gives pumpkin cavities bounded amber warmth using existing
  instance energy. No new light, texture, transparency stack or render pass.

Classic, six playable gem cuts/colors, board rules, saves, progression, co-op and
audio stay intact. Comfort controls suppress the additional motion/particles;
Flashes Low scales warmth to 35%, Off uses zero event energy. Frozen time holds
the pose. Theme changes/new boards clear presentation events.

## Budget

| Resource | Reviewed phone candidate | Sculpted candidate |
|---|---:|---:|
| Static seasonal triangles | 7,136 | 6,906 |
| Flight bat triangles | 180 | 168 |
| Maximum desktop flight triangles | 2,160 | 2,016 |
| Cached seasonal vertex bytes | 1,053,504 | 1,018,656 |
| Cached seasonal meshes | 3 | 3 |

No runtime performance claim is made: browser/GPU testing remains paused.

## Allowed verification

All 117 CPU/source tests pass, including source preservation, geometry/aperture
bounds, phone projection through camera punch, event lifetime and tier merging,
comfort behavior and finite cached meshes. Generation is reproducible. Independent
source review verified outward normals, zero static triangle intersections with
the playable aperture, shader-converter preservation of the opaque material,
bounded energy and preserved original source. Independent art review approved
the actual production meshes under a CPU rasterizer, including 20/21/28px finials.

The previews use Node VM extraction and NumPy/Pillow opaque software rasterization.
They are clearly labeled CPU ASSET PREVIEW — NOT IN-GAME VALIDATED. Their lighting
is approximate. They do not establish game-camera/HUD framing, browser shader
compilation, actual game rendering cost or visual approval in either renderer.
The material-response sheet samples the production cavity formula at energy
0/.12/.25/.40; it is an asset study, not gameplay footage.

## Held actions

No Firefox/Chromium launch, browser/GPU test, physical or simulated input, focus,
audio playback/test, push, PR, CI or deployment was performed for this pass.
Browser/GPU testing is paused following the Firefox crash incident. Earlier
input/focus/live-WebAudio release gates remain pending as well. Their scripts and
workflow were not weakened. Actual runtime visuals, shader compilation, measured
costs and exact-commit release checks require later permission and verification.
