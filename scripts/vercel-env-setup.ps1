# Requires: logged-in Vercel CLI and linked project
# Usage (PowerShell):
#   powershell -ExecutionPolicy Bypass -File .\scripts\vercel-env-setup.ps1
# Precondition:
#   1) npx vercel login
#   2) npx vercel link --project <your-backend-project>

$ErrorActionPreference = 'Stop'

function Get-EnvMap([string]$envPath) {
  if (-not (Test-Path $envPath)) {
    throw "Not found: $envPath"
  }

  $map = @{}
  Get-Content $envPath |
    Where-Object { $_ -match '^\s*[^#].+' } |
    ForEach-Object {
      if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$') {
        $name = $Matches[1]
        $value = $Matches[2]
        $map[$name] = $value
      }
    }

  return $map
}

function Add-VercelEnv([string]$key, [string]$envName, $envMap) {
  if (-not $envMap.ContainsKey($key)) {
    Write-Host "跳过 $key（未在 .env 中找到）" -ForegroundColor Yellow
    return
  }

  $value = $envMap[$key]
  if ([string]::IsNullOrWhiteSpace($value)) {
    Write-Host "跳过 $key（值为空）" -ForegroundColor Yellow
    return
  }

  # Basic safety checks for common pitfalls
  if ($key -eq 'JWT_SECRET' -and $value -like 'dev-secret*') {
    Write-Warning "JWT_SECRET 看起来是开发占位符，跳过 $envName。请在生产/预览环境设置高强度密钥。"
    return
  }
  if ($key -eq 'CORS_ORIGIN' -and ($value -notmatch '^https?://')) {
    Write-Warning "CORS_ORIGIN 似乎不是有效的域名（应为 https://...），跳过 $envName。"
    return
  }

  Write-Host "添加 $key 到 $envName ..." -ForegroundColor Cyan
  # Pipe the value into vercel env add to avoid interactive input
  $value | npx vercel env add $key $envName | Out-Host
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$serverEnvPath = Join-Path $repoRoot 'server/.env'
$envMap = Get-EnvMap -envPath $serverEnvPath

$keys = @(
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET',
  'CORS_ORIGIN',
  'NODE_ENV',
  'LOG_LEVEL',
  'RATE_LIMIT_WINDOW_MS',
  'RATE_LIMIT_MAX_REQUESTS',
  'SILICONFLOW_API_KEY'
)

foreach ($envName in @('production','preview')) {
  foreach ($key in $keys) {
    Add-VercelEnv -key $key -envName $envName -envMap $envMap
  }
}

Write-Host "完成。可用 'npx vercel env ls' 查看结果。" -ForegroundColor Green