# Joshua Tait — Project Portfolio

A responsive static portfolio website built with HTML, CSS and vanilla JavaScript. No build step, backend or paid service is required.

## Publish with GitHub Pages
1. Open **Settings → Pages** in this repository.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Select branch `main` and folder `/ (root)`, then save.
4. Wait for GitHub Pages to finish deploying.

## Personalise
- Replace `YOUR_EMAIL@example.com` in `index.html` with your preferred contact email.
- Review project descriptions and statuses for accuracy.
- Add links to source repositories, demos, screenshots and project write-ups as they become available.

## Included
- Responsive portfolio dashboard
- Project filters and click-to-open detail panels
- Six project entries
- Static front end with no framework or external API dependency

## Complaint-handling demo
`complaints.html` is a browser port of the control flow of my Python complaint agent (`customer-complaint-agent`). Ported from the real code: the intake safety screen (high value, money transfer, suspicious and out-of-policy flags), the four read-only tools and their validation, the synthetic data, the 8-call loop limit and every escalation path. The language model is replaced by scripted rules, so no AI runs in the browser and nothing is sent anywhere.
- `demo/complaint-data.js` - synthetic data, safety phrases and the 10 evaluation cases from the Python project
- `demo/complaint-engine.js` - safety screen, tool registry, loop and escalation record
- `demo/complaint-ui.js` - rendering and controls
- `demo/complaint-demo.css` - sub page styles
- `demo/engine.test.js` - tests; run with `node --test demo/engine.test.js`

## Command palette
`palette.js` adds a Ctrl/Cmd+K palette (also the "⌘K" button in the top bar) for jumping to sections, opening projects, applying filters, running demo examples, toggling dark mode and searching. It only drives existing page controls.

## Graduate job finder demo
`jobfinder.html` is an interactive prototype of a transparent 0-100 role-match score using fictional roles (no AI model, no network calls).
- `demo/jobfinder-data.js` - fictional roles, vocabularies and the example profile
- `demo/jobfinder-engine.js` - scoring (skills, location/mode, salary, sector, level) with per-component reasons
- `demo/jobfinder-ui.js` / `demo/jobfinder.css` - profile controls and ranked results
- `demo/theme.js` - dark-mode toggle shared by the sub pages
- `demo/jobfinder.test.js` - tests; run with `node --test demo/jobfinder.test.js`
Role links go to a live search (LinkedIn, Indeed, Reed) or the home page (other boards) of a real job board, never to the fictional listing. Job sources are defined in `demo/jobfinder-data.js`.
The sub pages share page styling from `demo/complaint-demo.css`.

## Local AI infrastructure diagram
`diagrams/local-ai-infrastructure.html` is a standalone architecture diagram (generated with Archify) of the local setup: Ollama with `qwen3:4b`, the Python complaint agent, its safety screen, read-only tools and evaluation harness. It opens inside the project dialog when the Local AI Infrastructure card is clicked, and can be opened full size from there.

## Showreel
`showreel.html` is a ~55 second motion showreel of the projects with a soundtrack synthesised live in the browser (Web Audio, no audio files). Click play for sound; Space pauses, M mutes, R replays and F toggles fullscreen. A playback bar (drag or click to jump anywhere, chapter markers for each scene) and a back button appear when you move the mouse; the left and right arrow keys seek 5 seconds. To make a video file, record the page with a screen recorder (for example Windows Game Bar, Win+Alt+R).

## Cursor trail
`cursor.js` adds an "aurora" cursor on the home page, demos and showreel: two silky physics ribbons that shift between lime, mint and coral, ember sparks at speed, click ripples, and a magnetic ring that snaps onto buttons and links. It is an original implementation inspired by the ribbon, gooey and magnetic cursors found in open-source portfolios, and is skipped for touch devices and reduced-motion users. Toggle it from the Ctrl+K palette ("Toggle cursor trail"); the choice is remembered in localStorage.

## AI readiness scorecard
`readiness.html` applies ideas from my dissertation (resource-based view, socio-technical systems, agency theory) to a business process. Ten answers produce four scores (rule fit, agent fit, risk, readiness), two safety gates, and a recommendation of the *least* autonomy that works: human-led, AI-assisted, rule-based automation or a bounded agent. It also lists guardrails, readiness gaps and which single answer changes would flip the result. It is a thinking aid, not validated research, and the shareable link keeps answers in the URL only.
- `demo/readiness-data.js` - questions, example processes and advice
- `demo/readiness-engine.js` - scoring, gates and recommendation
- `demo/readiness-ui.js` / `demo/readiness.css` - form and results
- `demo/readiness.test.js` - tests; run with `node --test demo/readiness.test.js`

## Sharing, icons and 404
- Every page has Open Graph and Twitter tags with a 1200x630 preview image in `og/` (rendered from a template with headless Chrome), plus a canonical URL.
- `favicon.svg`, `favicon-64.png` and `apple-touch-icon.png` (iPad and iPhone home screen).
- `404.html` is a friendly "page not found" page. It fixes wrong capitalisation automatically (for example `/portfolio/Readiness.html`) and links to the main pages. The bare `joshuat09.github.io` address needs a separate `joshuat09.github.io` repository to redirect.

## Case studies, transitions, analytics and contact form
- `case-studies.html` has a problem / approach / result / "what I'd change" write-up for each project, linked from every project dialog.
- Moving between pages uses cross-document view transitions (`@view-transition`) in Chrome, Edge and Safari 18.2+; other browsers navigate normally.
- `site-config.js` holds the GoatCounter site code (analytics) and the Web3Forms access key (contact form). Both are empty, so neither service runs until a value is added. With no key, the contact form stays hidden and the email link remains.


## Local model leaderboard

`leaderboard.html` compares small Ollama models on the complaint agent's ten evaluation cases: correct escalations, malformed responses, speed and size. The page reads `data/model-benchmark.json`; until that file exists it shows a "results are on the way" state, and it never invents numbers.

The data comes from `scripts/benchmark_models.py` in the (private) complaint-agent project, run on a local machine:

```
python scripts/benchmark_models.py --list
python scripts/benchmark_models.py --models <name> <name> --repeats 3
```

Copy the resulting `data/model_benchmark.json` to `data/model-benchmark.json` in this site. Models without Ollama tool-calling support are listed as skipped rather than hidden. `--dry-run` writes scripted sample data that the page labels "SAMPLE DATA"; do not publish that file.

Tests: `node --test demo/leaderboard.test.js`
