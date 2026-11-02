/* Fictional roles and an example profile for the job finder demo. Companies and roles are invented.
 * Links go to a live search (or the home page) of a real job board, never to the fictional listing itself. */
(function (root) {
  'use strict';

  const skillGroups = [
    { label: 'Technical', skills: ['Python', 'SQL', 'JavaScript', 'HTML/CSS', 'Java', 'R', 'Git', 'Cloud basics', 'Cyber security basics', 'AI/ML basics', 'Prompt engineering'] },
    { label: 'Data & analysis', skills: ['Excel', 'Power BI', 'Tableau', 'Data analysis', 'Data visualisation', 'Statistics', 'Research', 'Financial analysis', 'Business modelling', 'Risk assessment'] },
    { label: 'Business', skills: ['Process improvement', 'Project management', 'Stakeholder management', 'Agile', 'Compliance', 'Marketing', 'Customer service', 'Negotiation'] },
    { label: 'People & communication', skills: ['Communication', 'Presentation', 'Report writing', 'Teamwork', 'Problem solving', 'Leadership'] }
  ];
  const skills = skillGroups.reduce((all, g) => all.concat(g.skills), []);
  const locations = ['Glasgow', 'Edinburgh', 'London', 'Manchester'];
  const sectors = ['Technology', 'Consulting', 'Finance', 'Public sector', 'Retail'];
  const levels = [
    { id: 'placement', label: 'Placement / internship' },
    { id: 'graduate', label: 'Graduate scheme' },
    { id: 'junior', label: 'Junior role' }
  ];
  const modes = [
    { id: 'any', label: 'No preference' },
    { id: 'remote', label: 'Remote' },
    { id: 'hybrid', label: 'Hybrid' },
    { id: 'onsite', label: 'On-site' }
  ];

  const enc = encodeURIComponent;
  const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  // search(term, place) builds a live search URL; sources without it link to their home page.
  const sources = {
    linkedin: { label: 'LinkedIn', home: 'https://www.linkedin.com/jobs/', search: (t, l) => `https://www.linkedin.com/jobs/search/?keywords=${enc(t)}&location=${enc(l)}` },
    indeed: { label: 'Indeed', home: 'https://uk.indeed.com/', search: (t, l) => `https://uk.indeed.com/jobs?q=${enc(t)}&l=${enc(l)}` },
    reed: { label: 'Reed', home: 'https://www.reed.co.uk/', search: (t, l) => `https://www.reed.co.uk/jobs/${slug(t)}-jobs-in-${slug(l)}` },
    totaljobs: { label: 'Totaljobs', home: 'https://www.totaljobs.com/' },
    milkround: { label: 'Milkround', home: 'https://www.milkround.com/' },
    prospects: { label: 'Prospects', home: 'https://www.prospects.ac.uk/' },
    civilservice: { label: 'Civil Service Jobs', home: 'https://www.civilservicejobs.service.gov.uk/csr/index.cgi' }
  };

  // salary is in £ thousands; term is the search phrase used for the board link
  const roles = [
    { id: 'r1', title: 'Graduate Business Analyst', company: 'Brightfield Consulting', location: 'Glasgow', mode: 'hybrid', salary: 30, sector: 'Consulting', level: 'graduate', skills: ['Excel', 'Data analysis', 'Communication', 'Presentation', 'Process improvement'], source: 'linkedin', term: 'graduate business analyst' },
    { id: 'r2', title: 'AI Operations Graduate', company: 'Lumen Systems', location: 'Edinburgh', mode: 'hybrid', salary: 32, sector: 'Technology', level: 'graduate', skills: ['Python', 'AI/ML basics', 'Process improvement', 'Communication'], source: 'linkedin', term: 'graduate ai operations' },
    { id: 'r3', title: 'Junior Data Analyst', company: 'Harbour Retail Group', location: 'Manchester', mode: 'onsite', salary: 28, sector: 'Retail', level: 'junior', skills: ['SQL', 'Excel', 'Power BI', 'Data analysis'], source: 'indeed', term: 'junior data analyst' },
    { id: 'r4', title: 'Digital Transformation Associate', company: 'Calder & Wynne', location: 'London', mode: 'hybrid', salary: 36, sector: 'Consulting', level: 'graduate', skills: ['Stakeholder management', 'Process improvement', 'Presentation', 'Research'], source: 'milkround', term: 'digital transformation graduate' },
    { id: 'r5', title: 'Policy Research Assistant', company: 'Thistle Policy Unit', location: 'Edinburgh', mode: 'onsite', salary: 26, sector: 'Public sector', level: 'graduate', skills: ['Research', 'Communication', 'Excel'], source: 'civilservice', term: 'policy research' },
    { id: 'r6', title: 'Graduate Web Developer', company: 'Pixelforge', location: 'Remote (UK)', mode: 'remote', salary: 31, sector: 'Technology', level: 'graduate', skills: ['JavaScript', 'Python', 'Communication'], source: 'reed', term: 'graduate web developer' },
    { id: 'r7', title: 'Summer Placement: Product Analytics', company: 'Kestrel Bank', location: 'London', mode: 'hybrid', salary: 24, sector: 'Finance', level: 'placement', skills: ['SQL', 'Python', 'Data analysis'], source: 'prospects', term: 'product analytics placement' },
    { id: 'r8', title: 'Finance Graduate Programme', company: 'Anchor & Pine', location: 'Glasgow', mode: 'onsite', salary: 29, sector: 'Finance', level: 'graduate', skills: ['Excel', 'Data analysis', 'Communication', 'Stakeholder management'], source: 'reed', term: 'finance graduate programme' },
    { id: 'r9', title: 'AI Governance Analyst', company: 'Meridian Assurance', location: 'Edinburgh', mode: 'hybrid', salary: 34, sector: 'Consulting', level: 'graduate', skills: ['AI/ML basics', 'Research', 'Stakeholder management', 'Communication'], source: 'linkedin', term: 'ai governance analyst' },
    { id: 'r10', title: 'Customer Insight Graduate', company: 'Willow & Co', location: 'Glasgow', mode: 'hybrid', salary: 27, sector: 'Retail', level: 'graduate', skills: ['Data analysis', 'Excel', 'Communication', 'Presentation'], source: 'indeed', term: 'customer insight graduate' },
    { id: 'r11', title: 'Graduate Software Engineer', company: 'Fernhill Software', location: 'Glasgow', mode: 'hybrid', salary: 33, sector: 'Technology', level: 'graduate', skills: ['Python', 'Git', 'SQL', 'Problem solving'], source: 'linkedin', term: 'graduate software engineer' },
    { id: 'r12', title: 'Data Science Graduate', company: 'Orbital Labs', location: 'Edinburgh', mode: 'hybrid', salary: 35, sector: 'Technology', level: 'graduate', skills: ['Python', 'Statistics', 'AI/ML basics', 'Data visualisation'], source: 'reed', term: 'graduate data scientist' },
    { id: 'r13', title: 'Marketing Analytics Placement', company: 'Saltire Media', location: 'Glasgow', mode: 'hybrid', salary: 23, sector: 'Retail', level: 'placement', skills: ['Excel', 'Data analysis', 'Marketing', 'Presentation'], source: 'indeed', term: 'marketing analytics placement' },
    { id: 'r14', title: 'Risk & Compliance Graduate', company: 'Fairhaven Insurance', location: 'Edinburgh', mode: 'onsite', salary: 30, sector: 'Finance', level: 'graduate', skills: ['Risk assessment', 'Compliance', 'Report writing', 'Excel'], source: 'totaljobs', term: 'risk and compliance graduate' },
    { id: 'r15', title: 'Government Analyst (Fast Stream style)', company: 'Central Analysis Team', location: 'London', mode: 'hybrid', salary: 32, sector: 'Public sector', level: 'graduate', skills: ['Research', 'Statistics', 'Report writing', 'Communication'], source: 'civilservice', term: 'analyst' },
    { id: 'r16', title: 'Junior Project Coordinator', company: 'Northgate Build Tech', location: 'Manchester', mode: 'hybrid', salary: 27, sector: 'Technology', level: 'junior', skills: ['Project management', 'Agile', 'Teamwork', 'Excel'], source: 'totaljobs', term: 'junior project coordinator' },
    { id: 'r17', title: 'Cyber Security Graduate', company: 'Bastion Secure', location: 'London', mode: 'hybrid', salary: 34, sector: 'Technology', level: 'graduate', skills: ['Cyber security basics', 'Python', 'Risk assessment', 'Problem solving'], source: 'linkedin', term: 'graduate cyber security' },
    { id: 'r18', title: 'Junior BI Developer', company: 'Clydeside Logistics', location: 'Glasgow', mode: 'hybrid', salary: 31, sector: 'Retail', level: 'junior', skills: ['SQL', 'Power BI', 'Tableau', 'Data visualisation'], source: 'reed', term: 'junior bi developer' },
    { id: 'r19', title: 'Management Consulting Graduate', company: 'Hartwell & Reid', location: 'London', mode: 'onsite', salary: 35, sector: 'Consulting', level: 'graduate', skills: ['Business modelling', 'Presentation', 'Problem solving', 'Stakeholder management', 'Excel'], source: 'milkround', term: 'management consulting graduate' },
    { id: 'r20', title: 'Public Sector Digital Intern', company: 'Highland Digital Service', location: 'Edinburgh', mode: 'hybrid', salary: 22, sector: 'Public sector', level: 'placement', skills: ['HTML/CSS', 'JavaScript', 'Teamwork', 'Agile'], source: 'civilservice', term: 'digital intern' },
    { id: 'r21', title: 'Prompt Engineering Associate', company: 'Quill AI', location: 'Remote (UK)', mode: 'remote', salary: 33, sector: 'Technology', level: 'graduate', skills: ['Prompt engineering', 'AI/ML basics', 'Python', 'Report writing'], source: 'linkedin', term: 'prompt engineer' },
    { id: 'r22', title: 'Graduate Customer Success Analyst', company: 'Ember Cloud', location: 'Manchester', mode: 'hybrid', salary: 29, sector: 'Technology', level: 'graduate', skills: ['Customer service', 'Communication', 'Data analysis', 'Cloud basics'], source: 'indeed', term: 'graduate customer success analyst' }
  ];

  // Where a role's "find similar" link goes: a live search where the board supports it, else its home page.
  function jobLink(role) {
    const s = sources[role.source];
    const place = role.mode === 'remote' ? 'United Kingdom' : role.location;
    return s.search
      ? { href: s.search(role.term, place), label: `Search similar roles on ${s.label}`, kind: 'search' }
      : { href: s.home, label: `Browse ${s.label}`, kind: 'home' };
  }

  const exampleProfile = {
    skills: ['Python', 'Excel', 'Research', 'Communication', 'Process improvement', 'AI/ML basics'],
    locations: ['Glasgow', 'Edinburgh'],
    workMode: 'hybrid',
    minSalary: 28,
    sectors: ['Technology', 'Consulting'],
    level: 'graduate'
  };
  const defaultWeights = { skills: 40, location: 20, salary: 15, sector: 15, level: 10 };

  const api = { skillGroups, skills, locations, sectors, levels, modes, sources, roles, jobLink, exampleProfile, defaultWeights };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.JobFinderData = api;
})(typeof window !== 'undefined' ? window : globalThis);
