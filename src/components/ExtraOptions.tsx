'use client';

import React, { useState } from 'react';

interface ExtraOption {
  key: string;
  label: string;
}

const extraOptions: ExtraOption[] = [
  { key: 'private_recovery', label: '전담회복실' },
  { key: 'parking', label: '주차가능' },
  { key: 'cctv', label: 'CCTV설치' },
  { key: 'night_consult', label: '야간상담' },
  { key: 'female_doctor', label: '여의사진료' },
  { key: 'anesthesiologist', label: '마취전문의' },
];

interface OptionState {
  private_recovery: boolean;
  parking: boolean;
  cctv: boolean;
  night_consult: boolean;
  female_doctor: boolean;
  anesthesiologist: boolean;
  specialistCount: number;
}

export default function ExtraOptions() {
  const [options, setOptions] = useState<OptionState>({
    private_recovery: false,
    parking: false,
    cctv: false,
    night_consult: false,
    female_doctor: false,
    anesthesiologist: false,
    specialistCount: 0,
  });

  // 체크박스 변경 핸들러
  const handleCheck = (key: keyof OptionState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setOptions((prev) => ({
      ...prev,
      [key]: e.target.checked,
    }));
  };

  // 숫자 입력 핸들러
  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(0, parseInt(e.target.value.replace(/\D/g, '') || '0', 10));
    setOptions((prev) => ({
      ...prev,
      specialistCount: val,
    }));
  };

  return (
    
    <div className="flex flex-row items-end gap-6 max-w-3xl mx-auto p-4 bg-white rounded-xl shadow">
      {/* 전문의 O명 (input만) */}
      <div className="flex flex-row items-end gap-1">
        <span className="text-sm font-medium">전문의</span>
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
            checked={options[opt.key as keyof OptionState] as boolean}
            onChange={handleCheck(opt.key as keyof OptionState)}
            className="w-4 h-4 accent-blue-500"
          />
          <span className="text-xs text-gray-700">{opt.label}</span>
        </label>
      ))}
    </div>
  );
}
