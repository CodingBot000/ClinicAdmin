import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
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
    const { rows: adminRows } = await pool.query(
      'SELECT id, id_uuid_hospital, email, is_active FROM admin WHERE id_auth_user = $1',
      [uid]
    );
    
    const admin = adminRows[0] || null;

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
      const { rows: hospitalRows } = await pool.query(
        'SELECT id_uuid_admin FROM prepare_hospital WHERE id_uuid_admin = $1 LIMIT 1',
        [admin.id]
      );
      
      hasClinicInfo = hospitalRows.length > 0;
      hospitalData = hospitalRows;
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
    const { rows: existingRows } = await pool.query(
      'SELECT id FROM admin WHERE id_auth_user = $1',
      [uid]
    );

    if (existingRows.length > 0) {
      return createErrorResponse('Admin already exists', 409);
    }

    // Create new admin
    const { rows: newAdminRows } = await pool.query(
      'INSERT INTO admin (id_auth_user, email, is_active, password_hash, id_uuid_hospital) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [uid, email, true, null, null]
    );
    
    const newAdmin = newAdminRows[0];

    return createSuccessResponse(
      { admin: newAdmin },
      'Admin created successfully'
    );

  } catch (error) {
    console.error('Admin creation error:', error);
    return handleApiError(error);
  }
}
