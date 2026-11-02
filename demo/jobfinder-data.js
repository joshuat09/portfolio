/* Fictional roles and an example profile for the job finder demo. Companies and roles are invented. */
(function (root) {
  'use strict';

  const skills = ['Python', 'SQL', 'JavaScript', 'Excel', 'Power BI', 'Data analysis', 'AI/ML basics', 'Research', 'Communication', 'Presentation', 'Stakeholder management', 'Process improvement'];
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

  // salary is in £ thousands
  const roles = [
    { id: 'r1', title: 'Graduate Business Analyst', company: 'Brightfield Consulting', location: 'Glasgow', mode: 'hybrid', salary: 30, sector: 'Consulting', level: 'graduate', skills: ['Excel', 'Data analysis', 'Communication', 'Presentation', 'Process improvement'] },
    { id: 'r2', title: 'AI Operations Graduate', company: 'Lumen Systems', location: 'Edinburgh', mode: 'hybrid', salary: 32, sector: 'Technology', level: 'graduate', skills: ['Python', 'AI/ML basics', 'Process improvement', 'Communication'] },
    { id: 'r3', title: 'Junior Data Analyst', company: 'Harbour Retail Group', location: 'Manchester', mode: 'onsite', salary: 28, sector: 'Retail', level: 'junior', skills: ['SQL', 'Excel', 'Power BI', 'Data analysis'] },
    { id: 'r4', title: 'Digital Transformation Associate', company: 'Calder & Wynne', location: 'London', mode: 'hybrid', salary: 36, sector: 'Consulting', level: 'graduate', skills: ['Stakeholder management', 'Process improvement', 'Presentation', 'Research'] },
    { id: 'r5', title: 'Policy Research Assistant', company: 'Thistle Policy Unit', location: 'Edinburgh', mode: 'onsite', salary: 26, sector: 'Public sector', level: 'graduate', skills: ['Research', 'Communication', 'Excel'] },
    { id: 'r6', title: 'Graduate Web Developer', company: 'Pixelforge', location: 'Remote (UK)', mode: 'remote', salary: 31, sector: 'Technology', level: 'graduate', skills: ['JavaScript', 'Python', 'Communication'] },
    { id: 'r7', title: 'Summer Placement: Product Analytics', company: 'Kestrel Bank', location: 'London', mode: 'hybrid', salary: 24, sector: 'Finance', level: 'placement', skills: ['SQL', 'Python', 'Data analysis'] },
    { id: 'r8', title: 'Finance Graduate Programme', company: 'Anchor & Pine', location: 'Glasgow', mode: 'onsite', salary: 29, sector: 'Finance', level: 'graduate', skills: ['Excel', 'Data analysis', 'Communication', 'Stakeholder management'] },
    { id: 'r9', title: 'AI Governance Analyst', company: 'Meridian Assurance', location: 'Edinburgh', mode: 'hybrid', salary: 34, sector: 'Consulting', level: 'graduate', skills: ['AI/ML basics', 'Research', 'Stakeholder management', 'Communication'] },
    { id: 'r10', title: 'Customer Insight Graduate', company: 'Willow & Co', location: 'Glasgow', mode: 'hybrid', salary: 27, sector: 'Retail', level: 'graduate', skills: ['Data analysis', 'Excel', 'Communication', 'Presentation'] }
  ];

  const exampleProfile = {
    skills: ['Python', 'Excel', 'Research', 'Communication', 'Process improvement', 'AI/ML basics'],
    locations: ['Glasgow', 'Edinburgh'],
    workMode: 'hybrid',
    minSalary: 28,
    sectors: ['Technology', 'Consulting'],
    level: 'graduate'
  };
  const defaultWeights = { skills: 40, location: 20, salary: 15, sector: 15, level: 10 };

  const api = { skills, locations, sectors, levels, modes, roles, exampleProfile, defaultWeights };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.JobFinderData = api;
})(typeof window !== 'undefined' ? window : globalThis);
