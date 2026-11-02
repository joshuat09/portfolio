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
