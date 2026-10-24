# Prepare embedded narration without a paid service

The initial MP4s contain captions only. This setup prepares actual audio tracks, using Cloudflare MeloTTS within the Workers AI free allowance. Keep Workers Free. Do not buy credits or enable paid billing. Generating speech is separate from the adaptive live explanation function.

1. Rebuild `npm run build:worker` if needed. Replace the Cloudflare dashboard Worker code with all of `deploy/cloudflare-worker.js`, deploy, and keep the existing Workers AI binding named `AI`.
2. Open the website's `generate-audio.html` setup page. Click **Generate narration files** and leave the tab open. It speaks only the whitelisted script captions, never learner text. Completed scene audio is cached in that browser so a retry can resume.
3. Listen to the first lesson preview. Download `brick-narration.json.gz` (or `.json` if browser compression is unavailable) into Downloads. This is an audio pack, not a learner evidence export.
4. Run `node --experimental-strip-types scripts/embed-narration.mjs "C:\path\to\brick-narration.json.gz"`. This Windows helper uses the installed VLC encoder. It validates all scene timing, keeps copies of the silent originals in `media-work/silent-videos`, and embeds AAC audio into each H264 MP4.
5. Listen to sample clock and fraction movies, check chapter controls and audio/video synchronisation, rebuild the website, and republish the MP4s. Update the audio status in the README and verification report only after the files exist and have been checked.

The setup makes roughly one speech request per scene, far below a million characters. Free availability is quota-limited, not guaranteed. The `/api/narration` route rejects arbitrary text and unsupported scene IDs. It applies a modest 120 requests/hour/IP limit per isolate. Quota errors stop generation; no paid retry/provider is selected. [Model documentation](https://developers.cloudflare.com/workers-ai/models/melotts/) and [pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/).

Scene audio begins 0.12 seconds after each chapter boundary and leaves a short gap. Clips longer than their scene are gently resampled to fit, with a maximum permitted speedup of 1.5; longer clips are rejected. A final listening review is needed because speech pronunciation and clarity cannot be proven by file-format tests. The generated voice is synthetic and is not a student's recording.
