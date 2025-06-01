"use client";

import React, { useState, useEffect } from "react";
import { TreatmentSelectModal } from "./modal/TreatmentSelectModal";
import { X } from "lucide-react";
import { TREATMENT_CATEGORIES } from "@/app/contents/treatments";
import { CategoryNode } from "@/app/contents/CategoryNode";
import { Button } from "@/components/ui/button";

interface TreatmentSelectBoxProps {
  onSelectionChange?: (selectedKeys: number[]) => void;
  initialSelectedKeys?: number[];
}

const getLabelByKey = (() => {
  // 한번만 트리 플랫하게 만들어서 성능 최적화
  const map = new Map<number, string>();
  const traverse = (nodes: CategoryNode[]) => {
    nodes.forEach((n) => {
      map.set(n.key, n.label);
      if (n.children) traverse(n.children);
    });
  };
  traverse(TREATMENT_CATEGORIES);
  return (key: number) => map.get(key) ?? key.toString();
})();

export function TreatmentSelectBox({ onSelectionChange, initialSelectedKeys = [] }: TreatmentSelectBoxProps) {
  const [selectedKeys, setSelectedKeys] = useState<number[]>(initialSelectedKeys);
  const [modalOpen, setModalOpen] = useState(false);

  // 선택된 항목이 변경될 때마다 상위 컴포넌트에 알림
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedKeys);
    }
  }, [selectedKeys, onSelectionChange]);

  const handleRemove = (key: number) => {
    setSelectedKeys((prev) => prev.filter((k) => k !== key));
  };

  const handleRemoveOption = (key: number) => {
    // setSelectedKeys((prev) => prev.filter((k) => k !== key));
  };

  const handleOpen = () => setModalOpen(true);
  const handleClose = () => setModalOpen(false);

  const handleSave = (keys: number[]) => {
    setSelectedKeys(keys);
  };

  return (
    <div>
      <Button size="sm" className="mb-2" onClick={handleOpen}>
        가능시술 선택하기
      </Button>
      {/* 선택 결과 칩 형태 */}
      <div className="flex flex-wrap gap-2">
        {selectedKeys.length === 0 ? (
          <span className="text-gray-400">선택된 시술이 없습니다.</span>
        ) : (
          selectedKeys.map((key) => (
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
              {getLabelByKey(key)}
            
            </div>
          ))
        )}
      </div>
      
      {/* Hidden input for form submission */}
      {selectedKeys.length > 0 && (
        <input type="hidden" name="selected_treatments" value={JSON.stringify(selectedKeys)} />
      )}
      
      {/* 모달 */}
      <TreatmentSelectModal
        open={modalOpen}
        initialSelectedKeys={selectedKeys}
        onClose={handleClose}
        onSave={handleSave}
      />
    </div>
  );
}
