$ErrorActionPreference = "Continue"
$lib = "D:\@kaifa\lemo-opuscar"
$ff = "D:\@kaifa\model\tools\ffmpeg7\ffmpeg.exe"
$fp = "D:\@kaifa\model\tools\ffmpeg7\ffprobe.exe"
$out = "D:\@kaifa\Auto-Video\samples-v2\work"
$env:PATH = "D:\@kaifa\model\tools\ffmpeg7;$env:PATH"
$env:PLAYWRIGHT_CORE = "D:\@kaifa\Auto-Video\piying\node_modules\playwright-core"
$env:CHROME_PATH = "C:\Users\Administrator\AppData\Local\Google\Chrome\Application\chrome.exe"
Set-Location $lib

$jobs = @(
  @{ id = "bianping"; style = "flat-space-explainer"; from = 6 },
  @{ id = "shouhui"; style = "sketchnote"; from = 8 },
  @{ id = "zhidiao"; style = "papercut-red"; from = 6 },
  @{ id = "xiangsu"; style = "pixel-rpg"; from = 8 },
  @{ id = "huixingzhen"; style = "hardcore-info"; from = 6 },
  @{ id = "jianying"; style = "paper-popup"; from = 6 },
  @{ id = "lishi"; style = "engraving"; from = 8 }
)

foreach ($j in $jobs) {
  $demo = Join-Path $lib ("styles\" + $j.style + "\demo")
  if (-not (Test-Path $demo)) { Write-Host "缺 demo $($j.style)" -ForegroundColor Red; continue }
  # 字体回退
  $fc = Join-Path $demo "fonts\fonts.css"
  if (Test-Path $fc) {
    $t = Get-Content $fc -Raw -Encoding UTF8
    $t = $t -replace "url\(['`"]?[^)'`"]*\.(ttf|otf|woff2?)[^)'`"]*['`"]?\)", "local('Georgia')"
    Set-Content $fc -Value $t -Encoding UTF8
  }
  # 隐藏库层字幕
  $idx = Join-Path $demo "index.html"
  $h = Get-Content $idx -Raw -Encoding UTF8
  if (-not $h.Contains("id=""nofilmcap")) {
    $h = $h.Replace("</head>", "<style id=""nofilmcap"">#cap,#caps,#captions,#subs,.cap,.caps,.caption,.captions{display:none!important;opacity:0!important}</style></head>")
    Set-Content $idx -Value $h -Encoding UTF8
  }

  $mp4 = Join-Path $lib ($j.id + "-demo.mp4")
  Write-Host "渲 $($j.id) ← $($j.style)"
  node core\render\video.mjs $demo --out $mp4 2>&1 | Select-Object -Last 2
  if (-not (Test-Path $mp4)) { Write-Host "渲染失败 $($j.id)" -ForegroundColor Red; continue }
  $dur = [double](& $fp -v error -show_entries format=duration -of csv=p=0 $mp4)
  $start = [Math]::Min($j.from, [Math]::Max(0, $dur - 11))
  $dst = Join-Path $out ($j.id + "\raw-10s.mp4")
  New-Item -ItemType Directory -Force -Path (Split-Path $dst) | Out-Null
  & $ff -y -v error -ss $start -t 10 -i $mp4 -an -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -r 30 $dst
  Write-Host ("切成 $($j.id)  $([Math]::Round($dur,1))s → $start s" ) -ForegroundColor Green
}
Write-Host "ALL DONE"
