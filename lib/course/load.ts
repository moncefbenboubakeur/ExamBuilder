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

export interface TopicProgress {
  topic_name: string;
  completed: boolean;
  last_visited_at: string;
}

export interface CourseData {
  exam_id: string;
  topics: TopicData[];
  sections: SectionData[];
  progress?: TopicProgress[];
  statistics?: {
    total_topics: number;
    completed_topics: number;
    completion_percentage: number;
    last_visited_topic: {
      topic_name: string;
      visited_at: string;
    } | null;
  };
}

/**
 * Load study progress for an exam
 */
export async function loadStudyProgress(
  supabase: SupabaseClient,
  examId: string,
  userId: string
): Promise<{ progress: TopicProgress[]; statistics: CourseData['statistics'] }> {
  // Fetch study progress for this exam
  const { data: progress, error: progressError } = await supabase
    .from('study_progress')
    .select('topic_name, completed, last_visited_at')
    .eq('user_id', userId)
    .eq('exam_id', examId)
    .order('last_visited_at', { ascending: false });

  if (progressError) {
    console.error('Failed to load study progress:', progressError);
    return { progress: [], statistics: undefined };
  }

  const progressData = progress || [];

  // Calculate progress statistics
  const totalTopics = progressData.length;
  const completedTopics = progressData.filter(p => p.completed).length;
  const completionPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
  const lastVisited = progressData.length > 0 ? progressData[0] : null;

  const statistics = {
    total_topics: totalTopics,
    completed_topics: completedTopics,
    completion_percentage: completionPercentage,
    last_visited_topic: lastVisited ? {
      topic_name: lastVisited.topic_name,
      visited_at: lastVisited.last_visited_at
    } : null
  };

  return {
    progress: progressData as TopicProgress[],
    statistics
  };
}

/**
 * Load complete course data for an exam
 */
export async function loadCourse(
  supabase: SupabaseClient,
  examId: string,
  userId?: string
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

  // Load progress if userId is provided
  let progressData: TopicProgress[] | undefined;
  let statistics: CourseData['statistics'] | undefined;

  if (userId) {
    const progressResult = await loadStudyProgress(supabase, examId, userId);
    progressData = progressResult.progress;
    statistics = progressResult.statistics;
  }

  return {
    exam_id: examId,
    topics,
    sections: sections as SectionData[],
    progress: progressData,
    statistics
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
