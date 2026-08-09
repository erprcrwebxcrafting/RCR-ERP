"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

import { Building2, HardHat, Loader2, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(loginAction, { success: false, error: undefined as string | undefined });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (state?.success) {
      router.push("/");
      router.refresh();
    }
  }, [state?.success, router]);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950 selection:bg-indigo-500/30">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 w-full h-full bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      
      {/* Glowing Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-1000"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-1000" style={{ animationDelay: '1s' }}></div>

      <div className="relative z-10 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-700 ease-out">
        {/* Logo/Brand Section */}
        <div className="flex flex-col items-center mb-8 text-center space-y-2">
          <div className="h-24 w-24 bg-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-2 overflow-hidden border-2 border-indigo-500/20">
            <img src="/rcr-logo.png" alt="RCR Enterprises Logo" className="h-full w-full object-cover scale-110" />
          </div>
          <p className="text-slate-400 font-medium">Construction ERP Management</p>
        </div>

        {/* Glassmorphism Card */}
        <div className="backdrop-blur-xl bg-slate-900/60 border border-slate-700/50 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
          {/* Subtle shine effect on card */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 rounded-3xl pointer-events-none"></div>
          
          <form action={formAction} className="space-y-6 relative z-10">
            <div className="space-y-4">
              <div className="space-y-2 group">
                <Label htmlFor="email" className="text-slate-300 font-medium group-focus-within:text-indigo-400 transition-colors">Email Address</Label>
                <div className="relative">
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    required 
                    placeholder="admin@rcrenterprises.com"
                    className="bg-slate-950/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20 h-12 rounded-xl transition-all"
                  />
                </div>
              </div>
              
              <div className="space-y-2 group">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-slate-300 font-medium group-focus-within:text-indigo-400 transition-colors">Password</Label>
                </div>
                <div className="relative">
                  <Input 
                    id="password" 
                    name="password" 
                    type={showPassword ? "text" : "password"} 
                    required 
                    placeholder="••••••••"
                    className="bg-slate-950/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20 h-12 rounded-xl transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 focus:outline-none transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {state?.error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg animate-in slide-in-from-top-2">
                <p className="text-sm text-red-400 text-center font-medium">{state.error}</p>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-medium text-base rounded-xl shadow-lg shadow-indigo-500/25 transition-all group overflow-hidden relative" 
              disabled={pending}
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
              <span className="relative z-10 flex items-center justify-center gap-2">
                {pending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
            </Button>
          </form>
        </div>
        
        {/* Footer text */}
        <p className="text-center text-slate-500 text-sm mt-8">
          Secure, authenticated access only.
        </p>
      </div>
    </div>
  );
}
