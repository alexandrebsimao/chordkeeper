# Google OAuth Setup Guide

## Overview
This guide will help you configure Google OAuth authentication for Chord Keeper. Users will be able to sign in using their Google accounts.

## Prerequisites
- A Google Cloud Platform account
- Access to your application's environment variables

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: **Chord Keeper**
4. Click "Create"

## Step 2: Configure OAuth Consent Screen

1. In the sidebar, go to **APIs & Services** → **OAuth consent screen**
2. Select **External** user type (unless you have Google Workspace)
3. Click **Create**

### App Information:
- **App name**: Chord Keeper
- **User support email**: your-email@example.com
- **App logo**: (optional) Upload your app logo
- **Application home page**: https://your-domain.com
- **Authorized domains**: your-domain.com

### Developer contact information:
- **Email addresses**: your-email@example.com

4. Click **Save and Continue**

### Scopes:
5. Click **Add or Remove Scopes**
6. Select these scopes:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
7. Click **Update** → **Save and Continue**

### Test users (for development):
8. Click **Add Users**
9. Add your test email addresses
10. Click **Save and Continue**

## Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Application type**: **Web application**
4. **Name**: Chord Keeper Web Client

### Authorized JavaScript origins:
Add these URLs:
- `http://localhost:3000` (development)
- `https://your-production-domain.com` (production)

### Authorized redirect URIs:
Add these URLs:
- `http://localhost:3000/users/auth/google_oauth2/callback` (development)
- `https://your-production-domain.com/users/auth/google_oauth2/callback` (production)

5. Click **Create**

## Step 4: Save Credentials

You'll see a dialog with:
- **Client ID**: Something like `123456789-abc123def456.apps.googleusercontent.com`
- **Client Secret**: Something like `GOCSPX-abc123def456`

**Important**: Copy these values immediately!

## Step 5: Configure Environment Variables

### For Development (Docker):

Edit your `docker-compose.yml` or `.env` file:

```yaml
# docker-compose.yml
services:
  web:
    environment:
      GOOGLE_CLIENT_ID: "your-client-id-here"
      GOOGLE_CLIENT_SECRET: "your-client-secret-here"
      FRONTEND_URL: "http://localhost:5173"
```

Or create/update `.env`:

```bash
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
FRONTEND_URL=http://localhost:5173
```

### For Production:

#### Option 1: Environment Variables
Set these in your hosting platform (Heroku, AWS, etc.):

```bash
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
FRONTEND_URL=https://your-frontend-domain.com
```

#### Option 2: Rails Encrypted Credentials
```bash
EDITOR="code --wait" rails credentials:edit --environment production
```

Add:
```yaml
google:
  client_id: your-client-id-here
  client_secret: your-client-secret-here
```

Then update `config/initializers/omniauth.rb`:
```ruby
config.omniauth :google_oauth2,
  Rails.application.credentials.dig(:google, :client_id),
  Rails.application.credentials.dig(:google, :client_secret),
  {
    scope: 'email,profile',
    prompt: 'select_account',
    access_type: 'online',
    name: 'google'
  }
```

## Step 6: Restart Your Application

```bash
# Stop containers
docker-compose down

# Rebuild and start
docker-compose up --build
```

## Step 7: Test the Integration

1. Open your application: http://localhost:5173
2. Click on the login page
3. Click **"Continuar com Google"** button
4. You should be redirected to Google's login page
5. Select your Google account
6. Grant permissions
7. You should be redirected back to your app and logged in

## How It Works

### Authentication Flow:

```
1. User clicks "Continuar com Google"
   ↓
2. Frontend redirects to: /users/auth/google_oauth2
   ↓
3. Rails redirects to Google OAuth
   ↓
4. User logs in and grants permissions
   ↓
5. Google redirects to: /users/auth/google_oauth2/callback
   ↓
6. Rails creates/finds user and generates JWT token
   ↓
7. Rails redirects to frontend: /auth/callback?token=...&email=...
   ↓
8. Frontend stores JWT token in localStorage
   ↓
9. User is redirected to /songs
```

### User Model Fields:

When a user signs in with Google, these fields are populated:

