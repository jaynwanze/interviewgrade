'use server';

import { createSupabaseUserServerActionClient } from '@/supabase-clients/user/createSupabaseUserServerActionClient';
import type {
  EvaluationRubricType,
  SAPayload,
  Table,
} from '@/types';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';
import type { Database } from './lib/database.types';

// Default rubrics for evaluation criteria
const DEFAULT_RUBRICS: EvaluationRubricType[] = [
  {
    grade: 'Excellent',
    order: 1,
    description:
      'Demonstrates exceptional understanding and application. Clear, comprehensive examples with strong strategic thinking.',
    percentage_range: '70-100%',
  },
  {
    grade: 'Very Good',
    order: 2,
    description:
      'Shows clear understanding with good examples. Demonstrates competence with room for minor improvement.',
    percentage_range: '60-70%',
  },
  {
    grade: 'Good',
    order: 3,
    description:
      'Adequate understanding with basic examples. Shows foundational knowledge but lacks depth.',
    percentage_range: '50-60%',
  },
  {
    grade: 'Acceptable',
    order: 4,
    description:
      'Limited examples with vague explanations. Basic awareness but struggles to elaborate.',
    percentage_range: '40-50%',
  },
  {
    grade: 'Weak',
    order: 5,
    description:
      'Unable to demonstrate understanding or provide relevant examples. No clear knowledge shown.',
    percentage_range: '0-40%',
  },
];

export type CustomInterviewInput = {
  title: string;
  description: string;
  role: string;
  category: Database["public"]["Enums"]["template_category"];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  evaluationCriteria: {
    name: string;
    description: string;
    questions: {
      text: string;
      type: 'Behavioral' | 'Technical' | 'Role-Specific' | 'Situational';
      sampleAnswer?: string;
    }[];
  }[];
};

export type GeneratedInterviewFromJob = {
  jobTitle: string;
  jobDescription: string;
  company?: string;
  suggestedEvaluationCriteria: string[];
};

/**
 * Creates a custom mock interview template with evaluation criteria, questions, and all linkings
 * This automates the manual process of:
 * 1. Creating evaluation criteria
 * 2. Creating a template
 * 3. Linking template to evaluation criteria
 * 4. Creating questions for each evaluation criteria
 */
