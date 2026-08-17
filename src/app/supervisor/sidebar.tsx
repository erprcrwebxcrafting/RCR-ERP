"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MapPin, ClipboardList, HardHat, User, Menu, X } from "lucide-react";
import { YearSelector } from "@/components/year-selector";
import { useState, useEffect } from "react";

const nav = [
  { href: "/supervisor", label: "Dashboard", icon: LayoutDashboard },
  { href: "/supervisor/sites", label: "My Sites", icon: MapPin },
  { href: "/supervisor/attendance", label: "Attendance", icon: ClipboardList },
  { href: "/supervisor/labours", label: "Labours", icon: HardHat },
  { href: "/supervisor/profile", label: "Profile", icon: User },
];

export function SupervisorSidebar({ 
  userName, 
  logoutButton,
  earliestYear
}: { 
  userName?: string | null,
  logoutButton: React.ReactNode,
  earliestYear?: number
}) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar on route change on mobile
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const sidebarContent = (
    <>
      {/* Decorative background gradients */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-br from-blue-600/10 via-transparent to-transparent pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-full h-64 bg-gradient-to-tl from-sky-600/10 via-transparent to-transparent pointer-events-none" />

      {/* Brand Header */}
      <div className="flex h-20 items-center gap-3 px-6 relative z-10 mb-2 mt-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl overflow-hidden shadow-lg shadow-blue-500/20 ring-1 ring-white/20 bg-white p-1">
          <img src="/rcr-logo.png" alt="RCR Enterprises Logo" className="w-full h-full object-contain" />
        </div>
        <div className="flex flex-col">
          <span className="text-[15px] font-bold tracking-wide text-white leading-tight">RCR Enterprises</span>
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">Supervisor</span>
        </div>
      </div>
      
      {/* Divider */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-700/50 to-transparent mb-4" />

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 px-4 overflow-y-auto pb-6 scrollbar-none relative z-10">
        {nav.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/supervisor" && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                isActive 
                  ? "bg-blue-600/15 text-blue-400" 
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              }`}
            >
              <div className={`relative flex items-center justify-center ${isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"}`}>
                <item.icon className={`h-[18px] w-[18px] transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} strokeWidth={isActive ? 2.5 : 2} />
                {isActive && (
                  <div className="absolute inset-0 blur-sm bg-blue-400/40 rounded-full scale-150" />
                )}
              </div>
              
              <span className={`tracking-wide ${isActive ? "font-semibold text-blue-300" : ""}`}>{item.label}</span>
              
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Profile */}
      <div className="relative z-10 mt-auto border-t border-slate-800/60 bg-slate-900/50 p-4">
        <div className="flex items-center gap-3 px-2 mb-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-sm font-semibold text-white">
            {userName ? userName.charAt(0).toUpperCase() : "S"}
          </div>
          <div className="flex flex-col truncate">
            <span className="text-xs font-medium text-slate-400">Logged in as</span>
            <span className="text-sm font-semibold text-slate-200 truncate">{userName || "Supervisor"}</span>
          </div>
        </div>
        
        <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-slate-800">
          <div className="px-3 pb-2">
            <YearSelector earliestYear={earliestYear} />
          </div>
          {logoutButton}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0b1120] flex items-center justify-between px-4 z-40 border-b border-slate-800/60 shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg overflow-hidden bg-white p-1">
            <img src="/rcr-logo.png" alt="RCR Logo" className="w-full h-full object-contain" />
          </div>
          <span className="font-bold text-white text-sm tracking-wide">Supervisor Portal</span>
        </div>
        <button 
          onClick={() => setIsOpen(true)}
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile Overlay & Sidebar */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Sidebar Panel */}
          <aside className="relative flex w-[280px] flex-col bg-[#0b1120] text-slate-300 h-full shadow-2xl animate-in slide-in-from-left duration-300">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-lg z-50 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden w-[280px] shrink-0 flex-col bg-[#0b1120] text-slate-300 md:flex shadow-2xl relative z-10 border-r border-slate-800/60 overflow-hidden min-h-screen">
        {sidebarContent}
      </aside>
    </>
  );
}
