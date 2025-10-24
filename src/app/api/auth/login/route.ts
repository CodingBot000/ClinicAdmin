import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { issueSession, COOKIE_NAME } from '@/lib/auth';
import argon2 from 'argon2';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // admin 테이블에서 사용자 조회
    const { rows } = await pool.query(
      'SELECT * FROM admin WHERE email = $1 AND is_active = true',
      [email]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const admin = rows[0];
    
    // 패스워드 검증
    if (!admin.password_hash) {
      return NextResponse.json({ error: 'Account not properly configured' }, { status: 401 });
    }

    const isValidPassword = await argon2.verify(admin.password_hash, password);
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // JWT 토큰 생성
    const token = await issueSession({
      id: admin.id,
      email: admin.email,
      id_uuid_hospital: admin.id_uuid_hospital
    });

    // 쿠키 설정
    const response = NextResponse.json({
      user: {
        id: admin.id,
        email: admin.email,
        id_uuid_hospital: admin.id_uuid_hospital
      }
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 2 // 2 hours
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}