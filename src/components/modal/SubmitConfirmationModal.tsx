"use client";

import React from "react";
import { X, Check, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FormDataSummary {
  basicInfo: {
    name: string;
    searchkey: string;
    search_key: string;
  };
  address: {
    road: string;
    jibun: string;
    detail: string;
    coordinates: string;
  };
  location: string;
  treatments: {
    count: number;
    items: string[];
  };
  treatmentOptions: {
    count: number;
    items: Array<{
      treatmentKey: number;
      optionName: string;
      price: number;
    }>;
  };
  openingHours: {
    count: number;
    items: Array<{
      day: string;
      time: string;
      status: string;
    }>;
  };
  extraOptions: {
    facilities: string[];
    specialistCount: number;
  };
  images: {
    clinicImages: number;
    doctorImages: number;
  };
}

interface SubmitConfirmationModalProps {
  open: boolean;
  formData: FormDataSummary;
  onConfirm: () => void;
  onCancel: () => void;
}

export function SubmitConfirmationModal({
  open,
  formData,
  onConfirm,
  onCancel,
}: SubmitConfirmationModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onCancel}
      />
      
      {/* 모달 컨텐츠 */}
      <div 
        className="relative bg-white rounded-lg shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">병원 정보 최종 확인</h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* 스크롤 가능한 컨텐츠 영역 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* 기본 정보 */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">🏥 기본 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div><strong>병원명:</strong> {formData.basicInfo.name}</div>
                <div><strong>검색키:</strong> {formData.basicInfo.searchkey}</div>
                <div><strong>검색키2:</strong> {formData.basicInfo.search_key}</div>
              </div>
            </div>

            {/* 주소 정보 */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800 mb-3">📍 주소 정보</h3>
              <div className="space-y-2 text-sm">
                <div><strong>도로명:</strong> {formData.address.road}</div>
                <div><strong>지번:</strong> {formData.address.jibun}</div>
                <div><strong>상세주소:</strong> {formData.address.detail}</div>
                <div><strong>좌표:</strong> {formData.address.coordinates}</div>
                <div><strong>지역:</strong> {formData.location}</div>
              </div>
            </div>

            {/* 시술 정보 */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-800 mb-3">💊 시술 정보</h3>
              <div className="space-y-3">
                <div className="text-sm">
                  <strong>선택된 시술 ({formData.treatments.count}개):</strong>
                  <div className="mt-1 space-y-1">
                    {formData.treatments.items.map((treatment, idx) => (
                      <div key={idx} className="pl-4 text-gray-700">• {treatment}</div>
                    ))}
                  </div>
                </div>
                
                {formData.treatmentOptions.count > 0 && (
                  <div className="text-sm">
                    <strong>상품옵션 ({formData.treatmentOptions.count}개):</strong>
                    <div className="mt-1 space-y-1">
                      {formData.treatmentOptions.items.map((option, idx) => (
                        <div key={idx} className="pl-4 text-gray-700">
                          • {option.optionName}: {option.price.toLocaleString()}원
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 영업시간 */}
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-yellow-800 mb-3">🕒 영업시간</h3>
              <div className="text-sm">
                <strong>영업일정 ({formData.openingHours.count}일):</strong>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {formData.openingHours.items.map((hour, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-white rounded border">
                      <span className="font-medium">{hour.day}</span>
                      <span className="text-gray-600">{hour.time}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        hour.status === '영업' 
                          ? 'bg-green-100 text-green-800'
                          : hour.status === '휴무'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {hour.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 부가 시설 */}
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-orange-800 mb-3">🏢 부가 시설</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>시설:</strong> {formData.extraOptions.facilities.join(', ')}
                </div>
                <div>
                  <strong>의사 수:</strong> {formData.extraOptions.specialistCount}명
                </div>
              </div>
            </div>

            {/* 이미지 정보 */}
            <div className="bg-pink-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-pink-800 mb-3">📸 이미지 정보</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>병원 이미지:</strong> {formData.images.clinicImages}장</div>
                <div><strong>의사 이미지:</strong> {formData.images.doctorImages}장</div>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 버튼 영역 */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 flex-shrink-0">
          <div className="flex gap-4 justify-end">
            <Button 
              variant="outline" 
              onClick={onCancel}
              className="px-8 py-3 text-base"
            >
              <X className="w-4 h-4 mr-2" />
              닫기
            </Button>
            <Button 
              onClick={onConfirm}
              className="px-8 py-3 text-base bg-blue-600 hover:bg-blue-700"
            >
              <Check className="w-4 h-4 mr-2" />
              최종 제출
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 