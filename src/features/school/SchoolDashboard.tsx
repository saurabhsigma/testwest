import { useState } from "react";
import {
  GraduationCap,
  School as SchoolIcon,
  TrendingUp,
  Users,
  BookOpen,
  Award,
  AlertTriangle,
  Briefcase,
  Loader2,
  Plus,
  ClipboardList,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageContainer } from "@/components/shell/PageContainer";
import { SectionHeader } from "@/components/shell/SectionHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { SubjectPerformanceChart } from "@/components/dashboard/SubjectPerformanceChart";
import { ClassCard } from "./components/ClassCard";
import { ClassDetail } from "./components/ClassDetail";
import { GradePerformanceChart } from "./components/GradePerformanceChart";
import { SubjectRanking } from "./components/SubjectRanking";
import { TeachersList } from "./components/TeachersList";
import { AssignmentTable } from "../teacher/components/AssignmentTable";
import {
  useUser,
  useSchool,
  useSchoolStats,
  useSchoolClasses,
  useSchoolTeachers,
  useSchoolStudents,
  useAssignments,
} from "@/lib/api/hooks";
import { AddTeacherForm } from "./components/AddTeacherForm";
import { AddStudentForm } from "./components/AddStudentForm";
import { AddClassForm } from "./components/AddClassForm";
import { StudentsList } from "./components/StudentsList";
import { EditClassForm } from "./components/EditClassForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

