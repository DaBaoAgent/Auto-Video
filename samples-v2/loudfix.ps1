$ErrorActionPreference = "Stop"
$sv = "D:\@kaifa\Auto-Video\samples-v2"
$ff = "D:\@kaifa\model\tools\ffmpeg7\ffmpeg.exe"
$rows = @(
  @{ id = "fushihui"; i = -17.57; tp = -1.50; lra = 9.00; th = -28.17; off = 0.76 },
  @{ id = "shuimo2";  i = -17.51; tp = -1.49; lra = 6.90; th = -27.85; off = 0.72 },
  @{ id = "manga";    i = -19.16; tp = -1.49; lra = 8.30; th = -29.44; off = 1.51 }
)
foreach ($r in $rows) {
  $src = Join-Path $sv ("$($r.id)-10s.mp4")
  $tmp = Join-Path $sv ("$($r.id)-10s-fix.mp4")
  $af = "loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=$($r.i):measured_TP=$($r.tp):measured_LRA=$($r.lra):measured_thresh=$($r.th):offset=$($r.off):linear=true"
  & $ff -y -v error -i $src -map 0:v -map 0:a -c:v copy -af $af -t 10 -c:a aac -b:a 192k -movflags +faststart $tmp
  if (Test-Path -LiteralPath $tmp) {
    Move-Item -Force $tmp $src
    $out = & $ff -hide_banner -nostats -i $src -map 0:a -af "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json" -f null - 2>&1 |
      Select-String "input_i|input_tp" | ForEach-Object { $_.Line.Trim() }
    Write-Host "$($r.id) 校正后 $out" -ForegroundColor Green
  }
}
