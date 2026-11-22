$ErrorActionPreference = "Stop"
$root = "D:\@kaifa\Auto-Video"
$ff = "D:\@kaifa\model\tools\ffmpeg7\ffmpeg.exe"
Set-Location $root
$man = Get-Content "samples-v2\manifest.json" -Raw -Encoding UTF8 | ConvertFrom-Json
foreach ($s in $man.samples) {
  $src = "samples-v2\$($s.id)-10s.mp4"
  $mp4 = "site\media\$($s.id).mp4"
  $jpg = "site\media\$($s.id).jpg"
  & $ff -y -v error -i $src -vf "scale=1024:-2:flags=lanczos" -c:v libx264 -crf 30 -preset slow -profile:v high -pix_fmt yuv420p -c:a aac -b:a 96k -movflags +faststart $mp4
  & $ff -y -v error -ss 3.2 -i $mp4 -frames:v 1 -q:v 4 -vf "scale=1024:-2" $jpg
  Write-Host ("{0}  {1:N2} MB" -f $s.id, ((Get-Item $mp4).Length / 1MB))
}
$sum = (Get-ChildItem site\media -Filter *.mp4 | Measure-Object Length -Sum).Sum
Write-Host ("站点 mp4 合计 {0:N1} MB" -f ($sum / 1MB)) -ForegroundColor Green
