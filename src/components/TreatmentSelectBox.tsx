"use client";

import React, { useState, useEffect } from "react";
import { TreatmentSelectModal } from "./modal/TreatmentSelectModal";
import { X } from "lucide-react";
// import { TREATMENT_CATEGORIES } from "@/app/contents/treatments";
import { CategoryNode } from "@/types/category";
import { Button } from "@/components/ui/button";
import { 
  getLabelByKey, 
  getUnitByKey, 
  getDepartmentByKey,
  getDepartmentDisplayName,
  getDepartmentStyleClass
} from "@/utils/categoryUtils";

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
  selectedDepartment: 'skin' | 'surgery';
}

interface TreatmentSelectBoxProps {
  onSelectionChange?: (data: TreatmentData) => void;
  initialSelectedKeys?: number[];
  initialProductOptions?: ProductOption[];
  initialPriceExpose?: boolean;
  initialEtc?: string;
  initialSelectedDepartment?: 'skin' | 'surgery';
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
  initialSelectedDepartment = 'skin',
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
  const [selectedDepartment, setSelectedDepartment] = useState<'skin' | 'surgery'>(initialSelectedDepartment);
  const [modalOpen, setModalOpen] = useState(false);

  // 초기값이 변경될 때 상태 업데이트
  useEffect(() => {
    console.log('TreatmentSelectBox - 초기값 변경됨:', {
      initialSelectedKeys,
      initialProductOptions,
      initialPriceExpose,
      initialEtc,
      initialSelectedDepartment
    });
    
    if (initialSelectedKeys.length > 0 || initialProductOptions.length > 0 || initialEtc || initialPriceExpose !== true || initialSelectedDepartment !== 'skin') {
      console.log('TreatmentSelectBox - 초기값으로 상태 업데이트');
      setSelectedKeys(initialSelectedKeys);
      setProductOptions(initialProductOptions);
      setPriceExpose(initialPriceExpose);
      setEtc(initialEtc);
      setSelectedDepartment(initialSelectedDepartment);
    }
  }, [initialSelectedKeys, initialProductOptions, initialPriceExpose, initialEtc, initialSelectedDepartment]);

