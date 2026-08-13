"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { formatIndianString, parseIndianString } from "@/lib/utils";

interface IndianNumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value?: number | string;
  onChange?: (val: number, formattedStr: string) => void;
  name?: string;
  placeholder?: string;
  className?: string;
  defaultValue?: number | string;
}

export function IndianNumberInput({
  value: propValue,
  defaultValue,
  onChange,
  name,
  placeholder = "0",
  className,
  ...props
}: IndianNumberInputProps) {
  const [displayValue, setDisplayValue] = useState<string>(() => {
    const init = propValue !== undefined ? propValue : defaultValue;
    if (init === undefined || init === null || init === "") return "";
    return formatIndianString(init.toString());
  });

  useEffect(() => {
    if (propValue !== undefined) {
      setDisplayValue(formatIndianString(propValue.toString()));
    }
  }, [propValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = e.target.value;
    const formatted = formatIndianString(rawInput);
    const numeric = parseIndianString(formatted);

    setDisplayValue(formatted);
    if (onChange) {
      onChange(numeric, formatted);
    }
  };

  const numericValue = parseIndianString(displayValue);

  return (
    <>
      <Input
        {...props}
        type="text"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={className}
      />
      {name && <input type="hidden" name={name} value={numericValue} />}
    </>
  );
}
