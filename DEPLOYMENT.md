# Deployment Checklist

## Supabase
1. Create project.
2. Go to SQL Editor.
3. Run `supabase/schema.sql`.
4. In Authentication, enable email OTP.
5. Optionally invite:
   - shishiny@gmail.com
   - Mariam's email

## Railway
1. Push this folder to GitHub.
2. In Railway choose **New Project -> Deploy from GitHub Repo**.
3. Add environment variables:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
4. Railway commands:
   - Build: `npm run build`
   - Start: `npm start`

## Verify
- Login using magic link.
- Confirm `shishiny@gmail.com` becomes `admin`.
- Confirm Mariam becomes `contributor`.
- Update a milestone and verify progress/status refresh.

## Optional next enhancements
- Add create/edit/delete for pillars and milestones
- Add weekly review notes
- Add notification reminders
- Add export to PDF
