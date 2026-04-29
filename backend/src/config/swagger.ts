import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Test West API",
      version: "1.0.0",
      description: "Backend API documentation for Test West project",
    },
    servers: [
      {
        url: process.env.BASE_URL || `http://localhost:${process.env.PORT || 8000}`,
      },
    ],
  },
  apis: ["src/**/*.ts", "src/**/*.tsx"],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
