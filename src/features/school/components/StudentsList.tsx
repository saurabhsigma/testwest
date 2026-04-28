import { useState } from "react";
import { Search, Mail, GraduationCap, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

interface StudentsListProps {
  students?: any[];
}

export function StudentsList({ students = [] }: StudentsListProps) {
  const [q, setQ] = useState("");

  const filtered = students.filter((s) =>
    `${s.name} ${s.email} ${s.grade} ${s.section}`.toLowerCase().includes(q.toLowerCase()),
  );

  if (!students || students.length === 0) {
    return (
      <div className="rounded-xl border bg-muted/10 p-8 text-center text-sm text-muted-foreground">
        No students enrolled yet. Click "Add student" to create student accounts.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search students by name, email, grade…"
          className="h-9 pl-8"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border bg-muted/10 p-8 text-center text-sm text-muted-foreground">
          No students match "{q}"
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => (
            <Card key={s.id || s._id} className="transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <Avatar className="h-11 w-11">
                    <AvatarFallback className="bg-primary-soft text-sm text-accent-foreground">
                      {initials(s.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{s.name}</p>
                    <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {s.email}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-[10px]">
                    Roll {s.rollNo || "—"}
                  </Badge>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/40 px-3 py-2">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                      <GraduationCap className="h-3 w-3" />
                      Grade
                    </div>
                    <p className="mt-0.5 text-sm font-semibold">{s.grade}</p>
                  </div>
                  <div className="rounded-lg bg-muted/40 px-3 py-2">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                      <BookOpen className="h-3 w-3" />
                      Section
                    </div>
                    <p className="mt-0.5 text-sm font-semibold">{s.section || "—"}</p>
                  </div>
                </div>

                <div className="mt-3 border-t pt-3">
                  <p className="text-xs text-muted-foreground">
                    Board: <span className="font-medium text-foreground">{s.board}</span>
                  </p>
                  {s.className && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Class: <span className="font-medium text-foreground">{s.className}</span>
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
