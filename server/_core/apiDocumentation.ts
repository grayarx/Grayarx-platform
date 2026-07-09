/**
 * API Documentation for GrayArx Authentication System
 * Auto-generated documentation for all authentication endpoints
 */

export interface APIEndpoint {
  method: string;
  path: string;
  description: string;
  authentication: string;
  requestBody?: Record<string, any>;
  responseBody?: Record<string, any>;
  errorCodes?: Record<number, string>;
}

export const authenticationEndpoints: APIEndpoint[] = [
  {
    method: "POST",
    path: "/api/auth/signup",
    description: "Create a new user account with email and password",
    authentication: "None",
    requestBody: {
      email: "string (required)",
      password: "string (required, min 8 chars, uppercase, number)",
      name: "string (required)",
    },
    responseBody: {
      success: "boolean",
      user: { id: "number", email: "string", name: "string" },
    },
    errorCodes: {
      400: "Invalid email format or weak password",
      409: "Email already registered",
    },
  },
  {
    method: "POST",
    path: "/api/auth/login",
    description: "Authenticate user with email and password",
    authentication: "None",
    requestBody: {
      email: "string (required)",
      password: "string (required)",
    },
    responseBody: {
      success: "boolean",
      user: { id: "number", email: "string", name: "string" },
    },
    errorCodes: {
      401: "Invalid credentials",
      429: "Too many failed attempts",
    },
  },
  {
    method: "POST",
    path: "/api/auth/forgot-password",
    description: "Request password reset token",
    authentication: "None",
    requestBody: {
      email: "string (required)",
    },
    responseBody: {
      success: "boolean",
      message: "string",
    },
    errorCodes: {
      400: "Email is required",
    },
  },
  {
    method: "POST",
    path: "/api/auth/reset-password",
    description: "Reset password with valid token",
    authentication: "None",
    requestBody: {
      token: "string (required)",
      newPassword: "string (required)",
    },
    responseBody: {
      success: "boolean",
      message: "string",
    },
    errorCodes: {
      401: "Invalid or expired token",
      400: "Invalid password",
    },
  },
  {
    method: "POST",
    path: "/api/auth/logout",
    description: "Logout current user",
    authentication: "Session Cookie",
    responseBody: {
      success: "boolean",
    },
    errorCodes: {
      401: "Not authenticated",
    },
  },
];

export const twoFactorEndpoints: APIEndpoint[] = [
  {
    method: "POST",
    path: "/api/auth/2fa/enable",
    description: "Enable two-factor authentication",
    authentication: "Session Cookie",
    requestBody: {
      method: "string (totp|sms|email)",
      phoneNumber: "string (optional, required for SMS)",
    },
    responseBody: {
      success: "boolean",
      secret: "string (for TOTP)",
      qrCode: "string (for TOTP)",
    },
    errorCodes: {
      401: "Not authenticated",
      400: "Invalid method",
    },
  },
  {
    method: "POST",
    path: "/api/auth/2fa/verify",
    description: "Verify 2FA code",
    authentication: "None",
    requestBody: {
      userId: "number",
      code: "string (6 digits)",
    },
    responseBody: {
      success: "boolean",
      backupCodes: "string[] (on first setup)",
    },
    errorCodes: {
      401: "Invalid code",
      429: "Too many attempts",
    },
  },
  {
    method: "POST",
    path: "/api/auth/2fa/disable",
    description: "Disable two-factor authentication",
    authentication: "Session Cookie",
    requestBody: {
      password: "string (required for security)",
    },
    responseBody: {
      success: "boolean",
    },
    errorCodes: {
      401: "Invalid password",
    },
  },
];

export const socialLoginEndpoints: APIEndpoint[] = [
  {
    method: "GET",
    path: "/api/oauth/google/authorize",
    description: "Initiate Google OAuth flow",
    authentication: "None",
    responseBody: {
      redirectUrl: "string",
    },
  },
  {
    method: "GET",
    path: "/api/oauth/google/callback",
    description: "Google OAuth callback",
    authentication: "None",
    requestBody: {
      code: "string (from Google)",
      state: "string (CSRF token)",
    },
    responseBody: {
      success: "boolean",
      user: { id: "number", email: "string" },
    },
  },
  {
    method: "POST",
    path: "/api/auth/social/link",
    description: "Link social account to existing user",
    authentication: "Session Cookie",
    requestBody: {
      provider: "string (google|apple)",
      token: "string (OAuth token)",
    },
    responseBody: {
      success: "boolean",
    },
    errorCodes: {
      401: "Not authenticated",
      409: "Account already linked",
    },
  },
];

export const adminEndpoints: APIEndpoint[] = [
  {
    method: "GET",
    path: "/api/admin/users",
    description: "List all users (paginated)",
    authentication: "Admin Session",
    requestBody: {
      page: "number (default 1)",
      limit: "number (default 20)",
      role: "string (optional filter)",
    },
    responseBody: {
      users: "User[]",
      total: "number",
      page: "number",
    },
    errorCodes: {
      403: "Not admin",
    },
  },
  {
    method: "GET",
    path: "/api/admin/users/:id",
    description: "Get user details",
    authentication: "Admin Session",
    responseBody: {
      user: "User",
      loginHistory: "LoginRecord[]",
      activityLog: "AuditLogEntry[]",
    },
    errorCodes: {
      403: "Not admin",
      404: "User not found",
    },
  },
  {
    method: "POST",
    path: "/api/admin/users/:id/role",
    description: "Update user role",
    authentication: "Admin Session",
    requestBody: {
      role: "string (admin|user)",
    },
    responseBody: {
      success: "boolean",
    },
    errorCodes: {
      403: "Not admin",
      404: "User not found",
    },
  },
];

export function generateAPIDocumentation(): string {
  const doc = `
# GrayArx Authentication API Documentation

## Authentication Endpoints
${authenticationEndpoints.map((ep) => formatEndpoint(ep)).join("\n")}

## Two-Factor Authentication Endpoints
${twoFactorEndpoints.map((ep) => formatEndpoint(ep)).join("\n")}

## Social Login Endpoints
${socialLoginEndpoints.map((ep) => formatEndpoint(ep)).join("\n")}

## Admin Endpoints
${adminEndpoints.map((ep) => formatEndpoint(ep)).join("\n")}
`;
  return doc;
}

function formatEndpoint(endpoint: APIEndpoint): string {
  return `
### ${endpoint.method} ${endpoint.path}
${endpoint.description}

**Authentication:** ${endpoint.authentication}

${endpoint.requestBody ? `**Request Body:**\n\`\`\`json\n${JSON.stringify(endpoint.requestBody, null, 2)}\n\`\`\`` : ""}

${endpoint.responseBody ? `**Response Body:**\n\`\`\`json\n${JSON.stringify(endpoint.responseBody, null, 2)}\n\`\`\`` : ""}

${
  endpoint.errorCodes
    ? `**Error Codes:**\n${Object.entries(endpoint.errorCodes)
        .map(([code, message]) => `- ${code}: ${message}`)
        .join("\n")}`
    : ""
}
`;
}
