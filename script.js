const projects = {
  complaints: {
    kicker:"01 / AGENTIC AI · IN DEVELOPMENT",
    title:"Agentic Customer Complaint System",
    description:"A Python prototype investigating bounded autonomy in customer-service complaint handling. The agent interprets a complaint, consults structured customer, order and policy data, and selects from controlled workflow actions. High-risk or complex cases are routed to human review.",
    points:["Separates language-model reasoning from deterministic safety controls and tool execution.","Uses a constrained tool registry and validates tool names and arguments.","Supports resolve, request-missing-information and human-escalation outcomes.","Includes iteration limits, execution traces and tests for provider, tool and malformed-response failures.","Designed to avoid direct financial-action tools; sensitive decisions remain subject to human oversight."],
    tech:["Python","Local LLMs","Ollama","Qwen","JSON","pytest","Human oversight"]
  },
  guessed: {
    kicker:"02 / WEB PRODUCT · PUBLISHED",
    title:"GUESSED — Daily Guessing Game",
    description:"A browser-based daily guessing game built as a lightweight static website. The project uses vanilla HTML, CSS and JavaScript and is hosted on GitHub Pages.",
    points:["Daily puzzle format with a numbered sequence of challenges.","117 questions across PRICE, SCALE, HUMAN, CROWD and TIME, each linked to its source; crowd answers come from real YouGov polls.","Daily streaks, personal stats and a shareable result image, saved on the device with no backend.","Public project URL: joshuat09.github.io/guessed/."],
    tech:["HTML","CSS","JavaScript","GitHub Pages","Vanilla web development"]
  },
  evaluation: {
    kicker:"03 / AI GOVERNANCE · ITERATIVE",
    title:"AI Evaluation, Safety & Governance",
    description:"A structured testing and reporting workstream for the complaint agent. It focuses on whether agent behaviour matches explicit workflow expectations and whether safety gates correctly allow, block or leave decisions unresolved.",
    points:["Defines complaint intents, workflow contracts and scenario matrices.","Distinguishes expected outcomes (supported, blocked, unresolved) from actual gate results (allow, block, unknown).","Uses pytest to validate contracts, taxonomy alignment and reconciliation logic.","Keeps historical evaluation reports separate from experimental report generation."],
    tech:["Python","pytest","JSON","Evaluation design","Safety taxonomy","Scenario testing"]
  },
  localai: {
    kicker:"04 / LOCAL INFRASTRUCTURE · EXPLORATION",
    title:"Local AI Infrastructure",
    description:"Hands-on experimentation with locally hosted language models and interfaces, with an emphasis on running models without depending on paid inference APIs.",
    points:["Installed and tested Ollama and local model workflows.","Explored Qwen model variants for coding and complaint-handling tasks.","Set up Open WebUI and investigated local API connectivity and custom prompts.","Compared hardware constraints and model suitability for local inference."],
    tech:["Ollama","Qwen","Open WebUI","Local inference","API integration","Prompt engineering"]
  },
  jobfinder: {
    kicker:"05 / PRODUCTIVITY TOOL · PROTOTYPE",
    title:"AI Graduate Job Finder",
    description:"A prototype concept for making graduate-role matching more transparent. It uses an editable candidate profile and a scoring approach to explain how closely a role aligns with a user's preferences and skills.",
    points:["Uses a transparent 0–100 matching score rather than an unexplained recommendation.","Supports an editable profile and role criteria.","Includes a Python testing approach and an Ollama integration scaffold.","Explores how AI can support job discovery without hiding the basis of recommendations."],
    tech:["Python","Scoring model","pytest","Ollama scaffold","Structured data"]
  },
  research: {
    kicker:"06 / ACADEMIC RESEARCH · DISSERTATION",
    title:"Agentic AI & Autonomous Business Processes",
    description:"Academic research examining how agentic artificial intelligence could change autonomous business processes and what organisational capabilities are needed for effective implementation.",
    points:["Explores the distinction between conventional automation and agentic systems.","Uses organisational and technology perspectives including the resource-based view and socio-technical systems.","Connects the research question to a practical customer-complaint prototype.","Considers governance, risk, human oversight and organisational readiness."],
    tech:["Business research","Resource-based view","Socio-technical systems","Agency theory","AI strategy"]
  }
};
const dialog = document.querySelector("#project-dialog");
const closeDialog = () => dialog.close();
document.querySelector(".dialog-close").addEventListener("click", closeDialog);
dialog.addEventListener("click", e => { if(e.target === dialog) closeDialog(); });
function openProject(key){
  const p = projects[key]; if(!p) return;
  document.querySelector("#dialog-kicker").textContent = p.kicker;
  document.querySelector("#dialog-title").textContent = p.title;
  document.querySelector("#dialog-description").textContent = p.description;
  const list = document.querySelector("#dialog-points"); list.replaceChildren();
  p.points.forEach(point => { const li=document.createElement("li"); li.textContent=point; list.append(li); });
  const tech = document.querySelector("#dialog-tech"); tech.replaceChildren();
  p.tech.forEach(item => { const tag=document.createElement("i"); tag.textContent=item; tech.append(tag); });
  const demoLink = document.querySelector("#dialog-demo-link");
  const caseLink = document.querySelector("#dialog-case-link");
  if(caseLink) caseLink.href = `case-studies.html#${key}`;
  const codeLinks = { guessed:"https://github.com/joshuat09/guessed" };
  const codeLink = document.querySelector("#dialog-code-link");
  if(codeLink){ codeLink.hidden = !codeLinks[key]; if(codeLinks[key]) codeLink.href = codeLinks[key]; }
  const demoPages = { complaints:"complaints.html", jobfinder:"jobfinder.html", research:"readiness.html" };
  if(demoLink){ demoLink.hidden = !demoPages[key]; if(demoPages[key]) demoLink.href = demoPages[key]; }
  const diagrams = { localai:"diagrams/local-ai-infrastructure.html" };
  const diagramBox = document.querySelector("#dialog-diagram");
  if(diagramBox){
    const src = diagrams[key];
    diagramBox.hidden = !src;
    dialog.classList.toggle("has-diagram", !!src);
    if(src){
      const frame = document.querySelector("#dialog-diagram-frame");
      if(frame.getAttribute("src") !== src) frame.setAttribute("src", src);
      document.querySelector("#dialog-diagram-link").href = src;
    }
  }
  dialog.showModal();
}
document.querySelectorAll(".project-card").forEach(card => {
  card.addEventListener("click", e => { if(e.target.closest("a")) return; openProject(card.dataset.project); });
  card.addEventListener("keydown", e => { if(e.key==="Enter" || e.key===" "){e.preventDefault();openProject(card.dataset.project);} });
});
const filterButtons = [...document.querySelectorAll(".filter")];
const searchInput = document.querySelector("#project-search");
const searchStatus = document.querySelector("#search-status");
const projectCards = [...document.querySelectorAll(".project-card")];

