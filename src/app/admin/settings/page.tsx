import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Building2, Mail, Phone, MapPin, Receipt, ShieldCheck } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-8 sm:p-10 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 h-48 w-48 rounded-full bg-blue-400/20 blur-2xl" />
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md border border-white/20">
              <Settings className="h-3.5 w-3.5" />
              Configuration
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">System Settings</h1>
            <p className="text-blue-100 max-w-xl text-sm sm:text-base font-medium">
              Manage your company profile, billing configurations, and system-wide preferences.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Company Details Card */}
        <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900 col-span-1 lg:col-span-2">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-blue-500/5 blur-2xl transition-all duration-500 group-hover:bg-blue-500/10" />
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Building2 className="h-5 w-5" />
               </div>
               <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">Company Details</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              <div className="flex items-start gap-3">
                 <div className="mt-0.5"><Receipt className="h-4 w-4 text-slate-400" /></div>
                 <div>
                   <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Company Name & GST</p>
                   <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">RCR Enterprises</p>
                   <p className="text-sm text-slate-600 dark:text-slate-400">27CIMPR8276H1ZF</p>
                 </div>
              </div>

              <div className="flex items-start gap-3">
                 <div className="mt-0.5"><MapPin className="h-4 w-4 text-slate-400" /></div>
                 <div>
                   <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registered Address</p>
                   <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">
                     (Address configuration available in upcoming update)
                   </p>
                 </div>
              </div>

              <div className="flex items-start gap-3">
                 <div className="mt-0.5"><Mail className="h-4 w-4 text-slate-400" /></div>
                 <div>
                   <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Email</p>
                   <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">rcrenterprises786@gmail.com</p>
                 </div>
              </div>

              <div className="flex items-start gap-3">
                 <div className="mt-0.5"><Phone className="h-4 w-4 text-slate-400" /></div>
                 <div>
                   <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Number</p>
                   <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">+91 9619439243</p>
                 </div>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Security / Audit Log Planner */}
        <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-slate-900">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <ShieldCheck className="h-5 w-5" />
               </div>
               <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">Security & Logs</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              Editable company-profile settings, WhatsApp/Email integrations, user roles, and a detailed system audit-log viewer are planned for <span className="font-bold text-indigo-600 dark:text-indigo-400">Phase 4</span>.
            </p>
            <div className="mt-6 p-4 rounded-xl bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
              <p className="text-xs text-center text-slate-500 font-bold uppercase tracking-widest">Update Pending</p>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
