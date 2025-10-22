import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { TABLE_TREATMENT_SELECTION } from '@/constants/tables';
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/lib/api-utils';

/**
 * GET /api/treatment-selection - Fetch treatment selections
 * Query params: id_uuid_hospital (required)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id_uuid_hospital = searchParams.get('id_uuid_hospital');

    if (!id_uuid_hospital) {
      return createErrorResponse('Hospital ID is required', 400);
    }

    const { data, error } = await supabase
      .from(TABLE_TREATMENT_SELECTION)
      .select('category, ids, device_ids')
      .eq('id_uuid_hospital', id_uuid_hospital);

    if (error) {
      console.error('Treatment selection fetch error:', error);
      return createErrorResponse('Failed to fetch treatment selections', 500);
    }

    // Organize data by category
    const skinData = data?.find(row => row.category === 'skin');
    const plasticData = data?.find(row => row.category === 'plastic');

    const treatmentSelection = {
      skinTreatmentIds: skinData?.ids || [],
      plasticTreatmentIds: plasticData?.ids || [],
      deviceIds: Array.from(new Set([
        ...(skinData?.device_ids || []),
        ...(plasticData?.device_ids || [])
      ])),
    };

    return createSuccessResponse({ treatmentSelection });

  } catch (error) {
    console.error('Treatment selection API error:', error);
    return handleApiError(error);
  }
}

/**
 * OPTIONS /api/treatment-selection - CORS preflight
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
