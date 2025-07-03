'use client';

import PageHeader from '@/components/PageHeader';
import { useEffect, useState } from 'react';
import Button from '@/components/Button';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { loadExistingHospitalData } from '@/lib/hospitalDataLoader';
import { ExistingHospitalData } from '@/types/hospital';
import Divider from '@/components/Divider';

interface ClinicInfoEditClientProps {
  currentUserUid: string;
}

interface BasicInfo {
  name: string;
  email: string;
  tel: string;
  kakao_talk: string;
  line: string;
  we_chat: string;
  whats_app: string;
  telegram: string;
  facebook_messenger: string;
  instagram: string;
  tiktok: string;
  youtube: string;
  other_channel: string;
  snsContentAgreement: 1 | 0 | null;
}

const ClinicInfoEditClient = ({
  currentUserUid,
}: ClinicInfoEditClientProps) => {
  const router = useRouter();
  const [isLoadingExistingData, setIsLoadingExistingData] = useState(false);
  const [existingData, setExistingData] = useState<ExistingHospitalData | null>(null);
  const [basicInfo, setBasicInfo] = useState<BasicInfo>({
    name: '',
    email: '',
    tel: '',
    kakao_talk: '',
    line: '',
    we_chat: '',
    whats_app: '',
    telegram: '',
    facebook_messenger: '',
    instagram: '',
    tiktok: '',
    youtube: '',
    other_channel: '',
    snsContentAgreement: null,
  });

  // 기존 데이터 로딩
  useEffect(() => {
    if (currentUserUid) {
      loadExistingDataForEdit();
    }
  }, [currentUserUid]);

  const loadExistingDataForEdit = async () => {
    try {
      setIsLoadingExistingData(true);
      const data = await loadExistingHospitalData(currentUserUid);
      if (data) {
        setExistingData(data);
        if (data.hospitalDetail) {
          setBasicInfo({
            name: data.hospital.name || '',
            email: data.hospitalDetail.email || '',
            tel: data.hospitalDetail.tel || '',
            kakao_talk: data.hospitalDetail.kakao_talk || '',
            line: data.hospitalDetail.line || '',
            we_chat: data.hospitalDetail.we_chat || '',
            whats_app: data.hospitalDetail.whats_app || '',
            telegram: data.hospitalDetail.telegram || '',
            facebook_messenger: data.hospitalDetail.facebook_messenger || '',
            instagram: data.hospitalDetail.instagram || '',
            tiktok: data.hospitalDetail.tiktok || '',
            youtube: data.hospitalDetail.youtube || '',
            other_channel: data.hospitalDetail.other_channel || '',
            snsContentAgreement: data.hospitalDetail.sns_content_agreement === null ? null : (data.hospitalDetail.sns_content_agreement as 1 | 0),
          });
        }
      }
    } catch (error) {
      console.error('데이터 로딩 실패:', error);
    } finally {
      setIsLoadingExistingData(false);
    }
  };

  if (isLoadingExistingData) return <LoadingSpinner backdrop />;

  const renderSNSChannels = () => {
    const channels = [
      { key: 'kakao_talk', label: '카카오톡' },
      { key: 'line', label: '라인' },
      { key: 'we_chat', label: '위챗' },
      { key: 'whats_app', label: '왓츠앱' },
      { key: 'telegram', label: '텔레그램' },
      { key: 'facebook_messenger', label: '페이스북 메신저' },
      { key: 'instagram', label: '인스타그램' },
      { key: 'tiktok', label: '틱톡' },
      { key: 'youtube', label: '유튜브' },
      { key: 'other_channel', label: '기타 채널' }
    ];

    return (
      <div className="space-y-2">
        {channels.map(channel => {
          const value = basicInfo[channel.key as keyof BasicInfo];
          if (!value) return null;
          return (
            <div key={channel.key} className="flex items-center">
              <span className="font-medium w-32">{channel.label}:</span>
              <span>{value}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <main>
      <PageHeader name='병원 정보 보기' />
      <div className='my-8 mx-auto px-6' style={{ width: '100vw', maxWidth: '1024px' }}>
        <div className='space-y-4 w-full'>
          {/* 기본 정보 */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-4">기본 정보</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="font-medium w-32">병원명:</span>
                <span>{basicInfo.name}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium w-32">이메일:</span>
                <span>{basicInfo.email}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium w-32">전화번호:</span>
                <span>{basicInfo.tel}</span>
              </div>
            </div>
          </div>

          <Divider />

          {/* SNS 채널 정보 */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-4">SNS 상담 채널</h3>
            {renderSNSChannels()}
            <div className="mt-4">
              <span className="font-medium">SNS 컨텐츠 이용 동의:</span>
              <span className="ml-2">
                {basicInfo.snsContentAgreement === 1 ? '동의' : 
                 basicInfo.snsContentAgreement === 0 ? '미동의' : '미설정'}
              </span>
            </div>
          </div>

          <Divider />

          {/* 주소 정보 */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-4">주소 정보</h3>
            {existingData?.hospital && (
              <div className="space-y-2">
                <div>
                  <span className="font-medium">도로명 주소:</span>
                  <p className="mt-1">{existingData.hospital.address_full_road}</p>
                </div>
                <div>
                  <span className="font-medium">상세 주소:</span>
                  <p className="mt-1">{existingData.hospital.address_detail}</p>
                </div>
                <div>
                  <span className="font-medium">찾아오시는 길:</span>
                  <p className="mt-1">{existingData.hospital.directions_to_clinic}</p>
                </div>
              </div>
            )}
          </div>

          <Divider />

          {/* 가능 시술 */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-4">가능 시술</h3>
            {existingData?.treatments && existingData.treatments.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1">
                {existingData.treatments.map((treatment, index) => (
                  <li key={index}>{treatment.name}</li>
                ))}
              </ul>
            ) : (
              <p>등록된 시술 정보가 없습니다.</p>
            )}
          </div>

          <Divider />

          {/* 진료 시간 */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-4">진료 시간</h3>
            {existingData?.businessHours && existingData.businessHours.length > 0 ? (
              <div className="grid grid-cols-1 gap-2">
                {existingData.businessHours.map((hour, index) => (
                  <div key={index} className="flex items-center">
                    <span className="font-medium w-20">{hour.day}:</span>
                    {/* <span>
                      {hour.closed ? '휴무' :
                       hour.ask ? '문의 필요' :
                       `${hour.from.hour}:${hour.from.minute.toString().padStart(2, '0')} - 
                        ${hour.to.hour}:${hour.to.minute.toString().padStart(2, '0')}`}
                    </span> */}
                  </div>
                ))}
              </div>
            ) : (
              <p>등록된 진료 시간이 없습니다.</p>
            )}
          </div>

          <Divider />

          {/* 부가 시설 */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-4">부가 시설</h3>
            {existingData?.hospitalDetail && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">전담 회복실:</span>
                    <span className="ml-2">{existingData.hospitalDetail.has_private_recovery_room ? '있음' : '없음'}</span>
                  </div>
                  <div>
                    <span className="font-medium">주차 시설:</span>
                    <span className="ml-2">{existingData.hospitalDetail.has_parking ? '있음' : '없음'}</span>
                  </div>
                  <div>
                    <span className="font-medium">CCTV:</span>
                    <span className="ml-2">{existingData.hospitalDetail.has_cctv ? '있음' : '없음'}</span>
                  </div>
                  <div>
                    <span className="font-medium">야간 상담:</span>
                    <span className="ml-2">{existingData.hospitalDetail.has_night_counseling ? '가능' : '불가능'}</span>
                  </div>
                  <div>
                    <span className="font-medium">여의사 진료:</span>
                    <span className="ml-2">{existingData.hospitalDetail.has_female_doctor ? '가능' : '불가능'}</span>
                  </div>
                  <div>
                    <span className="font-medium">마취 전문의:</span>
                    <span className="ml-2">{existingData.hospitalDetail.has_anesthesiologist ? '있음' : '없음'}</span>
                  </div>
                </div>
                <div>
                  <span className="font-medium">전문의 수:</span>
                  <span className="ml-2">{existingData.hospitalDetail.specialist_count}명</span>
                </div>
              </div>
            )}
          </div>

          <Divider />

          {/* 병원 이미지 */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-4">병원 이미지</h3>
            {existingData?.hospital.imageurls && existingData.hospital.imageurls.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {existingData.hospital.imageurls.map((url, index) => (
                  <div key={index} className="aspect-video relative">
                    <img
                      src={url}
                      alt={`병원 이미지 ${index + 1}`}
                      className="w-full h-full object-cover rounded"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p>등록된 이미지가 없습니다.</p>
            )}
          </div>

          <Divider />

          {/* 의사 정보 */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-4">의사 정보</h3>
            {existingData?.doctors && existingData.doctors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {existingData.doctors.map((doctor, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-24 h-24">
                        <img
                          src={doctor.imageurl || '/default/doctor_default_man.png'}
                          alt={doctor.name}
                          className="w-full h-full object-cover rounded"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{doctor.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{doctor.chief ? '대표원장' : '의사'}</p>
                        {doctor.bio && <p className="mt-2 text-sm">{doctor.bio}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>등록된 의사 정보가 없습니다.</p>
            )}
          </div>

          <Divider />

          {/* 가능 언어 */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-4">가능 언어</h3>
            {existingData?.hospitalDetail?.available_languages && existingData.hospitalDetail.available_languages.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {existingData.hospitalDetail.available_languages.map((language, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                    {language}
                  </span>
                ))}
              </div>
            ) : (
              <p>등록된 가능 언어가 없습니다.</p>
            )}
          </div>

          <Divider />

          {/* 피드백 */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-4">피드백</h3>
            {existingData?.feedback ? (
              <p className="whitespace-pre-wrap">{existingData.feedback}</p>
            ) : (
              <p>등록된 피드백이 없습니다.</p>
            )}
          </div>

          {/* 나가기 버튼 */}
          <div className="flex justify-center mt-8">
            <Button color="blue" onClick={() => router.back()}>
              나가기
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ClinicInfoEditClient;
