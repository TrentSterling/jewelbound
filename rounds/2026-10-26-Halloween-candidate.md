# Halloween vault 3.4.0 candidate

Status: local reviewed candidate, not published. Based on main commit
`517375e72c2daa2fa8bfc5f9056fb58012f8b400` (Jewelbound 3.3.29).
The live Jewelbound document and source were checked before implementation.

## Content

The existing obsidian-and-gold co-op jewel cabinet gains faceted amber pumpkins
with dark carved cavities, ivory skull mounts, amethyst bats, gold web filigree,
green crystal candles and a seasonal crown. The six original playable jewels
retain their geometry, colors and rules. Big cascades and special clears release
at most twelve opaque instanced bats above the side HUD and outside the tray.
The second art pass improves skull anatomy, amber material, concave bat wings,
composition and crown framing under the existing camera punch.

Settings > Jewels switches between Halloween vault and Classic jewelcraft.
The separate `jewelbound-season-v1` preference defaults to Halloween in October
and Classic otherwise; explicit choices persist. Board snapshots, progression,
existing storage keys and co-op messages are unchanged. Flight feedback respects
motion, particles and flash preferences. Portrait hides the entire seasonal crown
to avoid a partial ornament behind its HUD.

## Permitted validation

- Reproducible `python tools/polish.py` output, SHA-256
  `a478958a3d55be9c7feb0fe49fc4c1794aeff96ec4188977473a0b9c2d40ccb4`.
- 110 source/CPU tests passed, including five new seasonal contracts. Game board,
  networking, playable geometry, audio bytes and immutable source drop compare
  identically to the base.
- Muted, isolated headless Chrome 155 on the NVIDIA Blackwell adapter: matched
  actual WebGPU and WebGL2 scene renders at 1280x800, 390x844 and 844x390,
  including peak camera punch, high contrast, settings and active cascade flight.
- Both backends: original, Classic and Halloween match exactly across six seeds,
  eight moves per seed and five special-clear fixtures. Populated save fixtures
  retain their values; 100 theme switches preserve other storage and game state
  with no growth in renderer resources.
- One self-contained HTML with About assets inlined boots and completes a direct
  game-state move on both backends with HTTP(S)/WebSocket requests blocked.
  The packaged file selects solo mode under `file:`.
- Independent source/CPU and actual-render art review found no remaining blocker
  within their scope. Review included the stronger art pass and visible flock.

No simulated input, physical input, focus changes, pointer lock, audio playback
or live audio assertions were used in these checks. Scene simulation is not a
substitute for input or real network co-op qualification.

## Cost and evidence

Seasonal cached vertex data totals 1,053,504 bytes and 7,136 static triangles.
It adds three cached mesh resources at boot, including a 180-triangle bat mesh;
the bounded flock adds at most 2,160 instanced triangles and one draw while active.
Idle desktop draw calls remain 28, portrait uses 27 instead of 28. No bloom,
transparent material stack or added render pass.

Synchronized frame-completion timings (70 measured frames after 20 warmups) on
this machine: WebGPU original median/p95 4.0/5.1ms, Halloween 4.0/5.0ms;
WebGL2 original 0.6/0.8ms, Halloween 0.5/1.3ms. These are bounded headless samples,
not real-time FPS or a guarantee for other devices.

The matched silent MP4 is eight seconds, 1920x600, original left and candidate
right. It shows the same seeded swap at a fixed simulation clock (12fps); the
capture fixture zeroes the existing slow-motion deadline for repeatability.
It is actual renderer output, not real-time performance footage. It has one H.264
video stream and no audio stream. Evidence and reusable harnesses are packaged
separately with the local candidate.

## Held release gates

`tools/verify.mjs` uses `page.front()` and real browser pointer gestures. The
unchanged `.github/workflows/about-checks.yml` runs `tests/about-browser.cjs` on
every PR and main push. That test performs a board drag, About clicks and
fullscreen changes, wraps real AudioContext constructors, then compares running
context states before/after About. The drag initializes/resumes the live game
audio graph connected to the destination; `--mute-audio` does not make this an
offline audio assertion. The test does not analyze a recording or spectrum.

User clarification for input is pending; live WebAudio checks remain held under
the user's audio restriction. No gate was weakened or bypassed. No push, draft PR,
CI run, deployment or live release verification has been attempted. Required
exact-commit CI and established destination verification must pass before release.
