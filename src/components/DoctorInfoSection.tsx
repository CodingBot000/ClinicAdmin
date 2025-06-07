'use client';

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Edit2, Trash2, Plus } from "lucide-react";
import DoctorInfoForm, { DoctorInfo } from "./DoctorInfoForm";

interface DoctorInfoSectionProps {
  title: string;
  description?: string;
  onDoctorsChange: (doctors: DoctorInfo[]) => void;
}

const DoctorInfoSection: React.FC<DoctorInfoSectionProps> = ({
  title,
  description,
  onDoctorsChange,
}) => {
  const [doctors, setDoctors] = useState<DoctorInfo[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<DoctorInfo | undefined>(undefined);

  // 부모 컴포넌트에 의사 데이터 전달
  useEffect(() => {
    onDoctorsChange(doctors);
  }, [doctors, onDoctorsChange]);

  // 의사 추가/수정
  const handleSaveDoctor = (doctorInfo: DoctorInfo) => {
    if (editingDoctor) {
      // 수정
      setDoctors(prev => prev.map(doctor => 
        doctor.id === doctorInfo.id ? doctorInfo : doctor
      ));
    } else {
      // 추가
      setDoctors(prev => [...prev, doctorInfo]);
    }
    
    setEditingDoctor(undefined);
  };

  // 의사 삭제
  const handleDeleteDoctor = (id: string) => {
    if (confirm("정말 삭제하시겠습니까?")) {
      setDoctors(prev => prev.filter(doctor => doctor.id !== id));
    }
  };

  // 의사 편집
  const handleEditDoctor = (doctor: DoctorInfo) => {
    setEditingDoctor(doctor);
    setIsFormOpen(true);
  };

  // 대표원장 체크박스 변경
  const handleChiefChange = (id: string, isChief: boolean) => {
    setDoctors(prev => prev.map(doctor => 
      doctor.id === id ? { ...doctor, isChief } : doctor
    ));
  };

  // 새 의사 추가
  const handleAddNew = () => {
    setEditingDoctor(undefined);
    setIsFormOpen(true);
  };

  // 폼 닫기
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingDoctor(undefined);
  };

  return (
    <div className="w-full">
      {/* 헤더 */}
      <div className="flex justify-between items-start my-4">
        <div>
          <h2 className="font-semibold text-lg mb-2">{title}</h2>
          {description && (
            <div className="text-sm text-gray-600 whitespace-pre-line">
              {description}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <p className="text-sm text-gray-600">등록 {doctors.length}명</p>
          <button
            type="button"
            onClick={handleAddNew}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            추가
          </button>
        </div>
      </div>

      {/* 의사 카드 목록 */}
      {doctors.length > 0 ? (
        <div className="flex flex-wrap gap-4">
          {doctors.map((doctor) => (
            <div 
              key={doctor.id} 
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
              style={{ width: '150px' }}
            >
              {/* 카드 헤더 - 편집/삭제 버튼 */}
              <div className="flex justify-end gap-1 mb-3">
                <button
                  type="button"
                  onClick={() => handleEditDoctor(doctor)}
                  className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                  title="편집"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteDoctor(doctor.id)}
                  className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  title="삭제"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* 프로필 이미지 */}
              <div className="flex justify-center mb-3">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
                  <Image
                    src={doctor.imagePreview || "/default/doctor_default_man.png"}
                    alt={doctor.name}
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                  />
                </div>
              </div>

              {/* 이름 */}
              <h3 className="text-center font-medium text-gray-900 mb-2">
                {doctor.name}
              </h3>

              {/* 소개 */}
              {doctor.bio && (
                <p className="text-xs text-gray-600 text-center mb-3 line-clamp-3">
                  {doctor.bio}
                </p>
              )}

              {/* 대표원장 체크박스 */}
              <div className="flex justify-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={doctor.isChief}
                    onChange={(e) => handleChiefChange(doctor.id, e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">대표원장</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* 빈 상태 */
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <p className="text-gray-600 font-medium">등록된 의사가 없습니다</p>
              <p className="text-sm text-gray-500 mt-1">
                "추가" 버튼을 눌러서 의사 정보를 등록해보세요
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddNew}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              의사 추가하기
            </button>
          </div>
        </div>
      )}

      {/* 의사 정보 폼 모달 */}
      <DoctorInfoForm
        open={isFormOpen}
        initialData={editingDoctor}
        onClose={handleCloseForm}
        onSave={handleSaveDoctor}
      />
    </div>
  );
};

export default DoctorInfoSection; 