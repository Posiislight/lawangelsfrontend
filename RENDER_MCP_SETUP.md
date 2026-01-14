# Render MCP Server Setup Guide

This guide will help you set up Render's Model Context Protocol (MCP) server to manage your Render infrastructure directly from Cursor.

## Overview

The Render MCP server allows you to:
- Spin up new services
- Query your databases
- Analyze metrics and logs
- Manage your Render infrastructure using natural language prompts

## Prerequisites

1. A Render account with API access
2. Cursor installed and configured

## Setup Steps

### 1. Create a Render API Key

1. Go to your [Render Account Settings](https://dashboard.render.com/settings#api-keys)
2. Click "Create API Key"
3. Give it a descriptive name (e.g., "Cursor MCP Access")
4. **Copy the API key immediately** - you won't be able to see it again!

> ⚠️ **Security Note**: Render API keys are broadly scoped and grant access to all workspaces and services your account can access. Make sure you're comfortable with this level of access.

### 2. Configure Cursor MCP

On Windows, the Cursor MCP configuration file is located at:
```
%APPDATA%\Cursor\mcp.json
```

Or in PowerShell:
```
$env:APPDATA\Cursor\mcp.json
```

#### Option A: Create the file manually

1. Navigate to `%APPDATA%\Cursor\` (or create the directory if it doesn't exist)
2. Create a file named `mcp.json`
3. Add the following configuration:

```json
{
  "mcpServers": {
    "render": {
      "url": "https://mcp.render.com/mcp",
      "headers": {
        "Authorization": "Bearer <YOUR_API_KEY>"
      }
    }
  }
}
```

4. Replace `<YOUR_API_KEY>` with your actual Render API key from step 1
5. Save the file

#### Option B: Use PowerShell to create the file

Run this command in PowerShell (replace `<YOUR_API_KEY>` with your actual API key):

```powershell
$configPath = "$env:APPDATA\Cursor\mcp.json"
$configDir = Split-Path -Parent $configPath
if (-not (Test-Path $configDir)) {
    New-Item -ItemType Directory -Path $configDir -Force
}

$config = @{
    mcpServers = @{
        render = @{
            url = "https://mcp.render.com/mcp"
            headers = @{
                Authorization = "Bearer <YOUR_API_KEY>"
            }
        }
    }
} | ConvertTo-Json -Depth 10

Set-Content -Path $configPath -Value $config
```

### 3. Restart Cursor

After creating the configuration file, restart Cursor to load the MCP server configuration.

### 4. Set Your Workspace

When you first use the MCP server, you'll need to set your Render workspace. You can do this by prompting Cursor:

```
Set my Render workspace to [YOUR_WORKSPACE_NAME]
```

If you don't know your workspace name, you can ask:
```
List my Render workspaces
```

## Example Prompts

Once set up, you can use natural language prompts like:

### Service Management
- "Create a new database named user-db with 5 GB storage"
- "List all my Render services"
- "Show me details about my quiz-backend service"

### Database Queries
- "Query my Render database for the most recent user signups"
- "What are the daily signup counts for the last 30 days?"

### Monitoring & Troubleshooting
- "What was the busiest traffic day for my service this month?"
- "Show me the most recent error-level logs for my API service"
- "Why isn't my site at example.onrender.com working?"

### Metrics
- "What did my service's autoscaling behavior look like yesterday?"
- "Show me CPU and memory usage for my backend service"

## Supported Actions

The Render MCP server supports:

| Resource Type | Actions |
|--------------|---------|
| **Workspaces** | List, set, fetch details |
| **Services** | Create web services/static sites, list, get details, update environment variables |
| **Deploys** | List deploy history, get deploy details |
| **Logs** | List logs with filters, list log label values |
| **Metrics** | Fetch CPU/memory usage, instance counts, response times, bandwidth usage |
| **Postgres** | Create databases, list databases, get details, run read-only SQL queries |
| **Key Value** | List instances, get details, create instances |

## Limitations

- Only supports creation of web services, static sites, Postgres databases, and Key Value instances
- Does not support free instances
- Does not support all configuration options (e.g., image-backed services, IP allowlists)
- Cannot modify or delete resources (except environment variables)
- Cannot trigger deploys or modify scaling settings

## Troubleshooting

### MCP server not working

1. **Check the config file location**: Make sure `mcp.json` is in `%APPDATA%\Cursor\`
2. **Verify JSON syntax**: Use a JSON validator to ensure your config file is valid
3. **Check API key**: Make sure your API key is correct and hasn't been revoked
4. **Restart Cursor**: After making changes, fully restart Cursor
5. **Check Cursor logs**: Look for MCP-related errors in Cursor's developer console

### API key issues

- If you've lost your API key, create a new one from the Render dashboard
- Make sure the API key is properly formatted in the config (should start with `Bearer `)

## Additional Resources

- [Render MCP Server Documentation](https://render.com/docs/mcp)
- [Model Context Protocol Documentation](https://modelcontextprotocol.io/introduction)
- [Cursor MCP Documentation](https://docs.cursor.com/context/mcp)
- [Render MCP Server GitHub Repository](https://github.com/render-oss/render-mcp-server)

## Security Best Practices

1. **Never commit your API key** to version control
2. **Use environment-specific API keys** if you have multiple environments
3. **Rotate API keys regularly** for security
4. **Review API key permissions** - remember they grant broad access
5. **Monitor API usage** in your Render dashboard
