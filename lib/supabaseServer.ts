20:44:19.632 Running build in Washington, D.C., USA (East) – iad1
20:44:19.632 Build machine configuration: 2 cores, 8 GB
20:44:19.647 Cloning github.com/raileats/Admin-Raileats (Branch: main, Commit: 4193805)
20:44:19.979 Cloning completed: 331.000ms
20:44:20.415 Restored build cache from previous deployment (29Uug6CqVr4p2G3fjMUK7HSChxbm)
20:44:20.772 Running "vercel build"
20:44:21.217 Vercel CLI 47.1.1
20:44:21.574 Installing dependencies...
20:44:22.696 
20:44:22.697 up to date in 891ms
20:44:22.697 
20:44:22.698 36 packages are looking for funding
20:44:22.698   run `npm fund` for details
20:44:22.725 Detected Next.js version: 13.4.10
20:44:22.729 Running "npm run build"
20:44:22.853 
20:44:22.853 > raileats-admin-example@1.0.0 build
20:44:22.853 > next build
20:44:22.853 
20:44:23.474 - info Creating an optimized production build...
20:44:23.733 - warn Found lockfile missing swc dependencies, run next locally to automatically patch
20:44:34.843 - warn Compiled with warnings
20:44:34.843 
20:44:34.843 ./node_modules/@supabase/realtime-js/dist/main/RealtimeClient.js
20:44:34.843 Critical dependency: the request of a dependency is an expression
20:44:34.844 
20:44:34.844 Import trace for requested module:
20:44:34.844 ./node_modules/@supabase/realtime-js/dist/main/RealtimeClient.js
20:44:34.844 ./node_modules/@supabase/realtime-js/dist/main/index.js
20:44:34.844 ./node_modules/@supabase/supabase-js/dist/main/index.js
20:44:34.844 ./app/admin/page.tsx
20:44:34.844 
20:44:34.844 ./node_modules/@supabase/realtime-js/dist/main/RealtimeClient.js
20:44:34.844 Critical dependency: the request of a dependency is an expression
20:44:34.844 
20:44:34.844 Import trace for requested module:
20:44:34.844 ./node_modules/@supabase/realtime-js/dist/main/RealtimeClient.js
20:44:34.844 ./node_modules/@supabase/realtime-js/dist/main/index.js
20:44:34.845 ./node_modules/@supabase/supabase-js/dist/main/index.js
20:44:34.845 ./lib/supabaseServer.ts
20:44:34.845 ./app/api/stations/route.ts
20:44:34.845 
20:44:34.846 - info Linting and checking validity of types...
20:44:35.160 We detected TypeScript in your project and reconfigured your tsconfig.json file for you. Strict-mode is set to false by default.
20:44:35.160 
20:44:35.161 The following suggested values were added to your tsconfig.json. These values can be changed to fit your project's needs:
20:44:35.162 
20:44:35.162 	- include was updated to add '.next/types/**/*.ts'
20:44:35.162 	- plugins was updated to add { name: 'next' }
20:44:35.162 	- strictNullChecks was set to true
20:44:35.162 
20:44:41.962 Failed to compile.
20:44:41.962 
20:44:41.962 ./app/admin/page.tsx:6:3
20:44:41.962 Type error: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
20:44:41.962   Type 'undefined' is not assignable to type 'string'.
20:44:41.962 
20:44:41.963 [0m [90m 4 | [39m[0m
20:44:41.963 [0m [90m 5 | [39m[36mconst[39m supabase [33m=[39m createClient([0m
20:44:41.963 [0m[31m[1m>[22m[39m[90m 6 | [39m  process[33m.[39menv[33m.[39m[33mNEXT_PUBLIC_SUPABASE_URL[39m[33m,[39m[0m
20:44:41.963 [0m [90m   | [39m  [31m[1m^[22m[39m[0m
20:44:41.963 [0m [90m 7 | [39m  process[33m.[39menv[33m.[39m[33mNEXT_PUBLIC_SUPABASE_ANON_KEY[39m[0m
20:44:41.963 [0m [90m 8 | [39m)[33m;[39m[0m
20:44:41.963 [0m [90m 9 | [39m[0m
20:44:42.034 Error: Command "npm run build" exited with 1
