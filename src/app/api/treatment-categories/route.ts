import { CategoryNode } from '@/types/category';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { TABLE_TREATMENT } from '@/constants/tables';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  const apiStartTime = Date.now();
  console.log("Treatment Categories API 시작:", new Date().toISOString());
  
  const dbQueryStart = Date.now();
  const { data, error } = await supabase
    .from(TABLE_TREATMENT)
    .select('code, department, level1, name, unit');
  
  const dbQueryEnd = Date.now();
  const dbQueryTime = dbQueryEnd - dbQueryStart;
  console.log(` DB 쿼리 시간: ${dbQueryTime}ms`);
  console.log(` 조회된 데이터 개수: ${data?.length || 0}`);

  if (error) {
    console.error(" DB 쿼리 에러:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const transformStart = Date.now();
  console.log("데이터 변환 시작");
  
  // group by level1 (level2는 더 이상 없음)
  const level1Map = new Map<string, any[]>();

  for (const row of data) {
    if (!level1Map.has(row.level1)) {
      level1Map.set(row.level1, []);
    }
    level1Map.get(row.level1)!.push({
      key: row.code,
      name: row.name,
      label: row.name,
      unit: row.unit, // unit 추가
      department: row.department, // department 추가
    });
  }

  const TREATMENT_CATEGORIES: CategoryNode[] = [];

  for (const [level1, items] of level1Map.entries()) {
    TREATMENT_CATEGORIES.push({
      key: -1,
      name: level1,
      label: level1,
      children: items,
    });
  }

  const transformEnd = Date.now();
  const transformTime = transformEnd - transformStart;
  console.log(` 데이터 변환 시간: ${transformTime}ms`);
  
  const apiEndTime = Date.now();
  const totalApiTime = apiEndTime - apiStartTime;
  console.log(` Treatment Categories API 완료: ${totalApiTime}ms`);
  console.log(` 최종 카테고리 개수: ${TREATMENT_CATEGORIES.length}`);

  return NextResponse.json(TREATMENT_CATEGORIES);
}
