import { redirect } from "next/navigation";

export default function AdminAttendanceRedirectPage() {
  redirect("/admin/attendance/labours");
}
