import { supabase } from '../../lib/supabase';
import { IQuestionService, QuestionWithDetails } from '../types';

export class SupabaseQuestionService implements IQuestionService {
  async getQuestionsBySurgeryTypeId(surgeryTypeId: string, surgeryId?: string): Promise<QuestionWithDetails[]> {
    const { data, error } = await supabase
      .from('surgery_questions')
      .select(`
        display_order,
        is_active,
        question:questions (
          *,
          options:question_options(*)
        )
      `)
      .eq('surgery_type_id', surgeryTypeId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching questions:', error);
      throw error;
    }

    if (!data) return [];

    // Check if surgery has drain (to filter drain-specific questions)
    let hasDrain = false;
    if (surgeryId) {
      const { data: surgery } = await supabase
        .from('surgeries')
        .select('has_drain')
        .eq('id', surgeryId)
        .single();

      hasDrain = surgery?.has_drain ?? false;
    }

    // Map the result to match QuestionWithDetails structure
    // We combine the link table fields (display_order) with the question fields
    const questions = data.map((item: any) => {
      // The join returns 'question' as a single object (or null if not found, though inner join implies found)
      // We need to cast it or treat it as any to merge properties
      const questionData = item.question;

      if (!questionData) return null;

      // Filter out drain-specific questions if surgery has no drain
      const meta = questionData.metadata as any;
      if (meta?.requires_drain === true && !hasDrain) {
        return null;
      }

      // Sort options by display_order if they exist
      if (questionData.options && Array.isArray(questionData.options)) {
        questionData.options.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0));
      }

      return {
        ...questionData,
        display_order: item.display_order, // Use the order from the link table
        is_active: item.is_active // Use the active status from the link table
      };
    }).filter(q => q !== null); // Filter out any nulls if join failed

    return questions as QuestionWithDetails[];
  }
}
export const questionService = new SupabaseQuestionService();
