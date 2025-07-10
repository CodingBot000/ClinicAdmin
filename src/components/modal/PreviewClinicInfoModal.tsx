'use client';

import React, { useState, useEffect } from 'react';
import { X, MapPin, Phone, Mail, Clock, Camera, Users, Star, Globe, MessageSquare } from 'lucide-react';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import { 
  TABLE_HOSPITAL, 
  TABLE_DOCTOR, 
  TABLE_HOSPITAL_DETAIL, 
  TABLE_HOSPITAL_TREATMENT, 
  TABLE_HOSPITAL_BUSINESS_HOUR, 
  TABLE_TREATMENT,
  TABLE_FEEDBACKS
} from '@/constants/tables';
import { 
  HospitalData, 
  HospitalDetailData, 
  BusinessHourData, 
  DoctorData
} from '@/types/hospital';
import DoctorCard from '../DoctorCard';
import { TreatmentSelectedOptionInfo } from '../TreatmentSelectedOptionInfo';
import { useTreatmentCategories } from '@/hooks/useTreatmentCategories';
import Divider from '../Divider';
import { findRegionByKey, REGIONS } from '@/app/contents/location';

interface PreviewClinicInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  id_uuid_hospital: string;
}

// 치료 정보를 위한 인터페이스 (실제 DB 구조에 맞게)
interface TreatmentData {
  id_uuid: string;
  id_uuid_hospital: string;
  id_uuid_treatment: string | null;
  option_value: string;
  price: number;
  discount_price: number;
  price_expose: number;
  etc: string;
}

interface CombinedHospitalData extends HospitalData, Partial<HospitalDetailData> {
  business_hours?: BusinessHourData[];
  doctors?: DoctorData[];
  treatments?: TreatmentData[];
  treatmentDetails?: any[];
  feedback?: string;
}

