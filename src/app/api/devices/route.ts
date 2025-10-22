import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { Device } from '@/models/devices.dto';
import "@/utils/logger";

export async function GET() {
  const apiStartTime = Date.now();
  log.info("Devices API 시작:", new Date().toISOString());

  const dbQueryStart = Date.now();
  const { data, error } = await supabase
    .from('device_catalog')
    .select('id, ko, en, type, group, dept');

  const dbQueryEnd = Date.now();
  const dbQueryTime = dbQueryEnd - dbQueryStart;
  log.info(` DB 쿼리 시간: ${dbQueryTime}ms`);
  log.info(` 조회된 데이터 개수: ${data?.length || 0}`);

  if (error) {
    console.error(" DB 쿼리 에러:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const devices: Device[] = data.map(row => ({
    id: row.id,
    ko: row.ko,
    en: row.en,
    type: row.type as 'device' | 'drug' | 'program',
    group: row.group || '',
    dept: row.dept as 'skin' | 'plastic' | 'both',
  }));

  const apiEndTime = Date.now();
  const totalApiTime = apiEndTime - apiStartTime;
  log.info(` Devices API 완료: ${totalApiTime}ms`);
  log.info(` 최종 장비 개수: ${devices.length}`);

  return NextResponse.json(devices);
}
