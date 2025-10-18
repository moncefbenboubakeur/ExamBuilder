import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { UserPreferences } from '@/lib/supabaseClient';

/**
 * GET /api/preferences
 * Fetch user's shuffle preferences (or return defaults if not set)
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch user preferences
    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // If no preferences exist, return defaults
    if (error || !preferences) {
      return NextResponse.json({
        success: true,
        preferences: {
          user_id: user.id,
          shuffle_questions: true,
          shuffle_options: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as UserPreferences,
        isDefault: true,
      });
    }

    return NextResponse.json({
      success: true,
      preferences,
      isDefault: false,
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/preferences
 * Create or update user's shuffle preferences
 *
 * Body: { shuffle_questions: boolean, shuffle_options: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { shuffle_questions, shuffle_options } = body;

    // Validate input
    if (typeof shuffle_questions !== 'boolean' || typeof shuffle_options !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid preferences format. Both shuffle_questions and shuffle_options must be boolean.' },
        { status: 400 }
      );
    }

    // Check if preferences already exist
    const { data: existing } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    let result;

    if (existing) {
      // Update existing preferences
      const { data, error } = await supabase
        .from('user_preferences')
        .update({
          shuffle_questions,
          shuffle_options,
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Preferences update error:', error);
        return NextResponse.json(
          { error: 'Failed to update preferences' },
          { status: 500 }
        );
      }

      result = data;
    } else {
      // Insert new preferences
      const { data, error } = await supabase
        .from('user_preferences')
        .insert({
          user_id: user.id,
          shuffle_questions,
          shuffle_options,
        })
        .select()
        .single();

      if (error) {
        console.error('Preferences insert error:', error);
        return NextResponse.json(
          { error: 'Failed to create preferences' },
          { status: 500 }
        );
      }

      result = data;
    }

    return NextResponse.json({
      success: true,
      preferences: result,
    });
  } catch (error) {
    console.error('Save preferences error:', error);
    return NextResponse.json(
      { error: 'Failed to save preferences' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/preferences
 * Alias for POST - updates preferences
 */
export async function PUT(request: NextRequest) {
  return POST(request);
}
