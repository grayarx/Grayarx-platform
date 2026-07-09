# GrayArx Custom Authentication System

## Overview

GrayArx now features a fully custom, self-hosted authentication system that replaces Manus OAuth. This system eliminates all external branding and provides complete control over the authentication flow, user experience, and data.

## Key Features

### Security
- **Bcrypt Password Hashing**: Industry-standard password hashing with 12 salt rounds
- **Password Strength Requirements**: Minimum 8 characters, at least 1 uppercase letter, at least 1 number
- **Session Management**: Secure HTTP-only cookies for session persistence
- **Password Reset Tokens**: Time-limited tokens (1 hour expiration) for secure password recovery
- **Rate Limiting Infrastructure**: Built-in support for rate limiting signup and login attempts
- **POPIA Compliance**: No unnecessary data collection; compliant with South African privacy regulations

### User Experience
- **GrayArx Branded Pages**: All authentication pages feature the GrayArx dark luxury aesthetic (charcoal + gold)
- **Responsive Design**: Mobile-optimized forms and layouts
- **Real-time Validation**: Client-side validation with server-side verification
- **Error Handling**: Clear, user-friendly error messages
- **Loading States**: Visual feedback during authentication operations

### Backend Infrastructure
- **Express Routes**: RESTful API endpoints for all authentication operations
- **Database Integration**: Seamless integration with existing MySQL database
- **Email Service**: Integration with Resend/SendGrid for password reset emails
- **Logging**: Comprehensive logging for security auditing and troubleshooting

## Architecture

### Frontend Pages

#### `/login`
Custom email/password login page with:
- Email input with validation
- Password input with show/hide toggle
- "Remember me" option (optional future enhancement)
- "Forgot password?" link
- Sign up link for new users
- Dark luxury design with GrayArx branding

#### `/signup`
Custom registration page with:
- Email input with validation
- Password input with strength indicator
- Name input
- Password strength requirements display
- Terms of service acknowledgment
- Sign in link for existing users
- Dark luxury design with GrayArx branding

#### `/forgot-password`
Password reset request page with:
- Email input
- Success confirmation screen
- Back to login link
- Dark luxury design with GrayArx branding

### Backend Routes

#### `POST /api/auth/signup`
Register a new user with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "userId": 123,
  "message": "Account created successfully"
}
```

**Validation:**
- Email must be valid format
- Email must not already exist
- Password must be at least 8 characters
- Password must contain at least 1 uppercase letter
- Password must contain at least 1 number

#### `POST /api/auth/login`
Authenticate user with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 123,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  },
  "message": "Logged in successfully"
}
```

**Validation:**
- Email must exist in database
- Password must match stored hash
- User account must be active

#### `POST /api/auth/forgot-password`
Request a password reset token.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

**Behavior:**
- Generates a time-limited token (1 hour expiration)
- Sends email with reset link
- Returns success even if email doesn't exist (security best practice)

#### `POST /api/auth/reset-password`
Complete the password reset process.

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewSecurePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Validation:**
- Token must be valid and not expired
- New password must meet strength requirements
- Token is consumed after use (one-time use only)

### Database Schema

#### Users Table
```sql
ALTER TABLE users ADD COLUMN passwordHash VARCHAR(255);
ALTER TABLE users ADD COLUMN loginMethod ENUM('email', 'oauth') DEFAULT 'email';
ALTER TABLE users ADD COLUMN lastSignedIn TIMESTAMP;
```

#### Password Reset Tokens Table
```sql
CREATE TABLE passwordResetTokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expiresAt TIMESTAMP NOT NULL,
  consumedAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX (token),
  INDEX (expiresAt)
);
```

## Implementation Details

### Password Hashing
Passwords are hashed using bcrypt with 12 salt rounds:
```typescript
const hash = await hashPassword(password);
// Hash is stored in users.passwordHash
```

### Session Management
Sessions are managed via HTTP-only cookies:
```typescript
// Cookie is set on successful login
res.cookie('session', sessionToken, {
  httpOnly: true,
  secure: true, // HTTPS only
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});
```

### Email Integration
Password reset emails are sent via Resend or SendGrid:
```typescript
await emailService.sendPasswordResetEmail(email, resetLink);
```

## Testing

Comprehensive vitest test suite covers:
- Password hashing and verification
- Signup validation (email format, password strength)
- Login with correct/incorrect credentials
- Password reset token generation and verification
- Database integration
- Error handling
- Case sensitivity handling

Run tests with:
```bash
pnpm test -- customAuth.test.ts
```

## Security Considerations

### Password Storage
- Passwords are never stored in plain text
- Bcrypt hashing is irreversible
- Each password is salted with a unique salt

### Session Security
- Sessions use HTTP-only cookies (not accessible via JavaScript)
- Cookies are marked as secure (HTTPS only)
- Cookies have strict SameSite policy to prevent CSRF attacks

### Password Reset
- Reset tokens are time-limited (1 hour)
- Reset tokens are one-time use only
- Reset emails should only be sent to verified email addresses

### Rate Limiting
- Rate limiting infrastructure is in place for signup and login
- Can be configured per endpoint

## Future Enhancements

### Two-Factor Authentication (2FA)
- TOTP (Time-based One-Time Password) support
- SMS-based verification
- Backup codes for account recovery

### Social Login
- Google OAuth integration
- Microsoft OAuth integration
- LinkedIn OAuth integration

### Account Recovery
- Security questions
- Backup email addresses
- Account recovery codes

### Session Management
- Device management UI
- Session history
- Remote logout capability

### Device Trust
- Remember device for 30 days
- Device fingerprinting
- Trusted device list

## Migration from Manus OAuth

For existing users who were using Manus OAuth:

1. **Create temporary password**: Generate a secure temporary password
2. **Send password reset email**: Direct users to set their own password
3. **Verify email**: Ensure email addresses are verified
4. **Update user records**: Set `loginMethod = 'email'` for migrated users

## Deployment

The authentication system requires:
- Node.js 18+ (already running)
- MySQL database (already configured)
- Email service credentials (Resend or SendGrid)
- HTTPS/TLS certificate (for production)

No additional infrastructure or services are required beyond what's already in place.

## Support & Troubleshooting

### Common Issues

**"Invalid email or password"**
- Verify email address is correct
- Verify password is correct
- Check if account exists

**"Password reset email not received"**
- Check spam/junk folder
- Verify email address is correct
- Check email service credentials

**"Session expired"**
- Log in again
- Session timeout is 7 days
- Clear browser cookies if issues persist

## Code References

- Backend: `server/_core/customAuth.ts`
- Routes: `server/_core/customAuth.ts` (registerCustomAuthRoutes)
- Frontend: `client/src/pages/Login.tsx`, `client/src/pages/SignUp.tsx`, `client/src/pages/ForgotPassword.tsx`
- Tests: `server/customAuth.test.ts`
- Database: `drizzle/schema.ts`

## Support

For issues or questions about the authentication system, refer to:
1. Code comments in `server/_core/customAuth.ts`
2. Test cases in `server/customAuth.test.ts`
3. Frontend components in `client/src/pages/`
4. Database schema in `drizzle/schema.ts`
