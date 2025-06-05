"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

interface ProductOptionInputProps {
  id: string;
  initialValue1?: number;
  initialValue2?: number;
  onRemove: (id: string) => void;
  onChange?: (id: string, value1: number, value2: number) => void;
}

const ProductOptionInput: React.FC<ProductOptionInputProps> = ({
  id,
  initialValue1 = 0,
  initialValue2 = 0,
  onRemove,
  onChange
}) => {
  const [value1, setValue1] = useState<number>(initialValue1);
  const [value2, setValue2] = useState<number>(initialValue2);

  // 초기값이 변경될 때 상태 업데이트
  useEffect(() => {
    console.log(`🔧 ProductOptionInput [${id}] - 초기값 업데이트:`, {
      initialValue1,
      initialValue2,
      currentValue1: value1,
      currentValue2: value2
    });
    setValue1(initialValue1);
    setValue2(initialValue2);
  }, [initialValue1, initialValue2]);

  // 컴포넌트가 마운트될 때 초기값을 부모에게 알림
  useEffect(() => {
    console.log(`⚡ ProductOptionInput [${id}] - 마운트:`, {
      initialValue1,
      initialValue2,
      willCallOnChange: initialValue1 !== 0 || initialValue2 !== 0
    });
    if (initialValue1 !== 0 || initialValue2 !== 0) {
      onChange?.(id, initialValue1, initialValue2);
    }
  }, []);

  const handleValue1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value) || 0;
    setValue1(newValue);
    onChange?.(id, newValue, value2);
  };

  const handleValue2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value) || 0;
    setValue2(newValue);
    onChange?.(id, value1, newValue);
  };

  return (
    <div className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
      <button
        type="button"
        onClick={() => onRemove(id)}
        className="p-1 hover:bg-gray-200 rounded transition-colors"
        aria-label="옵션 삭제"
      >
        <X size={16} className="text-gray-600" />
      </button>
      
      <div className="flex items-center gap-2">
        <span className="sm:text-xs text-gray-500">시술옵션: </span>
        <input
          value={value1}
          onChange={handleValue1Change}
          className="sm:text-xs text-[10px] w-20 px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          // placeholder="0"
          // min="0"
        />
        <span className="sm:text-xs text-gray-500">  가격(원):</span>
        <input
          type="number"
          value={value2}
          onChange={handleValue2Change}
          className="
              w-20 px-2 py-1 
              text-right
              text-xs sm:text-xs
              border border-gray-300 rounded 
              focus:outline-none focus:border-blue-500
              appearance-none
              [-moz-appearance:textfield]
          "
          placeholder="0"
          min="0"
          inputMode="numeric"
        // 스핀버튼 제거(크롬/사파리)용 인라인 스타일
        style={{
          MozAppearance: 'textfield',
          appearance: 'none'
        }}
        />
      </div>
    </div>
  );
};

export default ProductOptionInput; 