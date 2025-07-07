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

  return (
    <div className={`flex flex-wrap gap-2 mb-4 ${className}`}>
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
        })
      )}
    </div>
  );
} 