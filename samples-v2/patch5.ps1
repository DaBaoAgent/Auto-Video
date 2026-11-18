$ErrorActionPreference = "Stop"
Set-Location "D:\@kaifa\Auto-Video"
function Patch($path, $old, $new) {
  if (-not (Test-Path -LiteralPath $path)) { Write-Host "!! 缺文件 $path" -ForegroundColor Red; return }
  $c = Get-Content -LiteralPath $path -Encoding UTF8 -Raw
  if (-not $c.Contains($old)) { Write-Host "!! 没找到 $path :: $old" -ForegroundColor Red; return }
  Set-Content -LiteralPath $path -Value $c.Replace($old, $new) -Encoding UTF8
  Write-Host "patched $path"
}
$pairs = @(
  @{ p="shuimo";    s="yuren30" },
  @{ p="shiliang";  s="010_shengming30" },
  @{ p="xianshiqi"; s="UAP30" },
  @{ p="xuni";      s="009_prion30" },
  @{ p="dengju";    s="yuren30" }
)
foreach ($x in $pairs) {
  $dst = "$($x.p)\projects\913_sample"
  if (Test-Path $dst) { Remove-Item -Recurse -Force $dst }
  Copy-Item -Recurse -Force "$($x.p)\projects\$($x.s)" $dst
  Patch "$dst\index.html" "setCaptions(cues.captions || []);" "setCaptions([]);"
}
Write-Host "ok" -ForegroundColor Green
