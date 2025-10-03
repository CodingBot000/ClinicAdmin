'use client';

import { useState } from 'react';
import PageBottom from '@/components/PageBottom';
import SupportTreatment from '@/components/SupportTreatment';
import SupportDevices from '@/components/SupportDevices';
import PreviewModal from '@/components/modal/PreviewModal';
import SupportTreatmentFeedbackModal from '@/components/modal/SupportTreatmentFeedbackModal';

interface Step6SupportTreatmentsProps {
  id_uuid_hospital: string;
  currentUserUid: string;
  isEditMode?: boolean;
  onPrev: () => void;
  onNext: () => void;
}

type MainTabType = 'treatment' | 'device';

const Step6SupportTreatments = ({
  id_uuid_hospital,
  currentUserUid,
  isEditMode = false,
  onPrev,
  onNext,
}: Step6SupportTreatmentsProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState<MainTabType>('treatment');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  // 제공시술 데이터
  const [selectedSkinTreatments, setSelectedSkinTreatments] = useState<Set<string>>(new Set());
  const [selectedPlasticTreatments, setSelectedPlasticTreatments] = useState<Set<string>>(new Set());

  // 보유장비 데이터
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());

  // 제공시술 데이터 변경 핸들러
  const handleTreatmentDataChange = (skinItems: Set<string>, plasticItems: Set<string>) => {
    setSelectedSkinTreatments(skinItems);
    setSelectedPlasticTreatments(plasticItems);
  };

  // 보유장비 데이터 변경 핸들러
  const handleDeviceDataChange = (devices: Set<string>) => {
    setSelectedDevices(devices);
  };

  const handleNext = () => {
    // TODO: 선택된 항목 저장 로직
    console.log('=== 제공시술 ===');
    console.log('Skin Treatments:', Array.from(selectedSkinTreatments));
    console.log('Plastic Treatments:', Array.from(selectedPlasticTreatments));
    console.log('=== 보유장비 ===');
    console.log('Devices:', Array.from(selectedDevices));
    // onNext();
  };

  return (
    <main className="min-h-screen flex flex-col p-6">
      {/* 공통 타이틀 */}
      <h1 className="text-2xl font-bold mb-2">시술/보유장비 선택</h1>
      <span className="text-md text-red-500 font-base mb-6">
        선택하는 시술과 보유장비는 병원정보에 보여지며 검색등 병원 노출을 위해 다양한 용도로 활용됩니다.
      </span>

      {/* 메인 탭 (제공시술 / 보유장비) */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveMainTab('treatment')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              activeMainTab === 'treatment'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            제공시술
          </button>
          <button
            onClick={() => setActiveMainTab('device')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              activeMainTab === 'device'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            보유장비
          </button>
        </div>

        <div className="flex gap-2">
          {/* 피드백 버튼 */}
          <button
            onClick={() => setIsFeedbackOpen(true)}
            className="px-6 py-2 rounded-lg font-medium bg-orange-600 text-white hover:bg-orange-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            피드백
          </button>

          {/* 미리보기 버튼 */}
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="px-6 py-2 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            미리보기
          </button>
        </div>
      </div>

      {/* 컨텐츠 영역 */}
      <div className={activeMainTab === 'treatment' ? 'flex flex-col flex-1' : 'hidden'}>
        <SupportTreatment
          onDataChange={handleTreatmentDataChange}
          initialSkinItems={selectedSkinTreatments}
          initialPlasticItems={selectedPlasticTreatments}
        />
      </div>

      <div className={activeMainTab === 'device' ? 'flex flex-col flex-1' : 'hidden'}>
        <SupportDevices
          onDataChange={handleDeviceDataChange}
          initialDevices={selectedDevices}
        />
      </div>

      {/* 하단 버튼 */}
      <PageBottom step={6} isSubmitting={isSubmitting} onNext={handleNext} onPrev={onPrev} />

      {/* 미리보기 모달 */}
      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        selectedSkinTreatments={selectedSkinTreatments}
        selectedPlasticTreatments={selectedPlasticTreatments}
        selectedDevices={selectedDevices}
      />

      {/* 피드백 모달 */}
      <SupportTreatmentFeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />
    </main>
  );
};

export default Step6SupportTreatments;
