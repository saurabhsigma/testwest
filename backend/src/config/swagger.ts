import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Test West API",
      version: "1.0.0",
      description: "Backend API documentation for Test West project",
    },
    components: {
      schemas: {
        AuthRegisterRequest: {
          type: "object",
          required: ["email", "password", "role", "firstName", "lastName"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 8 },
            role: { type: "string", enum: ["STUDENT", "PARENT", "TEACHER", "SCHOOL", "SOLO"] },
            firstName: { type: "string" },
            lastName: { type: "string" },
            profile: {
              type: "object",
              properties: {
                grade: { type: "integer", minimum: 1, maximum: 12 },
                board: { type: "string" },
                avatarUrl: { type: "string" },
                bio: { type: "string" },
                phone: { type: "string" },
                city: { type: "string" },
                schoolId: { type: "string" },
                classId: { type: "string" },
                section: { type: "string" },
                rollNo: { type: "string" },
                subjects: { type: "array", items: { type: "string" } },
                classIds: { type: "array", items: { type: "string" } },
                experienceYears: { type: "number" },
              },
            },
          },
        },
        AuthLoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string" },
          },
        },
        ParentCreateRequest: {
          type: "object",
          required: ["user"],
          properties: {
            user: { $ref: "#/components/schemas/UserProfileInput" },
          },
        },
        ParentUpdateRequest: {
          type: "object",
          properties: {
            user: { $ref: "#/components/schemas/UserProfilePatch" },
            children: { type: "array", items: { type: "string" } },
          },
        },
        ParentLinkStudentRequest: {
          type: "object",
          required: ["studentId", "studentPassword"],
          properties: {
            studentId: { type: "string" },
            studentPassword: { type: "string" },
          },
        },
        ParentVerifyStudentRequest: {
          type: "object",
          required: ["studentEmail"],
          properties: {
            studentEmail: { type: "string" },
          },
        },
        TeacherCreateRequest: {
          type: "object",
          required: ["user", "profile"],
          properties: {
            user: { $ref: "#/components/schemas/UserProfileInput" },
            profile: { $ref: "#/components/schemas/TeacherProfileInput" },
          },
        },
        TeacherUpdateRequest: {
          type: "object",
          properties: {
            user: { $ref: "#/components/schemas/UserProfilePatch" },
            profile: { $ref: "#/components/schemas/TeacherProfilePatch" },
          },
        },
        SchoolCreateRequest: {
          type: "object",
          required: ["name", "board"],
          properties: {
            name: { type: "string" },
            board: { type: "string" },
            city: { type: "string" },
            principal: { type: "string" },
          },
        },
        SchoolUpdateRequest: {
          type: "object",
          properties: {
            name: { type: "string" },
            board: { type: "string" },
            city: { type: "string" },
            principal: { type: "string" },
          },
        },
        ClassCreateRequest: {
          type: "object",
          required: ["grade", "section"],
          properties: {
            grade: { type: "integer", minimum: 1, maximum: 12 },
            section: { type: "string" },
            teacherId: { type: "string" },
          },
        },
        ClassUpdateRequest: {
          type: "object",
          properties: {
            grade: { type: "integer", minimum: 1, maximum: 12 },
            section: { type: "string" },
            teacherId: { type: "string" },
          },
        },
        StudentCreateRequest: {
          type: "object",
          required: ["user", "profile"],
          properties: {
            user: { $ref: "#/components/schemas/UserProfileInput" },
            profile: { $ref: "#/components/schemas/StudentProfileInput" },
          },
        },
        StudentUpdateRequest: {
          type: "object",
          properties: {
            user: { $ref: "#/components/schemas/UserProfilePatch" },
            profile: { $ref: "#/components/schemas/StudentProfilePatch" },
          },
        },
        QuestionCreateRequest: {
          type: "object",
          required: ["board", "grade", "subject", "chapter", "topic", "subtopic", "type", "difficulty", "body", "answer"],
          properties: {
            board: { type: "string" },
            grade: { type: "integer", minimum: 1, maximum: 12 },
            subject: { type: "string" },
            chapter: { type: "string" },
            topic: { type: "string" },
            subtopic: { type: "string" },
            type: { type: "string", enum: ["MCQ", "MSQ", "Fill in the blanks", "Short answer"] },
            difficulty: { type: "string", enum: ["Easy", "Medium", "Hard"] },
            body: { type: "string" },
            options: {
              oneOf: [
                { type: "object", additionalProperties: true },
                { type: "array", items: { type: "string" } },
                { type: "string" },
                { type: "number" },
                { type: "boolean" },
              ],
            },
            answer: {
              oneOf: [
                { type: "object", additionalProperties: true },
                { type: "array", items: { type: "string" } },
                { type: "string" },
                { type: "number" },
                { type: "boolean" },
              ],
            },
            explanation: { type: "string" },
          },
        },
        QuestionUpdateRequest: {
          type: "object",
          properties: {
            board: { type: "string" },
            grade: { type: "integer", minimum: 1, maximum: 12 },
            subject: { type: "string" },
            chapter: { type: "string" },
            topic: { type: "string" },
            subtopic: { type: "string" },
            type: { type: "string", enum: ["MCQ", "MSQ", "Fill in the blanks", "Short answer"] },
            difficulty: { type: "string", enum: ["Easy", "Medium", "Hard"] },
            body: { type: "string" },
            options: {
              oneOf: [
                { type: "object", additionalProperties: true },
                { type: "array", items: { type: "string" } },
                { type: "string" },
                { type: "number" },
                { type: "boolean" },
              ],
            },
            answer: {
              oneOf: [
                { type: "object", additionalProperties: true },
                { type: "array", items: { type: "string" } },
                { type: "string" },
                { type: "number" },
                { type: "boolean" },
              ],
            },
            explanation: { type: "string" },
          },
        },
        AssignmentCreateRequest: {
          type: "object",
          required: ["teacherId", "title", "subject", "questionCount", "difficulty", "dueDate", "target"],
          properties: {
            teacherId: { type: "string" },
            schoolId: { type: "string" },
            title: { type: "string" },
            subject: { type: "string" },
            chapter: { type: "string" },
            topic: { type: "string" },
            questionCount: { type: "integer", minimum: 1 },
            difficulty: { type: "string", enum: ["Easy", "Medium", "Hard"] },
            dueDate: { type: "string", format: "date-time" },
            target: { $ref: "#/components/schemas/AssignmentTargetInput" },
          },
        },
        AssignmentUpdateRequest: {
          type: "object",
          properties: {
            title: { type: "string" },
            subject: { type: "string" },
            chapter: { type: "string" },
            topic: { type: "string" },
            questionCount: { type: "integer" },
            difficulty: { type: "string", enum: ["Easy", "Medium", "Hard"] },
            dueDate: { type: "string", format: "date-time" },
            target: { $ref: "#/components/schemas/AssignmentTargetPatch" },
            totalStudents: { type: "integer" },
            submitted: { type: "integer" },
            inProgress: { type: "integer" },
            notStarted: { type: "integer" },
            averageScore: { type: "number" },
            status: { type: "string", enum: ["Assigned", "In progress", "Completed", "Overdue"] },
          },
        },
        TestCreateRequest: {
          type: "object",
          required: ["studentId", "subject", "difficulty"],
          properties: {
            studentId: { type: "string" },
            board: { type: "string" },
            grade: { type: "integer" },
            subject: { type: "string" },
            chapter: { type: "string" },
            topic: { type: "string" },
            subtopic: { type: "string" },
            difficulty: { type: "string", enum: ["Easy", "Medium", "Hard"] },
            questionTypes: { type: "array", items: { type: "string" } },
            count: { type: "integer", minimum: 1, maximum: 100 },
          },
        },
        TestResponsePatchRequest: {
          type: "object",
          properties: {
            givenAnswer: {
              oneOf: [
                { type: "object", additionalProperties: true },
                { type: "array", items: { type: "string" } },
                { type: "string" },
                { type: "number" },
                { type: "boolean" },
              ],
            },
            timeSpentSeconds: { type: "number" },
            flagged: { type: "boolean" },
          },
        },
        UserProfileInput: {
          type: "object",
          required: ["email", "password", "firstName", "lastName"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 6 },
            firstName: { type: "string" },
            lastName: { type: "string" },
            avatarUrl: { type: "string" },
            bio: { type: "string" },
            phone: { type: "string" },
            city: { type: "string" },
          },
        },
        UserProfilePatch: {
          type: "object",
          properties: {
            firstName: { type: "string" },
            lastName: { type: "string" },
            avatarUrl: { type: "string" },
            bio: { type: "string" },
            phone: { type: "string" },
            city: { type: "string" },
          },
        },
        TeacherProfileInput: {
          type: "object",
          required: ["subjects"],
          properties: {
            subjects: { type: "array", items: { type: "string" } },
            classIds: { type: "array", items: { type: "string" } },
            schoolId: { type: "string" },
            experienceYears: { type: "number" },
          },
        },
        TeacherProfilePatch: {
          type: "object",
          properties: {
            subjects: { type: "array", items: { type: "string" } },
            classIds: { type: "array", items: { type: "string" } },
            schoolId: { type: "string" },
            experienceYears: { type: "number" },
          },
        },
        StudentProfileInput: {
          type: "object",
          required: ["grade", "board"],
          properties: {
            grade: { type: "integer", minimum: 1, maximum: 12 },
            board: { type: "string" },
            avatarUrl: { type: "string" },
            schoolId: { type: "string" },
            classId: { type: "string" },
            section: { type: "string" },
            rollNo: { type: "string" },
          },
        },
        StudentProfilePatch: {
          type: "object",
          properties: {
            grade: { type: "integer", minimum: 1, maximum: 12 },
            board: { type: "string" },
            avatarUrl: { type: "string" },
            schoolId: { type: "string" },
            classId: { type: "string" },
            section: { type: "string" },
            rollNo: { type: "string" },
          },
        },
        AssignmentTargetInput: {
          type: "object",
          required: ["type"],
          properties: {
            type: { type: "string", enum: ["class", "students", "group"] },
            classIds: { type: "array", items: { type: "string" } },
            studentIds: { type: "array", items: { type: "string" } },
            groupId: { type: "string" },
            targetLabel: { type: "string" },
          },
        },
        AssignmentTargetPatch: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["class", "students", "group"] },
            classIds: { type: "array", items: { type: "string" } },
            studentIds: { type: "array", items: { type: "string" } },
            groupId: { type: "string" },
            targetLabel: { type: "string" },
          },
        },
      },
    },
    servers: [
      {
        url: "https://testwest.onrender.com",
      },
    ],
  },
  apis: ["src/**/*.ts", "src/**/*.tsx"],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
