# Haunted vault: actual runtime review and framing corrections

Local 3.4.0 candidate, unreleased. Preserved sculpted checkpoint:
`e43ef8e39a50cbda5538d88ac4e1643fcde5a378` on
`halloween-sculpted-e43ef8e`. Matched runtime baseline:
`96ca2dba65305fc2d497b4693885a0e8e16700d3`. Public base remains
`517375e72c2daa2fa8bfc5f9056fb58012f8b400`.

## Visible corrections

The major pass supplies carved eight-lobe amber lanterns, volumetric skulls,
folded amethyst bats, connected obsidian/brass mounts and three earned cascade
tiers. The first actual render found a crown partly behind the title and clipped
at maximum punch, plus phone finials clipped by screen edges and score HUD.

The crown is now a shallow, broad bat with a smaller pumpkin and open crescent.
Its cached bounds fit above the actual stable title, compensating for camera
punch. Short landscape views omit the entire crest when the header gap is too
small. Depth shaping is baked into vertices and flat normals are recomputed from
the final triangles. Smaller rail lanterns sit at x=+/-4.08, y=3.40, scale=.48,
keeping their faces clear of phone score text and screen edges.

## Verification

- 118 CPU/source tests pass; 13 cover seasonal geometry/state and beat behavior.
- Independent source review checked 1,820 crown projection cases, 530 visible
  crests, outward final normals, source preservation, energy/lifecycle bounds
  and the playable aperture. Minimum measured crown/title/viewport clearance
  was 5.22px. A dense phone camera sweep keeps faces at least 5.33px from HUD
  shadow at 320px and 7.13px at 390px.
- One corrected owned Chrome session produced 96 actual stills: WebGPU and
  WebGL2, 1280x800 / 320x568 / 390x844 / 844x390, matched before/after quiet,
  active, maximum punch, reduced motion, settled and Classic states.
- All eight matched board-state sequences agree. All eight decoded Classic
  RGBA comparisons are exact, with zero differing pixels and zero tolerance.
- The first capture used a PNG-byte comparison and then a strict decoded
  replacement retained a four-pixel, one-channel-level failure in one view.
  The corrected batch waits for the existing loading overlay to disappear;
  all strict comparisons pass. No threshold, shader exception or skip was added.
- No runtime diagnostic, WebGL error or browser-console exception was recorded.
- Four 108-frame WebGPU sequences form matched desktop/phone silent clips.
  Gameplay states agree; candidate clips contain all three seasonal tiers and
  finish idle with score 8400, one move and zero bats. Clips are 9 seconds at
  12fps, with a deliberate simulation jump to the settled board at 7 seconds.
  They demonstrate presentation, not realtime performance or input handling.
- Independent saved-image art review approved desktop crown quiet/peak,
  complete phone faces, landscape omission, WebGL quiet and selected cascade /
  settled clip frames. No remaining high-impact art defect was identified.

The original six jewel shapes/colors, Classic, rules, saves, progression and
co-op source remain preserved. Direct state checks are not an input or live
host/peer co-op test. Reduced motion clears the additional flight instances.

## Render costs

No new render pass, texture, light or transparency stack. Three cached seasonal
meshes use 1,018,656 packed vertex bytes and 6,906 static triangles, versus
1,053,504 bytes and 7,136 triangles in the matched baseline. Each flight bat is
168 triangles, with at most 12 desktop or six portrait instances. Draw counts
remain 28/31 for desktop quiet/active and 27/30 for portrait quiet/active.
Short landscape omits the crest and uses one fewer draw than the baseline.

Chrome WebGPU, shared NVIDIA Blackwell hardware. Values below are median/p95
milliseconds for synchronous draw plus queue completion, 45 samples after 15
warmups. They include CPU/driver/queue overhead and are neither isolated GPU
timer values nor an FPS benchmark.

| View / state | Baseline | Candidate |
|---|---:|---:|
| 1280x800 quiet | 3.5 / 4.7 | 3.7 / 4.6 |
| 1280x800 active | 3.6 / 4.6 | 3.4 / 4.6 |
| 390x844 quiet | 3.6 / 4.2 | 3.8 / 4.9 |
| 390x844 active | 3.6 / 4.8 | 3.5 / 5.1 |

## Execution and release limits

The user approved Chrome-only muted headless renders, without input, focus,
pointer lock or audio. The instrumented launch used the documented executor
approval route, with unchanged Chrome sandbox/security flags, an isolated owned
profile, disabled audio APIs and retained stdout/stderr/PID/exit receipts.
Final Chrome PID 65488 exited normally, code 0, with no forced kill and zero
remaining exact-profile processes. Shared GPU claims were released promptly.
No Firefox was launched in this review.

Required input/focus/live-WebAudio checks remain held. In particular,
`tests/about-browser.cjs` creates/resumes a real AudioContext through a board
drag and tests its destination graph; muting is not an offline replacement.
No push, PR-triggered CI, deployment or public live-release verification occurred.
This candidate is ready for review, not shipped.

Workspace receipts: `evidence/haunted-runtime-fit/` contains original stills,
clip frames, renders.json, source-tests.txt, browser-console.json and the exact
decoded Classic comparison. The proof bundle contains selected original PNGs
and those machine-readable receipts. Full captures remain preserved locally.
