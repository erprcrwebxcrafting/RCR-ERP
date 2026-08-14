import { auth } from "@/auth";
import { Card, CardContent } from "@/components/ui/card";
import { UserCircle, Mail, ShieldCheck, MapPin, Building2, HardHat } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function ProfilePage() {
  const session = await auth();
  const user = session?.user;
  const userId = (user as any)?.id as string;
  
  // Optionally fetch assigned sites to show on profile
  let assignedSites = [];
  if (userId) {
    assignedSites = await prisma.siteSupervisor.findMany({
      where: { supervisorId: userId },
      include: { site: true }
    });
  }

  const initials = user?.name ? user.name.substring(0, 2).toUpperCase() : "SP";

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-4xl mx-auto pb-12">
      
      {/* Premium Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-8 sm:p-12 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 h-48 w-48 rounded-full bg-blue-400/20 blur-2xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="h-28 w-28 rounded-full bg-white/20 border-4 border-white/30 backdrop-blur-md flex items-center justify-center text-4xl font-black text-white shadow-2xl shrink-0">
            {initials}
          </div>
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 mb-4 text-xs font-semibold text-white backdrop-blur-md border border-white/20">
              <ShieldCheck className="h-3.5 w-3.5" />
              Supervisor Profile
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">{user?.name || "Supervisor"}</h1>
            <p className="text-blue-100 max-w-xl text-sm sm:text-base font-medium flex items-center justify-center md:justify-start gap-2">
              <Mail className="h-4 w-4" />
              {user?.email}
            </p>
          </div>
        </div>
        
        <div className="absolute right-0 top-0 -mt-12 -mr-12 text-white/5 opacity-50 pointer-events-none">
          <UserCircle className="h-64 w-64" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Account Details */}
        <Card className="border-slate-200 dark:border-slate-800/60 shadow-xl bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-indigo-500" />
              Account Information
            </h3>
          </div>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Full Name</p>
              <p className="text-base font-bold text-slate-800 dark:text-slate-200">{user?.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Email Address</p>
              <p className="text-base font-bold text-slate-800 dark:text-slate-200">{user?.email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Role</p>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-1 border border-indigo-100 dark:border-indigo-500/20">
                <HardHat className="h-4 w-4" />
                Supervisor
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Assigned Sites */}
        <Card className="border-slate-200 dark:border-slate-800/60 shadow-xl bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-500" />
              Assigned Sites ({assignedSites.length})
            </h3>
          </div>
          <CardContent className="p-6">
            {assignedSites.length > 0 ? (
              <ul className="space-y-3">
                {assignedSites.map((assignment) => (
                  <li key={assignment.id} className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 transition-colors hover:border-blue-200 dark:hover:border-blue-500/30">
                    <div className="p-2 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{assignment.site.projectName}</p>
                      <p className="text-sm font-medium text-slate-500">{assignment.site.address}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-3">
                  <Building2 className="h-8 w-8 text-slate-400" />
                </div>
                <p className="font-bold text-slate-700 dark:text-slate-300">No Sites Assigned</p>
                <p className="text-sm text-slate-500 mt-1">You haven't been assigned to any sites yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
