import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Company & system configuration.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Company Details</CardTitle></CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          <p>RCR Enterprises</p>
          <p>GST No. 27CIMPR8276H1ZF</p>
          <p>rcrenterprises786@gmail.com · +91 9619439243</p>
          <p className="pt-2 text-xs">Editable company-profile settings, WhatsApp/Email credentials and audit-log viewer are planned for Phase 4.</p>
        </CardContent>
      </Card>
    </div>
  );
}
