# Script to check Render deployment status and recent logs
param(
    [Parameter(Mandatory=$false)]
    [string]$ApiKey
)

# Try to get API key from MCP config if not provided
if (-not $ApiKey) {
    $mcpConfigPath = Join-Path $env:APPDATA "Cursor\mcp.json"
    if (Test-Path $mcpConfigPath) {
        try {
            $mcpConfig = Get-Content $mcpConfigPath | ConvertFrom-Json
            $authHeader = $mcpConfig.mcpServers.render.headers.Authorization
            if ($authHeader -match "Bearer (.+)") {
                $ApiKey = $matches[1]
            }
        } catch {}
    }
}

if (-not $ApiKey) {
    Write-Host "Error: Render API key required" -ForegroundColor Red
    exit 1
}

$services = @("quiz-backend", "quiz-backend-staging")

foreach ($serviceName in $services) {
    Write-Host ""
    Write-Host ("=" * 60) -ForegroundColor Cyan
    Write-Host "Checking: $serviceName" -ForegroundColor Cyan
    Write-Host ("=" * 60) -ForegroundColor Cyan
    
    try {
        # Get service details
        $servicesResponse = Invoke-RestMethod -Uri "https://api.render.com/v1/services" `
            -Headers @{
                "Authorization" = "Bearer $ApiKey"
                "Accept" = "application/json"
            } `
            -Method Get
        
        $service = $servicesResponse | Where-Object { 
            ($_.service.name -eq $serviceName) -or ($_.name -eq $serviceName)
        } | Select-Object -First 1
        
        if (-not $service) {
            Write-Host "Service not found: $serviceName" -ForegroundColor Yellow
            continue
        }
        
        $serviceId = if ($service.service) { $service.service.id } else { $service.id }
        $actualName = if ($service.service) { $service.service.name } else { $service.name }
        
        Write-Host "Service ID: $serviceId" -ForegroundColor Gray
        Write-Host "Service Name: $actualName" -ForegroundColor Gray
        
        # Get recent deploys
        Write-Host ""
        Write-Host "Recent Deployments:" -ForegroundColor Green
        try {
            $deploysResponse = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$serviceId/deploys?limit=5" `
                -Headers @{
                    "Authorization" = "Bearer $ApiKey"
                    "Accept" = "application/json"
                } `
                -Method Get
            
            if ($deploysResponse -and $deploysResponse.Count -gt 0) {
                foreach ($deploy in $deploysResponse) {
                    $deployId = if ($deploy.deploy) { $deploy.deploy.id } else { $deploy.id }
                    $status = if ($deploy.deploy) { $deploy.deploy.status } else { $deploy.status }
                    $createdAt = if ($deploy.deploy) { $deploy.deploy.createdAt } else { $deploy.createdAt }
                    $commit = if ($deploy.deploy) { $deploy.deploy.commit.message } else { $deploy.commit.message }
                    
                    $statusColor = switch ($status) {
                        "live" { "Green" }
                        "build_failed" { "Red" }
                        "update_failed" { "Red" }
                        "canceled" { "Yellow" }
                        default { "White" }
                    }
                    
                    Write-Host "  Deploy ID: $deployId" -ForegroundColor Gray
                    Write-Host "  Status: $status" -ForegroundColor $statusColor
                    Write-Host "  Created: $createdAt" -ForegroundColor Gray
                    if ($commit) {
                        Write-Host "  Commit: $commit" -ForegroundColor Gray
                    }
                    Write-Host ""
                }
            } else {
                Write-Host "  No deployments found" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "  Error fetching deployments: $_" -ForegroundColor Red
        }
        
        # Get recent logs (if available)
        Write-Host "Recent Logs (last 50 lines):" -ForegroundColor Green
        try {
            $logsResponse = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$serviceId/logs?limit=50" `
                -Headers @{
                    "Authorization" = "Bearer $ApiKey"
                    "Accept" = "application/json"
                } `
                -Method Get
            
            if ($logsResponse -and $logsResponse.Count -gt 0) {
                foreach ($log in $logsResponse) {
                    $level = if ($log.level) { $log.level } else { "info" }
                    $message = if ($log.message) { $log.message } else { $log }
                    $timestamp = if ($log.timestamp) { $log.timestamp } else { "" }
                    
                    $levelColor = switch ($level) {
                        "error" { "Red" }
                        "warn" { "Yellow" }
                        default { "Gray" }
                    }
                    
                    if ($timestamp) {
                        Write-Host "[$timestamp] " -NoNewline -ForegroundColor DarkGray
                    }
                    Write-Host "[$level] " -NoNewline -ForegroundColor $levelColor
                    Write-Host $message
                }
            } else {
                Write-Host "  No logs available" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "  Error fetching logs: $_" -ForegroundColor Red
        }
        
    } catch {
        Write-Host "Error: $_" -ForegroundColor Red
    }
}
