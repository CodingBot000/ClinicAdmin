"use client";

import React, { useState, useEffect } from "react";
import { TreatmentSelectModal } from "./modal/TreatmentSelectModal";
import { X } from "lucide-react";
// import { TREATMENT_CATEGORIES } from "@/app/contents/treatments";
import { CategoryNode } from "@/types/category";
import { Button } from "@/components/ui/button";

interface ProductOption {
  id: string;
  treatmentKey: number;
  value1: number;
  value2: number;
}

interface TreatmentData {
  selectedKeys: number[];
  productOptions: ProductOption[];
  priceExpose: boolean;
}

interface TreatmentSelectBoxProps {
  onSelectionChange?: (data: TreatmentData) => void;
  initialSelectedKeys?: number[];
  categories: CategoryNode[];
}

// const getLabelByKey = (() => {
//   // 한번만 트리 플랫하게 만들어서 성능 최적화
//   const map = new Map<number, string>();
//   const traverse = (nodes: CategoryNode[]) => {
//     nodes.forEach((n) => {
//       map.set(n.key, n.label);
//       if (n.children) traverse(n.children);
//     });
//   };
//   traverse(TREATMENT_CATEGORIES);
//   return (key: number) => map.get(key) ?? key.toString();
// })();

export function TreatmentSelectBox({ onSelectionChange, initialSelectedKeys = [], categories }: TreatmentSelectBoxProps) {
  console.log("categories", categories);
  const [selectedKeys, setSelectedKeys] = useState<number[]>(initialSelectedKeys);
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [priceExpose, setPriceExpose] = useState<boolean>(true); // 기본값 true (체크된 상태)
  const [modalOpen, setModalOpen] = useState(false);

  // 선택된 항목이나 상품옵션이 변경될 때마다 상위 컴포넌트에 알림
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange({ selectedKeys, productOptions, priceExpose });
    }
  }, [selectedKeys, productOptions, priceExpose, onSelectionChange]);

  const handleRemove = (key: number) => {
    setSelectedKeys((prev) => prev.filter((k) => k !== key));
    // 해당 시술의 상품옵션도 함께 제거
    setProductOptions((prev) => prev.filter((option) => option.treatmentKey !== key));
  };

  const handleOpen = () => {
    console.log(' TreatmentSelectBox - 모달 열기:', {
      selectedKeys: selectedKeys,
      selectedKeysLength: selectedKeys.length,
      productOptions: productOptions,
      productOptionsLength: productOptions.length
    });
    setModalOpen(true);
  };
  const handleClose = () => setModalOpen(false);

  const handleSave = (data: { selectedKeys: number[], productOptions: ProductOption[] }) => {
    setSelectedKeys(data.selectedKeys);
    setProductOptions(data.productOptions);
    
    console.log(" TreatmentSelectBox - 저장된 데이터:", {
      selectedKeys: data.selectedKeys,
      productOptions: data.productOptions
    });
  };

  // 카테고리 플랫하게 만들어서 라벨 찾기
  const getLabelByKey = (key: number): string => {
    const findLabel = (nodes: CategoryNode[]): string | null => {
      for (const node of nodes) {
        if (node.key === key) return node.label;
        if (node.children) {
          const found = findLabel(node.children);
          if (found) return found;
        }
      }
      return null;
    };
    return findLabel(categories) || key.toString();
  };

  // 해당 시술에 연결된 상품옵션 개수 계산
  const getOptionCountForTreatment = (treatmentKey: number): number => {
    return productOptions.filter(option => option.treatmentKey === treatmentKey).length;
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-2">
        <Button size="sm" type="button" onClick={handleOpen}>
          가능시술 선택하기
        </Button>
        
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="price-expose-checkbox"
            checked={priceExpose}
            onChange={(e) => setPriceExpose(e.target.checked)}
            className="w-4 h-4 accent-blue-600 cursor-pointer"
          />
          <label 
            htmlFor="price-expose-checkbox" 
            className="text-sm text-gray-700 cursor-pointer select-none"
          >
            고객에게 가격노출하기
          </label>
        </div>
      </div>
      {/* 선택 결과 칩 형태 */}
      <div className="flex flex-wrap gap-2">
        {selectedKeys.length === 0 ? (
          <span className="text-gray-400">선택된 시술이 없습니다.</span>
        ) : (
          selectedKeys.map((key) => {
            const optionCount = getOptionCountForTreatment(key);
            return (
              <div
                key={key}
                className="flex items-center px-3 py-1 rounded-2xl bg-blue-100 text-blue-800 text-sm shadow-sm"
              >
                <button
                  type="button"
                  className="mr-1 focus:outline-none"
                  onClick={() => handleRemove(key)}
                  aria-label="선택 삭제"
                >
                  <X className="w-4 h-4" />
                </button>
                <span className="mr-1">{getLabelByKey(key)}</span>
                {optionCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-blue-200 text-blue-900 text-xs rounded-full">
                    {optionCount}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
      
      {/* 디버깅 정보 표시 */}
      {(selectedKeys.length > 0 || productOptions.length > 0) && (
        <div className="mt-3 p-3 bg-green-50 rounded border text-sm">
          <div className="font-semibold text-green-800 mb-1">📊 선택된 시술 데이터:</div>
          <div className="text-green-700 space-y-2">
            <div><strong>시술 개수:</strong> {selectedKeys.length}개</div>
            
            {/* 선택된 시술명 목록 */}
            {selectedKeys.length > 0 && (
              <div>
                <strong>선택된 시술:</strong>
                <div className="ml-4 mt-1 space-y-1">
                  {selectedKeys.map((key, index) => (
                    <div key={key} className="text-gray-600">
                      {index + 1}. {getLabelByKey(key)}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div><strong>상품옵션 개수:</strong> {productOptions.length}개</div>
            
            {/* 상품옵션 내용 목록 */}
            {productOptions.length > 0 && (
              <div>
                <strong>상품옵션 내용:</strong>
                <div className="ml-4 mt-1 space-y-1">
                  {productOptions.map((option, index) => (
                    <div key={option.id} className="text-gray-600">
                      {index + 1}. [{getLabelByKey(option.treatmentKey)}] {option.value1} : {option.value2?.toLocaleString()}원
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* 모달 */}
      <TreatmentSelectModal
        open={modalOpen}
        initialSelectedKeys={selectedKeys}
        initialProductOptions={productOptions}
        onClose={handleClose}
        onSave={handleSave}
        categories={categories}
      />
    </div>
  );
}
