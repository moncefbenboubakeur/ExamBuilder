import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current AI settings
    const { data, error } = await supabase
      .from('ai_settings')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      console.error('Failed to fetch AI settings:', error);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      settings: data,
    });

  } catch (error) {
    console.error('AI settings fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permission
    try {
      requireAdmin(user.email);
    } catch (error) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      provider,
      model_id,
      model_name,
      input_price_per_million,
      output_price_per_million,
    } = body;

    // Validate required fields
    if (!provider || !model_id || !model_name) {
      return NextResponse.json({
        error: 'Missing required fields: provider, model_id, model_name'
      }, { status: 400 });
    }

    // Get existing settings ID
    const { data: existing } = await supabase
      .from('ai_settings')
      .select('id')
      .limit(1)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Settings not initialized' }, { status: 500 });
    }

    // Update settings
    const { data, error } = await supabase
      .from('ai_settings')
      .update({
        provider,
        model_id,
        model_name,
        input_price_per_million,
        output_price_per_million,
        updated_by: user.email,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update AI settings:', error);
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      settings: data,
      message: `AI model updated to ${model_name}`,
    });

  } catch (error) {
    console.error('AI settings update error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