- `provider`: "google_oauth2"
- `uid`: User's Google ID (unique)
- `email`: User's email from Google
- `name`: User's full name from Google
- `avatar_url`: User's profile picture URL
- `password`: Random secure password (for compatibility)

### Database Index:

A unique index on `[provider, uid]` ensures one Google account = one user account.

## Troubleshooting

### Error: "redirect_uri_mismatch"
- **Cause**: The redirect URI in your request doesn't match what's configured in Google Cloud Console
- **Solution**: Make sure the redirect URI exactly matches:
  - Development: `http://localhost:3000/users/auth/google_oauth2/callback`
  - Production: `https://your-domain.com/users/auth/google_oauth2/callback`

### Error: "access_denied"
- **Cause**: User declined permission or app is not verified
- **Solution**: 
  - For testing: Add user to test users list
  - For production: Complete app verification process

### Error: "Invalid client"
- **Cause**: Wrong Client ID or Client Secret
- **Solution**: Double-check your environment variables match Google Cloud Console

### User sees "This app isn't verified"
- **Cause**: App is in testing mode
- **Solution**: 
  - For development: Click "Advanced" → "Go to Chord Keeper (unsafe)"
  - For production: Submit app for verification or keep in testing mode with approved test users

### OAuth callback doesn't work
- **Cause**: FRONTEND_URL environment variable not set or incorrect
- **Solution**: Make sure FRONTEND_URL is set to your frontend's base URL
  - Development: `http://localhost:5173`
  - Production: `https://your-frontend-domain.com`

## Security Best Practices

1. **Never commit credentials**: Keep Client ID and Secret out of git
2. **Use different credentials for dev/prod**: Create separate OAuth clients
3. **Restrict redirect URIs**: Only add URIs you actually use
4. **Rotate secrets regularly**: Update Client Secret periodically
5. **Monitor OAuth usage**: Check Google Cloud Console for suspicious activity

## Additional Configuration

### Custom User Data

To capture additional user information from Google, update `app/models/user.rb`:

```ruby
def self.from_omniauth(auth)
  where(provider: auth.provider, uid: auth.uid).first_or_create do |user|
    user.email = auth.info.email
    user.password = Devise.friendly_token[0, 20]
    user.name = auth.info.name
    user.avatar_url = auth.info.image
    
    # Additional fields (if you add them to the users table)
    # user.first_name = auth.info.first_name
    # user.last_name = auth.info.last_name
    # user.locale = auth.extra.raw_info.locale
  end
end
```

### Requesting Additional Scopes

To request more permissions, update `config/initializers/omniauth.rb`:

```ruby
config.omniauth :google_oauth2,
  ENV['GOOGLE_CLIENT_ID'],
  ENV['GOOGLE_CLIENT_SECRET'],
  {
    scope: 'email,profile,openid',  # Add more scopes here
    prompt: 'select_account',
    access_type: 'offline',  # Change to 'offline' for refresh tokens
    name: 'google'
  }
```

Available scopes:
- `email` - User's email address
- `profile` - Basic profile info (name, picture)
- `openid` - OpenID Connect
- `https://www.googleapis.com/auth/drive.readonly` - Read Google Drive files
- [More scopes](https://developers.google.com/identity/protocols/oauth2/scopes)

## Production Deployment Checklist

- [ ] Create production OAuth client in Google Cloud Console
- [ ] Add production domain to OAuth consent screen
- [ ] Add production redirect URIs
- [ ] Set production environment variables
- [ ] Test OAuth flow in production
- [ ] (Optional) Submit app for verification if needed
- [ ] Monitor OAuth errors in logs
- [ ] Set up alerting for authentication failures

## References

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [OmniAuth Google OAuth2 Gem](https://github.com/zquestz/omniauth-google-oauth2)
- [Devise OmniAuth](https://github.com/heartcombo/devise/wiki/OmniAuth:-Overview)

## Support

If you encounter issues:
1. Check the Rails logs: `docker-compose logs web`
2. Check browser console for frontend errors
3. Verify environment variables are set correctly
4. Ensure redirect URIs match exactly
