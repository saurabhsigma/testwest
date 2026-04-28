import { useState } from "react";
import { schoolService } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Loader2, Copy, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface AddStudentFormProps {
  schoolId: string;
  classes: { _id: string; grade: number; section: string }[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function AddStudentForm({ schoolId, classes, onSuccess, onCancel }: AddStudentFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(generatePassword());
  const [grade, setGrade] = useState<number>(1);
  const [board, setBoard] = useState("");
  const [classId, setClassId] = useState("");
  const [section, setSection] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ name: string; email: string; password: string } | null>(null);

  function generatePassword() {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await schoolService.createStudent(schoolId, {
        firstName,
        lastName,
        email,
        password,
        grade,
        board,
        classId: classId || undefined,
        section,
        rollNo,
      });

      setCreated({ name: result.name, email: result.email, password: result.password });
    } catch (err: any) {
      setError(err.message || "Failed to create student");
    } finally {
      setLoading(false);
    }
  };

  const copyCredentials = () => {
    if (!created) return;
    navigator.clipboard.writeText(
      `TestWest Login Credentials\nEmail: ${created.email}\nPassword: ${created.password}\nURL: ${window.location.origin}/login`
    );
    toast.success("Credentials copied to clipboard!");
  };

  // After creation — show credential card
  if (created) {
    return (
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-3 text-success">
          <CheckCircle2 className="h-5 w-5" />
          <p className="font-medium">Student account created for <strong>{created.name}</strong></p>
        </div>
        <Card className="border-success/30 bg-success/5">
          <CardContent className="p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Login Credentials to share with student</p>
            <div className="font-mono text-sm space-y-1">
              <p><span className="text-muted-foreground">Email:</span> {created.email}</p>
              <p><span className="text-muted-foreground">Password:</span> <strong>{created.password}</strong></p>
            </div>
            <p className="text-xs text-muted-foreground mt-2">⚠️ This password will not be shown again. Share it with the student immediately.</p>
          </CardContent>
        </Card>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyCredentials} className="gap-2">
            <Copy className="h-4 w-4" />
            Copy credentials
          </Button>
          <Button size="sm" onClick={onSuccess}>
            Add another student
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
          <Label htmlFor="firstName">First name</Label>
          <Input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} required placeholder="Aryan" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last name</Label>
          <Input id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} required placeholder="Chauhan" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="student@school.com" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">
          Password{" "}
          <span className="text-xs text-muted-foreground font-normal">(auto-generated, share with student)</span>
        </Label>
        <div className="flex gap-2">
          <Input id="password" value={password} onChange={e => setPassword(e.target.value)} required className="font-mono" />
          <Button type="button" variant="outline" size="sm" onClick={() => setPassword(generatePassword())} className="shrink-0">
            Regenerate
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="grade">Grade</Label>
          <Input id="grade" type="number" min={1} max={12} value={grade} onChange={e => setGrade(Number(e.target.value))} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="board">Board</Label>
          <Input id="board" value={board} onChange={e => setBoard(e.target.value)} required placeholder="CBSE" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rollNo">Roll No.</Label>
          <Input id="rollNo" value={rollNo} onChange={e => setRollNo(e.target.value)} placeholder="Optional" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="classId">Assign to Class</Label>
          <select
            id="classId"
            value={classId}
            onChange={e => setClassId(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          >
            <option value="">— No class yet —</option>
            {classes.map((cls: any) => (
              <option key={cls._id} value={cls._id}>
                Grade {cls.grade} – {cls.section}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="section">Section</Label>
          <Input id="section" value={section} onChange={e => setSection(e.target.value)} placeholder="A" />
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : "Create Student Account"}
        </Button>
      </div>
    </form>
  );
}
