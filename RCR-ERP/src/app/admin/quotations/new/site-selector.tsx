"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function SiteSelector({ sites }: { sites: { id: string; projectName: string; client: { name: string } }[] }) {
  const [siteId, setSiteId] = useState("");
  const router = useRouter();

  const handleContinue = () => {
    if (siteId) {
      router.push(`/admin/sites/${siteId}/quotations/new`);
    }
  };

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Select a Site</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <select 
          className="flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
          value={siteId}
          onChange={(e) => setSiteId(e.target.value)}
        >
          <option value="">Choose a site...</option>
          {sites.map(s => (
            <option key={s.id} value={s.id}>{s.projectName} ({s.client.name})</option>
          ))}
        </select>
        <Button onClick={handleContinue} disabled={!siteId}>Continue to Quotation Form</Button>
      </CardContent>
    </Card>
  );
}
