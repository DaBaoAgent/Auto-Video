# Full-film steady-frame render launcher (detached, records PID + log).
# ASCII-only on purpose: Windows PowerShell 5.1 reads BOM-less .ps1 as ANSI,
# so any non-ASCII path literal inside this file must be passed in as a parameter.
# Usage:
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts\start-film-render.ps1 `
#       -Engine "<engine dir>" -OutDir "<output dir>" -Pkg packages/chibi-full/battlefield.json
param(
  [Parameter(Mandatory = $true)][string]$Engine,
  [Parameter(Mandatory = $true)][string]$OutDir,
  [string]$Pkg = 'packages/chibi-full/battlefield.json',
  [string]$Node = 'C:\Program Files\nodejs\node.exe'
)
$ErrorActionPreference = 'Stop'

if (-not (Test-Path $Engine)) { throw "engine dir not found: $Engine" }
if (-not (Test-Path $Node))   { throw "node not found: $Node" }
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$pidFile = Join-Path $OutDir 'render_run.pid'
if (Test-Path $pidFile) {
  $old = (Get-Content $pidFile | Where-Object { $_ -like 'pid=*' }) -replace '^pid=', ''
  if ($old -and (Get-Process -Id $old -ErrorAction SilentlyContinue)) {
    Write-Output "already running pid=$old"
    exit 0
  }
}

$ts  = Get-Date -Format 'yyyyMMdd_HHmmss'
$log = Join-Path $OutDir "render_full_$ts.log"
$err = Join-Path $OutDir "render_full_$ts.err.log"

$p = Start-Process -FilePath $Node `
     -ArgumentList @('tools/render-film.mjs', '--pkg', $Pkg, '--out', $OutDir) `
     -WorkingDirectory $Engine -WindowStyle Hidden -PassThru `
     -RedirectStandardOutput $log -RedirectStandardError $err

@("pid=$($p.Id)", "tag=full-render", "start=$ts", "log=$log", "err=$err", "pkg=$Pkg", "out=$OutDir") |
  Set-Content -Path $pidFile -Encoding UTF8

Write-Output "started pid=$($p.Id) log=$log"
