export function buildOpenApiSpec() {
  return {
    openapi: "3.1.0",
    info: {
      title: "KnotWise API",
      version: "0.2.0",
      description: "Bureau matchmaker and client portal APIs.",
    },
    servers: [{ url: process.env.APP_URL ?? "http://localhost:3000" }],
    paths: {
      "/api/health": {
        get: {
          summary: "Liveness and dependency checks",
          responses: { "200": { description: "Health report" } },
        },
      },
      "/api/client/auth/signup": {
        post: {
          summary: "Client self-signup",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password", "acceptTos", "acceptPrivacy"],
                  properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string", minLength: 8 },
                    acceptTos: { type: "boolean" },
                    acceptPrivacy: { type: "boolean" },
                    marketingOptIn: { type: "boolean" },
                  },
                },
              },
            },
          },
          responses: { "201": { description: "Account created" }, "409": { description: "Email taken" } },
        },
      },
      "/api/client/data-export": {
        get: {
          summary: "Export client personal data bundle",
          security: [{ clientSession: [] }],
          responses: { "200": { description: "JSON export bundle" } },
        },
      },
      "/api/client/delete-account": {
        post: {
          summary: "Schedule account deletion (30-day grace)",
          security: [{ clientSession: [] }],
          responses: { "200": { description: "Deletion scheduled" } },
        },
        delete: {
          summary: "Cancel pending account deletion",
          security: [{ clientSession: [] }],
          responses: { "200": { description: "Deletion cancelled" } },
        },
      },
      "/api/client/discover": {
        get: {
          summary: "Discovery feed (Premium)",
          security: [{ clientSession: [] }],
          responses: { "200": { description: "Ranked limited-reveal profiles" }, "429": { description: "Rate limited" } },
        },
      },
      "/api/c2c/conversations/{id}/messages": {
        post: {
          summary: "Send C2C message post-mutual",
          security: [{ clientSession: [] }],
          responses: { "201": { description: "Message sent" }, "429": { description: "Rate limited" } },
        },
      },
      "/api/ops/scale": {
        get: {
          summary: "Ops production scale metrics",
          security: [{ matchmakerSession: [] }],
          responses: { "200": { description: "SLO and suppression summary" } },
        },
      },
    },
    components: {
      securitySchemes: {
        clientSession: { type: "apiKey", in: "cookie", name: "knotwise_client_session" },
        matchmakerSession: { type: "apiKey", in: "cookie", name: "knotwise_session" },
      },
    },
  };
}