function applyProjectFilters(){
  const activeFilter = document.querySelector(".filter.active")?.dataset.filter || "all";
  const query = (searchInput?.value || "").trim().toLowerCase();
  let visible = 0;
  projectCards.forEach(card => {
    const matchesCategory = activeFilter === "all" || card.dataset.category === activeFilter;
    const matchesSearch = !query || card.textContent.toLowerCase().includes(query);
    card.hidden = !(matchesCategory && matchesSearch);
    if(!card.hidden) visible++;
  });
  if(searchStatus) searchStatus.textContent = visible === 0 ? "No projects match that search." : `Showing ${visible} of ${projectCards.length} projects`;
}
filterButtons.forEach(button => {
  button.addEventListener("click", () => {
    filterButtons.forEach(b=>b.classList.remove("active"));
    button.classList.add("active");
    applyProjectFilters();
  });
});
searchInput?.addEventListener("input", applyProjectFilters);

document.querySelector("#surprise-project")?.addEventListener("click", () => {
  const visibleCards = projectCards.filter(card => !card.hidden);
  const pool = visibleCards.length ? visibleCards : projectCards;
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  if(chosen) openProject(chosen.dataset.project);
});

const themeToggle = document.querySelector("#theme-toggle");
themeToggle?.addEventListener("click", () => {
  const enabled = document.body.classList.toggle("dark-mode");
  themeToggle.setAttribute("aria-pressed", String(enabled));
  themeToggle.setAttribute("aria-label", enabled ? "Switch to light mode" : "Switch to dark mode");
  themeToggle.innerHTML = enabled ? "☀ <span>Light mode</span>" : "◐ <span>Dark mode</span>";
  try { localStorage.setItem("portfolio-theme", enabled ? "dark" : "light"); } catch(e) {}
});
try {
  if(localStorage.getItem("portfolio-theme") === "dark"){
    document.body.classList.add("dark-mode");
    themeToggle?.setAttribute("aria-pressed","true");
    themeToggle?.setAttribute("aria-label","Switch to light mode");
    if(themeToggle) themeToggle.innerHTML = "☀ <span>Light mode</span>";
  }
} catch(e) {}
document.querySelectorAll(".nav-link").forEach(link => link.addEventListener("click",()=>{
  document.querySelectorAll(".nav-link").forEach(item=>item.classList.remove("active"));
  link.classList.add("active");
}));