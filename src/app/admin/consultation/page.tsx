"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

interface ConsultationSubmission {
  id_uuid: string;
  created_at: string;
  form_version: number;
  private_first_name: string;
  private_last_name: string;
  private_email: string;
  private_age_range: string;
  private_gender: string;
  skin_types: string;
  budget_ranges: string;
  skin_concerns: string[];
  skin_concerns_other: string;
  treatment_areas: string[];
  treatment_areas_other: string;
  medical_conditions: string[];
  medical_conditions_other: string;
  priorities: string[];
  treatment_goals: string[];
  past_treatments: string[];
  past_treatments_side_effect_desc: string;
  anything_else: string;
  visit_path: string;
  visit_path_other: string;
  image_paths: string[];
  country: string;
  korean_phone_number: number;
  messengers: any;
  status: string;
  updated_at: string;
  doctor_notes: string;
}

type StatusType = 'New' | 'Done' | 'Retry';

const statusOptions: StatusType[] = ['New', 'Done', 'Retry'];

export default function ConsultationPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<ConsultationSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRows, setEditingRows] = useState<{[key: string]: {doctor_notes: string, status: StatusType}}>({});
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    console.log('🔐 인증 체크 시작');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 현재 사용자:', user?.email);
      
      if (!user) {
        console.log('❌ 사용자가 로그인되어 있지 않음');
        router.push('/admin/login');
        return;
      }

      const email = user.email;
      const username = email?.split('@')[0];
      console.log('🏷️ 추출된 사용자명:', username);
      console.log('🔑 환경변수 SUPER_ADMIN:', process.env.NEXT_PUBLIC_SUPER_ADMIN);

      if (username !== process.env.NEXT_PUBLIC_SUPER_ADMIN!) {
        console.log('❌ 권한 없음. 사용자:', username, '필요 권한:', process.env.NEXT_PUBLIC_SUPER_ADMIN);
        router.push('/admin');
        return;
      }
      
      console.log('✅ 인증 성공');
      setCurrentUser(username);
      await fetchSubmissions();
    } catch (error) {
      console.error('💥 Auth check error:', error);
      router.push('/admin/login');
    }
  };

  const fetchSubmissions = async () => {
    console.log('🔍 fetchSubmissions 시작');
    try {
      console.log('📡 Supabase에서 데이터 조회 중...');
      
      // RLS 정책 문제로 인한 것으로 확인됨

      // 2. 데이터 조회 시도
      const { data, error } = await supabase
        .from('consultation_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('📊 Supabase 응답:', { data, error });
      console.log('📊 데이터 개수:', data?.length || 0);
      
      // 3. 에러 상세 분석
      if (error) {
        console.error('❌ Error fetching submissions:', error);
        console.error('❌ Error code:', error.code);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error details:', error.details);
        console.error('❌ Error hint:', error.hint);
        
        // 테이블이 존재하지 않는 경우
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          console.log('🚫 consultation_submissions 테이블이 존재하지 않습니다.');
        }
        // 권한 문제인 경우
        if (error.code === '42501' || error.message.includes('permission denied')) {
          console.log('🔒 테이블 접근 권한이 없습니다.');
        }
        return;
      }

      if (!data || data.length === 0) {
        console.log('⚠️ 데이터가 없습니다.');
        console.log('💡 가능한 원인:');
        console.log('   1. 테이블이 비어있음');
        console.log('   2. RLS(Row Level Security) 정책으로 인한 접근 제한');
        console.log('   3. 다른 스키마에 테이블이 있을 수 있음');
        
        console.log('🔒 RLS(Row Level Security) 정책이 없어서 데이터에 접근할 수 없습니다.');
        console.log('💡 해결방법: Supabase 대시보드에서 consultation_submissions 테이블의 RLS Policy를 생성하세요.');
        
        setSubmissions([]);
        return;
      }

      console.log('✅ 데이터 조회 성공:', data.length, '개의 레코드');
      console.log('📝 첫 번째 레코드 샘플:', data[0]);

      const sortedData = data.sort((a, b) => {
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

      console.log('🔄 정렬 후 데이터:', sortedData.length, '개');
      setSubmissions(sortedData || []);
    } catch (error) {
      console.error('💥 fetchSubmissions 예외 발생:', error);
    } finally {
      setLoading(false);
      console.log('✅ fetchSubmissions 완료');
    }
  };

  const handleEdit = (id: string, field: 'doctor_notes' | 'status', value: string) => {
    setEditingRows(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const handleUpdate = async (id: string) => {
    const editData = editingRows[id];
    if (!editData) return;

    try {
      const { error } = await supabase
        .from('consultation_submissions')
        .update({
          doctor_notes: editData.doctor_notes,
          status: editData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id_uuid', id);

      if (error) {
        console.error('Update error:', error);
        return;
      }

      setEditingRows(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });

      await fetchSubmissions();
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  const hasChanges = (id: string) => {
    return editingRows[id] !== undefined;
  };

  const formatArrayValue = (value: string[] | null) => {
    if (!value || !Array.isArray(value)) return '';
    return value.join(', ');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  console.log('🎨 렌더링 시점 상태:', {
    submissions: submissions.length,
    currentUser,
    loading
  });

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">상담 신청서 조회</h1>
      
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="sticky left-0 bg-gray-50 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                액션
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">생성일</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">성</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이메일</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">연령대</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">성별</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">피부타입</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">예산범위</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">피부고민</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">피부고민(기타)</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">치료부위</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">치료부위(기타)</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">의료조건</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">의료조건(기타)</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">우선순위</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">치료목표</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">과거치료</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">과거치료 부작용</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">기타사항</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">방문경로</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">방문경로(기타)</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이미지</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">국가</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">전화번호</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">메신저</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">의사 메모</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">수정일</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {submissions.map((submission) => {
              const currentEdit = editingRows[submission.id_uuid];
              const hasEdit = hasChanges(submission.id_uuid);
              
              return (
                <tr key={submission.id_uuid} className="hover:bg-gray-50">
                  <td className="sticky left-0 bg-white px-4 py-2 whitespace-nowrap border-r">
                    {hasEdit ? (
                      <button
                        onClick={() => handleUpdate(submission.id_uuid)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        적용
                      </button>
                    ) : (
                      <button
                        className="px-3 py-1 bg-gray-300 text-gray-500 text-sm rounded cursor-not-allowed"
                        disabled
                      >
                        보기
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{submission.id_uuid}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{formatDate(submission.created_at)}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                    <select
                      value={currentEdit?.status || submission.status || 'New'}
                      onChange={(e) => handleEdit(submission.id_uuid, 'status', e.target.value)}
                      className="border rounded px-2 py-1"
                    >
                      {statusOptions.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{submission.private_last_name}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{submission.private_first_name}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{submission.private_email}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{submission.private_age_range}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{submission.private_gender}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{submission.skin_types}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{submission.budget_ranges}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{formatArrayValue(submission.skin_concerns)}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{submission.skin_concerns_other}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{formatArrayValue(submission.treatment_areas)}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{submission.treatment_areas_other}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{formatArrayValue(submission.medical_conditions)}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{submission.medical_conditions_other}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{formatArrayValue(submission.priorities)}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{formatArrayValue(submission.treatment_goals)}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{formatArrayValue(submission.past_treatments)}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{submission.past_treatments_side_effect_desc}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{submission.anything_else}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{submission.visit_path}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{submission.visit_path_other}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{formatArrayValue(submission.image_paths)}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{submission.country}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{submission.korean_phone_number}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{JSON.stringify(submission.messengers)}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                    <textarea
                      value={currentEdit?.doctor_notes || submission.doctor_notes || ''}
                      onChange={(e) => handleEdit(submission.id_uuid, 'doctor_notes', e.target.value)}
                      className="border rounded px-2 py-1 min-w-[200px] h-20"
                      placeholder="의사 메모를 입력하세요"
                    />
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{submission.updated_at ? formatDate(submission.updated_at) : ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}