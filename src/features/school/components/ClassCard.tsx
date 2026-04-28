import { ArrowRight, TrendingDown, TrendingUp, Users, Settings } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { SchoolClass } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  cls: SchoolClass;
  onSelect: () => void;
  onEdit?: () => void;
}

export function ClassCard({ cls, onSelect, onEdit }: Props) {
  const isUp = cls.trend >= 0;
  const topSubject = cls.topSubject || { subject: "N/A", score: 0 };
  const weakSubject = cls.weakSubject || { subject: "N/A", score: 0 };
  const studentCount = cls.studentCount || 0;
  const avgScore = cls.avgScore || 0;
  const teacher = cls.teacher || "Not assigned";
  
  return (
    <div className="relative group">
      {onEdit && (
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="absolute top-2 right-2 z-10 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Settings className="h-3.5 w-3.5" />
        </Button>
      )}
      <button
        type="button"
        onClick={onSelect}
        className="block w-full text-left"
      >
      <Card className="h-full transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Grade {cls.grade}
              </p>
              <h3 className="mt-0.5 text-2xl font-semibold tracking-tight">
                Class {cls.section || cls.id}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">{teacher}</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-accent-foreground">
              <Users className="h-4 w-4" />
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Students</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">{studentCount}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg score</p>
              <p className="mt-1 flex items-baseline gap-1.5 text-lg font-semibold tabular-nums">
                {avgScore}%
                <span
                  className={cn(
                    "inline-flex items-center text-[10px] font-medium",
                    isUp ? "text-success" : "text-destructive",
                  )}
                >
                  {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(cls.trend || 0)}%
                </span>
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-1.5 border-t pt-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Top subject</span>
              <span className="font-medium text-success">
                {topSubject.subject} · {topSubject.score}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Weak subject</span>
              <span className="font-medium text-destructive">
                {weakSubject.subject} · {weakSubject.score}%
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
            View students <ArrowRight className="h-3 w-3" />
          </div>
        </CardContent>
      </Card>
    </button>
    </div>
  );
}
