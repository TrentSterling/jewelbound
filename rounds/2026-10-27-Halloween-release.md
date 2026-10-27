# Halloween release qualification

The reviewed artwork checkpoint is
`6fbeac56a89abc81add71093033682fe5f4c4980`, preserved on the remote branch
`backup/jewelbound-halloween-6fbeac5`. Remote main was checked before publication
and remained `517375e72c2daa2fa8bfc5f9056fb58012f8b400`; no newer work or open PRs
needed integration. Pages is configured to publish only main at
https://tront.xyz/jewelbound/.

The user subsequently authorized isolated muted headless Chrome interaction
tests and existing CI WebAudio initialization. Physical input, cursor warping,
desktop focus changes, audible playback and Firefox remain prohibited. Draft
PR #1 starts the unchanged About browser workflow; no skip flags, removed
assertions or modified CI triggers were used.

## Local checks

- All 118 source/game contracts and 11 Chrome lifecycle mocks pass.
- The existing gameplay release gate passes 22/22 on actual WebGPU Chrome:
  version, board, solo isolation, right-click behavior, point expiry, simulated
  drag scoring, desktop/phone About clearance and clean diagnostics.
- The established co-op gate passes 15/15 in fresh owned profiles: private
  host/peer scoring, high-five and team Resonance, isolated random-room spectator
  restrictions, sync and host handoff. It never joins the real public room.
- All four owned Chrome exits were confirmed. The two gameplay processes exited
  with code 0; the two co-op processes received exact-child SIGTERM after the
  bounded graceful-close window. An independent exact-profile process query
  confirmed zero remaining processes before both shared GPU claims were released.
- The production index remains byte-identical to the reviewed artwork:
  SHA-256 `374eb8167ecd6102c7f272320250e9aaed968ccf0ee09d1e9ab430e5da733a01`.
  Its 96 actual-render captures, eight exact Classic comparisons and independent
  art/source reviews remain applicable; no artwork changed in this release step.

## Safe harness changes

The repository CDP helper now uses the previously proven owned Chrome lifecycle:
fixed Google Chrome binary, forced headless and mute flags, unique retained
profile, stdout/stderr/PID/exit receipts, profile-matched DevTools readiness,
bounded waits and exact-child cleanup. Headed and desktop-focus requests fail.
The gameplay gate removes only its unnecessary Page.bringToFront setup call and
awaits cleanup; every gameplay assertion is unchanged. Co-op cleanup awaits both
owned processes and fails if either exit cannot be confirmed.

Independent review found that an unconfirmed child exit could previously return
success. The corrected helper persists the receipt and rejects that outcome;
combined startup/cleanup failures retain both errors and the original cause.
Mocks cover kill=false/no-exit and kill=true/no-exit. Independent re-review
approved the correction. No browser sandbox or OS security setting was changed.

Exact-head CI, PR merge, main CI, Pages deployment and live version/input checks
are required completion evidence. This pre-merge report records completed local
qualification; it does not claim those later operations already happened. Their
authoritative results are the PR/check/deployment records and final release receipt.
