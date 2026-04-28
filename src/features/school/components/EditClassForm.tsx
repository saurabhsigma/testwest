import { useState } from "react";
import { schoolService } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";

interface EditClassFormProps {
  schoolId: string;
  classData: any;
  teachers: { _id: string; userId?: any; user?: any }[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function EditClassForm({ schoolId, classData, teachers, onSuccess, onCancel }: EditClassFormProps) {
  const [teacherId, setTeacherId] = useState(classData.teacherId?._id || classData.teacherId || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await schoolService.updateClass(schoolId, classData._id, {
        teacherId: teacherId || undefined,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to update class");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Class</span>
          <span className="text-sm font-semibold">Grade {classData.grade} – Section {classData.section}</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Students</span>
          <span className="text-sm font-semibold">{classData.studentCount || 0}</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ec-teacher">Assign class teacher</Label>
        <select
          id="ec-teacher"
          value={teacherId}
          onChange={e => setTeacherId(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
        >
          <option value="">— No teacher assigned —</option>
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
        <p className="text-xs text-muted-foreground">
          Teachers can create and assign tests to their classes.
        </p>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            "Update Class"
          )}
        </Button>
      </div>
    </form>
  );
}
