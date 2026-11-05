# Google OAuth Implementation Summary

## What Was Implemented

This document summarizes the Google OAuth authentication implementation for Chord Keeper.

## Backend Implementation

### 1. Dependencies Added (Gemfile)
```ruby
gem 'omniauth'
gem 'omniauth-google-oauth2'
gem 'omniauth-rails_csrf_protection'
```

### 2. Database Migration
**File**: `db/migrate/20251117000005_add_omniauth_to_users.rb`

Added OAuth fields to users table:
- `provider` (string) - OAuth provider name (e.g., 'google_oauth2')
- `uid` (string) - Unique identifier from OAuth provider
- `name` (string) - User's full name from Google
- `avatar_url` (string) - Profile picture URL from Google
- Unique index on `[provider, uid]` for fast lookups

**Status**: ✅ Migration applied successfully

### 3. OmniAuth Configuration
**File**: `config/initializers/omniauth.rb`

Configured Google OAuth2 strategy with:
- Reads credentials from environment variables
- Requests email and profile scopes
- Forces account selection prompt
- Uses 'online' access type

### 4. User Model Updates
**File**: `app/models/user.rb`

Added:
- `:omniauthable` Devise module
- `omniauth_providers: [:google_oauth2]`
- `from_omniauth` class method to find or create users from OAuth data

### 5. OmniAuth Callbacks Controller
**File**: `app/controllers/users/omniauth_callbacks_controller.rb`

Handles:
- `google_oauth2` action - Processes successful Google authentication
- `failure` action - Handles OAuth errors
- Generates JWT token for authenticated users
- Redirects to frontend with token and email
- Skips CSRF verification for OAuth callbacks

### 6. Routes Configuration
**File**: `config/routes.rb`

Updated `devise_for :users` to include:
```ruby
omniauth_callbacks: 'users/omniauth_callbacks'
```

Removed duplicate `devise_for` declaration in API namespace.

## Frontend Implementation

### 1. Login Page Updates
**File**: `frontend/src/pages/auth/Login.tsx`

Added:
- Google login button with official Google branding
- `handleGoogleLogin` function that redirects to OAuth endpoint
- Error handling for OAuth errors from URL params
- Visual separator between email/password and OAuth login

### 2. Register Page Updates
**File**: `frontend/src/pages/auth/Register.tsx`

Added:
- Google registration button (same OAuth flow)
- `handleGoogleRegister` function
- Consistent branding with login page

### 3. OAuth Callback Page
**File**: `frontend/src/pages/auth/OAuthCallback.tsx`

New page that:
- Receives JWT token and email from backend redirect
- Stores token in localStorage
- Shows loading spinner during processing
- Handles errors gracefully
- Redirects to `/songs` on success

### 4. App Router Updates
**File**: `frontend/src/App.tsx`

Added route:
```tsx
<Route path="/auth/callback" element={<OAuthCallback />} />
```

## Authentication Flow

### User Journey:

1. **User clicks "Continuar com Google"** (Login or Register page)
   - Frontend calls: `window.location.href = '${API_BASE_URL}/users/auth/google_oauth2'`

2. **Rails redirects to Google**
   - OmniAuth middleware handles the redirect
   - User sees Google's account selection page

3. **User selects Google account and grants permissions**
   - Google validates credentials
   - User approves email/profile access

4. **Google redirects to Rails callback**
   - URL: `/users/auth/google_oauth2/callback`
   - Includes authorization code

5. **Rails processes OAuth data**
   - `Users::OmniauthCallbacksController#google_oauth2`
   - Calls `User.from_omniauth(auth)` to find or create user
   - Generates JWT token using Devise-JWT

6. **Rails redirects to frontend**
   - URL: `${FRONTEND_URL}/auth/callback?token=...&email=...`
   - Includes JWT token and user email

7. **Frontend processes callback**
   - `OAuthCallback` component extracts token from URL
   - Stores token in `localStorage`
   - Shows success toast
   - Redirects to `/songs`

8. **User is authenticated**
   - All subsequent API requests use JWT token
   - User can access protected routes

## Environment Variables Required