export async function createCustomMockInterview(
  input: CustomInterviewInput
): Promise<SAPayload<{ templateId: string; evaluationCriteriaIds: string[] }>> {
  try {
    const user = await serverGetLoggedInUser();
    const supabase = createSupabaseUserServerActionClient();

    // 1. Create evaluation criteria
    const createdCriteriaIds: string[] = [];

    for (const criteria of input.evaluationCriteria) {
      const { data: criteriaData, error: criteriaError } = await supabase
        .from('evaluation_criteria')
        .insert({
          user_id: user.id,
          name: criteria.name,
          description: criteria.description,
          rubrics: DEFAULT_RUBRICS,
          is_system_defined: false,
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (criteriaError) {
        console.error('Error creating evaluation criteria:', criteriaError);
        throw criteriaError;
      }

      createdCriteriaIds.push(criteriaData.id);
    }

    // 2. Create the template
    const { data: templateData, error: templateError } = await supabase
      .from('templates')
      .insert({
        user_id: user.id,
        title: input.title,
        description: input.description,
        // role: input.role,
        // skill for now until sperate by role/skill/other categories
        skill: input.evaluationCriteria[0]?.name || 'General',
        category: input.category,
        difficulty: input.difficulty,
        duration: input.evaluationCriteria.reduce(
          (acc, c) => acc + c.questions.length * 3,
          0
        ), // ~3 min per question
        question_count: input.evaluationCriteria.reduce(
          (acc, c) => acc + c.questions.length,
          0
        ),
        is_company_specific: false,
        is_industry_specific: false,
        is_general: false,
        is_system_defined: false,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (templateError) {
      console.error('Error creating template:', templateError);
      throw templateError;
    }

    const templateId = templateData.id;

    // 3. Link template to evaluation criteria

    // TODO: Fix RLS policy for template_evaluation_criteria.
    // The current implementation requires RLS to be disabled for inserts on this table.
    // A long-term fix involves either:
    // 1. Adding a `user_id` column to the `template_evaluation_criteria` table
    //    and updating the RLS policy to check for ownership.
    // 2. Creating a `SECURITY DEFINER` RPC function that verifies the user owns both
    //    the template and the criteria before creating the link.
    // 3. Link template to evaluation criteria
    for (const criteriaId of createdCriteriaIds) {
      const { error: linkError } = await supabase
        .from('template_evaluation_criteria')
        .insert({
          template_id: templateId,
          evaluation_criteria_id: criteriaId,
        });

      if (linkError) {
        console.error('Error linking template to criteria:', linkError);
        throw linkError;
      }
    }

    // 4. Create questions for each evaluation criteria
    for (let i = 0; i < input.evaluationCriteria.length; i++) {
      const criteria = input.evaluationCriteria[i];
      const criteriaId = createdCriteriaIds[i];

      for (const question of criteria.questions) {
        const { error: questionError } = await supabase
          .from('questions')
          .insert({
            template_id: templateId,
            evaluation_criteria_id: criteriaId,
            text: question.text,
            type: question.type,
            sample_answer: question.sampleAnswer || 'No sample answer provided',
          });

        if (questionError) {
          console.error('Error creating question:', questionError);
          throw questionError;
        }
      }
    }

    return {
      status: 'success',
      data: {
        templateId,
        evaluationCriteriaIds: createdCriteriaIds,
      },
    };
  } catch (error) {
    console.error('Error in createCustomMockInterview:', error);
    return {
      status: 'error',
      message:
        error instanceof Error
          ? error.message
          : 'Failed to create custom interview',
    };
  }
}

/**
 * Parse job description to extract potential evaluation criteria
 */
function parseJobDescriptionForCriteria(jobDescription: string): {
  name: string;
  description: string;
  questions: {
    text: string;
    type: 'Behavioral' | 'Technical' | 'Role-Specific' | 'Situational';
  }[];
}[] {
  const criteria: {
    name: string;
    description: string;
    questions: {
      text: string;
      type: 'Behavioral' | 'Technical' | 'Role-Specific' | 'Situational';
    }[];
  }[] = [];

  const lowerDesc = jobDescription.toLowerCase();

  // Communication Skills
  if (
    lowerDesc.includes('communication') ||
    lowerDesc.includes('present') ||
    lowerDesc.includes('stakeholder')
  ) {
    criteria.push({
      name: 'Communication Skills',
      description:
        'Ability to communicate clearly and effectively with various stakeholders',
      questions: [
        {
          text: 'Describe a time when you had to explain a complex concept to someone without technical background.',
          type: 'Behavioral',
        },
        {
          text: 'How do you adapt your communication style for different audiences?',
          type: 'Situational',
        },
      ],
    });
  }

  // Leadership
  if (
    lowerDesc.includes('lead') ||
    lowerDesc.includes('manage') ||
    lowerDesc.includes('team')
  ) {
    criteria.push({
      name: 'Leadership & Team Management',
      description: 'Ability to lead teams and manage people effectively',
      questions: [
        {
          text: 'Tell me about a time you led a team through a challenging project.',
          type: 'Behavioral',
        },
        {
          text: 'How do you handle underperforming team members?',
          type: 'Situational',
        },
      ],
    });
  }

  // Problem Solving
  if (
    lowerDesc.includes('problem') ||
    lowerDesc.includes('solve') ||
    lowerDesc.includes('analytical')
  ) {
    criteria.push({
      name: 'Problem Solving',
      description: 'Ability to analyze problems and develop effective solutions',
      questions: [
        {
          text: 'Describe a complex problem you solved in your previous role.',
          type: 'Behavioral',
        },
        {
          text: 'Walk me through your approach to solving unfamiliar problems.',
          type: 'Role-Specific',
        },
      ],
    });
  }

  // Technical Skills
  if (
    lowerDesc.includes('technical') ||
    lowerDesc.includes('software') ||
    lowerDesc.includes('develop') ||
    lowerDesc.includes('engineer')
  ) {
    criteria.push({
      name: 'Technical Competency',
      description: 'Demonstrates required technical skills and knowledge',
      questions: [
        {
          text: 'Describe a technical project you are most proud of.',
          type: 'Technical',
        },
        {
          text: 'How do you stay current with new technologies and industry trends?',
          type: 'Role-Specific',
        },
      ],
    });
  }

  // Customer Focus
  if (
    lowerDesc.includes('customer') ||
    lowerDesc.includes('client') ||
    lowerDesc.includes('service')
  ) {
    criteria.push({
      name: 'Customer Focus',
      description: 'Ability to understand and meet customer needs',
      questions: [
        {
          text: 'Tell me about a time you went above and beyond for a customer.',
          type: 'Behavioral',
        },
        {
          text: 'How do you handle difficult customer situations?',
          type: 'Situational',
        },
      ],
    });
  }

  // Collaboration
  if (
    lowerDesc.includes('collaborat') ||
    lowerDesc.includes('cross-functional') ||
    lowerDesc.includes('partner')
  ) {
    criteria.push({
      name: 'Collaboration',
      description: 'Ability to work effectively with others across teams',
      questions: [
        {
          text: 'Describe a successful cross-functional project you contributed to.',
          type: 'Behavioral',
        },
        {
          text: 'How do you build relationships with colleagues in other departments?',
          type: 'Role-Specific',
        },
      ],
    });
  }

  // If no criteria matched, add default ones
  if (criteria.length === 0) {
    criteria.push(
      {
        name: 'Professional Experience',
        description: 'Relevant experience and background for the role',
        questions: [
          {
            text: 'Walk me through your relevant experience for this role.',
            type: 'Role-Specific',
          },
          {
            text: 'What accomplishment are you most proud of in your career?',
            type: 'Behavioral',
          },
        ],
      },
      {
        name: 'Cultural Fit',
        description: 'Alignment with company values and work style',
        questions: [
          {
            text: 'What type of work environment do you thrive in?',
            type: 'Behavioral',
          },
          {
            text: 'How do you handle feedback and constructive criticism?',
            type: 'Situational',
          },
        ],
      }
    );
  }

  return criteria;
}

/**
 * Quick create interview from a job description
 * Generates suggested evaluation criteria based on the job
 */
// export async function createInterviewFromJobDescription(
//   jobTitle: string,
//   jobDescription: string,
//   company?: string
// ): Promise<SAPayload<{ templateId: string; evaluationCriteriaIds: string[] }>> {
//   // Parse common skills/requirements from job description
//   const suggestedCriteria = parseJobDescriptionForCriteria(jobDescription);
//   //grab resume content from user profile and tailor questions based on that as well (e.g. if they have a lot of experience in leadership, generate more leadership questions, if they are junior, generate more foundational questions)
//   // For a more advanced implementation, we could also use an LLM to generate tailored questions based on the job description

//   const input: CustomInterviewInput = {
//     title: `${jobTitle}${company ? ` at ${company}` : ''} Interview`,
//     description: `Custom interview preparation for ${jobTitle} role. ${jobDescription.substring(0, 200)}...`,
//     role: jobTitle,
//     category: 'Role Specific',
//     difficulty: 'Medium',
//     evaluationCriteria: suggestedCriteria.map((criteria) => ({
//       name: criteria.name,
//       description: criteria.description,
//       questions: criteria.questions,
//     })),
//   };

//   return createCustomMockInterview(input);
// }

// /**
//  * Quick create interview from a job description with resume analysis
//  * Generates suggested evaluation criteria based on the job
//  */
// export async function createInterviewFromJobDescriptionWithResume(
//   jobTitle: string,
//   jobDescription: string,
//   company?: string
// ): Promise<SAPayload<{ templateId: string; evaluationCriteriaIds: string[] }>> {
//   // Parse common skills/requirements from job description
//   const suggestedCriteria = parseJobDescriptionForCriteria(jobDescription);
//   // get resume
// // For a more advanced implementation, we could also use an LLM to generate tailored questions based on the job description and the user's resume content (which we would fetch from their profile). This would allow us to create a more personalized interview experience that focuses on areas where the user may need more practice or improvement.
//   const input: CustomInterviewInput = {
//     title: `${jobTitle}${company ? ` at ${company}` : ''} Interview`,
//     description: `Custom interview preparation for ${jobTitle} role. ${jobDescription.substring(0, 200)}...`,
//     role: jobTitle,
//     category: 'Role Specific',
//     difficulty: 'Medium',
//     evaluationCriteria: suggestedCriteria.map((criteria) => ({
//       name: criteria.name,
//       description: criteria.description,
//       questions: criteria.questions,
//     })),
//   };

//   return createCustomMockInterview(input);
// }

/**
 * Get all custom templates created by the current user
 */
export async function getUserCustomTemplates(): Promise<
  SAPayload<Table<'templates'>[]>
> {
  try {
    const user = await serverGetLoggedInUser();
    const supabase = createSupabaseUserServerActionClient();

    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_system_defined', false)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      status: 'success',
      data: data || [],
    };
  } catch (error) {
    console.error('Error fetching user custom templates:', error);
    return {
      status: 'error',
      message:
        error instanceof Error
          ? error.message
          : 'Failed to fetch custom templates',
    };
  }
}

/**
 * Delete a custom template and all related data
 */
export async function deleteCustomTemplate(
  templateId: string
): Promise<SAPayload<void>> {
  try {
    const user = await serverGetLoggedInUser();
    const supabase = createSupabaseUserServerActionClient();

    // Verify the template belongs to the user
    const { data: template, error: fetchError } = await supabase
      .from('templates')
      .select('user_id')
      .eq('id', templateId)
      .single();

    if (fetchError || !template) {
      return {
        status: 'error',
        message: 'Template not found',
      };
    }

    if (template.user_id !== user.id) {
      return {
        status: 'error',
        message: 'You can only delete your own templates',
      };
    }

    // Delete questions first (due to foreign key constraints)
    await supabase.from('questions').delete().eq('template_id', templateId);

    // Delete template-criteria links
    await supabase
      .from('template_evaluation_criteria')
      .delete()
      .eq('template_id', templateId);

    // Delete the template
    const { error: deleteError } = await supabase
      .from('templates')
      .delete()
      .eq('id', templateId);

    if (deleteError) throw deleteError;

    return {
      status: 'success',
      data: undefined,
    };
  } catch (error) {
    console.error('Error deleting custom template:', error);
    return {
      status: 'error',
      message:
        error instanceof Error ? error.message : 'Failed to delete template',
    };
  }
}