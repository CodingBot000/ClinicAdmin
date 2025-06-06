"use client";

import React, { useEffect, useState } from "react";
// import { TREATMENT_CATEGORIES } from "@/app/contents/treatments";
import { CategoryNode } from "@/types/category";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import ProductOptionInput from "@/components/ProductOptionInput";
import { useCategories } from "@/hooks/useCategories";

interface ProductOption {
  id: string;
  treatmentKey: number;
  value1: number;
  value2: number;
}

interface TreatmentSelectModalProps {
  open: boolean;
  initialSelectedKeys: number[];
  initialProductOptions?: ProductOption[];
  onClose: () => void;
  onSave: (data: { selectedKeys: number[], productOptions: ProductOption[] }) => void;
  categories: CategoryNode[];
}

// depth 정보를 가지면서 전체 카테고리 플랫하게 펼치기
const flattenCategoriesWithParentDepth = (categories: CategoryNode[], depth = 1, parentKeys: number[] = []) => {
  const result: {
    key: number;
    name: string;
    label: string;
    depth: number;
    hasChildren: boolean;
    parentKeys: number[];
    isLastDepth: boolean;
  }[] = [];
  categories.forEach((node) => {
    const hasChildren = !!node.children?.length;
    const isLastDepth = !hasChildren;
    result.push({
      key: node.key,
      name: node.name,
      label: node.label,
      depth,
      hasChildren,
      parentKeys,
      isLastDepth,
    });
    if (hasChildren) {
      result.push(
        ...flattenCategoriesWithParentDepth(node.children!, depth + 1, [...parentKeys, node.key])
      );
    }
  });
  return result;
};

