'use client;';

import { InterviewTemplates } from './[interviewTemplateCategoryId]/(specific-interview-template-pages)/InterviewTemplates';

export default async function InterviewsCategoriesPage() {
  //return <InterviewsCategories />;
  //return general-skills-based for now
  return (
    <InterviewTemplates interviewTemplateCategoryId="general-skills-based" />
  );
}
