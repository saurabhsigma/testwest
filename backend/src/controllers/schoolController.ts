import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { School } from "../models/School";
import { User } from "../models/User";
import { Class } from "../models/Class";
import { StudentProfile } from "../models/StudentProfile";
import { TeacherProfile } from "../models/TeacherProfile";
import { Test } from "../models/Test";
import { getPagination } from "../middleware/pagination";

export async function listSchools(req: Request, res: Response) {
  const { page, limit, skip } = getPagination(req.query as Record<string, unknown>);
  const [total, schools] = await Promise.all([
    School.countDocuments({}),
    School.find({}).skip(skip).limit(limit).sort({ createdAt: -1 }),
  ]);
  return res.json({ data: schools, page, limit, total });
}

export async function getSchool(req: Request, res: Response) {
  const school = await School.findById(req.params.id);
  if (!school) return res.status(404).json({ error: "School not found" });
  return res.json(school);
}

export async function createSchool(req: Request, res: Response) {
  try {
    // Only SCHOOL role users can create schools
    if (!req.user || req.user.role !== "SCHOOL") {
      return res.status(403).json({ error: "Only school administrators can create schools" });
    }

    // Check if user already has a school linked
    if (req.user.schoolId) {
      return res.status(400).json({ error: "You already have a school registered" });
    }

    const school = await School.create(req.body);
    
    // Link the creator to the school
    await User.findByIdAndUpdate(req.user._id, { schoolId: school._id });
    
    return res.status(201).json(school);
  } catch (error) {
    console.error("Error creating school:", error);
    return res.status(500).json({ error: "Failed to create school" });
  }
}

export async function updateSchool(req: Request, res: Response) {
  const school = await School.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!school) return res.status(404).json({ error: "School not found" });
  return res.json(school);
}

export async function deleteSchool(req: Request, res: Response) {
  const school = await School.findByIdAndDelete(req.params.id);
  if (!school) return res.status(404).json({ error: "School not found" });
  return res.json({ message: "School deleted" });
}

export async function listClasses(req: Request, res: Response) {
  try {
    const { page, limit, skip } = getPagination(req.query as Record<string, unknown>);
    const filter = { schoolId: req.params.id };
    
    const [total, classes] = await Promise.all([
      Class.countDocuments(filter),
      Class.find(filter)
        .populate({
          path: "teacherId",
          populate: {
            path: "user",
            select: "firstName lastName email",
          },
        })
        .skip(skip)
        .limit(limit)
        .sort({ grade: 1, section: 1 }),
    ]);

    // Enrich each class with student count and formatted teacher name
    const enrichedClasses = await Promise.all(
      classes.map(async (cls: any) => {
        const studentCount = await StudentProfile.countDocuments({ classId: cls._id });
        const clsObj = cls.toObject();
        
        // Format teacher name from populated user
        let teacherName = "Not assigned";
        if (clsObj.teacherId && clsObj.teacherId.user) {
          teacherName = `${clsObj.teacherId.user.firstName} ${clsObj.teacherId.user.lastName || ""}`.trim();
        }
        
        return {
          ...clsObj,
          studentCount,
          teacher: teacherName,
        };
      })
    );

    return res.json({ data: enrichedClasses, page, limit, total });
  } catch (error) {
    console.error("Error listing classes:", error);
    return res.status(500).json({ error: "Failed to list classes" });
  }
}

export async function createClass(req: Request, res: Response) {
  try {
    const { teacherId } = req.body;
    const newClass = await Class.create({ ...req.body, schoolId: req.params.id });
    
    // If a teacher is assigned at creation, add class to their classIds
    if (teacherId) {
      await TeacherProfile.findByIdAndUpdate(teacherId, {
        $addToSet: { classIds: newClass._id },
      });
    }
    
    return res.status(201).json(newClass);
  } catch (error) {
    console.error("Error creating class:", error);
    return res.status(500).json({ error: "Failed to create class" });
  }
}

export async function updateClass(req: Request, res: Response) {
  try {
    const { classId } = req.params;
    const schoolId = req.params.id;
    const { teacherId } = req.body;

    // Get the current class to check if teacher is being changed
    const existingClass = await Class.findOne({ _id: classId, schoolId });
    if (!existingClass) return res.status(404).json({ error: "Class not found" });

    const oldTeacherId = existingClass.teacherId ? String(existingClass.teacherId) : null;
    const newTeacherId = teacherId || null;

    // Update the class
    const updated = await Class.findOneAndUpdate(
      { _id: classId, schoolId },
      req.body,
      { new: true },
    );

    // If teacher changed, update TeacherProfile.classIds for both old and new teacher
    if (oldTeacherId !== newTeacherId) {
      // Remove class from old teacher's classIds
      if (oldTeacherId) {
        await TeacherProfile.findByIdAndUpdate(oldTeacherId, {
          $pull: { classIds: classId },
        });
      }
      // Add class to new teacher's classIds
      if (newTeacherId) {
        await TeacherProfile.findByIdAndUpdate(newTeacherId, {
          $addToSet: { classIds: classId },
        });
      }
    }

    return res.json(updated);
  } catch (error) {
    console.error("Error updating class:", error);
    return res.status(500).json({ error: "Failed to update class" });
  }
}

export async function deleteClass(req: Request, res: Response) {
  const deleted = await Class.findOneAndDelete({
    _id: req.params.classId,
    schoolId: req.params.id,
  });
  if (!deleted) return res.status(404).json({ error: "Class not found" });
  return res.json({ message: "Class deleted" });
}