### Backend (.env or docker-compose.yml):
```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env):
```bash
VITE_API_BASE_URL=http://localhost:3000
```

## Google Cloud Console Configuration

Required setup in Google Cloud Console:

### OAuth Consent Screen:
- App name: Chord Keeper
- User support email
- Authorized domains
- Scopes: email, profile, openid

### OAuth Client:
- Type: Web application
- Authorized JavaScript origins:
  - http://localhost:3000 (development)
  - https://your-domain.com (production)
- Authorized redirect URIs:
  - http://localhost:3000/users/auth/google_oauth2/callback (dev)
  - https://your-domain.com/users/auth/google_oauth2/callback (prod)

## Files Created/Modified

### Backend:
- ✅ `Gemfile` - Added OmniAuth gems
- ✅ `db/migrate/20251117000005_add_omniauth_to_users.rb` - New migration
- ✅ `config/initializers/omniauth.rb` - New initializer
- ✅ `app/models/user.rb` - Added OAuth support
- ✅ `app/controllers/users/omniauth_callbacks_controller.rb` - Implemented callbacks
- ✅ `config/routes.rb` - Added OAuth routes

### Frontend:
- ✅ `frontend/src/pages/auth/Login.tsx` - Added Google button
- ✅ `frontend/src/pages/auth/Register.tsx` - Added Google button
- ✅ `frontend/src/pages/auth/OAuthCallback.tsx` - New callback page
- ✅ `frontend/src/App.tsx` - Added callback route

### Documentation:
- ✅ `GOOGLE_OAUTH_SETUP.md` - Complete setup guide

## Testing Checklist

### Backend Tests:
- [ ] User can sign in with Google account
- [ ] New user is created from Google data
- [ ] Existing user is found by provider + uid
- [ ] JWT token is generated correctly
- [ ] OAuth callback redirects to frontend
- [ ] Error handling works (declined permissions)

### Frontend Tests:
- [ ] Google button appears on login page
- [ ] Google button appears on register page
- [ ] Clicking button redirects to Google
- [ ] Callback page receives token
- [ ] Token is stored in localStorage
- [ ] User is redirected to /songs
- [ ] Error messages display correctly

### Integration Tests:
- [ ] Complete OAuth flow works end-to-end
- [ ] User data is saved correctly
- [ ] Avatar URL is stored
- [ ] User can access protected routes after OAuth
- [ ] Logout works after OAuth login

## Next Steps

### To Complete Setup:

1. **Create Google Cloud Project**
   - Follow `GOOGLE_OAUTH_SETUP.md`

2. **Get OAuth Credentials**
   - Client ID and Client Secret

3. **Set Environment Variables**
   ```bash
   # In docker-compose.yml or .env
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   FRONTEND_URL=http://localhost:5173
   ```

4. **Restart Application**
   ```bash
   docker-compose down
   docker-compose up
   ```

5. **Test OAuth Flow**
   - Visit http://localhost:5173
   - Click "Continuar com Google"
   - Complete authentication

### Optional Enhancements:

1. **Add More OAuth Providers**
   - GitHub: `omniauth-github`
   - Facebook: `omniauth-facebook`
   - Microsoft: `omniauth-microsoft_office365`

2. **Link OAuth Accounts**
   - Allow users to link multiple OAuth providers
   - Update user association logic

3. **Profile Picture Integration**
   - Display user's Google avatar
   - Add avatar to navbar/sidebar

4. **Email Verification**
   - Trust Google-verified emails
   - Skip email confirmation for OAuth users

5. **Account Linking**
   - Allow linking existing email/password account with Google
   - Handle duplicate emails gracefully

## Security Considerations

### Implemented:
- ✅ CSRF protection disabled only for OAuth callbacks
- ✅ JWT tokens used for API authentication
- ✅ Unique index prevents duplicate OAuth accounts
- ✅ Random password generated for OAuth users
- ✅ Environment variables for sensitive credentials

### Recommendations:
- 🔒 Use HTTPS in production
- 🔒 Rotate Client Secret periodically
- 🔒 Monitor OAuth usage for anomalies
- 🔒 Implement rate limiting on OAuth endpoints
- 🔒 Add session timeout for JWT tokens
- 🔒 Validate redirect URIs strictly

## Common Issues & Solutions

### Issue: "redirect_uri_mismatch"
**Solution**: Ensure redirect URI in Google Console exactly matches:
- `http://localhost:3000/users/auth/google_oauth2/callback`

### Issue: "Invalid client"
**Solution**: Check environment variables are set correctly and match Google Console.

### Issue: OAuth works but JWT not generated
**Solution**: Verify Devise-JWT is configured properly and JwtDenylist model exists.

### Issue: Frontend doesn't receive token
**Solution**: Check FRONTEND_URL environment variable is set to frontend's base URL.

### Issue: CORS errors during OAuth
**Solution**: Ensure CORS is configured to allow OAuth callbacks in production.

## Support

For detailed setup instructions, see: `GOOGLE_OAUTH_SETUP.md`

For OAuth debugging:
1. Check Rails logs: `docker-compose logs web`
2. Check browser console for errors
3. Verify OAuth credentials in Google Console
4. Test redirect URIs are exactly correct
