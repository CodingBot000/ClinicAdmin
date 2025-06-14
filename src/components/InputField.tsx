"use client";

import React, { forwardRef } from "react";
import clsx from "clsx";

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  disabled?: boolean;
  isError?: boolean;
  placeholder?: string;
  type?: string;
}

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, name, disabled = false, isError, placeholder, type, ...props }, ref) => {
    return (
      <div className="flex items-center w-full gap-2">
        {/* 왼쪽 라벨 */}
        <label htmlFor={name} className="min-w-[90px] font-medium">
          {label}
        </label>
        {/* 오른쪽 입력칸 (네모 border) */}
        <input
          id={name}
          name={name}
          ref={ref}
          type={type}
          disabled={disabled}
          placeholder={placeholder}
          className={clsx(
            "flex-1 px-3 py-2 border rounded outline-none transition",
            isError
              ? "border-red-500 focus:border-red-500"
              : "border-gray-300 focus:border-blue-500"
          )}
          onDoubleClick={(e) => e.currentTarget.select()}
          {...props}
        />
      </div>
    );
  }
);

InputField.displayName = "InputField";
export default InputField;