export async function getClassStudents(req: Request, res: Response) {
  try {
    const students = await StudentProfile.find({ classId: req.params.classId }).populate(
      "user",
      "firstName lastName avatarUrl email",
    );
    
    // Get test data for each student
    const enrichedStudents = await Promise.all(
      students.map(async (s: any) => {
        const completedTests = await Test.find({ 
          studentId: s._id, 
          status: "Completed" 
        });
        
        const avgScore = completedTests.length
          ? Math.round(completedTests.reduce((sum: number, t: any) => sum + (t.score || 0), 0) / completedTests.length)
          : 0;
        
        return {
          id: String(s._id),
          _id: String(s._id),
          userId: String(s.user?._id || ""),
          name: s.user ? `${s.user.firstName} ${s.user.lastName}`.trim() : "Student",
          email: s.user?.email || "",
          grade: s.grade,
          section: s.section,
          rollNo: s.rollNo || "",
          board: s.board || "",
          avgScore,
          testsTaken: completedTests.length,
          attendance: 0, // Placeholder - would need attendance tracking
        };
      })
    );
    
    return res.json(enrichedStudents);
  } catch (error) {
    console.error("Error getting class students:", error);
    return res.status(500).json({ error: "Failed to get class students" });
  }
}

// School creates a student account and links them to a class
export async function createStudentForSchool(req: Request, res: Response) {
  try {
    if (!req.user || req.user.role !== "SCHOOL") {
      return res.status(403).json({ error: "Only school administrators can create students" });
    }

    const schoolId = req.user.schoolId;
    if (!schoolId) {
      return res.status(400).json({ error: "You must have a registered school first" });
    }

    const { firstName, lastName, email, password, grade, board, classId, section, rollNo } = req.body;

    // Check email not already taken
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: `Email ${email} is already registered` });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create the User account
    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      role: "STUDENT",
      firstName,
      lastName,
      schoolId,
    });

    // Create the StudentProfile linked to school and class
    const profile = await StudentProfile.create({
      user: user._id,
      grade,
      board,
      schoolId,
      classId: classId || null,
      section: section || "",
      rollNo: rollNo || "",
    });

    return res.status(201).json({
      id: String(profile._id),
      userId: String(user._id),
      name: `${firstName} ${lastName}`,
      email: user.email,
      grade,
      section: section || "",
      rollNo: rollNo || "",
      password, // Return plain password once so school admin can share with student
    });
  } catch (error) {
    console.error("Error creating student:", error);
    return res.status(500).json({ error: "Failed to create student" });
  }
}

export async function createTeacherForSchool(req: Request, res: Response) {
  try {
    if (!req.user || req.user.role !== "SCHOOL") {
      return res.status(403).json({ error: "Only school administrators can create teachers" });
    }

    const schoolId = req.user.schoolId;
    if (!schoolId) {
      return res.status(400).json({ error: "You must have a registered school first" });
    }

    const { firstName, lastName, email, password, subjects, classIds, experienceYears } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: `Email ${email} is already registered` });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      role: "TEACHER",
      firstName,
      lastName,
      schoolId,
    });

    const profile = await TeacherProfile.create({
      user: user._id,
      schoolId,
      subjects: subjects || [],
      classIds: classIds || [],
      experienceYears: experienceYears || 0,
    });

    return res.status(201).json({
      id: String(profile._id),
      userId: String(user._id),
      name: `${firstName} ${lastName}`,
      email: user.email,
      subjects: profile.subjects,
      password, // Return plain password once so school admin can share with teacher
    });
  } catch (error) {
    console.error("Error creating teacher:", error);
    return res.status(500).json({ error: "Failed to create teacher" });
  }
}

export async function getSchoolStats(req: Request, res: Response) {
  const schoolId = req.params.id;
  const classes = await Class.find({ schoolId });
  const students = await StudentProfile.find({ schoolId });
  const tests = await Test.find({ studentId: { $in: students.map((s) => s._id) } });

  const averageScore = tests.length
    ? Math.round(tests.reduce((s: number, t: any) => s + (t.score || 0), 0) / tests.length)
    : 0;

  return res.json({
    totalStudents: students.length,
    totalClasses: classes.length,
    totalTests: tests.length,
    averageScore,
    attendance: 0,
    bestSubject: { subject: "", averageScore: 0, testsTaken: 0, trend: 0 },
    weakSubject: { subject: "", averageScore: 0, testsTaken: 0, trend: 0 },
  });
}

export async function listTeachers(req: Request, res: Response) {
  const { page, limit, skip } = getPagination(req.query as Record<string, unknown>);
  const filter = { schoolId: req.params.id };
  const [total, teachers] = await Promise.all([
    TeacherProfile.countDocuments(filter),
    TeacherProfile.find(filter)
      .populate("user", "firstName lastName email avatarUrl")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
  ]);
  return res.json({ data: teachers, page, limit, total });
}

export async function listStudents(req: Request, res: Response) {
  try {
    const { page, limit, skip } = getPagination(req.query as Record<string, unknown>);
    const filter = { schoolId: req.params.id };
    const [total, students] = await Promise.all([
      StudentProfile.countDocuments(filter),
      StudentProfile.find(filter)
        .populate("user", "firstName lastName email avatarUrl")
        .populate("classId", "grade section")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
    ]);
    
    const formattedStudents = students.map((s: any) => ({
      id: String(s._id),
      _id: String(s._id),
      userId: String(s.user?._id || ""),
      name: s.user ? `${s.user.firstName} ${s.user.lastName}`.trim() : "Student",
      email: s.user?.email || "",
      grade: s.grade,
      section: s.section,
      board: s.board,
      rollNo: s.rollNo,
      className: s.classId ? `Grade ${s.classId.grade} - ${s.classId.section}` : undefined,
    }));
    
    return res.json({ data: formattedStudents, page, limit, total });
  } catch (error) {
    console.error("Error listing students:", error);
    return res.status(500).json({ error: "Failed to list students" });
  }
}
