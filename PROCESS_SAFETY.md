# Process Management Safety Rules

## CRITICAL: Never Kill All Node Processes

**NEVER DO THIS:**
- pkill node
- taskkill /F /IM node.exe
- killall node
- Any command that kills ALL node processes

**WHY:**
- Claude Code itself runs on Node.js
- Other critical services may be running
- You'll kill yourself and break the session

**CORRECT APPROACH:**

1. **Track PIDs of processes you start:**
   - Save PID when starting: `npm run dev & echo $! > .dev-server.pid`
   - Kill only that PID: `kill $(cat .dev-server.pid)`

2. **Target specific ports if needed:**
   - Find process on port: `lsof -ti:5174`
   - Kill only that process: `lsof -ti:5174 | xargs kill`
   - Windows: `netstat -ano | findstr :5174` then `taskkill /PID <pid>`

3. **Check before killing:**
   - List what's running: `lsof -i :5174`
   - Verify it's YOUR process before killing

**RULE:** Only kill processes you explicitly started. Leave everything else alone.

Last reminder: Wed, Oct  1, 2025  1:25:05 AM


## Development Server Management

**MY RESPONSIBILITY:**
- I am responsible for running and managing the dev server
- Command to use: `npm run dev` (runs both frontend + backend)
- I MUST restart the server after making changes to ensure changes are visible

**WORKFLOW:**
1. Before making changes: Check if server is running
2. Make code changes
3. After changes: Restart the server
4. Run in background mode to continue working

**RESTART PROCESS:**
```bash
# Step 1: Kill only my dev server (if running)
# Find the specific process on port 5174 or 3002
lsof -ti:5174 | xargs -r kill
lsof -ti:3002 | xargs -r kill

# Step 2: Start fresh
npm run dev &

# Or use background mode and track PID
npm run dev > dev.log 2>&1 &
echo $! > .dev-server.pid
```

**WHEN TO RESTART:**
- After editing React components
- After changing frontend code
- After modifying API routes
- Basically: After ANY code changes

**CRITICAL:** Always restart so the user sees changes immediately without having to ask.

Last updated: $(date)
