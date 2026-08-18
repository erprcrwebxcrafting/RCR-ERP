"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteQuotationAction } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ClientQuotationActions({ id, status }: { id: string; status: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleEditClick = (e: React.MouseEvent) => {
    if (status !== "DRAFT") {
      e.preventDefault();
      toast.error("Cannot edit a quotation that has already been sent to the client.");
    }
  };

  const handleDelete = () => {
    if (status !== "DRAFT") {
      toast.error("Cannot delete a quotation that has already been sent to the client.");
      return;
    }

    if (confirm("Are you sure you want to delete this quotation?")) {
      startTransition(async () => {
        try {
          await deleteQuotationAction(id);
          toast.success("Quotation deleted successfully.");
          router.refresh();
        } catch (error: any) {
          toast.error(error.message || "Failed to delete quotation.");
        }
      });
    }
  };

  return (
    <>
      <Link href={`/admin/quotations/${id}/edit`} onClick={handleEditClick}>
        <Button variant="outline" size="sm" className="h-8 font-medium hover:bg-indigo-50 hover:text-indigo-600 border-indigo-200 text-indigo-600">
          Edit
        </Button>
      </Link>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={isPending}
        onClick={handleDelete}
        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </>
  );
}
