param(
  [string]$BackupDir = "backups",
  [string]$EnvFile = "services/api/.env",
  [string]$DatabaseUrl = "",
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Write-Step {
  param([string]$Message)
  Write-Host "[RoyalCare] $Message"
}

function Load-DotEnv {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) {
    return
  }

  Get-Content -LiteralPath $Path | ForEach-Object {
    $line = $_.Trim()
    if ($line.Length -eq 0 -or $line.StartsWith("#") -or $line -notmatch "^[A-Za-z_][A-Za-z0-9_]*=") {
      return
    }

    $parts = $line -split "=", 2
    $key = $parts[0].Trim()
    $value = $parts[1].Trim()

    if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
      $value = $value.Substring(1, $value.Length - 2)
    }

    if (-not [Environment]::GetEnvironmentVariable($key, "Process")) {
      [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
  }
}

function Invoke-Checked {
  param(
    [string]$Description,
    [scriptblock]$Command
  )

  Write-Step $Description
  if ($DryRun) {
    Write-Host "DRY RUN: skipped"
    return
  }

  & $Command
  if ($LASTEXITCODE -ne 0) {
    throw "$Description failed with exit code $LASTEXITCODE"
  }
}

Load-DotEnv -Path $EnvFile

$dbUrl = $DatabaseUrl
if ([string]::IsNullOrWhiteSpace($dbUrl)) {
  $dbUrl = [Environment]::GetEnvironmentVariable("DATABASE_URL", "Process")
}

if ([string]::IsNullOrWhiteSpace($dbUrl)) {
  throw "DATABASE_URL is required. Set it in the shell, pass -DatabaseUrl, or provide $EnvFile."
}

if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) {
  throw "pg_dump was not found. Install PostgreSQL client tools and add the PostgreSQL bin directory to PATH."
}

if (-not (Get-Command pg_restore -ErrorAction SilentlyContinue)) {
  throw "pg_restore was not found. Install PostgreSQL client tools and add the PostgreSQL bin directory to PATH."
}

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupRoot = Join-Path (Get-Location) $BackupDir
$backupFile = Join-Path $backupRoot "royalcare_$stamp.dump"

Write-Step "Preparing backup folder: $backupRoot"
if (-not $DryRun -and -not (Test-Path -LiteralPath $backupRoot)) {
  New-Item -ItemType Directory -Path $backupRoot | Out-Null
}

Invoke-Checked "Creating PostgreSQL custom backup" {
  & pg_dump $dbUrl --format=custom --file $backupFile
}

Invoke-Checked "Verifying backup can be read by pg_restore" {
  & pg_restore --list $backupFile | Out-Null
}

Write-Step "Backup ready: $backupFile"

