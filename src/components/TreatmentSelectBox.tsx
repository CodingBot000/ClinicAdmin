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
  etc: string;
}

interface TreatmentSelectBoxProps {
  onSelectionChange?: (data: TreatmentData) => void;
  initialSelectedKeys?: number[];
  initialProductOptions?: ProductOption[];
  initialPriceExpose?: boolean;
  initialEtc?: string;
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

export function TreatmentSelectBox({ 
  onSelectionChange, 
  initialSelectedKeys = [], 
  initialProductOptions = [],
  initialPriceExpose = true,
  initialEtc = "",
  categories 
}: TreatmentSelectBoxProps) {
  console.log("TreatmentSelectBox 초기값:", {
    initialSelectedKeys,
    initialProductOptions,
    initialPriceExpose,
    initialEtc,
    categories
  });
  
  const [selectedKeys, setSelectedKeys] = useState<number[]>(initialSelectedKeys);
  const [productOptions, setProductOptions] = useState<ProductOption[]>(initialProductOptions);
  const [priceExpose, setPriceExpose] = useState<boolean>(initialPriceExpose);
  const [etc, setEtc] = useState<string>(initialEtc);
  const [modalOpen, setModalOpen] = useState(false);

  // 초기값이 변경될 때 상태 업데이트
  useEffect(() => {
    console.log('TreatmentSelectBox - 초기값 변경됨:', {
      initialSelectedKeys,
      initialProductOptions,
      initialPriceExpose,
      initialEtc
    });
    
    if (initialSelectedKeys.length > 0 || initialProductOptions.length > 0 || initialEtc || initialPriceExpose !== true) {
      console.log('TreatmentSelectBox - 초기값으로 상태 업데이트');
      setSelectedKeys(initialSelectedKeys);
      setProductOptions(initialProductOptions);
      setPriceExpose(initialPriceExpose);
      setEtc(initialEtc);
    }
  }, [initialSelectedKeys, initialProductOptions, initialPriceExpose, initialEtc]);

  // 선택된 항목이나 상품옵션이 변경될 때마다 상위 컴포넌트에 알림
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange({ selectedKeys, productOptions, priceExpose, etc });
    }
  }, [selectedKeys, productOptions, priceExpose, etc, onSelectionChange]);

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

  const handleSave = (data: { selectedKeys: number[], productOptions: ProductOption[], etc: string }) => {
    setSelectedKeys(data.selectedKeys);
    setProductOptions(data.productOptions);
    setEtc(data.etc);
    
    console.log(" TreatmentSelectBox - 저장된 데이터:", {
      selectedKeys: data.selectedKeys,
      productOptions: data.productOptions,
      etc: data.etc
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

  // 카테고리에서 unit 찾기
  const getUnitByKey = (key: number): string | null => {
    const findUnit = (nodes: CategoryNode[]): string | null => {
      for (const node of nodes) {
        if (node.key === key) return node.unit || null;
        if (node.children) {
          const found = findUnit(node.children);
          if (found) return found;
        }
      }
      return null;
    };
    return findUnit(categories);
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
                {getUnitByKey(key) && (
                  <span className="text-xs text-blue-600 bg-blue-50 px-1 rounded">
                    {getUnitByKey(key)}
                  </span>
                )}
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
      {(selectedKeys.length > 0 || productOptions.length > 0 || etc.trim() !== "") && (
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
                      {getUnitByKey(key) && (
                        <span className="ml-1 text-xs text-blue-600 bg-blue-50 px-1 rounded">
                          {getUnitByKey(key)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div><strong>상품옵션 개수:</strong> {productOptions.length}개</div>
            
            {/* 상품옵션 내용 목록 */}
            {productOptions.map((option, index) => (
              <div key={option.id} className="text-gray-600">
                {index + 1}. [{getLabelByKey(option.treatmentKey)}
                {getUnitByKey(option.treatmentKey) && (
                  <span className="ml-1 text-xs text-blue-600 bg-blue-50 px-1 rounded">
                    {getUnitByKey(option.treatmentKey)}
                  </span>
                )}]{" "}
                {option.value1 && Number(option.value1) >= 1
                  ? (
                      <>
                        {option.value1} : {option.value2?.toLocaleString()}원
                      </>
                    )
                  : (
                      <>
                        옵션없음 가격: {option.value2?.toLocaleString()}원
                      </>
                    )
                }
              </div>
            ))}
            
            {/* 기타 정보 */}
            {etc.trim() !== "" && (
              <div>
                <strong>기타 정보:</strong>
                <div className="ml-4 mt-1 text-gray-600">
                  {etc}
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
        initialEtc={etc}
        onClose={handleClose}
        onSave={handleSave}
        categories={categories}
      />
    </div>
  );
}
