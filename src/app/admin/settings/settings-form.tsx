"use client";

import { useTransition } from "react";
import { updateGlobalSettings } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { CardContent } from "@/components/ui/card";
import { Building2, MapPin, Mail, Phone, Globe } from "lucide-react";
import { toast } from "sonner";

export function SettingsForm({ settings }: { settings: any }) {
  const [isPending, startTransition] = useTransition();
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateGlobalSettings(formData);
      if (res?.error) {
        toast.error("Failed to update settings", { description: res.error });
      } else {
        toast.success("Settings updated successfully!", {
          description: "Company details and letterhead profile updated.",
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardContent className="space-y-4">
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
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </CardContent>
    </form>
  );
}
