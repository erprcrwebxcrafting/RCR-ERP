"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onValidityChange?: (isValid: boolean) => void;
  showStrengthIndicator?: boolean;
}

export function PasswordInput({ onValidityChange, showStrengthIndicator = true, className, ...props }: PasswordInputProps) {
  const [showPass, setShowPass] = useState(false);
  const [value, setValue] = useState((props.defaultValue || props.value || "") as string);

  const checks = [
    { label: "At least 8 characters", test: (v: string) => v.length >= 8 },
    { label: "One uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
    { label: "One lowercase letter", test: (v: string) => /[a-z]/.test(v) },
    { label: "One number", test: (v: string) => /\d/.test(v) },
    { label: "One special character", test: (v: string) => /[!@#$%^&*()_+\-=\[\]{}|;':",./<>?]/.test(v) },
  ];

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue(val);
    if (props.onChange) {
      props.onChange(e);
    }
    if (onValidityChange) {
      const allValid = checks.every((c) => c.test(val));
      // If the field is optional and empty, we might want to consider it valid for edit forms. 
      // But typically, the consumer handles if it's required or not. 
      // This validity is just "if there is text, is it a strong password?".
      onValidityChange(val === "" ? !props.required : allValid);
    }
  };

  const isOptionalAndEmpty = !props.required && value === "";
  const showChecks = showStrengthIndicator && (value.length > 0 || props.required);

  return (
    <div className="space-y-3 w-full">
      <div className="relative">
        <Input
          {...props}
          type={showPass ? "text" : "password"}
          value={value}
          onChange={handleTextChange}
          className={`pr-10 ${className || ""}`}
        />
        <button
          type="button"
          onClick={() => setShowPass(!showPass)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          tabIndex={-1}
        >
          {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {showChecks && !isOptionalAndEmpty && (
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 border border-slate-200 dark:border-slate-800 space-y-2">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Password Requirements</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {checks.map((check, i) => {
              const passed = check.test(value);
              return (
                <div key={i} className={`flex items-center gap-1.5 text-xs ${passed ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`}>
                  {passed ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <XCircle className="h-3.5 w-3.5 shrink-0" />}
                  <span>{check.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
