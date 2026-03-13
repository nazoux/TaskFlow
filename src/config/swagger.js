const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "TaskFlow API",
      version: "1.0.0",
      description: "Documentation de l'API TaskFlow"
    },
    servers: [
      {
        url: process.env.NODE_ENV === "production"
          ? process.env.BACKEND_URL || "https://ton-api.railway.app"
          : "http://localhost:3000",
        description: process.env.NODE_ENV === "production" ? "Production" : "Local"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      },
      schemas: {
        RegisterInput: {
          type: "object",
          required: ["username", "email", "password"],
          properties: {
            username: {
              type: "string",
              example: "simon"
            },
            email: {
              type: "string",
              example: "simon@test.com"
            },
            password: {
              type: "string",
              example: "123456"
            }
          }
        },
        LoginInput: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              example: "simon@test.com"
            },
            password: {
              type: "string",
              example: "123456"
            }
          }
        },
        AuthSuccess: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Login successful"
            },
            token: {
              type: "string",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            }
          }
        },
        RegisterSuccess: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "User created"
            },
            user: {
              type: "object",
              properties: {
                id: {
                  type: "integer",
                  example: 1
                },
                username: {
                  type: "string",
                  example: "simon"
                },
                email: {
                  type: "string",
                  example: "simon@test.com"
                },
                created_at: {
                  type: "string",
                  format: "date-time",
                  example: "2026-03-09T10:00:00.000Z"
                }
              }
            }
          }
        },
        ErrorResponse: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Invalid credentials"
            }
          }
        },
        Task: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              example: 1
            },
            title: {
              type: "string",
              example: "Apprendre Node.js"
            },
            description: {
              type: "string",
              example: "Finir le backend TaskFlow"
            },
            status: {
                type: "string",
                enum: ["todo", "in_progress", "done"],
                example: "todo"
            },
            priority: {
            type: "string",
            enum: ["low", "medium", "high"],
            example: "high"
            },
            due_date: {
              type: "string",
              format: "date-time",
              example: "2026-03-15T18:00:00.000Z"
            },
            created_at: {
              type: "string",
              format: "date-time",
              example: "2026-03-09T10:00:00.000Z"
            },
            updated_at: {
              type: "string",
              format: "date-time",
              nullable: true,
              example: "2026-03-10T09:00:00.000Z"
            },
            user_id: {
              type: "integer",
              example: 1
            },
            category_id: {
              type: "integer",
              nullable: true,
              example: 2
            }
          }
        },
        CreateTaskInput: {
          type: "object",
          required: ["title", "status"],
          properties: {
            title: {
              type: "string",
              example: "Apprendre Node.js"
            },
            description: {
              type: "string",
              example: "Finir le backend TaskFlow"
            },
           status: {
            type: "string",
            enum: ["todo", "in_progress", "done"],
            example: "todo"
            },
            priority: {
            type: "string",
            enum: ["low", "medium", "high"],
            example: "high"
            },
            due_date: {
              type: "string",
              format: "date-time",
              example: "2026-03-15T18:00:00.000Z"
            },
            category_id: {
              type: "integer",
              example: 2
            }
          }
        },
        UpdateTaskInput: {
          type: "object",
          properties: {
            title: {
              type: "string",
              example: "Apprendre Express"
            },
            description: {
              type: "string",
              example: "Mettre à jour la tâche"
            },
            status: {
                type: "string",
                enum: ["todo", "in_progress", "done"],
                example: "todo"
                },
                priority: {
                type: "string",
                enum: ["low", "medium", "high"],
                example: "high"
            },
            due_date: {
              type: "string",
              format: "date-time",
              example: "2026-03-20T18:00:00.000Z"
            },
            category_id: {
              type: "integer",
              example: 1
            }
          }
        },
        Category: {
            type: "object",
            properties: {
                id: {
                type: "integer",
                example: 1
                },
                name: {
                type: "string",
                example: "Travail"
                },
                color: {
                type: "string",
                example: "#3B82F6"
                },
                user_id: {
                type: "integer",
                example: 1
                }
            }
        },
        CreateCategoryInput: {
            type: "object",
            required: ["name"],
            properties: {
                name: {
                type: "string",
                example: "Travail"
                },
                color: {
                type: "string",
                example: "#3B82F6"
                }
            }
        },
        UpdateCategoryInput: {
            type: "object",
            properties: {
                name: {
                type: "string",
                example: "Personnel"
                },
                color: {
                type: "string",
                example: "#10B981"
                }
            }
        },
      }
    }
  },
  apis: ["./src/routes/*.js"]
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;