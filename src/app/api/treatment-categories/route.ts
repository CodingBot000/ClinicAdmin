import { CategoryNode } from '@/types/category';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  const apiStartTime = Date.now();
  console.log("🔄 Treatment Categories API 시작:", new Date().toISOString());
  
  const dbQueryStart = Date.now();
  const { data, error } = await supabase
    .from('treatment')
    .select('code, department, level1, level2, name');
  
  const dbQueryEnd = Date.now();
  const dbQueryTime = dbQueryEnd - dbQueryStart;
  console.log(`📊 DB 쿼리 시간: ${dbQueryTime}ms`);
  console.log(`📊 조회된 데이터 개수: ${data?.length || 0}`);

  if (error) {
    console.error("❌ DB 쿼리 에러:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const transformStart = Date.now();
  console.log("🔄 데이터 변환 시작");
  
  // group by level1 > level2 (nullable)
  const level1Map = new Map<string, Map<string | null, any[]>>();

  for (const row of data) {
    if (!level1Map.has(row.level1)) {
      level1Map.set(row.level1, new Map());
    }
    const level2Map = level1Map.get(row.level1)!;

    const level2Key = row.level2 ?? null;
    if (!level2Map.has(level2Key)) {
      level2Map.set(level2Key, []);
    }
    level2Map.get(level2Key)!.push({
      key: row.code,
      name: row.name,
      label: row.name,
    });
  }

  const TREATMENT_CATEGORIES: CategoryNode[] = [];

  for (const [level1, level2Map] of level1Map.entries()) {
    const children: CategoryNode[] = [];
    for (const [level2, leaves] of level2Map.entries()) {
      if (level2) {
        children.push({
          key: -1,
          name: level2,
          label: level2,
          children: leaves,
        });
      } else {
        // 2뎁스만 있을 때
        children.push(...leaves);
      }
    }
    TREATMENT_CATEGORIES.push({
      key: -1,
      name: level1,
      label: level1,
      children,
    });
  }

  const transformEnd = Date.now();
  const transformTime = transformEnd - transformStart;
  console.log(`🔄 데이터 변환 시간: ${transformTime}ms`);
  
  const apiEndTime = Date.now();
  const totalApiTime = apiEndTime - apiStartTime;
  console.log(`✅ Treatment Categories API 완료: ${totalApiTime}ms`);
  console.log(`📊 최종 카테고리 개수: ${TREATMENT_CATEGORIES.length}`);

  return NextResponse.json(TREATMENT_CATEGORIES);
}
