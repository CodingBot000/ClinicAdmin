import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { TABLE_CONSULTATION_SUBMISSIONS } from '@/constants/tables';
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/lib/api-utils';

/**
 * GET /api/consultation - Fetch all consultation submissions
 * Query params: status (optional), limit (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = searchParams.get('limit');

    let query = supabase
      .from(TABLE_CONSULTATION_SUBMISSIONS)
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (limit) {
      query = query.limit(parseInt(limit, 10));
    }

    const { data, error } = await query;

    if (error) {
      console.error('Consultation fetch error:', error);
      return createErrorResponse('Failed to fetch consultations', 500);
    }

    // Sort data by status priority (New > Retry > Done) and then by date
    const sortedData = (data || []).sort((a, b) => {
      const statusOrder = { 'New': 0, 'Retry': 1, 'Done': 2 };
      const statusA = a.status || 'New';
      const statusB = b.status || 'New';

      const orderA = statusOrder[statusA as keyof typeof statusOrder] ?? 0;
      const orderB = statusOrder[statusB as keyof typeof statusOrder] ?? 0;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return createSuccessResponse({ submissions: sortedData });

  } catch (error) {
    console.error('Consultation API error:', error);
    return handleApiError(error);
  }
}

/**
 * PATCH /api/consultation - Update consultation submission
 * Body: { id_uuid: string, doctor_notes?: string, status?: string }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id_uuid, doctor_notes, status } = body;

    if (!id_uuid) {
      return createErrorResponse('Consultation ID is required', 400);
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (doctor_notes !== undefined) {
      updateData.doctor_notes = doctor_notes;
    }

    if (status !== undefined) {
      // Validate status
      const validStatuses = ['New', 'Done', 'Retry'];
      if (!validStatuses.includes(status)) {
        return createErrorResponse('Invalid status value', 400);
      }
      updateData.status = status;
    }

    const { data, error } = await supabase
      .from(TABLE_CONSULTATION_SUBMISSIONS)
      .update(updateData)
      .eq('id_uuid', id_uuid)
      .select()
      .single();

    if (error) {
      console.error('Consultation update error:', error);
      return createErrorResponse('Failed to update consultation', 500);
    }

    return createSuccessResponse(
      { consultation: data },
      'Consultation updated successfully'
    );

  } catch (error) {
    console.error('Consultation update error:', error);
    return handleApiError(error);
  }
}

/**
 * OPTIONS /api/consultation - CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
