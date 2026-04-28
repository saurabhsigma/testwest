import { useState } from "react";
import { schoolService } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Loader2, Copy, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface AddTeacherFormProps {
  schoolId: string;
  classes: { _id: string; grade: number; section: string }[];
  onSuccess: () => void;
  onCancel: () => void;
}

function generatePassword() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export function AddTeacherForm({ schoolId, classes, onSuccess, onCancel }: AddTeacherFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(generatePassword());
  const [subjects, setSubjects] = useState("");
  const [classIds, setClassIds] = useState<string[]>([]);
  const [experienceYears, setExperienceYears] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ name: string; email: string; password: string } | null>(null);

  const toggleClass = (id: string) => {
    setClassIds(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await schoolService.createTeacher(schoolId, {
        firstName,
        lastName,
        email,
        password,
        subjects: subjects.split(",").map(s => s.trim()).filter(Boolean),
        classIds,
        experienceYears,
      });

      setCreated({ name: result.name, email: result.email, password: result.password });
    } catch (err: any) {
      setError(err.message || "Failed to create teacher");
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

  const handleAddAnother = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword(generatePassword());
    setSubjects("");
    setClassIds([]);
    setExperienceYears(0);
    setError(null);
    setCreated(null);
  };

  // After creation — show credential card
  if (created) {
    return (
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-3 text-success">
          <CheckCircle2 className="h-5 w-5" />
          <p className="font-medium">Teacher account created for <strong>{created.name}</strong></p>
        </div>
        <Card className="border-success/30 bg-success/5">
          <CardContent className="p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Login Credentials to share with teacher</p>
            <div className="font-mono text-sm space-y-1">
              <p><span className="text-muted-foreground">Email:</span> {created.email}</p>
              <p><span className="text-muted-foreground">Password:</span> <strong>{created.password}</strong></p>
            </div>
            <p className="text-xs text-muted-foreground mt-2">⚠️ This password will not be shown again. Share it with the teacher immediately.</p>
          </CardContent>
        </Card>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyCredentials} className="gap-2">
            <Copy className="h-4 w-4" />
            Copy credentials
          </Button>
          <Button size="sm" onClick={handleAddAnother}>
            Add another teacher
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
          <Label htmlFor="tf-firstName">First name</Label>
          <Input id="tf-firstName" value={firstName} onChange={e => setFirstName(e.target.value)} required placeholder="John" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tf-lastName">Last name</Label>
          <Input id="tf-lastName" value={lastName} onChange={e => setLastName(e.target.value)} required placeholder="Doe" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tf-email">Email</Label>
        <Input id="tf-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="teacher@school.com" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tf-password">
          Password{" "}
          <span className="text-xs text-muted-foreground font-normal">(auto-generated, share with teacher)</span>
        </Label>
        <div className="flex gap-2">
          <Input id="tf-password" value={password} onChange={e => setPassword(e.target.value)} required className="font-mono" />
          <Button type="button" variant="outline" size="sm" onClick={() => setPassword(generatePassword())} className="shrink-0">
            Regenerate
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tf-subjects">Subjects <span className="text-xs text-muted-foreground font-normal">(comma-separated)</span></Label>
          <Input id="tf-subjects" value={subjects} onChange={e => setSubjects(e.target.value)} placeholder="Mathematics, Physics" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tf-exp">Years of experience</Label>
          <Input id="tf-exp" type="number" min={0} value={experienceYears} onChange={e => setExperienceYears(Number(e.target.value))} />
        </div>
      </div>

      {classes.length > 0 && (
        <div className="space-y-2">
          <Label>Assign to classes <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
          <div className="flex flex-wrap gap-2">
            {classes.map((cls: any) => (
              <button
                key={cls._id}
                type="button"
                onClick={() => toggleClass(cls._id)}
                className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                  classIds.includes(cls._id)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-input hover:border-primary"
                }`}
              >
                Grade {cls.grade} – {cls.section}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : "Create Teacher Account"}
        </Button>
      </div>
    </form>
  );
}
