import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { TABLE_SURGERY_INFO } from '@/constants/tables';
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/lib/api-utils';

/**
 * GET /api/surgery-info - Fetch surgery information
 * Query params: category (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let query = supabase
      .from(TABLE_SURGERY_INFO)
      .select('*');

    // Apply category filter if provided
    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Surgery info fetch error:', error);
      return createErrorResponse('Failed to fetch surgery information', 500);
    }

    return createSuccessResponse({ surgeryInfo: data || [] });

  } catch (error) {
    console.error('Surgery info API error:', error);
    return handleApiError(error);
  }
}

/**
 * OPTIONS /api/surgery-info - CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
