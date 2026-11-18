$ErrorActionPreference = "Stop"
$root = "D:\@kaifa\Auto-Video"
$sv = Join-Path $root "samples-v2"
$ff = "D:\@kaifa\model\tools\ffmpeg7\ffmpeg.exe"
$bgmDir = "D:\@kaifa\@\@风格动画BGM"
function Bgm([string]$kw) {
  $f = Get-ChildItem -LiteralPath $bgmDir -Filter "*.mp3" | Where-Object { $_.Name -like "*$kw*" } | Select-Object -First 1
  if (-not $f) { throw "没找到 BGM: $kw" }
  return $f.FullName
}
$lt = "https://ghfast.top/https://github.com"  # 占位，不用
$jobs = @(
  @{ id="pingban";   raw="$root\pingban\projects\913_sample\out\video.mp4";   bgm=(Bgm "Mystery & Crime");        sub="sub-pingban.ass";   vol=0.42 },
  @{ id="labi";      raw="$root\labi\projects\913_sample\out\video.mp4";      bgm=(Bgm "Royalty Free Ambient Space"); sub="sub-labi.ass";  vol=0.42 },
  @{ id="gangbi";    raw="$root\gangbi\projects\913_sample\out\video.mp4";    bgm=(Bgm "AMAZING AFRICA");          sub="sub-gangbi.ass";    vol=0.42 },
  @{ id="weisuo";    raw="$root\weisuo\projects\913_sample\out\video.mp4";    bgm=(Bgm "Funny Quirky");            sub="sub-weisuo.ass";    vol=0.42 },
  @{ id="zhuangshi"; raw="$root\zhuangshi\projects\913_sample\out\video.mp4"; bgm=(Bgm "Ancient_Rite");            sub="sub-zhuangshi.ass"; vol=0.42 },
  @{ id="ditu";      raw="$root\ditu\projects\913_sample\out\video.mp4";      bgm=(Bgm "Mystery Documentary");     sub="sub-ditu.ass";      vol=0.42 },
  @{ id="shuimo";    raw="$root\shuimo\projects\913_sample\out\video_only.mp4";   bgm=(Bgm "The Unseen Consequence"); sub="sub-shuimo.ass";  vol=0.42 },
  @{ id="shiliang";  raw="$root\shiliang\projects\913_sample\out\video_only.mp4"; bgm=(Bgm "Mystery Documentary"); sub="sub-shiliang.ass"; vol=0.42 },
  @{ id="xianshiqi"; raw="$root\xianshiqi\projects\913_sample\out\video_only.mp4"; bgm=(Bgm "Royalty Free Ambient Space"); sub="sub-xianshiqi.ass"; vol=0.42 },
  @{ id="xuni";      raw="$root\xuni\projects\913_sample\out\video_only.mp4";     bgm=(Bgm "The Unseen Consequence"); sub="sub-xuni.ass";  vol=0.42 },
  @{ id="dengju";    raw="$root\dengju\projects\913_sample\out\video_only.mp4";   bgm=(Bgm "Funny Quirky");           sub="sub-dengju.ass"; vol=0.42 }
)
Push-Location $sv
foreach ($j in $jobs) {
  $wo = Join-Path $sv ("audio\" + $j.id + ".wav")
  if (-not (Test-Path -LiteralPath $wo)) { Write-Host "缺配音 $wo" -ForegroundColor Red; continue }
  $vf = "fps=30"
  if ($j.sub) { $vf = "$vf,ass=$($j.sub)" }
  $fc = "[0:v]$vf[v];[2:a]atrim=0:10,volume=$($j.vol),afade=t=in:st=0:d=0.7,afade=t=out:st=8.9:d=1.1[bg];[1:a]adelay=550|550,apad,atrim=0:10[vo];[vo][bg]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-16:TP=-1.5:LRA=11[a]"
  $out = Join-Path $sv ("$($j.id)-10s.mp4")
  & $ff -y -v warning -i $j.raw -i $wo -i $j.bgm -filter_complex $fc -map "[v]" -map "[a]" -t 10 -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -movflags +faststart $out 2>&1 | Select-Object -Last 3
  if (Test-Path -LiteralPath $out) { Write-Host "成片 $($j.id)" -ForegroundColor Green }
}
Pop-Location
