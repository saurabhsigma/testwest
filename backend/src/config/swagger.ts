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
    url: "https://testwest.onrender.com",
  },
],
  },
  apis: ["src/**/*.ts", "src/**/*.tsx"],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
