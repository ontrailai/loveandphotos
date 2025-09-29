# Render Deployment Process

## Critical: Auto-deploy is DISABLED
- The Render service has auto-deploy turned OFF even though the config shows `autoDeploy: "yes"`
- Git pushes DO NOT trigger deployments automatically
- Manual deployment is ALWAYS required

## How to Deploy to Render

### Method 1: Render CLI (PREFERRED)
```bash
# Trigger deployment with cache clearing
render deploys create srv-d325l0ur433s7392f5cg --clear-cache --confirm -o json
```

### Method 2: MCP Server (Backup - may not work reliably)
```bash
# Use MCP Render server
mcp__render__deploy_service with serviceId: srv-d325l0ur433s7392f5cg
```

### Method 3: Manual Dashboard (Last resort)
1. Go to https://dashboard.render.com/web/srv-d325l0ur433s7392f5cg
2. Click "Manual Deploy" → "Deploy latest commit"

## Service Details
- Service ID: `srv-d325l0ur433s7392f5cg`
- Service Name: "Love & Photos"
- URL: https://love-and-photos.onrender.com
- Branch: RP

## Deployment Workflow
1. Make code changes
2. Build locally: `npm run build`
3. Commit and push: `git add -A && git commit -m "message" && git push origin RP`
4. **MANUALLY DEPLOY**: `render deploys create srv-d325l0ur433s7392f5cg --clear-cache --confirm -o json`
5. Wait 2-3 minutes for deployment to complete

## Never Forget
- Pushing to git does NOT deploy automatically
- Always use `--clear-cache` flag to avoid stale build issues
- Always use `-o json` for non-interactive mode
- Check deployment status with: `render deploys list srv-d325l0ur433s7392f5cg -o json`