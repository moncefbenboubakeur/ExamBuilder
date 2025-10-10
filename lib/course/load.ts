// Course loading utilities

import { SupabaseClient } from '@supabase/supabase-js';

export interface TopicData {
  topic_name: string;
  order_index: number;
}

export interface SectionData {
  topic_name: string;
  content_md: string;
  order_index: number;
}

export interface CourseData {
  exam_id: string;
  topics: TopicData[];
  sections: SectionData[];
}

/**
 * Load complete course data for an exam
 */
export async function loadCourse(
  supabase: SupabaseClient,
  examId: string
): Promise<CourseData | null> {
  // Load all sections for this exam
  const { data: sections, error: sectionsError } = await supabase
    .from('ai_generated_course_sections')
    .select('topic_name, content_md, order_index')
    .eq('exam_id', examId)
    .order('order_index', { ascending: true });

  if (sectionsError) {
    throw new Error(`Failed to load course sections: ${sectionsError.message}`);
  }

  if (!sections || sections.length === 0) {
    return null; // No course generated yet
  }

  // Extract topics from sections (they're already ordered)
  const topics: TopicData[] = sections.map(s => ({
    topic_name: s.topic_name,
    order_index: s.order_index
  }));

  return {
    exam_id: examId,
    topics,
    sections: sections as SectionData[]
  };
}

/**
 * Load detected topics for an exam
 */
export async function loadDetectedTopics(
  supabase: SupabaseClient,
  examId: string
) {
  const { data, error } = await supabase
    .from('ai_detected_topics')
    .select('*')
    .eq('exam_id', examId);

  if (error) {
    throw new Error(`Failed to load topics: ${error.message}`);
  }

  return data || [];
}
