"use client";

import React, { useEffect, useState } from "react";
import { TREATMENT_CATEGORIES } from "@/app/contents/treatments";
import { CategoryNode } from "@/app/contents/CategoryNode";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface TreatmentSelectModalProps {
  open: boolean;
  initialSelectedKeys: string[];
  onClose: () => void;
  onSave: (keys: string[]) => void;
}

// depth 정보를 가지면서 전체 카테고리 플랫하게 펼치기
const flattenCategoriesWithParentDepth = (categories: CategoryNode[], depth = 1, parentKeys: string[] = []) => {
  const result: {
    key: string;
    label: string;
    depth: number;
    hasChildren: boolean;
    parentKeys: string[];
    isLastDepth: boolean;
  }[] = [];
  categories.forEach((node) => {
    const hasChildren = !!node.children?.length;
    const isLastDepth = !hasChildren;
    result.push({
      key: node.key,
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
  onClose,
  onSave,
}: TreatmentSelectModalProps) {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  useEffect(() => {
    setSelectedKeys(initialSelectedKeys ?? []);
  }, [open, initialSelectedKeys]);

  const flatList = flattenCategoriesWithParentDepth(TREATMENT_CATEGORIES);

  // depth마다 마지막 depth가 체크박스 위치인지 파악
  const lastDepth = Math.max(...flatList.map((x) => x.depth));
  // 2뎁스 체크박스면 1뎁스만, 3뎁스 체크박스면 1,2뎁스 모두 강조

  // 체크박스가 있는 depth set 구하기
  const checkboxDepthSet = new Set(flatList.filter(x => x.isLastDepth).map(x => x.depth));

  const handleToggle = (key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSave = () => {
    onSave([...selectedKeys]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogTitle>시술 선택</DialogTitle>
        <div className="max-h-96 overflow-y-auto py-2 px-1">
          {flatList.map((item, idx) => {
            // 체크박스 있는 depth가 2 → 1뎁스만 강조, 3 → 1,2뎁스 모두 강조
            let labelClass = "pl-0";
            if (item.depth > 1) labelClass = `pl-[${(item.depth - 1) * 24}px]`;
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
                className={`flex items-center gap-2 py-1 px-2 rounded ${labelClass}`}
                style={{ marginLeft: `${(item.depth - 1) * 24}px` }}
              >
                {item.hasChildren ? (
                  <span className={`${fontClass} ${fontWeight}`}>{item.label}</span>
                ) : (
                  <>
                    <input
                      type="checkbox"
                      className="accent-blue-600"
                      checked={selectedKeys.includes(item.key)}
                      onChange={() => handleToggle(item.key)}
                    />
                    <span className={`${fontClass} ${fontWeight}`}>{item.label}</span>
                  </>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex gap-2 justify-end mt-4">
          <Button variant="ghost" onClick={onClose}>취소</Button>
          <Button onClick={handleSave}>완료</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}