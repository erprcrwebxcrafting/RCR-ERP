"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Building2, MapPin, Users, HardHat,
  ClipboardList, Receipt, FileText, BarChart3, Settings,
  Menu, X
} from "lucide-react";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/clients", label: "Clients", icon: Building2 },
  { href: "/admin/sites", label: "Sites", icon: MapPin },
  { href: "/admin/supervisors", label: "Supervisors", icon: HardHat },
  { href: "/admin/labours", label: "Labours", icon: Users },
  { href: "/admin/attendance", label: "Attendance", icon: ClipboardList },
  { href: "/admin/bills", label: "Bills", icon: Receipt },
  { href: "/admin/quotations", label: "Quotations", icon: FileText },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar({ 
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

  // Prevent scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const SidebarContent = (
    <>
      {/* Brand Header */}
      <div className="flex h-20 items-center gap-3 px-6 relative z-20 mb-2 mt-2">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl overflow-hidden shadow-[0_0_15px_rgba(59,130,246,0.3)] ring-1 ring-white/20 bg-white p-1 transition-transform hover:scale-105">
          <img src="/rcr-logo.png" alt="RCR Enterprises Logo" className="w-full h-full object-contain" />
        </div>
        <div className="flex flex-col">
          <span className="text-[16px] font-extrabold tracking-wide text-white leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">RCR Enterprises</span>
          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-0.5">Construction ERP</span>
        </div>
      </div>
      
      {/* Divider */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-700 to-transparent mb-4 opacity-60" />

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 px-3 overflow-y-auto pb-6 scrollbar-thin relative z-20">
        {nav.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 relative overflow-hidden ${
                isActive 
                  ? "bg-blue-600/15 text-white shadow-sm" 
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
              }`}
            >
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-transparent border-l-2 border-blue-400" />
              )}
              
              <div className={`relative z-10 flex items-center justify-center ${isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"}`}>
                <item.icon className={`h-[18px] w-[18px] transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              
              <span className={`relative z-10 tracking-wide ${isActive ? "font-bold text-blue-50" : ""}`}>{item.label}</span>
              
              {isActive && (
                <div className="relative z-10 ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Profile */}
      <div className="relative z-20 mt-auto border-t border-white/5 bg-black/20 backdrop-blur-md p-4">
        <div className="flex items-center gap-3 px-2 mb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-900/20 text-sm font-bold text-white border border-blue-400/30">
            {userName ? userName.charAt(0).toUpperCase() : "A"}
          </div>
          <div className="flex flex-col truncate">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Logged in as</span>
            <span className="text-sm font-bold text-slate-200 truncate">{userName || "Administrator"}</span>
          </div>
        </div>
        

        {logoutButton}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0a0f1c]/90 backdrop-blur-xl border-b border-slate-800/60 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white p-1 shadow-md">
            <img src="/rcr-logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <span className="font-extrabold text-white tracking-wide text-sm bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">RCR Enterprises</span>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 -mr-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-[100dvh] w-[280px] shrink-0 flex-col 
        bg-[#090f1a] text-slate-300 z-50 
        border-r border-slate-800/60 overflow-hidden
        transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]
        flex
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        {/* Decorative background gradients */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-br from-blue-600/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-full h-96 bg-gradient-to-tl from-indigo-600/10 via-transparent to-transparent pointer-events-none" />

        {SidebarContent}
      </aside>
    </>
  );
}
