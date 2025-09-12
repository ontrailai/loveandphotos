# Claude Code Configuration - Love & Photos Project

## MCP Servers Setup ✅

### 1. Render MCP Server
- **Status**: ✅ Connected and working
- **Access**: Available via `/mcp` command
- **Configuration**: HTTP transport in `.claude.json`
- **API Key**: Configured in `.claude.json`
- **Available Tools**:
  - `mcp__render__list_services`
  - `mcp__render__get_service`
  - `mcp__render__deploy_service`
  - `mcp__render__create_service`
  - `mcp__render__delete_service`
  - `mcp__render__get_deploys`
  - `mcp__render__manage_env_vars`
  - `mcp__render__manage_domains`

### 2. Supabase MCP Server
- **Status**: ✅ Connected and working
- **Package**: `@supabase/mcp-server-supabase`
- **Project Ref**: `ldxscjxoakqrmkgqwwhr`
- **Project URL**: `https://ldxscjxoakqrmkgqwwhr.supabase.co`
- **Access Token**: `sbp_b5f79651815cb5c2a79a614f8785001ee0e43b26`
- **Note**: Does NOT appear in `/mcp` command but is fully functional
- **Capabilities**: Can query database, list tables, perform CRUD operations
- **Configuration Files**:
  - Local config via `claude mcp add` command
  - Project config in `.mcp.json`

### 3. Render CLI
- **Status**: ✅ Installed and configured
- **Installation**: Via shell script from Render
- **Path**: Added to system PATH
- **Usage**: `render` command available globally
- **Features**: Deploy, manage services, view logs

### 4. Supabase CLI
- **Status**: ✅ Installed and configured
- **Version**: 2.40.7
- **Installation**: Via npx (no global install needed)
- **Access Token**: `sbp_b5f79651815cb5c2a79a614f8785001ee0e43b26`
- **Linked Project**: `ldxscjxoakqrmkgqwwhr` (Love & Photos)
- **Usage**: Use `npx supabase` for all commands (use with sudo for Docker commands)
- **Working Commands**:
  - `npx supabase projects list` - List all projects
  - `npx supabase gen types typescript --linked` - Generate TypeScript types
  - `npx supabase login --token <token>` - Login with access token
  - `npx supabase link --project-ref <ref>` - Link to project
  - `sudo npx supabase db dump --linked` - Dump database schema (requires Docker)
  - `sudo npx supabase start` - Start local Supabase instance (requires Docker)
  - `sudo npx supabase status` - Check local instance status (requires Docker)

### 5. Docker Engine
- **Status**: ✅ Installed directly in WSL
- **Version**: 28.4.0
- **Installation**: Native Docker Engine in WSL (not Docker Desktop)
- **Sudo Password**: rypasha4269 (for automated commands)
- **Usage**: 
  - Start service: `sudo service docker start`
  - Test: `sudo docker run hello-world`
  - Note: User added to docker group but requires sudo for now
- **Benefits**: 
  - Enables all Supabase CLI local development features
  - Can run local Supabase instance for testing
  - Database dumps and migrations work

## Database Information

### Supabase Database Tables:
- `users` - User accounts
- `photographers` - Photographer profiles
- `pay_tiers` - Pricing tiers (Bronze, Silver, Gold, Platinum)
- `packages` - Photography packages
- `portfolio_items` - Portfolio content
- `reviews` - Customer reviews
- `availability` - Photographer calendars
- `bookings` - Booking requests
- `training_modules` - Training content
- `training_status` - Training progress
- `contact_submissions` - Contact form data
- `messages` - Internal messaging

## Important Commands

### Check MCP Status:
```bash
claude mcp list
```

### Render CLI Commands:
```bash
render workspaces list
render services list
render deploy
```

### Test Supabase Connection:
The Supabase MCP works behind the scenes. You can ask Claude to query the database directly, like:
- "List all tables in the Supabase database"
- "Show me the data in the pay_tiers table"
- "Count records in contact_submissions"

## Environment Variables
- Supabase Service Role Key is configured
- Render API keys are configured
- All sensitive keys are properly stored

## Notes for Future Sessions
1. The Supabase MCP server won't show in `/mcp` but it IS working
2. Use the JavaScript Supabase client for complex operations
3. The Render MCP tools are accessible via `mcp__render__` prefix
4. All MCP servers auto-connect when VS Code starts

## Generated Files
- `supabase/database.types.ts` - Auto-generated TypeScript types from database schema
- `supabase/schema-docker-test.sql` - Database schema dump (created with Docker)

Last Updated: 2025-01-12 (Supabase CLI and Docker added)