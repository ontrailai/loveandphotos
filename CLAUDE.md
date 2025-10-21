# Claude Code Configuration - Love & Photos Project

## Important User Preferences
**DESKTOP ORGANIZATION**:
- ⚠️ **NEVER save files directly on the desktop** - User prefers a clean desktop
- ✅ Always save files within project directories (e.g., `/mnt/c/Users/riley/Desktop/loveandphotos/`)
- ✅ Create subdirectories for organization (e.g., `scripts/`, `tests/`, `docs/`)
- ❌ Do not create loose files on `/mnt/c/Users/riley/Desktop/`

**DEVELOPMENT SERVER MANAGEMENT**:
- ⚠️ **ALWAYS restart the dev server after making changes to React components or frontend code**
- ✅ After any frontend changes: Kill current server → Restart with `npm run dev:direct`
- ✅ Run in background mode to continue working
- 📝 This ensures the user sees changes immediately without having to ask

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
- **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkeHNjanhvYWtxcm1rZ3F3d2hyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQ2Nzc0OCwiZXhwIjoyMDczMDQzNzQ4fQ.jnnrsLJeB6B43_N-aaMIbn-9dyaOgQYtIIq308yOVI8`
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

### 6. Airtable MCP Server
- **Status**: ✅ Connected and working
- **Package**: `airtable-mcp-server`
- **API Key**: `[REDACTED - Configured in .claude.json]`
- **Configuration**: Added via `claude mcp add` command
- **Available Bases**:
  - Personal Finances (app1m5WHgxXaadPgR)
  - Property Management by Softr (appwngtpDWnLLnk3n)
  - Client Connect (appKex2kYPcrWNI2O)
  - Leadnest (appKpqYzELSUqWNxO)
  - Financials (appCcY6bvOsymEYGp)
  - Cars2You (app1HnBn9IJXfXf2r)
  - Client Portal (Demo) (app5PD6QgFaSmACZy)
  - Fleet Maintenance (apptn5FTi9yfhFiqk)
  - fleetlynk tasks (appA606mcZv5T3pPR)
  - QuickBooks Transaction Validator (appZPTjyeUT1PCz8l)
  - Month Close (appNv0kdIHiMP1wg5)
- **Available Tools**:
  - `mcp__airtable__list_bases` - List all accessible bases
  - `mcp__airtable__list_tables` - List tables in a base
  - `mcp__airtable__describe_table` - Get table schema
  - `mcp__airtable__list_records` - List records from a table
  - `mcp__airtable__search_records` - Search for records
  - `mcp__airtable__get_record` - Get a specific record
  - `mcp__airtable__create_record` - Create a new record
  - `mcp__airtable__update_records` - Update records
  - `mcp__airtable__delete_records` - Delete records
  - `mcp__airtable__create_table` - Create a new table
  - `mcp__airtable__update_table` - Update table metadata
  - `mcp__airtable__create_field` - Create a field
  - `mcp__airtable__update_field` - Update field metadata

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

### Test Airtable Connection:
You can ask Claude to interact with your Airtable bases:
- "List all my Airtable bases"
- "Show me the tables in [base name]"
- "List records from [table name] in [base name]"
- "Create a new record in [table name]"

## Environment Variables
- Supabase Service Role Key is configured
- Render API keys are configured
- Airtable Personal Access Token is configured
- All sensitive keys are properly stored

## Notes for Future Sessions
1. The Supabase MCP server won't show in `/mcp` but it IS working
2. Use the JavaScript Supabase client for complex operations
3. The Render MCP tools are accessible via `mcp__render__` prefix
4. The Airtable MCP tools are accessible via `mcp__airtable__` prefix
5. All MCP servers auto-connect when VS Code starts

## Generated Files
- `supabase/database.types.ts` - Auto-generated TypeScript types from database schema
- `supabase/schema-docker-test.sql` - Database schema dump (created with Docker)

Last Updated: 2025-10-20 (Added Airtable MCP Server)
# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
NEVER save files directly on the desktop - always use project directories.