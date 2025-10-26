import { NextRequest, NextResponse } from 'next/server';
import { listFiles } from '@/lib/s3Client';

/**
 * POST /api/storage/list - S3 파일 목록 조회
 * Body: { prefix: string, maxKeys?: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prefix, maxKeys } = body;

    if (!prefix) {
      return NextResponse.json(
        { success: false, error: 'Prefix is required' },
        { status: 400 }
      );
    }

    const result = await listFiles(prefix, maxKeys);

    return NextResponse.json(result);
  } catch (error) {
    console.error('S3 list files error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
