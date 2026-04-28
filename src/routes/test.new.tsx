import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { TestCreationWizard } from "@/features/test-creation/TestCreationWizard";
import { useUser } from "@/lib/api/hooks";
import { Loader2, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/shell/PageContainer";


export const Route = createFileRoute("/test/new")({
  head: () => ({
    meta: [
      { title: "Create a Test — TestWest" },
      {
        name: "description",
        content:
          "Build a focused practice test on TestWest by board, grade, subject, chapter, topic, question types, difficulty, and count.",
      },
      { property: "og:title", content: "Create a Test — TestWest" },
      {
        property: "og:description",
        content:
          "Build a focused practice test by board, grade, subject, chapter, topic, and difficulty.",
      },
    ],
  }),
  component: NewTestRoute,
});

function NewTestRoute() {
  const navigate = useNavigate();
  const { data: user, isLoading } = useUser();
  
  // Check if student is connected to a school
  const isSchoolConnected = user?.role === "STUDENT" && (!!user?.profile?.schoolId || !!user?.schoolId);

  useEffect(() => {
    // Redirect non-logged-in users
    if (!isLoading && !user) {
      navigate({ to: "/login" });
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Block school-connected students from creating tests
  if (isSchoolConnected) {
    return (
      <AppShell
        title="Access Restricted"
        subtitle="Test creation not available"
        role={user?.role || "STUDENT"}
        userName={user ? `${user.firstName} ${user.lastName}` : "Guest"}
      >
        <PageContainer>
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
                <ShieldAlert className="h-7 w-7" />
              </span>
              <h2 className="text-xl font-semibold">Test Creation Not Available</h2>
              <p className="max-w-md text-sm text-muted-foreground">
                As a school-connected student, you can only take tests assigned by your teachers. 
                Check your dashboard for assigned tests.
              </p>
              <div className="flex gap-3 mt-2">
                <Button onClick={() => navigate({ to: "/tests" })}>View Assigned Tests</Button>
                <Button variant="outline" onClick={() => navigate({ to: "/dashboard" })}>Go to Dashboard</Button>
              </div>
            </CardContent>
          </Card>
        </PageContainer>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Create new test"
      subtitle="9-step wizard · Choose your focus"
      role={user?.role || "STUDENT"}
      userName={user ? `${user.firstName} ${user.lastName}` : "Guest"}
    >
      <TestCreationWizard />
    </AppShell>
  );
}
