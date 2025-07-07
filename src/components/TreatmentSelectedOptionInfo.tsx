"use client";

import React from "react";
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

interface TreatmentSelectedOptionInfoProps {
  selectedKeys: number[];
  productOptions: ProductOption[];
  etc: string;
  categories: CategoryNode[];
  showTitle?: boolean;
  className?: string;
}

export function TreatmentSelectedOptionInfo({
  selectedKeys,
  productOptions,
  etc,
  categories,
  showTitle = true,
  className = ""
}: TreatmentSelectedOptionInfoProps) {
  // 데이터가 없으면 렌더링하지 않음
  if (selectedKeys.length === 0 && productOptions.length === 0 && etc.trim() === "") {
    return null;
  }

  return (
    <div className={`mt-6 p-4 bg-card rounded-lg border border-border shadow-sm ${className}`}>
      {showTitle && (
        <div className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <span className="text-lg">📊</span> 선택된 시술 데이터
        </div>
      )}
      
      <div className="text-muted-foreground space-y-3">
        <div className="text-sm">
          <strong className="text-foreground">시술 개수:</strong> {selectedKeys.length}개
        </div>
        
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
        
        <div className="text-sm">
          <strong className="text-foreground">상품옵션 개수:</strong> {productOptions.length}개
        </div>
        
        {/* 상품옵션 내용 목록 */}
        {productOptions.length > 0 && (
          <div>
            <strong className="text-foreground">상품옵션 상세:</strong>
            <div className="ml-4 mt-2 space-y-2">
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
            </div>
          </div>
        )}
        
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
  );
} 