import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { TABLE_ADMIN, TABLE_HOSPITAL } from '@/constants/tables';
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/lib/api-utils';

/**
 * GET /api/admin/auth - Verify admin authentication and fetch hospital data
 * Query params: uid (auth user ID)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return createErrorResponse('User ID is required', 400);
    }

    // Check admin table
    const { data: admin, error: adminError } = await supabase
      .from(TABLE_ADMIN)
      .select('id, id_uuid_hospital, email, is_active')
      .eq('id_auth_user', uid)
      .maybeSingle();

    if (adminError) {
      console.error('Admin query error:', adminError);
      return createErrorResponse('Failed to fetch admin data', 500);
    }

    // If admin doesn't exist, return appropriate response
    if (!admin) {
      return createSuccessResponse({
        adminExists: false,
        hasClinicInfo: false,
        admin: null,
        hospital: null
      });
    }

    // If admin exists and has hospital UUID, check hospital data
    let hasClinicInfo = false;
    let hospitalData = null;

    if (admin.id_uuid_hospital) {
      const { data: hospital, error: hospitalError } = await supabase
        .from(TABLE_HOSPITAL)
        .select('id_uuid_admin')
        .eq('id_uuid_admin', admin.id)
        .limit(1);

      if (hospitalError) {
        console.error('Hospital query error:', hospitalError);
      } else {
        hasClinicInfo = hospital && hospital.length > 0;
        hospitalData = hospital;
      }
    }

    return createSuccessResponse({
      adminExists: true,
      hasClinicInfo,
      admin,
      hospital: hospitalData
    });

  } catch (error) {
    console.error('Admin auth verification error:', error);
    return handleApiError(error);
  }
}

/**
 * POST /api/admin/auth - Create new admin entry
 * Body: { uid: string, email: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, email } = body;

    if (!uid || !email) {
      return createErrorResponse('User ID and email are required', 400);
    }

    // Check if admin already exists
    const { data: existingAdmin, error: checkError } = await supabase
      .from(TABLE_ADMIN)
      .select('id')
      .eq('id_auth_user', uid)
      .maybeSingle();

    if (checkError) {
      console.error('Admin check error:', checkError);
      return createErrorResponse('Failed to check existing admin', 500);
    }

    if (existingAdmin) {
      return createErrorResponse('Admin already exists', 409);
    }

    // Create new admin
    const { data: newAdmin, error: insertError } = await supabase
      .from(TABLE_ADMIN)
      .insert({
        id_auth_user: uid,
        email: email,
        is_active: true,
        password_hash: null,
        id_uuid_hospital: null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Admin insert error:', insertError);
      return createErrorResponse('Failed to create admin', 500);
    }

    return createSuccessResponse(
      { admin: newAdmin },
      'Admin created successfully'
    );

  } catch (error) {
    console.error('Admin creation error:', error);
    return handleApiError(error);
  }
}
