"use client";

import { PropsWithChildren, ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";

interface ModalBaseProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  footer?: ReactNode;
  className?: string;
}

export const ModalBase = ({
  open,
  onClose,
  title,
  children,
  footer,
  className = "max-w-md sm:rounded-xl animate-in fade-in-0 zoom-in-95",
}: PropsWithChildren<ModalBaseProps>) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={className}>
        {title && (
          <DialogHeader>
            <DialogTitle className="text-[1.5rem] font-bold py-4">{title}</DialogTitle>
          </DialogHeader>
        )}
        <div className="max-h-[60vh] overflow-y-auto break-words">
          {children}
        </div>
        {footer && <DialogFooter className="pt-4">{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
};

interface ConfirmModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title?: string;
}

export const ConfirmModal = ({
  open,
  title,
  children,
  onCancel,
  onConfirm,
}: PropsWithChildren<ConfirmModalProps>) => {
  return (
    <ModalBase
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <div className="flex gap-4 justify-end">
           <Button variant="outline" onClick={onCancel}>
            CANCEL
            </Button>
          <Button color="blue" onClick={onConfirm}>
            SIGN UP
          </Button>
        </div>
      }
    >
      {children}
    </ModalBase>
  );
};

interface AlertModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm?: () => void;
  children: ReactNode;
  className?: string;
  title?: string;
  showCancelButton?: boolean;
  cancelText?: string;
  confirmText?: string;
}

export const AlertModal = ({
  open,
  onCancel,
  onConfirm,
  children,
  className,
  title,
  showCancelButton,
  cancelText = '취소',
  confirmText = '확인',
}: AlertModalProps) => {
  return (
    <ModalBase
      open={open}
      onClose={onCancel}
      title={title}
      className={className || "max-w-sm sm:rounded-xl animate-in fade-in-0 zoom-in-95"}
      footer={
        <div className="flex justify-center gap-4">
          {showCancelButton && (
            <Button variant="outline" onClick={onCancel}>
              {cancelText}
            </Button>
          )}
          <Button onClick={onConfirm || onCancel}>
            {confirmText}
          </Button>
        </div>
      }
    >
      <div className="text-sm break-words py-4 text-center select-text whitespace-pre-line">
        {children}
      </div>
    </ModalBase>
  );
};