  // 선택된 항목이나 상품옵션이 변경될 때마다 상위 컴포넌트에 알림
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange({ selectedKeys, productOptions, priceExpose, etc, selectedDepartment });
    }
  }, [selectedKeys, productOptions, priceExpose, etc, selectedDepartment, onSelectionChange]);

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

  const handleSave = (data: { selectedKeys: number[], productOptions: ProductOption[], etc: string, selectedDepartment: 'skin' | 'surgery' }) => {
    setSelectedKeys(data.selectedKeys);
    setProductOptions(data.productOptions);
    setEtc(data.etc);
    setSelectedDepartment(data.selectedDepartment);
    
    console.log(" TreatmentSelectBox - 저장된 데이터:", {
      selectedKeys: data.selectedKeys,
      productOptions: data.productOptions,
      etc: data.etc,
      selectedDepartment: data.selectedDepartment
    });
  };

  // 해당 시술에 연결된 상품옵션 개수 계산
  const getOptionCountForTreatment = (treatmentKey: number): number => {
    return productOptions.filter(option => option.treatmentKey === treatmentKey).length;
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <Button size="sm" type="button" onClick={handleOpen} className="bg-primary hover:bg-primary/90 focus-ring font-medium">
          가능시술 선택하기
        </Button>
        
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="price-expose-checkbox"
            checked={priceExpose}
            onChange={(e) => setPriceExpose(e.target.checked)}
            className="w-4 h-4 accent-primary cursor-pointer focus-ring rounded"
          />
          <label 
            htmlFor="price-expose-checkbox" 
            className="text-sm text-foreground cursor-pointer select-none font-medium"
          >
            고객에게 가격노출하기
          </label>
        </div>
      </div>
      {/* 선택 결과 칩 형태 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {selectedKeys.length === 0 ? (
          <div className="flex items-center gap-2 p-4 rounded-lg border border-dashed border-border bg-muted/20">
            <span className="text-muted-foreground">선택된 시술이 없습니다.</span>
          </div>
        ) : (
          selectedKeys.map((key) => {
            const optionCount = getOptionCountForTreatment(key);
            return (
              <div
                key={key}
                className="flex items-center px-3 py-2 rounded-lg bg-primary/10 text-primary border border-primary/20 text-sm shadow-sm hover:shadow-md transition-shadow"
              >
                <button
                  type="button"
                  className="mr-2 hover:bg-destructive/10 p-0.5 rounded focus-ring"
                  onClick={() => handleRemove(key)}
                  aria-label="선택 삭제"
                >
                  <X className="w-3 h-3 text-destructive" />
                </button>
                <span className="mr-2 font-medium">{getLabelByKey(key, categories)}</span>
                {getUnitByKey(key, categories) && (
                  <span className="text-xs text-primary bg-primary/20 px-2 py-0.5 rounded-md font-medium mr-1">
                    {getUnitByKey(key, categories)}
                  </span>
                )}
                {getDepartmentByKey(key, categories) && (
                  <span className={`text-xs px-2 py-0.5 rounded-md font-medium mr-1 ${getDepartmentStyleClass(getDepartmentByKey(key, categories))}`}>
                    {getDepartmentDisplayName(getDepartmentByKey(key, categories))}
                  </span>
                )}
                {optionCount > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full font-bold">
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
        <div className="mt-6 p-4 bg-card rounded-lg border border-border shadow-sm">
          <div className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="text-lg">📊</span> 선택된 시술 데이터
          </div>
          <div className="text-muted-foreground space-y-3">
            <div className="text-sm"><strong className="text-foreground">시술 개수:</strong> {selectedKeys.length}개</div>
            
            {/* 선택된 시술명 목록 */}
            {selectedKeys.length > 0 && (
              <div>
                <strong className="text-foreground">선택된 시술:</strong>
                <div className="ml-4 mt-2 space-y-2">
                  {selectedKeys.map((key, index) => (
                    <div key={key} className="text-sm bg-muted/30 p-2 rounded-md">
                      {index + 1}. {getLabelByKey(key, categories)}
                      {getUnitByKey(key, categories) && (
                        <span className="ml-2 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-md font-medium">
                          {getUnitByKey(key, categories)}
                        </span>
                      )}
                      {getDepartmentByKey(key, categories) && (
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded-md font-medium ${getDepartmentStyleClass(getDepartmentByKey(key, categories))}`}>
                          {getDepartmentDisplayName(getDepartmentByKey(key, categories))}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="text-sm"><strong className="text-foreground">상품옵션 개수:</strong> {productOptions.length}개</div>
            
            {/* 상품옵션 내용 목록 */}
            {productOptions.map((option, index) => (
              <div key={option.id} className="text-sm bg-muted/30 p-3 rounded-md border border-border/50">
                <div className="font-medium text-foreground mb-1">
                  {index + 1}. {getLabelByKey(option.treatmentKey, categories)}
                  {getUnitByKey(option.treatmentKey, categories) && (
                    <span className="ml-2 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-md font-medium">
                      {getUnitByKey(option.treatmentKey, categories)}
                    </span>
                  )}
                  {getDepartmentByKey(option.treatmentKey, categories) && (
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-md font-medium ${getDepartmentStyleClass(getDepartmentByKey(option.treatmentKey, categories))}`}>
                      {getDepartmentDisplayName(getDepartmentByKey(option.treatmentKey, categories))}
                    </span>
                  )}
                </div>
                <div className="text-muted-foreground">
                  {option.value1 && Number(option.value1) >= 1
                    ? (
                        <>
                          시술옵션: <span className="font-medium">{option.value1}</span> → 가격: <span className="font-bold text-foreground">{option.value2?.toLocaleString()}원</span>
                        </>
                      )
                    : (
                        <>
                          옵션없음 → 가격: <span className="font-bold text-foreground">{option.value2?.toLocaleString()}원</span>
                        </>
                      )
                  }
                </div>
              </div>
            ))}
            
            {/* 기타 정보 */}
            {etc.trim() !== "" && (
              <div>
                <strong className="text-foreground">기타 정보:</strong>
                <div className="ml-4 mt-2 p-3 bg-muted/30 rounded-md border border-border/50 text-sm">
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
        initialSelectedDepartment={selectedDepartment}
        onClose={handleClose}
        onSave={handleSave}
        categories={categories}
      />
    </div>
  );
}
