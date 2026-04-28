import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { parentService } from "@/services/api";
import { toast } from "sonner";
import { Loader2, Search, UserCheck, GraduationCap, BookOpen, Target, CheckCircle2, AlertCircle } from "lucide-react";

interface StudentPreview {
  found: boolean;
  studentId: string;
  name: string;
  email: string;
  grade: number;
  board: string;
  testsCompleted: number;
  averageScore: number;
}

interface LinkChildDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentId: string;
  onSuccess: () => void;
}

export function LinkChildDialog({ open, onOpenChange, parentId, onSuccess }: LinkChildDialogProps) {
  const [step, setStep] = useState<"search" | "verify" | "success">("search");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [studentPreview, setStudentPreview] = useState<StudentPreview | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!studentEmail.trim()) {
      setError("Please enter the student's email address");
      return;
    }
    
    setError("");
    setIsSearching(true);
    
    try {
      const result = await parentService.verifyStudent(parentId, studentEmail.trim());
      setStudentPreview(result);
      setStep("verify");
    } catch (err: any) {
      setError(err.message || "Student not found. Make sure they have a student account.");
      setStudentPreview(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLink = async () => {
    if (!studentPassword.trim()) {
      setError("Please enter the student's password");
      return;
    }
    
    if (!studentPreview) return;
    
    setError("");
    setIsLinking(true);
    
    try {
      await parentService.linkChild(parentId, studentPreview.studentId, studentPassword);
      toast.success("Child linked successfully!", { 
        description: `${studentPreview.name} has been added to your account.` 
      });
      setStep("success");
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to link child. Check the password and try again.");
    } finally {
      setIsLinking(false);
    }
  };

  const handleClose = () => {
    setStep("search");
    setStudentEmail("");
    setStudentPassword("");
    setStudentPreview(null);
    setError("");
    onOpenChange(false);
  };

  const handleBack = () => {
    setStep("search");
    setStudentPassword("");
    setError("");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === "success" ? (
              <><CheckCircle2 className="h-5 w-5 text-green-500" /> Child Linked!</>
            ) : (
              <><UserCheck className="h-5 w-5" /> Link Your Child</>
            )}
          </DialogTitle>
          <DialogDescription>
            {step === "search" && "Enter your child's email address to find their account."}
            {step === "verify" && "Verify this is your child and enter their password to link."}
            {step === "success" && "You can now monitor their progress from your dashboard."}
          </DialogDescription>
        </DialogHeader>

        {step === "search" && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="studentEmail">Student's Email Address</Label>
              <div className="flex gap-2">
                <Input
                  id="studentEmail"
                  type="email"
                  placeholder="child@example.com"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={isSearching}>
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}
            
            <p className="text-xs text-muted-foreground">
              Your child must have signed up as a Student. They'll need to share their login password with you to complete the linking.
            </p>
          </div>
        )}

        {step === "verify" && studentPreview && (
          <div className="space-y-4 py-4">
            {/* Student Preview Card */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg font-bold">
                    {studentPreview.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg">{studentPreview.name}</h3>
                    <p className="text-sm text-muted-foreground">{studentPreview.email}</p>
                    <div className="flex flex-wrap gap-3 mt-2">
                      <span className="inline-flex items-center gap-1 text-xs bg-background px-2 py-1 rounded">
                        <GraduationCap className="h-3 w-3" /> Grade {studentPreview.grade}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs bg-background px-2 py-1 rounded">
                        <BookOpen className="h-3 w-3" /> {studentPreview.board}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{studentPreview.testsCompleted}</p>
                    <p className="text-xs text-muted-foreground">Tests Completed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{studentPreview.averageScore}%</p>
                    <p className="text-xs text-muted-foreground">Average Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="studentPassword">Student's Password</Label>
              <Input
                id="studentPassword"
                type="password"
                placeholder="Enter their login password"
                value={studentPassword}
                onChange={(e) => setStudentPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLink()}
              />
              <p className="text-xs text-muted-foreground">
                Enter the password your child uses to log in to TestWest.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}
          </div>
        )}

        {step === "success" && studentPreview && (
          <div className="py-8 text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold">{studentPreview.name}</h3>
            <p className="text-muted-foreground">has been linked to your account</p>
          </div>
        )}

        {step !== "success" && (
          <DialogFooter className="gap-2 sm:gap-0">
            {step === "verify" && (
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
            )}
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            {step === "verify" && (
              <Button onClick={handleLink} disabled={isLinking}>
                {isLinking ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Linking...</>
                ) : (
                  <><UserCheck className="mr-2 h-4 w-4" /> Link Child</>
                )}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
