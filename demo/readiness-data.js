/* Questions, example processes and advice for the AI readiness scorecard.
 * The thresholds in readiness-engine.js are my own judgement, informed by the frameworks named in `lens`;
 * they are a thinking aid, not validated research. */
(function (root) {
  'use strict';

  const groups = [
    { id: 'process', title: 'The process', lens: 'Socio-technical fit: does the work suit the tool?' },
    { id: 'risk', title: 'Risk and accountability', lens: 'Agency theory: the cost of delegating and monitoring' },
    { id: 'readiness', title: 'Organisational readiness', lens: 'Resource-based view: do you have the capabilities?' }
  ];

  const questions = [
    { id: 'predict', group: 'process', title: 'How predictable are the steps?', low: 'Judgement-heavy, ad hoc', high: 'Fixed rules, same every time' },
    { id: 'variety', group: 'process', title: 'How varied and messy are the inputs?', low: 'Always the same format', high: 'Free text, images, many exceptions' },
    { id: 'volume', group: 'process', title: 'How much volume is there?', low: 'A few cases a month', high: 'Thousands a day' },
    { id: 'impact', group: 'risk', title: 'How bad is a wrong decision?', low: 'Trivial, quickly noticed', high: 'Serious financial, legal or personal harm' },
    { id: 'reversible', group: 'risk', title: 'How hard is a mistake to undo?', low: 'Easily reversed', high: 'Irreversible once done' },
    { id: 'accountability', group: 'risk', title: 'How strict is legal or regulatory accountability?', low: 'Little scrutiny', high: 'Decisions must be explainable and auditable' },
    { id: 'data', group: 'readiness', title: 'How good and accessible is your data?', low: 'Scattered and unreliable', high: 'Clean, accessible, well owned' },
    { id: 'skills', group: 'readiness', title: 'How strong are your in-house technical and AI skills?', low: 'None', high: 'Strong, with real experience' },
    { id: 'governance', group: 'readiness', title: 'How well can you monitor, audit and override the system?', low: 'No oversight in place', high: 'Logging, review and testing are routine' },
    { id: 'people', group: 'readiness', title: 'How ready are the people affected?', low: 'Resistant or unprepared', high: 'Supportive and trained' }
  ];

  const order = questions.map(q => q.id);

  // Answers in question order, each 1-5.
  const presets = [
    { id: 'complaints', label: 'Customer complaint triage', name: 'Customer complaint triage', answers: [3, 5, 4, 3, 3, 3, 3, 4, 4, 3], note: 'The process my Python agent explores.' },
    { id: 'invoices', label: 'Invoice matching', name: 'Invoice matching and payment run', answers: [5, 2, 5, 3, 2, 4, 4, 3, 3, 3] },
    { id: 'cvs', label: 'Graduate CV screening', name: 'Graduate CV screening', answers: [2, 4, 4, 4, 3, 4, 3, 3, 2, 3] },
    { id: 'loans', label: 'Loan approval', name: 'Consumer loan approval', answers: [4, 3, 3, 5, 4, 5, 4, 4, 4, 3] },
    { id: 'meetings', label: 'Meeting notes and follow-ups', name: 'Meeting notes and follow-ups', answers: [2, 5, 3, 1, 1, 1, 3, 4, 3, 4] },
    { id: 'blank', label: 'Start from neutral', name: '', answers: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3] }
  ];

  const options = {
    human: {
      title: 'Human-led',
      summary: 'Keep people in charge of the work. Build data, skills and oversight first, then revisit.',
      guardrails: ['Keep every decision with a named person.', 'Use AI, if at all, only for low-stakes drafting.', 'Record what is holding readiness back so you can fix it.']
    },
    assist: {
      title: 'AI-assisted, human decides',
      summary: 'AI prepares, summarises or suggests, and a person makes and owns every decision.',
      guardrails: ['A person approves every outcome.', 'Show the evidence behind each suggestion.', 'Track how often people override the AI, and why.']
    },
    rules: {
      title: 'Rule-based automation',
      summary: 'The work is predictable enough for fixed rules. Plain automation is cheaper, easier to test and easier to explain than an agent.',
      guardrails: ['Write the rules down and test them.', 'Route every exception to a person.', 'Review the rules on a schedule.']
    },
    agent: {
      title: 'Bounded agent with human oversight',
      summary: 'Inputs are varied enough to need reasoning, and you have the governance to supervise it. Give it narrow autonomy and keep escalation routes open.',
      guardrails: [
        'Start with read-only tools on an allow-list.',
        'Validate every tool call before it runs.',
        'Cap the number of steps per case.',
        'Screen risky cases with deterministic rules before the model runs.',
        'Escalate anything high-value, unclear or out of policy to a person.',
        'Keep a full audit trace of every decision.',
        'Evaluate against a written contract before launch.'
      ]
    }
  };

  const gapAdvice = {
    data: 'Improve data quality and access first. An agent can only be as reliable as the records it reads.',
    skills: 'Build or buy technical skills before deploying. Someone must be able to test, debug and maintain the system.',
    governance: 'Put monitoring, audit logs and an override route in place. Oversight is what makes autonomy safe.',
    people: 'Involve the people affected early. Training and buy-in decide whether the system is used well.'
  };

  const api = { groups, questions, order, presets, options, gapAdvice };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ReadinessData = api;
})(typeof window !== 'undefined' ? window : globalThis);
