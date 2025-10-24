import { NextResponse } from 'next/server';
import { readSession } from '@/lib/auth';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    const session = await readSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // 최신 사용자 정보 조회
    const { rows } = await pool.query(
      'SELECT id, email, id_uuid_hospital, is_active FROM admin WHERE id = $1',
      [session.id]
    );

    if (rows.length === 0 || !rows[0].is_active) {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: rows[0].id,
        email: rows[0].email,
        id_uuid_hospital: rows[0].id_uuid_hospital
      }
    });
  } catch (error) {
    console.error('Session verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}