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
  initialEtc?: string;
  initialSelectedDepartment?: 'skin' | 'surgery';
  onClose: () => void;
  onSave: (data: { selectedKeys: number[], productOptions: ProductOption[], etc: string, selectedDepartment: 'skin' | 'surgery' }) => void;
  categories: CategoryNode[];
}

// depth 정보를 가지면서 전체 카테고리 플랫하게 펼치기
const flattenCategoriesWithParentDepth = (categories: CategoryNode[], depth = 1, parentKeys: number[] = []) => {
  const result: {
    key: number;
    name: string;
    label: string;
    unit?: string;
    department?: string;
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
      unit: node.unit,
      department: node.department,
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
  initialEtc = "",
  initialSelectedDepartment = 'skin',
  onClose,
  onSave,
  categories,
}: TreatmentSelectModalProps) {
  const [selectedKeys, setSelectedKeys] = useState<number[]>(initialSelectedKeys);
  const [productOptions, setProductOptions] = useState<ProductOption[]>(initialProductOptions);
  const [etc, setEtc] = useState<string>(initialEtc);
  const [selectedDepartment, setSelectedDepartment] = useState<'skin' | 'surgery'>(initialSelectedDepartment);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // 옵션없음 체크박스 상태 관리 (treatmentKey별로)
  const [noOptionChecked, setNoOptionChecked] = useState<Record<number, boolean>>({});
  // 이전값 저장용 (체크해제 시 복원용)
  const [previousValues, setPreviousValues] = useState<Record<string, number>>({});

  useEffect(() => {
    if (open) {
      setSelectedKeys(initialSelectedKeys ?? []);
      setProductOptions(initialProductOptions ?? []);
      setEtc(initialEtc ?? "");
      setSelectedDepartment(initialSelectedDepartment ?? 'skin');
    }
  }, [open, initialSelectedKeys, initialProductOptions, initialEtc, initialSelectedDepartment]);

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

  // department별로 카테고리 필터링
  const filteredCategories = categories.map(category => ({
    ...category,
    children: category.children?.filter(child => 
      child.department === selectedDepartment || 
      child.children?.some(grandChild => grandChild.department === selectedDepartment)
    ).map(child => ({
      ...child,
      children: child.children?.filter(grandChild => grandChild.department === selectedDepartment)
    }))
  })).filter(category => category.children && category.children.length > 0);

  const flatList = flattenCategoriesWithParentDepth(filteredCategories);

  // 초기 선택된 시술들에 대해 unit 값에 따라 "옵션없음" 기본값 설정
  useEffect(() => {
    if (open && (initialSelectedKeys ?? []).length > 0) {
      const currentFlatList = flattenCategoriesWithParentDepth(categories);
      const initialNoOptionState: Record<number, boolean> = {};
      (initialSelectedKeys ?? []).forEach(key => {
        const treatmentItem = currentFlatList.find(item => item.key === key);
        if (treatmentItem) {
          initialNoOptionState[key] = !treatmentItem.unit; // unit이 없으면 true, 있으면 false
        }
      });
      setNoOptionChecked(initialNoOptionState);
    }
  }, [open, initialSelectedKeys, categories]);

  // depth마다 마지막 depth가 체크박스 위치인지 파악
  const lastDepth = Math.max(...flatList.map((x) => x.depth));
  // 2뎁스 체크박스면 1뎁스만, 3뎁스 체크박스면 1,2뎁스 모두 강조

  // 체크박스가 있는 depth set 구하기
  const checkboxDepthSet = new Set(flatList.filter(x => x.isLastDepth).map(x => x.depth));

  const handleToggle = (key: number) => {
    setSelectedKeys((prev) => {
      const isCurrentlySelected = prev.includes(key);
      
      if (isCurrentlySelected) {
        // 체크 해제: 선택 목록에서만 제거 (옵션들은 유지)
        return prev.filter((k) => k !== key);
      } else {
        // 체크: 선택 목록에 추가
        const newSelectedKeys = [...prev, key];
        
        // 새로 선택된 시술에 대해 unit 값에 따라 "옵션없음" 기본값 설정
        const treatmentItem = flatList.find(item => item.key === key);
        if (treatmentItem && !noOptionChecked.hasOwnProperty(key)) {
          setNoOptionChecked(prevState => ({
            ...prevState,
            [key]: !treatmentItem.unit // unit이 없으면 true, 있으면 false
          }));
        }
        
        return newSelectedKeys;
      }
    });
  };

  const handleSave = () => {
    // 1. 선택된 시술 중 ProductOptionInput이 없는 것들 체크
    const selectedTreatmentsWithoutOptions = selectedKeys.filter(key => {
      const options = getOptionsForTreatment(key);
      return options.length === 0;
    });
    
    if (selectedTreatmentsWithoutOptions.length > 0) {
      const treatmentNames = selectedTreatmentsWithoutOptions.map(key => {
        const treatmentItem = flatList.find(item => item.key === key);
        return treatmentItem?.label || `시술 ${key}`;
      });
      
      alert(`다음 시술에 상품옵션이 없습니다:\n${treatmentNames.join(', ')}\n\n"상품옵션 추가" 버튼을 눌러서 최소 1개 이상의 옵션을 추가해주세요.`);
      return;
    }
    
    // 2. 선택된 시술의 옵션 중 가격이 0원인 항목 체크
    const selectedOptions = productOptions.filter(option => selectedKeys.includes(option.treatmentKey));
    const zeroPriceOptions = selectedOptions.filter(option => option.value2 === 0);
    
    if (zeroPriceOptions.length > 0) {
      // 가격이 0원인 시술 이름들 찾기
      const problematicTreatments = zeroPriceOptions.map(option => {
        const treatmentItem = flatList.find(item => item.key === option.treatmentKey);
        return treatmentItem?.label || `시술 ${option.treatmentKey}`;
      });
      
      const uniqueTreatments = [...new Set(problematicTreatments)];
      const treatmentNames = uniqueTreatments.join(', ');
      
      alert(`다음 시술의 가격 정보가 적절하지 않습니다:\n${treatmentNames}\n\n가격을 0원보다 큰 값으로 설정해주세요.`);
      return;
    }
    
    // 선택된 시술의 옵션들만 제출
    onSave({ selectedKeys: [...selectedKeys], productOptions: selectedOptions, etc, selectedDepartment });
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
    // 선택된 시술의 옵션들만 반환
    if (!selectedKeys.includes(treatmentKey)) {
      return [];
    }
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

        {/* 탭 영역 */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              selectedDepartment === 'skin'
                ? 'text-blue-600 bg-white border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
            onClick={() => setSelectedDepartment('skin')}
          >
            피부
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              selectedDepartment === 'surgery'
                ? 'text-blue-600 bg-white border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
            onClick={() => setSelectedDepartment('surgery')}
          >
            성형
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
                      key={`${item.key}-${idx}`}
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
                          {item.unit && (
                            <span className="text-xs text-blue-600 bg-blue-50 px-1 ml-1 rounded">
                              {item.unit}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
                
                {/* 기타 섹션 추가 */}
                <div className="mt-6 pt-4 border-t border-gray-300">
                  <div className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors">
                    <span className="text-lg font-bold text-gray-800">기타</span>
                  </div>
                  <div className="ml-6">
                    <span className="text-sm text-gray-600">별도 기재가 필요한 시술이 있다면 우측 텍스트 영역에 입력해주세요.</span>
                  </div>
                </div>
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
                            {treatmentItem.unit && (
                              <span className="ml-1 text-xs text-blue-600 bg-blue-50 px-1 rounded">
                                {treatmentItem.unit}
                              </span>
                            )}
                          </h4>
                          <div className="flex items-center gap-3">
                            {treatmentItem.department !== 'surgery' && (
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 accent-red-600 cursor-pointer"
                                  checked={noOptionChecked[treatmentKey] || false}
                                  onChange={() => handleNoOptionToggle(treatmentKey)}
                                />
                                <span className="text-xs text-red-600 font-medium">옵션없음</span>
                              </label>
                            )}
                            <button
                              type="button"
                              onClick={() => handleAddOption(treatmentKey)}
                              className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                            >
                              상품옵션 추가
                            </button>
                          </div>
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
                                unit={treatmentItem.unit}
                                department={treatmentItem.department}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* 기타 입력 섹션 */}
              <div className="mt-6 bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">기타 시술 정보</h4>
                <textarea
                  value={etc}
                  onChange={(e) => setEtc(e.target.value)}
                  placeholder="카테고리에 없는 시술이나 추가 정보가 있다면 여기에 입력해주세요..."
                  className="w-full h-24 p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <p className="text-xs text-gray-500 mt-2">
                  이 정보는 별도로 저장되어 관리됩니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 버튼 영역 */}
        <div className="border-t border-gray-200 p-6 bg-white flex-shrink-0">
          <p> 주의 : 옵션입력후 상품을 임시로 체크박스를 해제한 경우 완료를 누르면 입력한 상품이 사라집니다. 완료는 입력/수정이 모두 완료된 후 눌러주세요 </p> 
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