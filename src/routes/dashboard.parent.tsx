import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { ParentDashboard } from "@/features/parent/ParentDashboard";
import { useUser } from "@/lib/api/hooks";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/dashboard/parent")({
  head: () => ({
    meta: [
      { title: "Parent Dashboard — TestWest" },
      {
        name: "description",
        content:
          "TestWest parent dashboard: monitor your child's progress, weak areas, and recent activity.",
      },
      { property: "og:title", content: "Parent Dashboard — TestWest" },
      {
        property: "og:description",
        content:
          "Monitor your child's progress, weak areas, and recent activity on TestWest.",
      },
    ],
  }),
  component: ParentDashboardRoute,
});

function ParentDashboardRoute() {
  const navigate = useNavigate();
  const { data: user, isLoading } = useUser();

  // Redirect to login if not authenticated, or to correct dashboard if wrong role
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate({ to: "/login" });
      } else if (user.role !== "PARENT") {
        navigate({ to: "/dashboard" });
      }
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.role !== "PARENT") return null;

  return (
    <AppShell
      title="Parent dashboard"
      subtitle="Linked children · Performance overview"
      role={user?.role || "PARENT"}
      userName={user ? `${user.firstName} ${user.lastName}` : "Guest"}
    >
      <ParentDashboard />
    </AppShell>
  );
}
