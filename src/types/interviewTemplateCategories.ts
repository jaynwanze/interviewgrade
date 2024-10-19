import type { Database } from '../lib/database.types';

export const InterviewTemplateCategories: InterviewTemplateCategoriesType[] = [
  { id: 'general-skills-based', name: 'General Skills-Based' },
  { id: 'general-job-based', name: 'General Job-Based' },
  { id: 'accounting', name: 'Accounting' },
  { id: 'finance', name: 'Finance' },
  { id: 'admin', name: 'Admin' },
  { id: 'customer-service', name: 'Customer Service' },
  { id: 'it', name: 'IT' },
  { id: 'hr', name: 'HR' },
  { id: 'legal', name: 'Legal' },
  { id: 'education', name: 'Education' },
  { id: 'training', name: 'Training' },
  { id: 'real-estate', name: 'Real Estate' },
  { id: 'engineering', name: 'Engineering' },
  { id: 'construction', name: 'Construction' },
  { id: 'healthcare', name: 'Healthcare' },
  { id: 'pharma', name: 'Pharma' },
  { id: 'hospitality', name: 'Hospitality' },
  { id: 'travel', name: 'Travel' },
  { id: 'law-enforcement', name: 'Law Enforcement' },
  { id: 'security', name: 'Security' },
  { id: 'logistics', name: 'Logistics' },
  { id: 'marketing', name: 'Marketing' },
  { id: 'pr', name: 'PR' },
  { id: 'media', name: 'Media' },
  { id: 'sales', name: 'Sales' },
  { id: 'retail', name: 'Retail' },
  { id: 'other', name: 'Other' },
];

export type InterviewTemplateCategoriesType = {
  id: string;
  name: Database['public']['Enums']['template_category'];
};
