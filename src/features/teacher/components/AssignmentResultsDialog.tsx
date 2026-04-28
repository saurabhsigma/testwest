import { useState } from "react";
import { Loader2, Trophy, Users, CheckCircle2, Clock, AlertCircle, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { useAssignmentResults } from "@/lib/api/hooks";
import { cn } from "@/lib/utils";

interface Props {
  assignmentId: string | null;
  onClose: () => void;
}

const statusStyles: Record<string, { bg: string; text: string }> = {
  Completed: { bg: "bg-success/15", text: "text-success" },
  "In progress": { bg: "bg-warning/20", text: "text-warning-foreground" },
  Pending: { bg: "bg-muted", text: "text-muted-foreground" },
};

function scoreClass(score: number) {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-foreground";
  if (score >= 40) return "text-warning-foreground";
  return "text-destructive";
}

export function AssignmentResultsDialog({ assignmentId, onClose }: Props) {
  const { data, isLoading } = useAssignmentResults(assignmentId || "");
  const [sortBy, setSortBy] = useState<"name" | "score" | "status">("score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  if (!assignmentId) return null;

  const toggleSort = (key: typeof sortBy) => {
    if (sortBy === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  };

  const sortedStudents = [...(data?.students || [])].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    switch (sortBy) {
      case "name":
        return a.studentName.localeCompare(b.studentName) * dir;
      case "score":
        return ((a.score || 0) - (b.score || 0)) * dir;
      case "status":
        const order = { Completed: 3, "In progress": 2, Pending: 1 };
        return ((order[a.status as keyof typeof order] || 0) - (order[b.status as keyof typeof order] || 0)) * dir;
      default:
        return 0;
    }
  });

  return (
    <Dialog open={!!assignmentId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            {data?.assignment?.title || "Assignment Results"}
          </DialogTitle>
          <DialogDescription>
            {data?.assignment?.subject} · {data?.assignment?.chapter || "General"} · {data?.assignment?.difficulty} · {data?.assignment?.questionCount} questions
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : data ? (
          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg border bg-card p-3">
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Users className="h-3.5 w-3.5" />
                  Total Students
                </div>
                <p className="mt-1 text-xl font-semibold">{data.summary.totalStudents}</p>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  Completed
                </div>
                <p className="mt-1 text-xl font-semibold text-success">{data.summary.completed}</p>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Avg Score
                </div>
                <p className={cn("mt-1 text-xl font-semibold", scoreClass(data.summary.averageScore))}>
                  {data.summary.averageScore}%
                </p>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Clock className="h-3.5 w-3.5 text-warning" />
                  In Progress
                </div>
                <p className="mt-1 text-xl font-semibold">{data.summary.inProgress}</p>
              </div>
            </div>

            {/* Completion Progress */}
            <div className="rounded-lg border bg-card p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Completion</span>
                <span className="text-xs text-muted-foreground">
                  {data.summary.completed} of {data.summary.totalStudents} completed
                </span>
              </div>
              <Progress 
                value={data.summary.totalStudents > 0 ? (data.summary.completed / data.summary.totalStudents) * 100 : 0} 
                className="h-2"
              />
            </div>

            {/* Student Results Table */}
            <ScrollArea className="flex-1 rounded-lg border">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="w-[200px]">
                      <button 
                        onClick={() => toggleSort("name")}
                        className="flex items-center gap-1 hover:text-foreground"
                      >
                        Student
                        {sortBy === "name" && (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button 
                        onClick={() => toggleSort("status")}
                        className="flex items-center gap-1 hover:text-foreground"
                      >
                        Status
                        {sortBy === "status" && (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                      </button>
                    </TableHead>
                    <TableHead className="text-right">
                      <button 
                        onClick={() => toggleSort("score")}
                        className="flex items-center gap-1 ml-auto hover:text-foreground"
                      >
                        Score
                        {sortBy === "score" && (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                      </button>
                    </TableHead>
                    <TableHead className="text-right">Accuracy</TableHead>
                    <TableHead className="text-right">Questions</TableHead>
                    <TableHead>Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No students have been assigned this test yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedStudents.map((student) => (
                      <Collapsible key={student.testId} asChild>
                        <>
                          <TableRow className="group">
                            <TableCell>
                              <div>
                                <p className="font-medium">{student.studentName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {student.rollNo && `Roll: ${student.rollNo} · `}
                                  {student.grade && `Grade ${student.grade}`}
                                  {student.section && ` ${student.section}`}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "font-normal",
                                  statusStyles[student.status]?.bg,
                                  statusStyles[student.status]?.text
                                )}
                              >
                                {student.status}
                              </Badge>
                            </TableCell>
                            <TableCell className={cn("text-right font-semibold tabular-nums", scoreClass(student.score || 0))}>
                              {student.status === "Completed" ? `${student.score}%` : "—"}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-muted-foreground">
                              {student.status === "Completed" ? `${student.accuracy}%` : "—"}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-muted-foreground">
                              {student.questionsCorrect}/{student.questionsTotal}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {student.submittedAt 
                                ? new Date(student.submittedAt).toLocaleDateString(undefined, { 
                                    month: "short", 
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  })
                                : "—"}
                            </TableCell>
                          </TableRow>
                        </>
                      </Collapsible>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>

            {/* Score Distribution */}
            {data.summary.completed > 0 && (
              <div className="rounded-lg border bg-card p-3">
                <p className="text-sm font-medium mb-2">Score Range</p>
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Highest:</span>{" "}
                    <span className="font-semibold text-success">{data.summary.highestScore}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Lowest:</span>{" "}
                    <span className="font-semibold text-destructive">{data.summary.lowestScore}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Avg Accuracy:</span>{" "}
                    <span className="font-semibold">{data.summary.averageAccuracy}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Failed to load results</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
