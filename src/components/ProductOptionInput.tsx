"use client";

import React, { useState } from "react";
import { X } from "lucide-react";

interface ProductOptionInputProps {
  id: string;
  onRemove: (id: string) => void;
  onChange?: (id: string, value1: number, value2: number) => void;
}

const ProductOptionInput: React.FC<ProductOptionInputProps> = ({
  id,
  onRemove,
  onChange
}) => {
  const [value1, setValue1] = useState<number>(0);
  const [value2, setValue2] = useState<number>(0);

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
        <input
          type="number"
          value={value1}
          onChange={handleValue1Change}
          className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          placeholder="0"
          min="0"
        />
        <span className="text-gray-500">-</span>
        <input
          type="number"
          value={value2}
          onChange={handleValue2Change}
          className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          placeholder="0"
          min="0"
        />
      </div>
    </div>
  );
};

export default ProductOptionInput; 