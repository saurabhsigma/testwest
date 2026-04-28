import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { TeacherDashboard } from "@/features/teacher/TeacherDashboard";
import { useUser } from "@/lib/api/hooks";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/dashboard/teacher")({
  head: () => ({
    meta: [
      { title: "Teacher Dashboard — TestWest" },
      {
        name: "description",
        content:
          "TestWest teacher dashboard: manage classes, students, assignments, and subject analytics.",
      },
      { property: "og:title", content: "Teacher Dashboard — TestWest" },
      {
        property: "og:description",
        content:
          "Assign tests to classes, students, or groups and track performance across your students.",
      },
    ],
  }),
  component: TeacherDashboardRoute,
});

function TeacherDashboardRoute() {
  const navigate = useNavigate();
  const { data: user, isLoading } = useUser();

  // Redirect to login if not authenticated, or to correct dashboard if wrong role
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate({ to: "/login" });
      } else if (user.role !== "TEACHER") {
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

  if (!user || user.role !== "TEACHER") return null;

  return (
    <AppShell
      title="Teacher dashboard"
      subtitle={user?.profile?.subjects ? `${user.profile.subjects.join(", ")} · Classes ${user.profile.classIds?.join(", ") || ""}` : "Classroom overview"}
      role="TEACHER"
      userName={user ? `${user.firstName} ${user.lastName}` : "Guest"}
    >
      <TeacherDashboard />
    </AppShell>
  );
}
