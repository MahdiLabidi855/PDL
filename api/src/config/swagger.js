const swaggerJSDoc = require("swagger-jsdoc");

const swaggerDefinition = {
    openapi: "3.0.0",
    info: {
        title: "Smart Campus API",
        version: "1.0.0",
        description: "API documentation for the Smart Campus platform"
    },
    servers: [
        {
            url: process.env.SWAGGER_SERVER_URL || "http://localhost:5000"
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
            Sensor: {
                type: "object",
                properties: {
                    room: { type: "string" },
                    temperature: { type: "number" },
                    humidity: { type: "number" },
                    light: { type: "number" },
                    presence: { type: "boolean" },
                    timestamp: { type: "string", format: "date-time" }
                }
            },
            Alert: {
                type: "object",
                properties: {
                    title: { type: "string" },
                    message: { type: "string" },
                    severity: { type: "string" },
                    type: { type: "string" },
                    room: { type: "string" }
                }
            },
            Room: {
                type: "object",
                properties: {
                    name: { type: "string" },
                    floor: { type: "number" },
                    capacity: { type: "number" },
                    position: {
                        type: "object",
                        properties: {
                            x: { type: "number" },
                            y: { type: "number" }
                        }
                    }
                }
            },
            EnergyReading: {
                type: "object",
                properties: {
                    room: { type: "string" },
                    power: { type: "number" },
                    duration: { type: "number" },
                    timestamp: { type: "string", format: "date-time" },
                    isWaste: { type: "boolean" }
                }
            },
            User: {
                type: "object",
                properties: {
                    name: { type: "string" },
                    email: { type: "string" },
                    role: { type: "string" }
                }
            }
        }
    }
};

const options = {
    definition: swaggerDefinition,
    apis: ["./src/routes/*.js", "./src/controllers/*.js"]
};

module.exports = swaggerJSDoc(options);