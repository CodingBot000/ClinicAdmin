"use client";

import React from "react";
import { X, Check, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BasicInfo } from "@/app/admin/upload/ClinicInfoUploadClient";


export interface FormDataSummary {
  basicInfo: BasicInfo;
  address: {
    road: string;
    jibun: string;
    detail: string;
    detail_en: string;
    directions_to_clinic: string;
    directions_to_clinic_en: string;
    coordinates: string;
  };
  location: string;
  treatments: {
    count: number;
    items: Array<{
      name: string;
      department: string | null;
    }>;
  };
  treatmentOptions: {
    count: number;
    items: Array<{
      treatmentKey: number;
      optionName: string;
      price: number;
      department: string | null;
    }>;
  };
  treatmentEtc: string;
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
    clinicImageUrls: string[];
  };
  doctors?: {
    count: number;
    items: Array<{
      name: string;
      bio: string;
      isChief: string;
      hasImage: string;
      imageUrl?: string;
    }>;
  };
  availableLanguages: string[];
  feedback: string;
}

interface PreviewModalProps {
  open: boolean;
  formData: FormDataSummary;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function PreviewModal({
  open,
  formData,
  onConfirm,
  onCancel,
  isSubmitting = false,
}: PreviewModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold">최종 확인</h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* 기본 정보 */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">🏥 기본 정보</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div><strong>병원명:</strong> {formData.basicInfo.name}</div>
                  <div><strong>이메일:</strong> {formData.basicInfo.email}</div>
                  <div><strong>전화번호:</strong> {formData.basicInfo.tel}</div>
                </div>

                <div className="text-sm">
                  <strong>SNS 채널:</strong>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {Object.entries({
                      'KakaoTalk': formData.basicInfo.kakao_talk,
                      'LINE': formData.basicInfo.line,
                      'WeChat': formData.basicInfo.we_chat,
                      'WhatsApp': formData.basicInfo.whats_app,
                      'Telegram': formData.basicInfo.telegram,
                      'Facebook Messenger': formData.basicInfo.facebook_messenger,
                      'Instagram': formData.basicInfo.instagram,
                      'TikTok': formData.basicInfo.tiktok,
                      'Youtube': formData.basicInfo.youtube,
                      'Other': formData.basicInfo.other_channel,
                    }).filter(([_, value]) => value).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2 p-2 bg-white rounded border">
                        <span className="font-medium">{key}:</span>
                        <span className="text-gray-600">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 주소 정보 */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800 mb-3">📍 주소 정보</h3>
              <div className="space-y-2 text-sm">
                <div><strong>도로명 주소:</strong> {formData.address.road}</div>
                <div><strong>지번 주소:</strong> {formData.address.jibun}</div>
                {formData.address.detail && (
                  <>
                    <div><strong>상세 주소:</strong> {formData.address.detail}</div>
                    <div><strong>상세 주소 (영문):</strong> {formData.address.detail_en}</div>
                  </>
                )}
                {formData.address.directions_to_clinic && (
                  <>
                    <div><strong>찾아오는 방법:</strong> {formData.address.directions_to_clinic}</div>
                    <div><strong>찾아오는 방법 (영문):</strong> {formData.address.directions_to_clinic_en}</div>
                  </>
                )}
                <div><strong>좌표:</strong> {formData.address.coordinates}</div>
                <div><strong>지역:</strong> {formData.location}</div>
              </div>
            </div>

            {/* 시술 정보 */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-800 mb-3">💉 시술 정보</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">선택된 시술 ({formData.treatments.count}개)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {formData.treatments.items.map((item, index) => (
                      <div key={index} className="bg-white p-2 rounded border">
                        <span className="font-medium">{item.name}</span>
                        {item.department && (
                          <span className="text-xs text-gray-500 ml-2">({item.department})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {formData.treatmentOptions.count > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">시술 옵션 ({formData.treatmentOptions.count}개)</h4>
                    <div className="space-y-2">
                      {formData.treatmentOptions.items.map((item, index) => (
                        <div key={index} className="bg-white p-2 rounded border">
                          <div className="flex justify-between items-center">
                            <span>{item.optionName}</span>
                            <span className="font-medium">{item.price.toLocaleString()}원</span>
                          </div>
                          {item.department && (
                            <span className="text-xs text-gray-500">{item.department}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {formData.treatmentEtc && (
                  <div>
                    <h4 className="font-medium mb-2">추가 정보</h4>
                    <div className="bg-white p-3 rounded border whitespace-pre-wrap text-sm">
                      {formData.treatmentEtc}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 영업시간 */}
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-yellow-800 mb-3">⏰ 영업시간</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {formData.openingHours.items.map((item, index) => (
                  <div key={index} className="bg-white p-2 rounded border flex justify-between items-center">
                    <span className="font-medium">{item.day}</span>
                    <span className="text-gray-600">
                      {item.status === '영업' ? item.time : item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 부가시설 */}
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-red-800 mb-3">🏥 부가시설</h3>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {formData.extraOptions.facilities.map((facility, index) => (
                    <span key={index} className="bg-white px-3 py-1 rounded-full border text-sm">
                      {facility}
                    </span>
                  ))}
                </div>
                <div className="text-sm">
                  <strong>전문의 수:</strong> {formData.extraOptions.specialistCount}명
                </div>
              </div>
            </div>

            {/* 가능 언어 */}
            {formData.availableLanguages.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">🌐 가능 언어</h3>
                <div className="flex flex-wrap gap-2">
                  {formData.availableLanguages.map((language, index) => (
                    <span key={index} className="bg-white px-3 py-1 rounded-full border text-sm">
                      {language}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 피드백 */}
            {formData.feedback && (
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-purple-800 mb-3">💬 피드백</h3>
                <div className="bg-white p-3 rounded border whitespace-pre-wrap text-sm">
                  {formData.feedback}
                </div>
              </div>
            )}

            {/* 이미지 정보 */}
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-indigo-800 mb-3">📸 이미지 정보</h3>
              <div className="space-y-3">
                <div className="text-sm">
                  <div><strong>병원 이미지:</strong> {formData.images.clinicImages}개</div>
                  <div><strong>의사 이미지:</strong> {formData.images.doctorImages}개</div>
                </div>
                {formData.images.clinicImageUrls.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">병원 이미지 미리보기</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {formData.images.clinicImageUrls.map((url, index) => (
                        <div key={index} className="aspect-video bg-gray-100 rounded overflow-hidden">
                          <img src={url} alt={`병원 이미지 ${index + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 의사 정보 */}
            {formData.doctors && formData.doctors.count > 0 && (
              <div className="bg-pink-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-pink-800 mb-3">👨‍⚕️ 의사 정보</h3>
                <div className="space-y-4">
                  {formData.doctors.items.map((doctor, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg border">
                      <div className="flex gap-4">
                        {doctor.imageUrl && (
                          <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0">
                            <img src={doctor.imageUrl} alt={doctor.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900 text-base">{doctor.name}</h4>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              doctor.isChief === '대표원장' 
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {doctor.isChief}
                            </span>
                          </div>
                          
                          {doctor.bio && doctor.bio.trim() !== '' && (
                            <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                              {doctor.bio}
                            </div>
                          )}
                          
                          {(!doctor.bio || doctor.bio.trim() === '') && (
                            <div className="text-sm text-gray-400 italic">
                              소개 정보 없음
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
              disabled={isSubmitting}
              className="px-8 py-3 text-base bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  제출 중...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  최종 제출
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}