import { useState } from "react";
import { schoolService } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, CheckCircle2 } from "lucide-react";

interface AddClassFormProps {
  schoolId: string;
  teachers: { _id: string; userId?: any; user?: any }[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function AddClassForm({ schoolId, teachers, onSuccess, onCancel }: AddClassFormProps) {
  const [grade, setGrade] = useState<number>(1);
  const [section, setSection] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ grade: number; section: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await schoolService.createClass(schoolId, {
        grade,
        section: section.trim(),
        teacherId: teacherId || undefined,
      });
      setCreated({ grade, section: section.trim() });
    } catch (err: any) {
      setError(err.message || "Failed to create class");
    } finally {
      setLoading(false);
    }
  };

  if (created) {
    return (
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-3 text-success">
          <CheckCircle2 className="h-5 w-5" />
          <p className="font-medium">
            Class <strong>Grade {created.grade} – {created.section}</strong> created successfully
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => { setGrade(1); setSection(""); setTeacherId(""); setError(null); setCreated(null); }}>
            Add another class
          </Button>
          <Button size="sm" variant="outline" onClick={onSuccess}>
            Done
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ac-grade">Grade</Label>
          <Input
            id="ac-grade"
            type="number"
            min={1}
            max={12}
            value={grade}
            onChange={e => setGrade(Number(e.target.value))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ac-section">Section</Label>
          <Input
            id="ac-section"
            value={section}
            onChange={e => setSection(e.target.value)}
            required
            placeholder="A"
            maxLength={10}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ac-teacher">
          Assign class teacher{" "}
          <span className="text-xs text-muted-foreground font-normal">(optional)</span>
        </Label>
        <select
          id="ac-teacher"
          value={teacherId}
          onChange={e => setTeacherId(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
        >
          <option value="">— Assign later —</option>
          {teachers.map((t: any) => {
            const name = t.user
              ? `${t.user.firstName} ${t.user.lastName}`
              : t.userId
              ? `${t.userId.firstName} ${t.userId.lastName}`
              : t._id;
            return (
              <option key={t._id} value={t._id}>
                {name}
              </option>
            );
          })}
        </select>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Class"
          )}
        </Button>
      </div>
    </form>
  );
}
