import mongoose from "mongoose";

const testQuestionSchema = new mongoose.Schema(
  {
    originalQuestionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
    type: { type: String, enum: ["MCQ", "MSQ", "Fill in the blanks", "Short answer"], default: "MCQ" },
    body: { type: String, required: true },
    options: { type: mongoose.Schema.Types.Mixed, default: [] },
    answer: { type: mongoose.Schema.Types.Mixed, default: null },
    explanation: { type: String, default: "" },
    givenAnswer: { type: mongoose.Schema.Types.Mixed, default: null },
    isCorrect: { type: Boolean, default: null },
    timeSpentSeconds: { type: Number, default: 0 },
    flagged: { type: Boolean, default: false },
  },
  { _id: true },
);

const testSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "StudentProfile", required: true },
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment", default: null },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "TeacherProfile", default: null },
    title: { type: String, default: "" },
    subject: { type: String, required: true },
    chapter: { type: String, default: "" },
    topic: { type: String, default: "" },
    subtopic: { type: String, default: "" },
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], required: true },
    questionCount: { type: Number, default: 10 },
    dueDate: { type: Date, default: null },
    status: {
      type: String,
      enum: ["Pending", "In progress", "Completed", "Abandoned"],
      default: "Pending",
    },
    questions: [testQuestionSchema],
    score: { type: Number, default: null },
    accuracy: { type: Number, default: null },
    durationSeconds: { type: Number, default: null },
    submittedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const Test = mongoose.model("Test", testSchema);