const PreviewClinicInfoModal: React.FC<PreviewClinicInfoModalProps> = ({
  isOpen,
  onClose,
  id_uuid_hospital,
}) => {
  const [hospitalData, setHospitalData] = useState<CombinedHospitalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 치료 카테고리 데이터 가져오기
  const { data: categories } = useTreatmentCategories();

  useEffect(() => {
    if (isOpen && id_uuid_hospital) {
      loadHospitalData();
    }
  }, [isOpen, id_uuid_hospital]);

  const loadHospitalData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Step 1: 병원 기본 정보 조회
      const { data: hospitalInfo, error: hospitalError } = await supabase
        .from(TABLE_HOSPITAL)
        .select('*')
        .eq('id_uuid', id_uuid_hospital)
        .single();

      if (hospitalError) throw hospitalError;

      // Step 2: 병원 운영 시간 조회
      const { data: businessHours, error: businessError } = await supabase
        .from(TABLE_HOSPITAL_BUSINESS_HOUR)
        .select('*')
        .eq('id_uuid_hospital', id_uuid_hospital)
        .order('day_of_week');

      if (businessError) throw businessError;

      // Step 3: 의사 정보 조회
      const { data: doctors, error: doctorError } = await supabase
        .from(TABLE_DOCTOR)
        .select('*')
        .eq('id_uuid_hospital', id_uuid_hospital)
        .order('chief', { ascending: false });

      if (doctorError) throw doctorError;

      // Step 4: 치료 정보 조회
      const { data: treatments, error: treatmentError } = await supabase
        .from(TABLE_HOSPITAL_TREATMENT)
        .select('*')
        .eq('id_uuid_hospital', id_uuid_hospital);

      if (treatmentError) throw treatmentError;

      // Step 4-1: 치료 정보에서 UUID 추출하여 실제 치료 데이터 가져오기
      let treatmentDetails: any[] = [];
      if (treatments && treatments.length > 0) {
        const treatmentUuids = treatments
          .filter(treatment => treatment.id_uuid_treatment)
          .map(treatment => treatment.id_uuid_treatment);
        
        if (treatmentUuids.length > 0) {
          const { data: treatmentData, error: treatmentDetailError } = await supabase
            .from(TABLE_TREATMENT)
            .select('id_uuid, code, name')
            .in('id_uuid', treatmentUuids);

          if (treatmentDetailError) {
            console.error('시술 정보 로딩 실패:', treatmentDetailError);
          } else {
            treatmentDetails = treatmentData || [];
          }
        }
      }

      // Step 5: 병원 상세 정보 조회 (언어 및 기타 정보)
      const { data: hospitalDetails, error: detailError } = await supabase
        .from(TABLE_HOSPITAL_DETAIL)
        .select('*')
        .eq('id_uuid_hospital', id_uuid_hospital)
        .single();

      if (detailError && detailError.code !== 'PGRST116') {
        throw detailError;
      }

      // Step 6: 피드백 정보 조회
      const { data: feedbackData, error: feedbackError } = await supabase
        .from(TABLE_FEEDBACKS)
        .select('feedback_content')
        .eq('id_uuid_hospital', id_uuid_hospital)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (feedbackError) {
        console.error('피드백 정보 로딩 실패:', feedbackError);
      }
      
      // 데이터 조합
      const combinedData: CombinedHospitalData = {
        ...hospitalInfo,
        business_hours: businessHours || [],
        doctors: doctors || [],
        treatments: treatments || [],
        treatmentDetails: treatmentDetails || [],
        available_languages: hospitalDetails?.available_languages || [],
        feedback: feedbackData?.feedback_content || '',
        ...hospitalDetails,
      };

console.log('combinedData START ==================================');
      console.log('combinedData', combinedData);
      console.log('combinedData END ==================================');

      setHospitalData(combinedData);
    } catch (err) {
      console.error('병원 데이터 로드 실패:', err);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatDayOfWeek = (day: string) => {
    // 이미 대문자 축약형인 경우 그대로 반환
    if (['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].includes(day)) {
      return day;
    }
    
    // 소문자 전체 형태를 대문자 축약형으로 변환
    const days = {
      'monday': 'MON',
      'tuesday': 'TUE', 
      'wednesday': 'WED',
      'thursday': 'THU',
      'friday': 'FRI',
      'saturday': 'SAT',
      'sunday': 'SUN'
    };
    return days[day as keyof typeof days] || day;
  };

  // 요일 순서 정렬을 위한 함수
  const getDayOrder = (day: string) => {
    const dayOrder = {
      'MON': 1,
      'TUE': 2,
      'WED': 3,
      'THU': 4,
      'FRI': 5,
      'SAT': 6,
      'SUN': 7,
      // 기존 소문자 형태도 지원
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6,
      'sunday': 7
    };
    return dayOrder[day as keyof typeof dayOrder] || 8;
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    return time.substring(0, 5); // HH:MM 형식으로 변환
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full h-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">병원 정보 미리보기</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* 내용 */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-lg text-gray-600">데이터를 불러오는 중...</div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-64">
              <div className="text-lg text-red-600">{error}</div>
            </div>
          )}

          {hospitalData && (
            <div className="space-y-8">
              {/* Step 1: 기본 정보 */}
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 text-blue-800 flex items-center">
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm mr-3">Step 1</span>
                  기본 정보
                </h3>
                <div className="space-y-4">
                  {/* 병원 기본 정보 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <strong className="w-20 text-gray-700">병원명:</strong>
                        <span className="text-lg font-medium">{hospitalData.name || '입력되지 않음'}</span>
                      </div>
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-gray-500" />
                        <strong className="w-16 text-gray-700">이메일:</strong>
                        <span>{hospitalData.email || '입력되지 않음'}</span>
                      </div>
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-gray-500" />
                        <strong className="w-16 text-gray-700">전화:</strong>
                        <span>{hospitalData.tel || '입력되지 않음'}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                        <strong className="w-16 text-gray-700">지역:</strong>
                        <span>{findRegionByKey(REGIONS, parseInt(hospitalData.location, 10))?.label || '입력되지 않음'}</span>
                      </div>
                    </div>
                  </div>

                  {/* 주소 정보 */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3 text-gray-800">주소 정보</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div>
                          <strong className="text-sm text-gray-700 mr-3">도로명 주소:</strong>
                          <span className="text-sm">{hospitalData.address_full_road || '입력되지 않음'}</span>
                        </div>
                        <div>
                          <strong className="text-sm text-gray-700 mr-3">도로명 주소 (영문):</strong>
                          <span className="text-sm">{hospitalData.address_full_road_en || '입력되지 않음'}</span>
                        </div>
                        <div>
                          <strong className="text-sm text-gray-700 mr-3">지번 주소:</strong>
                          <span className="text-sm">{hospitalData.address_full_jibun || '입력되지 않음'}</span>
                        </div>
                        <div>
                          <strong className="text-sm text-gray-700 mr-3">지번 주소 (영문):</strong>
                          <span className="text-sm">{hospitalData.address_full_jibun_en || '입력되지 않음'}</span>
                        </div>
                        <div>
                          <strong className="text-sm text-gray-700 mr-3">상세 주소:</strong>
                          <span className="text-sm">{hospitalData.address_detail || '입력되지 않음'}</span>
                        </div>
                        <div>
                          <strong className="text-sm text-gray-700 mr-3">상세 주소 (영문):</strong>
                          <span className="text-sm">{hospitalData.address_detail_en || '입력되지 않음'}</span>
                        </div>
                        <div>
                          <strong className="text-sm text-gray-700 mr-3">우편번호:</strong>
                          <span className="text-sm">{hospitalData.zipcode || '입력되지 않음'}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <strong className="text-sm text-gray-700 mr-3">시/도:</strong>
                          <span className="text-sm">{hospitalData.address_si || (hospitalData as any).sido || '입력되지 않음'}</span>
                        </div>
                        <div>
                          <strong className="text-sm text-gray-700 mr-3">시/도 (영문):</strong>
                          <span className="text-sm">{hospitalData.address_si_en || '입력되지 않음'}</span>
                        </div>
                        <div>
                          <strong className="text-sm text-gray-700 mr-3">시/군/구:</strong>
                          <span className="text-sm">{hospitalData.address_gu || (hospitalData as any).sigungu || '입력되지 않음'}</span>
                        </div>
                        <div>
                          <strong className="text-sm text-gray-700 mr-3">시/군/구 (영문):</strong>
                          <span className="text-sm">{hospitalData.address_gu_en || '입력되지 않음'}</span>
                        </div>
                        <div>
                          <strong className="text-sm text-gray-700 mr-3">동/면/읍:</strong>
                          <span className="text-sm">{hospitalData.address_dong || (hospitalData as any).dong || '입력되지 않음'}</span>
                        </div>
                        <div>
                          <strong className="text-sm text-gray-700 mr-3">동/면/읍 (영문):</strong>
                          <span className="text-sm">{hospitalData.address_dong_en || '입력되지 않음'}</span>
                        </div>
                        <div>
                          <strong className="text-sm text-gray-700 mr-3">좌표:</strong>
                          <span className="text-sm">
                            {hospitalData.latitude && hospitalData.longitude 
                              ? `위도 : ${hospitalData.latitude}, 경도 : ${hospitalData.longitude}`
                              : '입력되지 않음'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* 찾아오는 길 */}
                    <div className="mt-4 pt-4 border-t">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <strong className="text-sm text-gray-700 mr-3" >찾아오는 길:</strong>
                          <span className="text-sm">{hospitalData.directions_to_clinic || '입력되지 않음'}</span>
                        </div>
                        
                        <div>
                        <strong className="text-sm text-gray-700 mr-3">찾아오는 길 (영문):</strong>
                        <span className="text-sm">{hospitalData.directions_to_clinic_en || '입력되지 않음'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

<Divider />

                {/* SNS 정보 */}
                <div>
                  <h4 className="font-medium mb-2 flex items-center">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    SNS 및 연락처
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {hospitalData.kakao_talk && (
                      <div className="flex items-center p-2 bg-white rounded border">
                        <strong className="w-24 text-gray-700">카카오톡:</strong>
                        <span>{hospitalData.kakao_talk}</span>
                      </div>
                    )}
                    {hospitalData.line && (
                      <div className="flex items-center p-2 bg-white rounded border">
                        <strong className="w-24 text-gray-700">라인:</strong>
                        <span>{hospitalData.line}</span>
                      </div>
                    )}
                    {hospitalData.we_chat && (
                      <div className="flex items-center p-2 bg-white rounded border">
                        <strong className="w-24 text-gray-700">위챗:</strong>
                        <span>{hospitalData.we_chat}</span>
                      </div>
                    )}
                    {hospitalData.whats_app && (
                      <div className="flex items-center p-2 bg-white rounded border">
                        <strong className="w-24 text-gray-700">왓츠앱:</strong>
                        <span>{hospitalData.whats_app}</span>
                      </div>
                    )}
                    {hospitalData.telegram && (
                      <div className="flex items-center p-2 bg-white rounded border">
                        <strong className="w-24 text-gray-700">텔레그램:</strong>
                        <span>{hospitalData.telegram}</span>
                      </div>
                    )}
                    {hospitalData.facebook_messenger && (
                      <div className="flex items-center p-2 bg-white rounded border">
                        <strong className="w-24 text-gray-700">페이스북:</strong>
                        <span>{hospitalData.facebook_messenger}</span>
                      </div>
                    )}
                    {hospitalData.instagram && (
                      <div className="flex items-center p-2 bg-white rounded border">
                        <strong className="w-24 text-gray-700">인스타그램:</strong>
                        <span>{hospitalData.instagram}</span>
                      </div>
                    )}
                    {hospitalData.tiktok && (
                      <div className="flex items-center p-2 bg-white rounded border">
                        <strong className="w-24 text-gray-700">틱톡:</strong>
                        <span>{hospitalData.tiktok}</span>
                      </div>
                    )}
                    {hospitalData.youtube && (
                      <div className="flex items-center p-2 bg-white rounded border">
                        <strong className="w-24 text-gray-700">유튜브:</strong>
                        <span>{hospitalData.youtube}</span>
                      </div>
                    )}
                    {hospitalData.other_channel && (
                      <div className="flex items-center p-2 bg-white rounded border">
                        <strong className="w-24 text-gray-700">기타:</strong>
                        <span>{hospitalData.other_channel}</span>
                      </div>
                    )}
                  </div>
                  
                  {hospitalData.sns_content_agreement === 1 && (
                    <div className="mt-3 p-3 bg-green-100 border border-green-300 rounded">
                      <span className="text-green-800 font-medium">✓ SNS 콘텐츠 사용 동의</span>
                    </div>
                  )}
                  
                  {hospitalData.sns_content_agreement === 0 && (
                    <div className="mt-3 p-3 bg-yellow-100 border border-yellow-300 rounded">
                      <div className="flex items-start">
                        <span className="text-yellow-800 font-medium">✗ SNS 콘텐츠 사용 동의하지 않음</span>
                      </div>
                      <div className="text-sm text-yellow-700 mt-1">
                        (동의해 주신다면 귀하의 병원을 홍보하는데 더욱 효과적입니다. 동의는 추후 철회 가능합니다)
                      </div>
                    </div>
                  )}
                  
                  {(hospitalData.sns_content_agreement === null || hospitalData.sns_content_agreement === undefined) && (
                    <div className="mt-3 p-3 bg-gray-100 border border-gray-300 rounded">
                      <span className="text-gray-700 font-medium">SNS 콘텐츠 사용 동의 여부: 입력되지 않음</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: 운영 시간 및 부가 정보 */}
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 text-green-800 flex items-center">
                  <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm mr-3">Step 2</span>
                  운영 시간 및 부가 정보
                </h3>
                
                {/* 운영 시간 */}
                <div className="mb-6">
                  <h4 className="font-medium mb-3 text-gray-800">운영 시간</h4>
                  <div className="space-y-1">
                    {(() => {
                      console.log('=== 운영시간 정렬 디버깅 START ===');
                      console.log('원본 business_hours:', hospitalData.business_hours);
                      
                      const sorted = hospitalData.business_hours
                        ?.sort((a, b) => {
                          const orderA = getDayOrder(a.day_of_week);
                          const orderB = getDayOrder(b.day_of_week);
                          console.log(`${a.day_of_week} (${orderA}) vs ${b.day_of_week} (${orderB})`);
                          return orderA - orderB;
                        });
                      
                      console.log('정렬된 business_hours:', sorted);
                      console.log('=== 운영시간 정렬 디버깅 END ===');
                      
                      return sorted?.map((hour, index) => (
                        <div key={index} className="flex items-center p-2 bg-white rounded border">
                          <Clock className="w-4 h-4 mr-2 text-gray-500" />
                          <span className="font-medium w-12 text-sm">{formatDayOfWeek(hour.day_of_week)}</span>
                          <span className="mx-3 text-gray-400">|</span>
                          {hour.status === 'closed' ? (
                            <span className="text-red-600 font-medium text-sm">휴무</span>
                          ) : hour.status === 'ask' ? (
                            <span className="text-orange-600 font-medium text-sm">진료시간 문의필요</span>
                          ) : hour.status === 'open' && hour.open_time && hour.close_time ? (
                            <div className="flex items-center">
                              <span className="text-gray-700 text-sm mr-2">
                                {formatTime(hour.open_time)} - {formatTime(hour.close_time)}
                              </span>
                              <span className="text-green-600 font-medium text-sm">영업</span>
                            </div>
                          ) : (
                            <span className="text-gray-500 text-sm">시간 정보 없음</span>
                          )}
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* 부가 정보 */}
                <div>
                  <h4 className="font-medium mb-3 text-gray-800">부가 정보</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {hospitalData.has_private_recovery_room && (
                      <div className="flex items-center p-2 bg-white rounded border">
                        <span className="text-green-600 mr-2">✓</span>
                        <span>개인 회복실</span>
                      </div>
                    )}
                    {hospitalData.has_parking && (
                      <div className="flex items-center p-2 bg-white rounded border">
                        <span className="text-green-600 mr-2">✓</span>
                        <span>주차 가능</span>
                      </div>
                    )}
                    {hospitalData.has_cctv && (
                      <div className="flex items-center p-2 bg-white rounded border">
                        <span className="text-green-600 mr-2">✓</span>
                        <span>CCTV 설치</span>
                      </div>
                    )}
                    {hospitalData.has_night_counseling && (
                      <div className="flex items-center p-2 bg-white rounded border">
                        <span className="text-green-600 mr-2">✓</span>
                        <span>야간 상담 가능</span>
                      </div>
                    )}
                    {hospitalData.has_female_doctor && (
                      <div className="flex items-center p-2 bg-white rounded border">
                        <span className="text-green-600 mr-2">✓</span>
                        <span>여의사 진료</span>
                      </div>
                    )}
                    {hospitalData.has_anesthesiologist && (
                      <div className="flex items-center p-2 bg-white rounded border">
                        <span className="text-green-600 mr-2">✓</span>
                        <span>마취과 전문의</span>
                      </div>
                    )}
                    {hospitalData.specialist_count && hospitalData.specialist_count > 0 && (
                      <div className="flex items-center p-2 bg-white rounded border">
                        <span className="text-blue-600 mr-2">👨‍⚕️</span>
                        <span>전문의 {hospitalData.specialist_count}명</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 3: 이미지 및 의사 정보 */}
              <div className="bg-purple-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 text-purple-800 flex items-center">
                  <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm mr-3">Step 3</span>
                  이미지 및 의사 정보
                </h3>
                
                {/* 썸네일 이미지 */}
                {hospitalData.thumbnail_url && (
                  <div className="mb-6">
                    <h4 className="font-medium mb-2 flex items-center">
                      <Camera className="w-4 h-4 mr-2" />
                      썸네일 이미지
                    </h4>
                    <div className="w-64 h-40 relative rounded-lg overflow-hidden border">
                      <Image
                        src={hospitalData.thumbnail_url}
                        alt="병원 썸네일"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* 병원 이미지들 */}
                {hospitalData.imageurls && hospitalData.imageurls.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium mb-2 flex items-center">
                      <Camera className="w-4 h-4 mr-2" />
                      병원 이미지 ({hospitalData.imageurls.length}개)
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {hospitalData.imageurls.map((url, index) => (
                        <div key={index} className="aspect-video relative rounded-lg overflow-hidden border">
                          <Image
                            src={url}
                            alt={`병원 이미지 ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 의사 정보 */}
                {hospitalData.doctors && hospitalData.doctors.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      의사 정보 ({hospitalData.doctors.length}명)
                    </h4>
                    <div className="flex flex-wrap gap-4">
                      {hospitalData.doctors.map((doctor, index) => (
                        <DoctorCard
                          key={index}
                          doctor={{
                            id: (doctor as any).id_uuid || `doctor-${index}`,
                            name: doctor.name,
                            bio: doctor.bio,
                            imagePreview: Array.isArray(doctor.image_url) ? doctor.image_url[0] : doctor.image_url,
                            isChief: doctor.chief === 1
                          }}
                          mode='preview'
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Step 4: 치료 정보 */}
              {hospitalData.treatments && hospitalData.treatments.length > 0 && (
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-4 text-green-800 flex items-center">
                    <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm mr-3">Step 4</span>
                    치료 정보
                  </h3>
                  
                  {/* TreatmentSelectedOptionInfo 컴포넌트 사용 */}
                  <TreatmentSelectedOptionInfo
                    selectedKeys={(() => {
                      // treatmentDetails의 code를 사용하여 selectedKeys 생성
                      if (!hospitalData.treatmentDetails || !categories) return [];
                      
                      const codes = hospitalData.treatmentDetails.map(detail => detail.code);
                      console.log('Treatment codes:', codes);
                      
                      return [...new Set(codes)].filter(code => code > 0);
                    })()}
                    productOptions={(() => {
                      // treatments와 treatmentDetails를 매칭하여 productOptions 생성
                      if (!hospitalData.treatments || !hospitalData.treatmentDetails) return [];
                      
                      return hospitalData.treatments.map((treatment) => {
                        // UUID로 treatmentDetails에서 해당 치료 정보 찾기
                        const treatmentDetail = hospitalData.treatmentDetails?.find(
                          detail => detail.id_uuid === treatment.id_uuid_treatment
                        );
                        
                        return {
                          id: treatment.id_uuid,
                          treatmentKey: treatmentDetail?.code || 0,
                          value1: treatment.option_value && treatment.option_value.trim() !== '' 
                            ? (isNaN(parseInt(treatment.option_value)) ? 0 : parseInt(treatment.option_value))
                            : 0,
                          value2: treatment.price || 0
                        };
                      });
                    })()}
                    etc={hospitalData.treatments
                      .filter(treatment => treatment.etc && treatment.etc.trim() !== '')
                      .map(treatment => treatment.etc)
                      .join('\n')
                    }
                    categories={categories || []}
                    showTitle={false}
                    className="bg-white"
                  />
                </div>
              )}

              {/* Step 5: 사용가능 언어 및 피드백 정보  */}
              <div className="bg-pink-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 text-pink-800 flex items-center">
                  <span className="bg-pink-600 text-white px-3 py-1 rounded-full text-sm mr-3">Step 5</span>
                  사용 가능 언어 및 피드백 정보
                </h3>
                
                {/* 사용 가능한 언어 */}
                {hospitalData.available_languages && hospitalData.available_languages.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2 flex items-center">
                      <Globe className="w-4 h-4 mr-2" />
                      사용 가능한 언어
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {hospitalData.available_languages.map((lang, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 피드백 정보 */}
                <div>
                  <h4 className="font-medium mb-2 flex items-center">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    피드백 정보
                  </h4>
                  {hospitalData.feedback && hospitalData.feedback.trim() !== '' ? (
                    <div className="p-4 bg-white rounded-lg border border-gray-200">
                      <div className="text-sm text-gray-700 whitespace-pre-wrap">
                        {hospitalData.feedback}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-sm text-gray-500 italic">
                        피드백 정보가 없습니다.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewClinicInfoModal;
