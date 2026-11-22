# 把四条老管线（chengshi / shipai / tuiyan / jilupian）的旧站点样片截成 10 秒，重出站点版与封面
$ErrorActionPreference = "Stop"
$root = "D:\@kaifa\Auto-Video"
$ff = "D:\@kaifa\model\tools\ffmpeg7\ffmpeg.exe"
Set-Location $root

# id, 起始秒, 竖屏?
$cuts = @(
  @{ id = "chengshi"; start = 18.0; portrait = $false },
  @{ id = "shipai";   start = 7.5;  portrait = $true  },
  @{ id = "tuiyan";   start = 9.0;  portrait = $false },
  @{ id = "jilupian"; start = 11.0; portrait = $false }
)

foreach ($c in $cuts) {
  $id = $c.id
  $src = "site\media\$id.mp4"            # 旧的 30 秒站点版（只读，不改）
  $mid = "samples-v2\old-$id-10s.mp4"    # 中间档：原分辨率 10 秒
  $mp4 = "site\media\$id.mp4"
  $jpg = "site\media\$id.jpg"

  # 1) 从旧片截 10 秒，源分辨率、高质量存档
  & $ff -y -v error -ss $c.start -i $src -t 10 -c:v libx264 -crf 20 -preset slow -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart $mid

  # 2) 站点版：长边 1024、crf 30、AAC 96k
  if ($c.portrait) { $vf = "scale=-2:1024:flags=lanczos" } else { $vf = "scale=1024:-2:flags=lanczos" }
  & $ff -y -v error -i $mid -vf $vf -c:v libx264 -crf 30 -preset slow -profile:v high -pix_fmt yuv420p -c:a aac -b:a 96k -movflags +faststart $mp4

  # 3) 封面：取重启后 3.2 秒处
  & $ff -y -v error -ss 3.2 -i $mp4 -frames:v 1 -q:v 4 -vf $vf $jpg

  Write-Host ("{0}  起始 {1}s  {2:N1} MB" -f $id, $c.start, ((Get-Item $mp4).Length / 1MB))
}

Write-Host "完成" -ForegroundColor Green
