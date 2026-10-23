# Real-browser checks still to complete

No browser was available to the connected UI tool during implementation. The DOM integration tests exercise application events/state/SVG attributes but cannot validate layout, rendering, actual keyboard behaviour, screen-reader output or OS preferences. Do not describe them as browser end-to-end tests.

Open the locally served app in a current browser and record the browser/version, device, date and outcome for each item. Suggested sizes: desktop 1280×800, tablet 768×1024, mobile 390×844 and 320×568. These are test targets, not verified screenshots.

- [ ] Both topic cards fit; typography is readable; no horizontal overflow or clipped buttons.
- [ ] Time: complete diagnosis, select/submit options, use uncertain/skip, observe neutral acknowledgements, reach a lesson, guided hint, fresh independent check and result.
- [ ] Fractions: complete the same journey; look closely at unequal parts, group boundaries, stud cells and identical whole lengths.
- [ ] Early stop offers a broad lesson and records incomplete diagnosis in Grown-ups.
- [ ] Two distinct response histories yield different follow-ups and appropriate teaching choices.
- [ ] Play/Pause stop the hands immediately; Replay restarts; Previous/Next keep caption and visual aligned; all lesson steps are readable.
- [ ] Clock explorer crosses 11:55 → 12:00 → 12:05 and backwards without desynchronising the hour hand.
- [ ] Keyboard only: Tab focus is visible, Enter/Space selects buttons, Skip to activity works, no focus trap, selected choice state is announced.
- [ ] With OS reduced motion enabled, transitions are instantaneous; manual steps remain usable.
- [ ] Screen reader: heading order, clock descriptions, fraction whole/piece descriptions, choice labels and step captions make sense. No time answer is taught visually during diagnosis.
- [ ] Explain differently is honestly labelled; missing-key/provider-failure fallback preserves progress. If configured, test a real provider response and inspect wording.
- [ ] Switch away mid-animation: no background movement or stale AI response changes another screen.
- [ ] Save/break/reload restores the session via Continue; unavailable storage gives a visible warning.
- [ ] Finish a connecting activity, accept a fresh revisit, and inspect its separate record.
- [ ] JSON/CSV downloads open correctly. Journal export remains separate. Reset/delete affects only this app's records; use disposable test data.
- [ ] Close and restart the local server, then reopen the app and check persisted progress.

Actual results / issues / fixes: ___________________________________________
