# Department Library

Next.js + Supabase (accounts, data, ads) + Google Drive (PDF files). Deploys to Vercel.

## 1. Supabase
1. Create a project. SQL Editor > paste `supabase/schema.sql` > Run.
2. Project Settings > API: copy the URL, anon key and service_role key.
3. Authentication > Providers > Email: turn off "Confirm email" if you want instant signups.

## 2. Google Drive (one time)
1. console.cloud.google.com > create a project > APIs and Services > Library > enable **Google Drive API**.
2. OAuth consent screen: User type External, fill the app name and your email. Then **Publish app** (status "In production"). If you leave it in Testing, the connection expires after 7 days.
3. Credentials > Create credentials > OAuth client ID > Web application.
   Authorised redirect URI: `https://YOUR-SITE.vercel.app/api/google/callback`
4. Copy the Client ID and Client secret.

## 3. Vercel
Import the repo and add these environment variables:
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`. Deploy.

## 4. Make yourself the owner
Sign up on the site, then in the Supabase SQL Editor:
`update profiles set role = 'owner' where email = 'YOUR_EMAIL';`
Sign out and in. The menu now shows Admin, Ads and Google Drive.

## 5. Connect Drive
Menu > Google Drive > Connect. Allow access, copy the code shown, add it in Vercel as `GOOGLE_REFRESH_TOKEN`, then redeploy.

## 6. Start
Admin > Courses: add courses. Admin > People: make course reps. Ads: add sponsors.

Edit the site name, department, emails and developer credit in `lib/config.js`.
