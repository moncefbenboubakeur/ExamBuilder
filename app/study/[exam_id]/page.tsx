'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, BookOpen } from 'lucide-react';
import StudySidebar from '@/components/study/StudySidebar';
import StudyContent from '@/components/study/StudyContent';
import StudyNav from '@/components/study/StudyNav';
import { CourseData } from '@/lib/course/load';

export default function StudyPage({ params }: { params: Promise<{ exam_id: string }> }) {
  const router = useRouter();
  const { exam_id: examId } = use(params);
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!examId) return;

    async function loadCourse() {
      try {
        console.log('📚 Fetching course for exam:', examId);
        const response = await fetch(`/api/courses/${examId}`);
        console.log('📚 Response status:', response.status);

        if (response.status === 404) {
          try {
            const data = await response.json();
            console.log('📚 404 response data:', data);
            if (data.status === 'not_generated') {
              console.log('📚 Course not generated, showing generate button');
              setError('Course not generated yet');
              setLoading(false);
              return;
            }
          } catch (jsonError) {
            console.error('📚 Failed to parse 404 JSON:', jsonError);
            setError('Course not generated yet');
            setLoading(false);
            return;
          }
        }

        if (!response.ok) {
          console.error('📚 Response not OK:', response.status);
          setError('Failed to load course');
          setLoading(false);
          return;
        }

        const data: CourseData = await response.json();
        console.log('📚 Course data loaded:', data);
        setCourseData(data);
        setLoading(false);
      } catch (err) {
        console.error('📚 Error loading course:', err);
        setError(err instanceof Error ? err.message : 'Failed to load course');
        setLoading(false);
      }
    }

    loadCourse();
  }, [examId]);

  const handleGenerateCourse = async () => {
    if (!examId) return;

    setGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exam_id: examId })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate course');
      }

      // Reload the course data
      const courseResponse = await fetch(`/api/courses/${examId}`);
      const courseData: CourseData = await courseResponse.json();
      setCourseData(courseData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate course');
    } finally {
      setGenerating(false);
    }
  };

  const handleTopicSelect = (index: number) => {
    setCurrentTopicIndex(index);
    // Scroll to top of content
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevious = () => {
    if (currentTopicIndex > 0) {
      handleTopicSelect(currentTopicIndex - 1);
    }
  };

  const handleNext = () => {
    if (courseData && currentTopicIndex < courseData.topics.length - 1) {
      handleTopicSelect(currentTopicIndex + 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!courseData) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentTopicIndex > 0) {
        setCurrentTopicIndex(prev => prev - 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      if (e.key === 'ArrowRight' && currentTopicIndex < courseData.topics.length - 1) {
        setCurrentTopicIndex(prev => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentTopicIndex, courseData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading course...</p>
        </div>
      </div>
    );
  }

  if (error && !courseData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center max-w-md">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Study Course Available
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This exam doesn't have a study course yet. Generate one to get started!
          </p>
          <button
            onClick={handleGenerateCourse}
            disabled={generating}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating Course...</span>
              </>
            ) : (
              <span>Generate Study Course</span>
            )}
          </button>
          <button
            onClick={() => router.back()}
            className="mt-4 block mx-auto text-blue-600 hover:text-blue-700"
          >
            ← Back to Exam
          </button>
        </div>
      </div>
    );
  }

  if (!courseData) {
    return null;
  }

  const currentSection = courseData.sections[currentTopicIndex];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Exam</span>
          </button>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Study Mode
          </h1>
          <div className="w-32" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <StudySidebar
          topics={courseData.topics}
          currentTopicIndex={currentTopicIndex}
          onTopicSelect={handleTopicSelect}
        />
        <div className="flex-1 flex flex-col">
          <StudyContent
            content={currentSection.content_md}
            topicName={currentSection.topic_name}
          />
          <StudyNav
            currentIndex={currentTopicIndex}
            totalTopics={courseData.topics.length}
            onPrevious={handlePrevious}
            onNext={handleNext}
          />
        </div>
      </div>
    </div>
  );
}
