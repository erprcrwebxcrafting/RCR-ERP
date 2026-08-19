"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/password-input";
import { Label } from "@/components/ui/label";
import { KeyRound, ShieldCheck, Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { requestOtpAction, verifyOtpAndChangePasswordAction } from "./otp-actions";

type Step = "email" | "otp" | "newpass" | "done";

export function ChangePasswordForm({ adminEmail }: { adminEmail: string }) {
  const [step, setStep] = useState<Step>("email");
  const [otp, setOtp] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleRequestOtp() {
    startTransition(async () => {
      try {
        await requestOtpAction(adminEmail);
        toast.success("OTP Sent!", {
          description: `A 6-digit OTP has been generated. Check your server console logs (Email will be enabled when SMTP is configured).`,
        });
        setStep("otp");
      } catch (err: any) {
        toast.error("Failed to send OTP", { description: err?.message });
      }
    });
  }

  function handleVerifyAndChange() {
    if (newPass !== confirmPass) {
      toast.error("Passwords do not match.");
      return;
    }
    startTransition(async () => {
      try {
        await verifyOtpAndChangePasswordAction(adminEmail, otp, newPass);
        setStep("done");
        toast.success("Password Changed!", {
          description: "Your new password has been saved securely.",
        });
      } catch (err: any) {
        toast.error("Failed to change password", { description: err?.message });
      }
    });
  }

  if (step === "done") {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <p className="font-bold text-slate-800 dark:text-slate-100">Password Updated Successfully!</p>
        <p className="text-sm text-slate-500">Use your new password the next time you log in.</p>
        <Button variant="ghost" size="sm" onClick={() => { setStep("email"); setOtp(""); setNewPass(""); setConfirmPass(""); }}>
          Reset Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-1">
      {step === "email" && (
        <div className="space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Click below to generate a secure 6-digit OTP for your admin account.
          </p>
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm font-mono text-slate-700 dark:text-slate-300">
            {adminEmail}
          </div>
          <Button onClick={handleRequestOtp} disabled={isPending} className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            {isPending ? "Generating OTP..." : "Generate OTP"}
          </Button>
        </div>
      )}

      {step === "otp" && (
        <div className="space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Enter the 6-digit OTP from your console logs (or email when SMTP is configured).
          </p>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">OTP Code</Label>
            <Input
              value={otp} onChange={(e) => setOtp(e.target.value)}
              placeholder="123456" maxLength={6}
              className="text-center text-xl font-mono tracking-widest h-12 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Password</Label>
            <PasswordInput
              value={newPass} 
              onChange={(e) => setNewPass(e.target.value)}
              required
              placeholder="Min 8 chars, A-Z, a-z, 0-9, !@#"
              className="h-11 rounded-xl"
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirm Password</Label>
            <PasswordInput
              value={confirmPass} 
              onChange={(e) => setConfirmPass(e.target.value)}
              required
              placeholder="Repeat new password"
              className="h-11 rounded-xl"
              autoComplete="new-password"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setStep("email"); setOtp(""); }} className="flex-1 rounded-xl">Back</Button>
            <Button onClick={handleVerifyAndChange} disabled={isPending || otp.length < 6 || !newPass} className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              {isPending ? "Changing..." : "Change Password"}
            </Button>
          </div>
          <button onClick={handleRequestOtp} disabled={isPending} className="w-full text-xs text-blue-600 hover:underline text-center">
            Resend OTP
          </button>
        </div>
      )}
    </div>
  );
}
