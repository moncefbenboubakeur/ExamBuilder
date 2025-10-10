// Course persistence utilities for topics and sections

import { SupabaseClient } from '@supabase/supabase-js';
import { DetectedTopic } from '../ai/prompts/topicDetection';

export interface CourseSection {
  exam_id: string;
  topic_name: string;
  content_md: string;
  order_index: number;
}

/**
 * Upsert detected topics for an exam
 */
export async function upsertTopics(
  supabase: SupabaseClient,
  examId: string,
  topics: DetectedTopic[]
): Promise<void> {
  // Delete existing topics for this exam (overwrite approach)
  const { error: deleteError } = await supabase
    .from('ai_detected_topics')
    .delete()
    .eq('exam_id', examId);

  if (deleteError) {
    throw new Error(`Failed to clear existing topics: ${deleteError.message}`);
  }

  // Insert new topics
  const topicRecords = topics.map(topic => ({
    exam_id: examId,
    topic_name: topic.name,
    question_ids: topic.question_ids,
  }));

  const { error: insertError } = await supabase
    .from('ai_detected_topics')
    .insert(topicRecords);

  if (insertError) {
    throw new Error(`Failed to insert topics: ${insertError.message}`);
  }
}

/**
 * Upsert course sections for an exam
 */
export async function upsertCourseSections(
  supabase: SupabaseClient,
  examId: string,
  sections: CourseSection[]
): Promise<void> {
  // Delete existing sections for this exam (overwrite approach)
  const { error: deleteError } = await supabase
    .from('ai_generated_course_sections')
    .delete()
    .eq('exam_id', examId);

  if (deleteError) {
    throw new Error(`Failed to clear existing sections: ${deleteError.message}`);
  }

  // Insert new sections
  const sectionRecords = sections.map(section => ({
    exam_id: section.exam_id,
    topic_name: section.topic_name,
    content_md: section.content_md,
    order_index: section.order_index,
  }));

  const { error: insertError } = await supabase
    .from('ai_generated_course_sections')
    .insert(sectionRecords);

  if (insertError) {
    throw new Error(`Failed to insert course sections: ${insertError.message}`);
  }
}

/**
 * Check if a course already exists for an exam (within regeneration window)
 */
export async function checkCourseExists(
  supabase: SupabaseClient,
  examId: string,
  regenWindowMinutes: number = 10
): Promise<boolean> {
  const windowStart = new Date();
  windowStart.setMinutes(windowStart.getMinutes() - regenWindowMinutes);

  const { data, error } = await supabase
    .from('ai_generated_course_sections')
    .select('created_at')
    .eq('exam_id', examId)
    .gte('created_at', windowStart.toISOString())
    .limit(1);

  if (error) {
    console.error('Error checking course existence:', error);
    return false;
  }

  return data && data.length > 0;
}