export function SchoolDashboard() {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAddClass, setShowAddClass] = useState(false);
  const [editingClass, setEditingClass] = useState<any | null>(null);
  const queryClient = useQueryClient();
  
  const { data: user } = useUser();
  const schoolId = user?.schoolId || user?.profile?.schoolId || "";
  
  const { data: school, isLoading: schoolLoading } = useSchool(schoolId);
  const { data: stats, isLoading: statsLoading } = useSchoolStats(schoolId);
  const { data: classes, isLoading: classesLoading } = useSchoolClasses(schoolId);
  const { data: teachersList, isLoading: teachersLoading, refetch: refetchTeachers } = useSchoolTeachers(schoolId);
  const { data: studentsList, isLoading: studentsLoading } = useSchoolStudents(schoolId);
  const { data: assignments = [], isLoading: assignmentsLoading } = useAssignments({ schoolId });

  const subjects: any[] = (stats?.subjectPerformance || []).filter((s: any) => s && s.subject);
  const gradeData: any[] = stats?.gradePerformance || [];

  const displayStats = stats || {
    totalStudents: 0,
    totalClasses: 0,
    totalTests: 0,
    averageScore: 0,
    attendance: 0,
    bestSubject: { subject: "N/A", averageScore: 0 },
    weakSubject: { subject: "N/A", averageScore: 0 },
  };

  // Ensure bestSubject and weakSubject have valid structure
  if (!displayStats.bestSubject || !displayStats.bestSubject.subject) {
    displayStats.bestSubject = { subject: "N/A", averageScore: 0 };
  }
  if (!displayStats.weakSubject || !displayStats.weakSubject.subject) {
    displayStats.weakSubject = { subject: "N/A", averageScore: 0 };
  }

  if (schoolLoading || statsLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center flex-col gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Loading institutional data...</p>
      </div>
    );
  }

  if (!school && !schoolLoading) {
    return (
      <PageContainer>
        <Card className="flex flex-col items-center justify-center py-20 px-6 text-center border-dashed border-2">
          <div className="bg-primary/10 p-5 rounded-full mb-6">
            <SchoolIcon className="h-12 w-12 text-primary opacity-70" />
          </div>
          <h2 className="text-3xl font-bold mb-3 tracking-tight">Register your institution</h2>
          <p className="text-muted-foreground max-w-md mb-10 text-lg leading-relaxed">
            Welcome to TestWest! To start managing classes and teachers, you'll first need to set up your school profile.
          </p>
          <Button size="lg" asChild className="h-14 px-10 text-lg shadow-xl hover:shadow-primary/20 transition-all">
            <a href="/schools/new">
              <Plus className="mr-2 h-6 w-6" />
              Get started
            </a>
          </Button>
        </Card>
      </PageContainer>
    );
  }

  if (selectedClassId) {
    return (
      <ClassDetail
        classId={selectedClassId}
        onBack={() => setSelectedClassId(null)}
      />
    );
  }

  return (
    <PageContainer>
      {/* Welcome */}
      <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-primary-soft/60 via-background to-background">
        <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-accent-foreground">
              School overview
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
              {school?.name}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {school?.board} · {school?.city} · Principal: {school?.principal}
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <SchoolIcon className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Academic year</p>
              <p className="text-sm font-semibold whitespace-nowrap">2024–25 · Term 2</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Total students" value={displayStats.totalStudents} icon={Users} hint={`${displayStats.totalClasses} classes`} />
        <StatCard label="Teachers" value={teachersList?.length || 0} icon={Briefcase} hint="On TestWest" />
        <StatCard label="Average score" value={`${displayStats.averageScore}%`} icon={TrendingUp} hint="School-wide" />
        <StatCard label="Tests taken" value={displayStats.totalTests} icon={BookOpen} hint="This term" />
        <StatCard label="Attendance" value={`${displayStats.attendance}%`} icon={GraduationCap} hint="Avg this month" />
      </div>

      {/* Best vs weak subject */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="border-success/20 bg-success/5 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/15 text-success">
              <Award className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Best performing subject</p>
              <p className="mt-1 text-lg font-semibold truncate">{displayStats.bestSubject.subject}</p>
              <p className="text-sm text-muted-foreground">
                Avg <span className="font-medium text-success">{displayStats.bestSubject.averageScore}%</span> across all classes
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-destructive/20 bg-destructive/5 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
              <AlertTriangle className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Needs attention</p>
              <p className="mt-1 text-lg font-semibold truncate">{displayStats.weakSubject.subject}</p>
              <p className="text-sm text-muted-foreground">
                Avg <span className="font-medium text-destructive">{displayStats.weakSubject.averageScore}%</span> — focus area
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          title="Performance by grade"
          subtitle="Average score per grade level"
          className="lg:col-span-2"
        >
          <GradePerformanceChart data={gradeData} />
        </ChartCard>
        <ChartCard title="Subjects" subtitle="School-wide averages">
          <SubjectPerformanceChart data={subjects} />
        </ChartCard>
      </div>

      {/* Subject ranking */}
      <div className="mt-8">
        <SectionHeader
          title="Subjects ranked"
          subtitle="Strongest to weakest across the school"
        />
        <SubjectRanking subjects={subjects} />
      </div>

      {/* Classes & Teachers tabs */}
      <Tabs defaultValue="classes" className="mt-8">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="classes" className="px-6">Classes</TabsTrigger>
          <TabsTrigger value="students" className="px-6">Students</TabsTrigger>
          <TabsTrigger value="teachers" className="px-6">Teachers</TabsTrigger>
          <TabsTrigger value="assignments" className="px-6">
            <ClipboardList className="h-4 w-4 mr-1.5" />
            Tests & Results
          </TabsTrigger>
        </TabsList>
        <TabsContent value="classes" className="mt-6">
          <SectionHeader
            title="Institutional classes"
            subtitle="Monitor student progress and analytics per grade/section"
          >
            <Dialog open={showAddClass} onOpenChange={(open) => { setShowAddClass(open); if (!open) queryClient.invalidateQueries({ queryKey: ["schoolClasses", schoolId] }); }}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2 shadow-sm">
                  <Plus className="h-4 w-4" />
                  Add class
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle>Create New Class</DialogTitle>
                </DialogHeader>
                <AddClassForm
                  schoolId={schoolId}
                  teachers={teachersList || []}
                  onSuccess={() => {
                    setShowAddClass(false);
                    queryClient.invalidateQueries({ queryKey: ["schoolClasses", schoolId] });
                  }}
                  onCancel={() => setShowAddClass(false)}
                />
              </DialogContent>
            </Dialog>
          </SectionHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(classes || []).map((cls: any) => (
              <ClassCard 
                key={cls.id || cls._id} 
                cls={cls} 
                onSelect={() => setSelectedClassId(cls.id || cls._id)}
                onEdit={() => setEditingClass(cls)}
              />
            ))}
            {(!classes || classes.length === 0) && (
              <div className="col-span-full py-12 text-center text-muted-foreground border rounded-xl bg-muted/20">
                No classes added yet.
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="students" className="mt-6">
          <SectionHeader
            title="Enrolled students"
            subtitle={`${displayStats.totalStudents} students across all classes`}
          >
            <Dialog open={showAddStudent} onOpenChange={(open) => {
              setShowAddStudent(open);
              if (!open) {
                queryClient.invalidateQueries({ queryKey: ["schoolStats", schoolId] });
                queryClient.invalidateQueries({ queryKey: ["schoolClasses", schoolId] });
                queryClient.invalidateQueries({ queryKey: ["schoolStudents", schoolId] });
                queryClient.invalidateQueries({ queryKey: ["school"] }); // Invalidate all class student queries
              }
            }}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2 shadow-sm">
                  <Plus className="h-4 w-4" />
                  Add student
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create Student Account</DialogTitle>
                </DialogHeader>
                <AddStudentForm
                  schoolId={schoolId}
                  classes={classes || []}
                  onSuccess={() => {
                    setShowAddStudent(false);
                  }}
                  onCancel={() => setShowAddStudent(false)}
                />
              </DialogContent>
            </Dialog>
          </SectionHeader>
          <StudentsList students={studentsList} />
        </TabsContent>
        <TabsContent value="teachers" className="mt-6">
          <SectionHeader
            title="Academic faculty"
            subtitle={`${teachersList?.length || 0} registered teachers`}
          >
            <Dialog open={showAddTeacher} onOpenChange={(open) => { setShowAddTeacher(open); if (!open) refetchTeachers(); }}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2 shadow-sm">
                  <Plus className="h-4 w-4" />
                  Onboard teacher
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Teacher</DialogTitle>
                </DialogHeader>
                <AddTeacherForm 
                    schoolId={schoolId}
                    classes={classes || []}
                    onSuccess={() => {
                        setShowAddTeacher(false);
                        refetchTeachers();
                    }}
                    onCancel={() => setShowAddTeacher(false)}
                />
              </DialogContent>
            </Dialog>
          </SectionHeader>
          <TeachersList teachers={teachersList} />
        </TabsContent>

        <TabsContent value="assignments" className="mt-6">
          <SectionHeader
            title="Tests & Results"
            subtitle="View all assigned tests and student scores"
          />
          {assignmentsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : assignments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <ClipboardList className="h-12 w-12 text-muted-foreground mb-3" />
                <h3 className="font-medium mb-1">No tests assigned yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Teachers can assign tests to classes. Results will appear here once students complete them.
                </p>
              </CardContent>
            </Card>
          ) : (
            <AssignmentTable assignments={assignments} />
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Class Dialog */}
      <Dialog open={!!editingClass} onOpenChange={(open) => { if (!open) setEditingClass(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
          </DialogHeader>
          {editingClass && (
            <EditClassForm
              schoolId={schoolId}
              classData={editingClass}
              teachers={teachersList || []}
              onSuccess={() => {
                setEditingClass(null);
                queryClient.invalidateQueries({ queryKey: ["schoolClasses", schoolId] });
              }}
              onCancel={() => setEditingClass(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
