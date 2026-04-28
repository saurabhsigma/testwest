import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { SoloDashboard } from "@/features/solo/SoloDashboard";
import { useUser } from "@/lib/api/hooks";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/dashboard/solo")({
  head: () => ({
    meta: [
      { title: "Solo Learner — TestWest" },
      {
        name: "description",
        content:
          "TestWest solo learner dashboard: auto-generated tests, self-created practice, and progress tracking — no school required.",
      },
      { property: "og:title", content: "Solo Learner — TestWest" },
      {
        property: "og:description",
        content:
          "Independent learners get auto-generated weekly tests, custom practice, and clear progress insights on TestWest.",
      },
    ],
  }),
  component: SoloDashboardRoute,
});

function SoloDashboardRoute() {
  const navigate = useNavigate();
  const { data: user, isLoading } = useUser();

  // Redirect to login if not authenticated, or to correct dashboard if wrong role
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate({ to: "/login" });
      } else if (user.role !== "SOLO") {
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

  if (!user || user.role !== "SOLO") return null;

  return (
    <AppShell
      title="Solo dashboard"
      subtitle={user?.profile ? `Grade ${user.profile.grade} · Independent learner` : "Independent learner"}
      role="SOLO"
      userName={user ? `${user.firstName} ${user.lastName}` : "Guest"}
    >
      <SoloDashboard />
    </AppShell>
  );
}
