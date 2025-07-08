"use client";

import React from "react";
import { X } from "lucide-react";
import { CategoryNode } from "@/types/category";
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

interface TreatmentSelectedChipsProps {
  selectedKeys: number[];
  productOptions: ProductOption[];
  categories: CategoryNode[];
  onRemove?: (key: number) => void;
  showRemoveButton?: boolean;
  className?: string;
}

export function TreatmentSelectedChips({
  selectedKeys,
  productOptions,
  categories,
  onRemove,
  showRemoveButton = true,
  className = ""
}: TreatmentSelectedChipsProps) {
  // 해당 시술에 연결된 상품옵션 개수 계산
  const getOptionCountForTreatment = (treatmentKey: number): number => {
    return productOptions.filter(option => option.treatmentKey === treatmentKey).length;
  };

  // 부서별로 선택된 시술 그룹화
  const groupByDepartment = () => {
    const skinTreatments: number[] = [];
    const surgeryTreatments: number[] = [];
    const noDepartmentTreatments: number[] = [];

    selectedKeys.forEach(key => {
      const department = getDepartmentByKey(key, categories);
      if (department === 'skin') {
        skinTreatments.push(key);
      } else if (department === 'surgery') {
        surgeryTreatments.push(key);
      } else {
        noDepartmentTreatments.push(key);
      }
    });

    return {
      skin: skinTreatments,
      surgery: surgeryTreatments,
      noDepartment: noDepartmentTreatments
    };
  };

  // 칩 렌더링 함수
  const renderChips = (keys: number[]) => {
    return keys.map((key) => {
      const optionCount = getOptionCountForTreatment(key);
      return (
        <div
          key={key}
          className="flex items-center px-3 py-2 rounded-lg bg-primary/10 text-primary border border-primary/20 text-sm shadow-sm hover:shadow-md transition-shadow"
        >
          {showRemoveButton && onRemove && (
            <button
              type="button"
              className="mr-2 hover:bg-destructive/10 p-0.5 rounded focus-ring"
              onClick={() => onRemove(key)}
              aria-label="선택 삭제"
            >
              <X className="w-3 h-3 text-destructive" />
            </button>
          )}
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
    });
  };

  // 부서별로 그룹화
  const groupedTreatments = groupByDepartment();
  const hasAnyTreatments = selectedKeys.length > 0;

  if (!hasAnyTreatments) {
    return (
      <div className={`flex flex-wrap gap-2 mb-4 ${className}`}>
        <div className="flex items-center gap-2 p-4 rounded-lg border border-dashed border-border bg-muted/20">
          <span className="text-muted-foreground">선택된 시술이 없습니다.</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 mb-4 ${className}`}>
      {/* 피부과 시술 */}
      {groupedTreatments.skin.length > 0 && (
        <div>
          <div className="mb-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getDepartmentStyleClass('skin')}`}>
              {getDepartmentDisplayName('skin')}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {renderChips(groupedTreatments.skin)}
          </div>
        </div>
      )}

      {/* 성형외과 시술 */}
      {groupedTreatments.surgery.length > 0 && (
        <div>
          <div className="mb-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getDepartmentStyleClass('surgery')}`}>
              {getDepartmentDisplayName('surgery')}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {renderChips(groupedTreatments.surgery)}
          </div>
        </div>
      )}

      {/* 부서 미지정 시술 */}
      {groupedTreatments.noDepartment.length > 0 && (
        <div>
          <div className="mb-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-gray-700 bg-gray-100">
              기타
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {renderChips(groupedTreatments.noDepartment)}
          </div>
        </div>
      )}
    </div>
  );
} 