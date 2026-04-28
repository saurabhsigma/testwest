import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Calendar, ClipboardList, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  useUser,
  useTeacherStudents,
  useTeacherClasses,
} from "@/lib/api/hooks";
import { assignmentService } from "@/services/api";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

type Mode = "class" | "students";

export function AssignTestDialog({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const { data: user } = useUser();
  const profileId = user?.profile?._id || user?.profile?.id || "";
  const schoolId = user?.schoolId || user?.profile?.schoolId || "";
  
  const { data: myStudents = [], isLoading: studentsLoading } = useTeacherStudents(profileId);
  const { data: myClasses = [], isLoading: classesLoading } = useTeacherClasses(profileId);
  
  const [mode, setMode] = useState<Mode>("class");
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [chapter, setChapter] = useState("");
  const [questionCount, setQuestionCount] = useState("10");
  const [difficulty, setDifficulty] = useState("Medium");
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  );
  
  const [classIds, setClassIds] = useState<string[]>([]);
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [studentQuery, setStudentQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Set initial subject from profile
  useEffect(() => {
    if (user?.profile?.subjects?.length && !subject) {
      setSubject(user.profile.subjects[0]);
    }
  }, [user]);

  // Auto-select first class if available
  useEffect(() => {
    if (myClasses.length && !classIds.length) {
      setClassIds([myClasses[0]._id || myClasses[0].id]);
    }
  }, [myClasses]);

  const targetCount = useMemo(() => {
    if (mode === "class") {
      // Count students in selected classes
      return myClasses
        .filter((c: any) => classIds.includes(c._id || c.id))
        .reduce((sum: number, c: any) => sum + (c.studentCount || 0), 0);
    }
    return studentIds.length;
  }, [mode, classIds, studentIds, myClasses]);

  const filteredStudents = useMemo(() => {
    const q = studentQuery.toLowerCase();
    return (myStudents || []).filter((s: any) =>
      `${s.name || ''} ${s.firstName || ''} ${s.lastName || ''} ${s.rollNo || ""}`.toLowerCase().includes(q),
    );
  }, [myStudents, studentQuery]);

  function reset() {
    setTitle("");
    setChapter("");
    setQuestionCount("10");
    setDifficulty("Medium");
    setMode("class");
    if (myClasses.length) {
      setClassIds([myClasses[0]._id || myClasses[0].id]);
    } else {
      setClassIds([]);
    }
    setStudentIds([]);
    setStudentQuery("");
  }

  async function handleAssign() {
    if (!title.trim()) {
      toast.error("Please enter a test title");
      return;
    }
    if (targetCount === 0) {
      toast.error("Please select at least one recipient");
      return;
    }
    if (!subject) {
      toast.error("Please select a subject");
      return;
    }

    setSubmitting(true);
    
    try {
      // Build target label
      let targetLabel = "";
      if (mode === "class") {
        const selectedClasses = myClasses.filter((c: any) => classIds.includes(c._id || c.id));
        targetLabel = selectedClasses.map((c: any) => c.name).join(", ");
      } else {
        targetLabel = `${studentIds.length} selected students`;
      }

      // Create assignment
      await assignmentService.create({
        teacherId: profileId,
        schoolId: schoolId || undefined,
        title,
        subject,
        chapter: chapter || undefined,
        questionCount: parseInt(questionCount, 10),
        difficulty,
        dueDate,
        target: {
          type: mode,
          classIds: mode === "class" ? classIds : undefined,
          studentIds: mode === "students" ? studentIds : undefined,
          targetLabel,
        },
      });

      toast.success("Test assigned!", {
        description: `"${title}" sent to ${targetCount} student${targetCount > 1 ? "s" : ""}.`,
      });

      // Invalidate assignments query
      queryClient.invalidateQueries({ queryKey: ["assignments"] });

      onOpenChange(false);
      reset();
    } catch (err: any) {
      toast.error("Failed to assign test", {
        description: err.message || "Please try again",
      });
    } finally {
      setSubmitting(false);
    }
  }

  function toggle<T>(value: T, list: T[], set: (v: T[]) => void) {
    set(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  }

  const isLoading = classesLoading || studentsLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Assign a new test
          </DialogTitle>
          <DialogDescription>
            Configure the test and choose who should receive it.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Test title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Algebra Practice Set 4"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Subject</Label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>
                    {(user?.profile?.subjects || []).map((s: string) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Chapter (optional)</Label>
                <Input
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value)}
                  placeholder="e.g., Quadratic Equations"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Questions</Label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Difficulty</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Due date
                </Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Assign to</Label>
              <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
                <TabsList className="w-full">
                  <TabsTrigger value="class" className="flex-1">By Class</TabsTrigger>
                  <TabsTrigger value="students" className="flex-1">Individual Students</TabsTrigger>
                </TabsList>

                <TabsContent value="class" className="mt-3">
                  {myClasses.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                      <p>No classes assigned to you yet.</p>
                      <p className="mt-1 text-xs">Ask your school admin to assign you to classes.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {myClasses.map((c: any) => (
                        <label
                          key={c._id || c.id}
                          className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 hover:bg-muted/50"
                        >
                          <Checkbox
                            checked={classIds.includes(c._id || c.id)}
                            onCheckedChange={() => toggle(c._id || c.id, classIds, setClassIds)}
                          />
                          <div className="min-w-0">
                            <span className="text-sm font-medium block truncate">{c.name}</span>
                            <span className="text-xs text-muted-foreground">{c.studentCount || 0} students</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="students" className="mt-3 space-y-2">
                  <Input
                    value={studentQuery}
                    onChange={(e) => setStudentQuery(e.target.value)}
                    placeholder="Search students…"
                    className="h-9"
                  />
                  {filteredStudents.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                      {myStudents.length === 0 
                        ? "No students in your classes yet." 
                        : "No students match your search."}
                    </div>
                  ) : (
                    <ScrollArea className="h-56 rounded-lg border">
                      <div className="divide-y">
                        {filteredStudents.map((s: any) => (
                          <label
                            key={s.id || s._id}
                            className="flex cursor-pointer items-center justify-between gap-3 p-2.5 hover:bg-muted/50"
                          >
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={studentIds.includes(s.id || s._id)}
                                onCheckedChange={() => toggle(s.id || s._id, studentIds, setStudentIds)}
                              />
                              <div>
                                <p className="text-sm font-medium">{s.name || `${s.firstName} ${s.lastName}`}</p>
                                <p className="text-xs text-muted-foreground">
                                  Grade {s.grade} · {s.section || ""}
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {s.avgScore || 0}%
                            </Badge>
                          </label>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <span className="font-medium">{targetCount}</span>{" "}
              <span className="text-muted-foreground">
                student{targetCount === 1 ? "" : "s"} will receive this test.
              </span>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={submitting || isLoading || targetCount === 0}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              "Assign test"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
