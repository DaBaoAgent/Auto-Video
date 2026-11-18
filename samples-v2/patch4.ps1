$ErrorActionPreference = "Stop"
Set-Location "D:\@kaifa\Auto-Video"
function Patch($path, $old, $new) {
  if (-not (Test-Path -LiteralPath $path)) { Write-Host "!! 缺文件 $path" -ForegroundColor Red; return }
  $c = Get-Content -LiteralPath $path -Encoding UTF8 -Raw
  if (-not $c.Contains($old)) { Write-Host "!! 没找到 $path :: $old" -ForegroundColor Red; return }
  Set-Content -LiteralPath $path -Value $c.Replace($old, $new) -Encoding UTF8
  Write-Host "patched $path"
}
Patch "shiliang\projects\913_sample\index.html" "const CAPS = CUES.captions.map(" "const CAPS = [].map("
Patch "xianshiqi\projects\913_sample\index.html" "const cap = CUES.captions.find(c => t >= c.t0 && t < c.t1);" "const cap = undefined; // sample: no captions"
Patch "xuni\projects\913_sample\index.html" "const cap = CUES.captions.find(c => t >= c.t0 && t < c.t1);" "const cap = undefined; // sample: no captions"
Patch "dengju\projects\913_sample\index.html" "#caption{position:absolute;" "#caption{display:none !important;position:absolute;"
Write-Host "ok" -ForegroundColor Green
