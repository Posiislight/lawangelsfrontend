# Script to list Render services using the Render API
# Requires: Render API key

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
                Write-Host "Using API key from MCP config" -ForegroundColor Gray
            }
        } catch {
            Write-Host "Could not read MCP config" -ForegroundColor Yellow
        }
    }
}

if (-not $ApiKey) {
    Write-Host "Error: Render API key required" -ForegroundColor Red
    Write-Host ""
    Write-Host "Usage: .\list-render-services.ps1 -ApiKey <YOUR_API_KEY>" -ForegroundColor Yellow
    Write-Host "Or set up MCP config first using: .\setup-render-mcp.ps1 <YOUR_API_KEY>" -ForegroundColor Yellow
    exit 1
}

Write-Host "Fetching Render services..." -ForegroundColor Cyan
Write-Host ""

try {
    # Get all services directly
    $servicesResponse = Invoke-RestMethod -Uri "https://api.render.com/v1/services" `
        -Headers @{
            "Authorization" = "Bearer $ApiKey"
            "Accept" = "application/json"
        } `
        -Method Get

    if ($null -eq $servicesResponse -or $servicesResponse.Count -eq 0) {
        Write-Host "No services found" -ForegroundColor Yellow
    } else {
        Write-Host "Found $($servicesResponse.Count) service(s):" -ForegroundColor Green
        Write-Host ("=" * 60) -ForegroundColor Gray
        Write-Host ""
        
        foreach ($service in $servicesResponse) {
            # Handle different response structures
            $serviceName = if ($service.service) { $service.service.name } else { $service.name }
            $serviceType = if ($service.service) { $service.service.type } else { $service.type }
            $servicePlan = if ($service.service) { $service.service.plan } else { $service.plan }
            $serviceId = if ($service.service) { $service.service.id } else { $service.id }
            
            $status = if ($service.serviceDetails) { $service.serviceDetails.status } else { $service.status }
            $url = if ($service.serviceDetails) { $service.serviceDetails.url } else { $service.url }
            $branch = if ($service.serviceDetails) { $service.serviceDetails.branch } else { $service.branch }
            $createdAt = if ($service.service) { $service.service.createdAt } else { $service.createdAt }
            
            $statusColor = switch ($status) {
                "live" { "Green" }
                "suspended" { "Yellow" }
                "not_deployed" { "Gray" }
                "build_failed" { "Red" }
                default { "White" }
            }
            
            Write-Host "Service: $serviceName" -ForegroundColor Cyan
            Write-Host "  ID: $serviceId" -ForegroundColor Gray
            Write-Host "  Type: $serviceType" -ForegroundColor Gray
            Write-Host "  Status: $status" -ForegroundColor $statusColor
            if ($url) {
                Write-Host "  URL: $url" -ForegroundColor Gray
            }
            Write-Host "  Plan: $servicePlan" -ForegroundColor Gray
            if ($branch) {
                Write-Host "  Branch: $branch" -ForegroundColor Gray
            }
            if ($createdAt) {
                Write-Host "  Created: $createdAt" -ForegroundColor Gray
            }
            Write-Host ""
        }
    }
    
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "HTTP Status: $statusCode" -ForegroundColor Yellow
        if ($statusCode -eq 401) {
            Write-Host "Authentication failed. Please check your API key." -ForegroundColor Yellow
        } elseif ($statusCode -eq 403) {
            Write-Host "Access forbidden. Check API key permissions." -ForegroundColor Yellow
        }
    }
    Write-Host ""
    Write-Host "Make sure your API key is valid and has the correct permissions." -ForegroundColor Yellow
    exit 1
}
