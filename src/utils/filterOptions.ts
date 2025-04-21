export const availableIndustries = [
  'All Industries',
  'Information Technology & Software',
  'Financial Services & Banking',
  'Healthcare & Life Sciences',
  'Education & Training',
  'Retail & E‑commerce',
  'Manufacturing & Industrial',
  'Real Estate & Construction',
  'Transportation & Logistics',
  'Energy & Utilities',
  'Media & Entertainment',
  'Hospitality & Tourism',
  'Government & Public Sector',
  'Professional Services & Consulting',
  'Non‑profit & NGOs',
];

export const availableSkills = [
  'Problem Solving',
  'Conflict Resolution',
  'Adaptability',
  'Decision Making',
];

export const availableCountries = [
  'All Locations',
  'Argentina',
  'Australia',
  'Austria',
  'Bangladesh',
  'Belgium',
  'Brazil',
  'Canada',
  'Chile',
  'China',
  'Colombia',
  'Czech Republic',
  'Denmark',
  'Egypt',
  'Finland',
  'France',
  'Germany',
  'Greece',
  'India',
  'Indonesia',
  'Ireland',
  'Italy',
  'Japan',
  'Malaysia',
  'Mexico',
  'Netherlands',
  'New Zealand',
  'Nigeria',
  'Norway',
  'Pakistan',
  'Philippines',
  'Poland',
  'Portugal',
  'Remote',
  'Russia',
  'Saudi Arabia',
  'Singapore',
  'South Africa',
  'South Korea',
  'Spain',
  'Sweden',
  'Switzerland',
  'Thailand',
  'Turkey',
  'Ukraine',
  'United Arab Emirates',
  'United Kingdom',
  'United States',
  'Vietnam',
];

export const availableRoles = [
  'All Roles',
  /* Business & Operations */
  'Project / Program Manager',
  'Business Analyst',
  'Operations Manager',
  'Supply‑Chain Coordinator',
  /* Finance & Legal */
  'Accountant',
  'Financial Analyst',
  'Controller / CFO',
  'Legal Counsel',
  /* People & Admin */
  'HR Manager',
  'Recruiter / Talent Partner',
  'Administrative Assistant',
  'Customer Support Representative',
  /* Sales & Marketing */
  'Sales Executive / Account Executive',
  'Customer Success Manager',
  'Marketing Specialist',
  'Product Marketing Manager',
  /* Product & Design */
  'Product Manager',
  'UX / UI Designer',
  'Graphic Designer',
  /* Engineering & Data */
  'Software Engineer',
  'Web / Front‑End Developer',
  'Mobile Developer',
  'DevOps / Cloud Engineer',
  'Data Scientist',
  'Data Analyst',
  'Cybersecurity Analyst',
  /* Other Technical */
  'Mechanical Engineer',
  'Electrical Engineer',
  'Quality Assurance / QA Tester',
];

export const experienceRanges = [
  { label: 'All Experience', min: 0, max: 999 },
  { label: '0-1 year', min: 0, max: 1 },
  { label: '2-4 years', min: 2, max: 4 },
  { label: '5-7 years', min: 5, max: 7 },
  { label: '8+ years', min: 8, max: 99 },
];

export const availableCountriesCandidates = availableCountries.filter(
  (country) => country !== 'All Locations',
);

export const availableIndustriesCandidates = availableIndustries.filter(
  (industry) => industry !== 'All Industries',
);
export const availableRolesCandidates = availableRoles.filter(
  (role) => role !== 'All Roles',
);
