import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useUser } from "@/lib/api/hooks";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardIndex,
});

function DashboardIndex() {
  const { data: user, isLoading } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      // Redirect to login if not authenticated
      if (!user) {
        navigate({ to: "/login" });
        return;
      }

      // Redirect to role-specific dashboard
      const roleToPath: Record<string, string> = {
        STUDENT: "/dashboard/student",
        SOLO: "/dashboard/solo",
        PARENT: "/dashboard/parent",
        TEACHER: "/dashboard/teacher",
        SCHOOL: "/dashboard/school",
      };
      
      const path = roleToPath[user.role] || "/dashboard/student";
      navigate({ to: path });
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
