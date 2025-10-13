import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { TABLE_HOSPITAL } from '@/constants/tables';
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/lib/api-utils';

/**
 * GET /api/hospital/name - Fetch hospital name by UUID
 * Query params: id_uuid (required)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id_uuid = searchParams.get('id_uuid');

    if (!id_uuid) {
      return createErrorResponse('Hospital ID is required', 400);
    }

    const { data, error } = await supabase
      .from(TABLE_HOSPITAL)
      .select('name, name_en')
      .eq('id_uuid', id_uuid)
      .single();

    if (error) {
      console.error('Hospital name fetch error:', error);
      return createErrorResponse('Failed to fetch hospital name', 500);
    }

    if (!data) {
      return createErrorResponse('Hospital not found', 404);
    }

    return createSuccessResponse({
      name: data.name,
      name_en: data.name_en
    });

  } catch (error) {
    console.error('Hospital name API error:', error);
    return handleApiError(error);
  }
}

/**
 * OPTIONS /api/hospital/name - CORS preflight
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
