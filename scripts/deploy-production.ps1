param(
  [string]$ApiAppName = "royalcare-api",
  [string]$WebAppName = "royalcare-web",
  [string]$ApiHealthUrl = "http://localhost:3001/api/v1/health",
  [string]$PublicPageUrl = "http://localhost:3002/centers",
  [switch]$Install,
  [switch]$SkipBackup,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$Root = Split-Path -Parent $PSScriptRoot
$ApiDir = Join-Path $Root "services/api"
$WebDir = Join-Path $Root "apps/web"
$DatabaseDir = Join-Path $Root "packages/database"
$ApiEnv = Join-Path $ApiDir ".env"
$WebEnv = Join-Path $WebDir ".env"

function Write-Step {
  param([string]$Message)
  Write-Host ""
  Write-Host "[RoyalCare] $Message"
}

function Invoke-Checked {
  param(
    [string]$Description,
    [string]$WorkingDirectory,
    [scriptblock]$Command
  )

  Write-Step $Description
  Write-Host "Path: $WorkingDirectory"

  if ($DryRun) {
    Write-Host "DRY RUN: skipped"
    return
  }

  Push-Location $WorkingDirectory
  try {
    & $Command
    if ($LASTEXITCODE -ne 0) {
      throw "$Description failed with exit code $LASTEXITCODE"
    }
  } finally {
    Pop-Location
  }
}

function Test-RequiredFile {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) {
    throw "Required file missing: $Path"
  }
}

function Test-CommandAvailable {
  param([string]$CommandName)

  if (-not (Get-Command $CommandName -ErrorAction SilentlyContinue)) {
    throw "$CommandName was not found in PATH."
  }
}

Write-Step "Starting RoyalCare production deployment"
Write-Host "Root: $Root"
if ($DryRun) {
  Write-Host "Mode: DRY RUN"
}

Write-Step "Verifying environment files"
Test-RequiredFile -Path $ApiEnv
Test-RequiredFile -Path $WebEnv

Write-Step "Verifying required commands"
Test-CommandAvailable -CommandName "npm.cmd"
Test-CommandAvailable -CommandName "npx.cmd"
Test-CommandAvailable -CommandName "pg_dump"
Test-CommandAvailable -CommandName "pg_restore"
Test-CommandAvailable -CommandName "pm2.cmd"

if (-not $SkipBackup) {
  Invoke-Checked "Creating pre-deploy database backup" $Root {
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $Root "scripts/backup-db.ps1")
  }
}

$needsInstall = $Install `
  -or -not (Test-Path -LiteralPath (Join-Path $ApiDir "node_modules")) `
  -or -not (Test-Path -LiteralPath (Join-Path $WebDir "node_modules")) `
  -or -not (Test-Path -LiteralPath (Join-Path $DatabaseDir "node_modules"))

if ($needsInstall) {
  Invoke-Checked "Installing database package dependencies" $DatabaseDir {
    & npm.cmd install
  }
  Invoke-Checked "Installing API dependencies" $ApiDir {
    & npm.cmd install
  }
  Invoke-Checked "Installing web dependencies" $WebDir {
    & npm.cmd install
  }
} else {
  Write-Step "Skipping npm install because node_modules folders exist. Pass -Install to force install."
}

Invoke-Checked "Running Prisma migrate deploy" $DatabaseDir {
  & npx.cmd prisma migrate deploy
}

Invoke-Checked "Generating Prisma client" $DatabaseDir {
  & npx.cmd prisma generate
}

Invoke-Checked "Validating Prisma schema" $DatabaseDir {
  & npm.cmd run db:validate
}

Invoke-Checked "Building API" $ApiDir {
  & npm.cmd run build
}

Invoke-Checked "Building web app" $WebDir {
  & npm.cmd run build
}

Invoke-Checked "Restarting API PM2 app" $Root {
  & pm2.cmd restart $ApiAppName
}

Invoke-Checked "Restarting web PM2 app" $Root {
  & pm2.cmd restart $WebAppName
}

Invoke-Checked "Saving PM2 process list" $Root {
  & pm2.cmd save
}

Write-Step "Checking API health: $ApiHealthUrl"
if (-not $DryRun) {
  $apiResponse = Invoke-WebRequest -Uri $ApiHealthUrl -UseBasicParsing -TimeoutSec 20
  if ($apiResponse.StatusCode -lt 200 -or $apiResponse.StatusCode -ge 300) {
    throw "API health check failed with status $($apiResponse.StatusCode)"
  }
}

Write-Step "Checking public page: $PublicPageUrl"
if (-not $DryRun) {
  $publicResponse = Invoke-WebRequest -Uri $PublicPageUrl -UseBasicParsing -TimeoutSec 20
  if ($publicResponse.StatusCode -lt 200 -or $publicResponse.StatusCode -ge 300) {
    throw "Public page check failed with status $($publicResponse.StatusCode)"
  }
}

Write-Step "Deployment completed successfully"