export function TreatmentSelectModal({
  open,
  initialSelectedKeys,
  initialProductOptions = [],
  onClose,
  onSave,
  categories,
}: TreatmentSelectModalProps) {
  const [selectedKeys, setSelectedKeys] = useState<number[]>(initialSelectedKeys);
  const [productOptions, setProductOptions] = useState<ProductOption[]>(initialProductOptions);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // 옵션없음 체크박스 상태 관리 (treatmentKey별로)
  const [noOptionChecked, setNoOptionChecked] = useState<Record<number, boolean>>({});
  // 이전값 저장용 (체크해제 시 복원용)
  const [previousValues, setPreviousValues] = useState<Record<string, number>>({});

  useEffect(() => {
    if (open) {
      console.log(' TreatmentSelectModal 열림 - 초기값 설정:', {
        initialSelectedKeys,
        selectedKeysLength: initialSelectedKeys?.length || 0,
        initialProductOptions,
        productOptionsLength: initialProductOptions?.length || 0
      });
      
      setSelectedKeys(initialSelectedKeys ?? []);
      setProductOptions(initialProductOptions ?? []);
      
      console.log(' TreatmentSelectModal 상태 설정 완료');
    }
  }, [open, initialSelectedKeys, initialProductOptions]);

  useEffect(() => {
    if (open) {
      setIsAnimating(true);
      // 스크롤 막기
      document.body.style.overflow = 'hidden';
    } else {
      // 스크롤 복원
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  // const flatList = flattenCategoriesWithParentDepth(TREATMENT_CATEGORIES);
  const flatList = flattenCategoriesWithParentDepth(categories);

  // depth마다 마지막 depth가 체크박스 위치인지 파악
  const lastDepth = Math.max(...flatList.map((x) => x.depth));
  // 2뎁스 체크박스면 1뎁스만, 3뎁스 체크박스면 1,2뎁스 모두 강조

  // 체크박스가 있는 depth set 구하기
  const checkboxDepthSet = new Set(flatList.filter(x => x.isLastDepth).map(x => x.depth));

  const handleToggle = (key: number) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSave = () => {
    onSave({ selectedKeys: [...selectedKeys], productOptions: [...productOptions] });
    handleClose();
  };

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300); // 애니메이션 시간과 맞춤
  };

  // 배경 클릭 시 아무것도 하지 않음 (preventDefault)
  const handleBackdropClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // 아무것도 하지 않음 - 모달이 닫히지 않음
  };

  const handleAddOption = (treatmentKey: number) => {
    const newOption: ProductOption = {
      id: `${treatmentKey}-${Date.now()}`,
      treatmentKey,
      value1: 0,
      value2: 0,
    };
    setProductOptions(prev => [...prev, newOption]);
  };

  const handleRemoveOption = (optionId: string) => {
    setProductOptions(prev => prev.filter(option => option.id !== optionId));
  };

  const handleOptionChange = (optionId: string, value1: number, value2: number) => {
    setProductOptions(prev => prev.map(option => 
      option.id === optionId 
        ? { ...option, value1, value2 }
        : option
    ));
  };

  const getOptionsForTreatment = (treatmentKey: number) => {
    return productOptions.filter(option => option.treatmentKey === treatmentKey);
  };

  // 옵션없음 체크박스 토글 함수
  const handleNoOptionToggle = (treatmentKey: number) => {
    const isCurrentlyChecked = noOptionChecked[treatmentKey] || false;
    const newCheckedState = !isCurrentlyChecked;
    
    setNoOptionChecked(prev => ({
      ...prev,
      [treatmentKey]: newCheckedState
    }));
    
    // 해당 치료의 모든 옵션들 처리
    const treatmentOptions = getOptionsForTreatment(treatmentKey);
    
    if (newCheckedState) {
      // 체크됨: 모든 value1을 -1로 설정하기 전에 이전값 저장
      treatmentOptions.forEach(option => {
        if (option.value1 !== -1 && option.value1 !== 0) {
          setPreviousValues(prev => ({
            ...prev,
            [option.id]: option.value1
          }));
        }
      });
      
      // 모든 value1을 -1로 설정
      setProductOptions(prev => prev.map(option => 
        option.treatmentKey === treatmentKey 
          ? { ...option, value1: -1 }
          : option
      ));
    } else {
      // 체크해제됨: 이전값이 있으면 복원
      setProductOptions(prev => prev.map(option => {
        if (option.treatmentKey === treatmentKey) {
          const previousValue = previousValues[option.id];
          if (previousValue !== undefined && previousValue !== -1 && previousValue !== 0) {
            return { ...option, value1: previousValue };
          }
          return { ...option, value1: 0 };
        }
        return option;
      }));
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* 배경 오버레이 */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleBackdropClick}
      />
      
      {/* 하단 시트 */}
      <div 
        className={`
          absolute bottom-0 left-0 right-0 
          bg-white rounded-t-2xl shadow-2xl
          transition-transform duration-300 ease-out
          flex flex-col
          ${isAnimating ? 'translate-y-0' : 'translate-y-full'}
        `}
        style={{ height: '80vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-bold">시술 선택</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* 컨텐츠 영역 */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex">
            {/* 왼쪽 패널 - 시술 선택 */}
            <div className="w-100 overflow-y-auto p-6 border-r border-gray-200">
              <div className="space-y-2">
                {flatList.map((item, idx) => {
                  // 체크박스 있는 depth가 2 → 1뎁스만 강조, 3 → 1,2뎁스 모두 강조
                  let fontClass = "text-base";
                  let fontWeight = "font-normal";
                  // 2뎁스가 체크박스면 1뎁스만, 3뎁스면 1,2뎁스 모두 강조
                  if (
                    (checkboxDepthSet.has(2) && item.depth === 1) ||
                    (checkboxDepthSet.has(3) && (item.depth === 1 || item.depth === 2))
                  ) {
                    fontClass = "text-lg";
                    fontWeight = "font-bold";
                  }

                  return (
                    <div
                      key={item.key}
                      className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                      style={{ marginLeft: `${(item.depth - 1) * 24}px` }}
                    >
                      {item.hasChildren ? (
                        <span className={`${fontClass} ${fontWeight} text-gray-800`}>
                          {item.label}
                        </span>
                      ) : (
                        <>
                          <input
                            type="checkbox"
                            className="w-5 h-5 accent-blue-600 cursor-pointer"
                            checked={selectedKeys.includes(item.key)}
                            onChange={() => handleToggle(item.key)}
                          />
                          <span 
                            className={`${fontClass} ${fontWeight} text-gray-700 cursor-pointer`}
                            onClick={() => handleToggle(item.key)}
                          >
                            {item.label}
                          </span>
                          <button
                            type="button"
                            disabled={!selectedKeys.includes(item.key)}
                            className={`ml-3 px-3 py-1 text-xs rounded transition-colors ${
                              selectedKeys.includes(item.key)
                                ? 'text-white bg-blue-600 hover:bg-blue-700 cursor-pointer'
                                : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (selectedKeys.includes(item.key)) {
                                handleAddOption(item.key);
                              }
                            }}
                            aria-label="상품옵션 추가"
                          >
                            상품옵션 추가
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 오른쪽 패널  : 상품옵션 */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 sticky top-0 bg-gray-50 pb-2">
                상품옵션 관리
              </h3>
              
              {selectedKeys.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <p className="text-sm">시술을 선택하고</p>
                  <p className="text-sm">"상품옵션 추가" 버튼을 눌러</p>
                  <p className="text-sm">옵션을 추가해보세요</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedKeys.map((treatmentKey) => {
                    const options = getOptionsForTreatment(treatmentKey);
                    const treatmentItem = flatList.find(item => item.key === treatmentKey);
                    
                    if (!treatmentItem) return null;
                    
                    return (
                      <div key={`options-${treatmentKey}`} className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-blue-800">
                            {treatmentItem.label}
                          </h4>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              className="w-4 h-4 accent-red-600 cursor-pointer"
                              checked={noOptionChecked[treatmentKey] || false}
                              onChange={() => handleNoOptionToggle(treatmentKey)}
                            />
                            <span className="text-xs text-red-600 font-medium">옵션없음</span>
                          </label>
                        </div>
                        
                        {options.length === 0 ? (
                          <p className="text-xs text-gray-500 italic">
                            아직 상품옵션이 없습니다
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {options.map((option) => (
                              <ProductOptionInput
                                key={option.id}
                                id={option.id}
                                initialValue1={option.value1}
                                initialValue2={option.value2}
                                onRemove={handleRemoveOption}
                                onChange={handleOptionChange}
                                isHidden={noOptionChecked[treatmentKey] || false}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 하단 버튼 영역 */}
        <div className="border-t border-gray-200 p-6 bg-white flex-shrink-0">
          <div className="flex gap-4 justify-end">
            <Button 
              variant="outline" 
              onClick={handleClose}
              className="px-8 py-3 text-base"
            >
              취소
            </Button>
            <Button 
              onClick={handleSave}
              className="px-8 py-3 text-base bg-blue-600 hover:bg-blue-700"
            >
              완료 ({selectedKeys.length}개 선택)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}