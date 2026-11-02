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
The `complaints.html` sub page is a rule-based **simulation** of the complaint agent (fictional data, no AI model, no network calls).
- `demo/complaint-data.js` - mock customers, orders, policy and preset scenarios
- `demo/complaint-engine.js` - classifier, tool registry, safety gate and agent loop (no DOM code)
- `demo/complaint-ui.js` - rendering, controls and theme toggle
- `demo/complaint-demo.css` - sub page styles
- `demo/engine.test.js` - tests; run with `node --test demo/engine.test.js`

Upload the `demo/` folder along with the other files when publishing to GitHub Pages.

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

## AI evaluation explorer
`evaluation.html` runs the complaint-agent simulation against 30 generated scenarios (5 intents x 6 conditions) and reconciles a written contract (expected outcome and gate result) with what the agent actually did, plus six safety invariants. It evaluates the simulation, not the Python code.
- `demo/eval-engine.js` - contract, scenario generation, reconciliation and invariants
- `demo/eval-ui.js` / `demo/eval.css` - matrix, detail panel and invariants
- `demo/eval.test.js` - tests; run with `node --test demo/eval.test.js`
