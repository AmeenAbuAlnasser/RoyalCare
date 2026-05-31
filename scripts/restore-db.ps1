param(
  [Parameter(Mandatory = $true)]
  [string]$BackupFile,
  [string]$EnvFile = "services/api/.env",
  [string]$DatabaseUrl = "",
  [switch]$Force,
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

if (-not (Test-Path -LiteralPath $BackupFile)) {
  throw "Backup file not found: $BackupFile"
}

Load-DotEnv -Path $EnvFile

$dbUrl = $DatabaseUrl
if ([string]::IsNullOrWhiteSpace($dbUrl)) {
  $dbUrl = [Environment]::GetEnvironmentVariable("DATABASE_URL", "Process")
}

if ([string]::IsNullOrWhiteSpace($dbUrl)) {
  throw "DATABASE_URL is required. Set it in the shell, pass -DatabaseUrl, or provide $EnvFile."
}

if (-not (Get-Command pg_restore -ErrorAction SilentlyContinue)) {
  throw "pg_restore was not found. Install PostgreSQL client tools and add the PostgreSQL bin directory to PATH."
}

Write-Step "Restore target database is read from DATABASE_URL. The value will not be printed."
Write-Step "Backup file: $BackupFile"

if (-not $Force -and -not $DryRun) {
  $confirmation = Read-Host "Type RESTORE to overwrite the target database from this backup"
  if ($confirmation -ne "RESTORE") {
    throw "Restore cancelled."
  }
}

Write-Step "Verifying backup file"
if (-not $DryRun) {
  & pg_restore --list $BackupFile | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "Backup verification failed with exit code $LASTEXITCODE"
  }
}

Write-Step "Restoring database with pg_restore"
if ($DryRun) {
  Write-Host "DRY RUN: pg_restore --clean --if-exists --no-owner --dbname <DATABASE_URL> $BackupFile"
  exit 0
}

& pg_restore --clean --if-exists --no-owner --dbname $dbUrl $BackupFile
if ($LASTEXITCODE -ne 0) {
  throw "Restore failed with exit code $LASTEXITCODE"
}

Write-Step "Restore completed successfully"

