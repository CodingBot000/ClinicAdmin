'use client';

import React, { useState, useEffect } from 'react';

interface ExtraOption {
  key: string;
  label: string;
}

const extraOptions: ExtraOption[] = [
  { key: 'has_private_recovery_room', label: '전담회복실' },
  { key: 'has_parking', label: '주차가능' },
  { key: 'has_cctv', label: 'CCTV설치' },
  { key: 'has_night_counseling', label: '야간상담' },
  { key: 'has_female_doctor', label: '여의사진료' },
  { key: 'has_anesthesiologist', label: '마취전문의' },
];

export interface ExtraOptionState {
  has_private_recovery_room: boolean;
  has_parking: boolean;
  has_cctv: boolean;
  has_night_counseling: boolean;
  has_female_doctor: boolean;
  has_anesthesiologist: boolean;
  specialistCount: number;
}

interface ExtraOptionStateProps {
  onSelectOptionState?: (address: ExtraOptionState) => void;
}

export default function ExtraOptions({ onSelectOptionState } : ExtraOptionStateProps) {
  const [options, setOptions] = useState<ExtraOptionState>({
    has_private_recovery_room: false,
    has_parking: false,
    has_cctv: false,
    has_night_counseling: false,
    has_female_doctor: false,
    has_anesthesiologist: false,
    specialistCount: 1,
  });

  // options가 변경될 때마다 상위 컴포넌트에 알림
  useEffect(() => {
    console.log(' ExtraOptions - 상태 변경:', options);
    onSelectOptionState?.(options);
  }, [options, onSelectOptionState]);

  // 체크박스 변경 핸들러
  const handleCheck = (key: keyof ExtraOptionState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    console.log(` ExtraOptions - ${key} 체크박스 변경:`, newValue);
    
    setOptions((prev) => ({
      ...prev,
      [key]: newValue,
    }));
  };

  // 숫자 입력 핸들러
  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(1, parseInt(e.target.value.replace(/\D/g, '') || '1', 10));
    console.log(' ExtraOptions - 전문의 수 변경:', val);
    
    setOptions((prev) => ({
      ...prev,
      specialistCount: val,
    }));
  };

  return (
    
    <div className="flex flex-row items-end gap-6 max-w-3xl mx-auto p-4 bg-white rounded-xl shadow">
      {/* 전문의 O명 (input만) */}
      <div className="flex flex-row items-end gap-1">
        <span className="text-sm font-medium">의사</span>
        <input
          type="number"
          className="w-12 border-b border-gray-300 focus:outline-none focus:border-blue-500 px-1 text-center text-sm"
          min={1}
          value={options.specialistCount}
          onChange={handleCountChange}
        />
        <span className="text-sm font-medium">명</span>
      </div>
      {/* 나머지 체크박스 옵션 */}
      {extraOptions.map((opt) => (
        <label
          key={opt.key}
          className="flex flex-col items-center gap-1 min-w-[68px]"
        >
          <input
            type="checkbox"
            checked={options[opt.key as keyof ExtraOptionState] as boolean}
            onChange={handleCheck(opt.key as keyof ExtraOptionState)}
            className="w-4 h-4 accent-blue-500"
          />
          <span className="text-xs text-gray-700">{opt.label}</span>
        </label>
      ))}
    </div>
  );
}
