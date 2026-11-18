param([string[]]$Only)
$ErrorActionPreference = "Stop"
$root = "D:\@kaifa\Auto-Video"
$sv = Join-Path $root "samples-v2"
$ff = "D:\@kaifa\model\tools\ffmpeg7\ffmpeg.exe"
$probe = "D:\@kaifa\model\tools\ffmpeg7\ffprobe.exe"
$bgmDir = "D:\@kaifa\@\@风格动画BGM"

function Bgm([string]$kw) {
  $f = Get-ChildItem -LiteralPath $bgmDir -Filter "*.mp3" | Where-Object { $_.Name -like "*$kw*" } | Select-Object -First 1
  if (-not $f) { throw "没找到 BGM: $kw" }
  return $f.FullName
}

$jobs = @(
  @{ id = "laolang";   raw = "$sv\work\laolang\out\raw-10s.mp4";          bgm = (Bgm "Royalty Free Ambient Space"); sub = "sub-laolang.ass";   vol = 0.42 },
  @{ id = "fushihui";  raw = "$root\fushihui\projects\913_sample\out\video.mp4"; bgm = (Bgm "BGM_ambient");          sub = $null;                vol = 0.40 },
  @{ id = "shuimo2";   raw = "$root\shuimo2\projects\913_sample\out\video.mp4";  bgm = (Bgm "Ancient_Rite");        sub = $null;                vol = 0.40 },
  @{ id = "goldenage"; raw = "$sv\work\goldenage\out\raw-10s.mp4";        bgm = (Bgm "Funny Quirky");              sub = "sub-goldenage.ass";  vol = 0.42 },
  @{ id = "manga";     raw = "$sv\work\manga\out\raw-10s.mp4";           bgm = (Bgm "Mystery & Crime");           sub = "sub-manga.ass";      vol = 0.42 }
)

Push-Location $sv
foreach ($j in $jobs) {
  if ($Only -and ($Only -notcontains $j.id)) { continue }
  $wo = Join-Path $sv ("audio\" + $j.id + ".wav")
  if (-not (Test-Path -LiteralPath $wo)) { throw "缺配音 $wo" }
  Write-Host "== $($j.id) 混音" -ForegroundColor Cyan
  $vf = "fps=30"
  if ($j.sub) { $vf = "$vf,ass=$($j.sub)" }
  $fc = "[0:v]$vf[v];[2:a]atrim=0:10,volume=$($j.vol),afade=t=in:st=0:d=0.7,afade=t=out:st=8.9:d=1.1[bg];[1:a]adelay=550|550,apad,atrim=0:10[vo];[vo][bg]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-16:TP=-1.5:LRA=11[a]"
  $out = Join-Path $sv ("$($j.id)-10s.mp4")
  & $ff -y -v warning -i $j.raw -i $wo -i $j.bgm -filter_complex $fc -map "[v]" -map "[a]" -t 10 -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -movflags +faststart $out 2>&1 | Select-Object -Last 4
  if (Test-Path -LiteralPath $out) { Write-Host "  成片 $out" -ForegroundColor Green }
}
Pop-Location
