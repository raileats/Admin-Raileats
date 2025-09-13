# If there's an old JS file, remove it to avoid bundler confusion
git rm lib/supabaseClient.js || true

# Add new TS file
git add lib/supabaseClient.ts

git commit -m "fix(supabase): replace JS client with TS client and export named + default"
git push
