$ErrorActionPreference = "Stop"
$git = "C:\Program Files\Git\cmd\git.exe"
Set-Location "D:\@kaifa\Auto-Video"

$pipes = @(
  @{ id = "isometric"; libs = @("core.js","promo.js","isometric.js","autoscene.js") },
  @{ id = "blueprint"; libs = @("core.js","promo.js","blueprint.js","autoscene.js") },
  @{ id = "parable";   libs = @("core.js","promo.js","parable.js","autoscene.js") }
)

foreach ($p in $pipes) {
  $id = $p.id
  $w = "samples-v2\work\$id"
  New-Item -ItemType Directory -Force -Path "$w\lib" | Out-Null
  if (-not (Test-Path "$w\index.html")) {
    & $git show "c3690d0:$id/template/index.html" > "$w\index.html"
  }
  Copy-Item -Force "$id\template\timeline.js" "$w\" -ErrorAction SilentlyContinue
  if (Test-Path "$id\template\assets") { Copy-Item -Recurse -Force "$id\template\assets" "$w\" }
  foreach ($f in $p.libs) { if (Test-Path "$id\runtime\$f") { Copy-Item -Force "$id\runtime\$f" "$w\lib\$f" } }

  $c = Get-Content -LiteralPath "$w\index.html" -Raw -Encoding UTF8
  if (-not $c.Contains("captions: false")) {
    $c = $c.Replace("PROMO.compose({", "PROMO.compose({`r`n  captions: false,")
    $c = $c -replace "PROMO\.$id\(F, \{", "PROMO.$id(F, { captions: false,"
    Set-Content -LiteralPath "$w\index.html" -Value $c -Encoding UTF8
  }
  Write-Host "搭好 $id"
}
Write-Host "done" -ForegroundColor Green
