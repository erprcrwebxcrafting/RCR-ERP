"use client";

import { useTransition } from "react";
import { updateGlobalSettings } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { CardContent } from "@/components/ui/card";
import { Building2, MapPin, Mail, Phone, Globe, Save, Bell } from "lucide-react";
import { toast } from "sonner";
import { validatePhone, validateEmail } from "@/lib/validations";

export function SettingsForm({ settings }: { settings: any }) {
  const [isPending, startTransition] = useTransition();
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const companyName = (formData.get("companyName") as string)?.trim();
    const phone = (formData.get("phone") as string)?.trim();
    const email = (formData.get("email") as string)?.trim();

    if (!companyName || companyName.length < 2) {
      toast.error("Company name is required (minimum 2 characters).");
      return;
    }

    if (phone) {
      const phoneCheck = validatePhone(phone);
      if (!phoneCheck.valid) {
        toast.error(phoneCheck.error);
        return;
      }
    }

    if (email) {
      const emailCheck = validateEmail(email, false);
      if (!emailCheck.valid) {
        toast.error(emailCheck.error);
        return;
      }
    }

    startTransition(async () => {
      const res = await updateGlobalSettings(formData);
      if (res?.error) {
        toast.error("Failed to update settings", { description: res.error });
      } else {
        toast.success("Settings updated successfully!", {
          description: "System preferences and details updated.",
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="companyName" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Company Name
            </Label>
            <Input id="companyName" name="companyName" defaultValue={settings?.companyName || "RCR ENTERPRISES"} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" /> Phone Number
            </Label>
            <Input id="phone" name="phone" defaultValue={settings?.phone || ""} placeholder="+91 9876543210" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> Email Address
            </Label>
            <Input id="email" name="email" type="email" defaultValue={settings?.email || ""} placeholder="info@company.com" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website" className="flex items-center gap-2">
              <Globe className="h-4 w-4" /> Website URL
            </Label>
            <Input id="website" name="website" type="url" defaultValue={settings?.website || ""} placeholder="https://www.company.com" />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Registered Address
            </Label>
            <Input id="address" name="address" defaultValue={settings?.address || ""} placeholder="Office No- 04, Raipada..." />
          </div>
        </div>

        <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-slate-800 dark:text-slate-200">
            <Bell className="h-4 w-4 text-indigo-500" /> Notifications
          </h3>
          <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <input 
              type="checkbox" 
              id="notifySupervisorLogins" 
              name="notifySupervisorLogins" 
              defaultChecked={settings?.notifySupervisorLogins ?? true}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
            />
            <Label htmlFor="notifySupervisorLogins" className="font-medium cursor-pointer flex-1">
              Receive Supervisor Login Alerts
              <p className="text-xs text-slate-500 font-normal mt-0.5">Send me an email whenever a supervisor successfully logs into the system.</p>
            </Label>
          </div>
        </div>
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </CardContent>
    </form>
  );
}
