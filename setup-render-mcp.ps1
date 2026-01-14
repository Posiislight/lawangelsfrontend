# Render MCP Server Setup Script for Cursor
# This script creates the MCP configuration file for Cursor on Windows

Write-Host "Render MCP Server Setup for Cursor" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check if API key is provided as argument
$apiKey = $args[0]

if (-not $apiKey) {
    Write-Host "Please provide your Render API key as an argument." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Usage: .\setup-render-mcp.ps1 <YOUR_API_KEY>" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To get your API key:" -ForegroundColor Yellow
    Write-Host "1. Go to https://dashboard.render.com/settings#api-keys" -ForegroundColor Yellow
    Write-Host "2. Click Create API Key" -ForegroundColor Yellow
    Write-Host "3. Copy the key and run this script with it" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Validate API key format (basic check - should not contain spaces and be reasonably long)
if ($apiKey.Length -lt 20) {
    Write-Host "Warning: API key seems too short. Please verify it's correct." -ForegroundColor Yellow
    $confirm = Read-Host "Continue anyway? (y/n)"
    if ($confirm -ne "y" -and $confirm -ne "Y") {
        exit 1
    }
}

# Define config file path
$configPath = "$env:APPDATA\Cursor\mcp.json"
$configDir = Split-Path -Parent $configPath

Write-Host "Configuration will be saved to: $configPath" -ForegroundColor Gray
Write-Host ""

# Create directory if it doesn't exist
if (-not (Test-Path $configDir)) {
    Write-Host "Creating Cursor config directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $configDir -Force | Out-Null
    Write-Host "[OK] Directory created" -ForegroundColor Green
}

# Check if mcp.json already exists
if (Test-Path $configPath) {
    Write-Host "Warning: mcp.json already exists!" -ForegroundColor Yellow
    Write-Host ""
    
    # Try to read existing config
    try {
        $existingConfig = Get-Content $configPath | ConvertFrom-Json
        if ($existingConfig.mcpServers.render) {
            Write-Host "Found existing Render MCP configuration." -ForegroundColor Yellow
            $overwrite = Read-Host "Overwrite existing configuration? (y/n)"
            if ($overwrite -ne "y" -and $overwrite -ne "Y") {
                Write-Host "Setup cancelled." -ForegroundColor Red
                exit 0
            }
        }
    } catch {
        Write-Host "Existing file is not valid JSON. It will be overwritten." -ForegroundColor Yellow
    }
}

# Create configuration object
$config = @{
    mcpServers = @{
        render = @{
            url = "https://mcp.render.com/mcp"
            headers = @{
                Authorization = "Bearer $apiKey"
            }
        }
    }
}

# Convert to JSON with proper formatting
$jsonConfig = $config | ConvertTo-Json -Depth 10

# Write to file
try {
    Set-Content -Path $configPath -Value $jsonConfig -Encoding UTF8
    Write-Host "[OK] Configuration file created successfully!" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "[ERROR] Error creating configuration file: $_" -ForegroundColor Red
    exit 1
}

# Verify the file was created correctly
if (Test-Path $configPath) {
    try {
        $verifyConfig = Get-Content $configPath | ConvertFrom-Json
        if ($verifyConfig.mcpServers.render.url -eq "https://mcp.render.com/mcp") {
            Write-Host "[OK] Configuration verified!" -ForegroundColor Green
            Write-Host ""
        }
    } catch {
        Write-Host "[WARNING] Could not verify configuration file format." -ForegroundColor Yellow
        Write-Host ""
    }
}

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Restart Cursor to load the MCP configuration" -ForegroundColor White
Write-Host "2. Set your Render workspace by prompting: Set my Render workspace to [WORKSPACE_NAME]" -ForegroundColor White
Write-Host "3. Start using prompts like: List my Render services" -ForegroundColor White
Write-Host ""
Write-Host "For more examples, see RENDER_MCP_SETUP.md" -ForegroundColor Gray
Write-Host ""
