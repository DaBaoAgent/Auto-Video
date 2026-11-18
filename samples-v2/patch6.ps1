$ErrorActionPreference = "Stop"
Set-Location "D:\@kaifa\Auto-Video"

function Patch($path, $old, $new) {
  $c = Get-Content -LiteralPath $path -Encoding UTF8 -Raw
  if (-not $c.Contains($old)) { Write-Host "!! 没找到: $path :: $old" -ForegroundColor Red; return }
  $c = $c.Replace($old, $new)
  Set-Content -LiteralPath $path -Value $c -Encoding UTF8
  Write-Host "patched $path"
}

# 1 pingban
Copy-Item -Recurse -Force "pingban\projects\038_guanyu_sketch" "pingban\projects\913_sample"
Patch "pingban\projects\913_sample\index.html" "function drawSubs(t) {" "function drawSubs(t) { return; // sample: no subs"

# 2 labi
Copy-Item -Recurse -Force "labi\projects\012_moon" "labi\projects\913_sample"
Patch "labi\projects\913_sample\film.js" "{ subs = true, vig = 0.3 } = {}" "{ subs = false, vig = 0.3 } = {}"

# 3 gangbi（无字幕，直接复制）
Copy-Item -Recurse -Force "gangbi\projects\012_wind" "gangbi\projects\913_sample"

# 4 weisuo
Copy-Item -Recurse -Force "weisuo\projects\012_pomelo" "weisuo\projects\913_sample"
Patch "weisuo\projects\913_sample\main.js" "dio.render(t, f, { grow, text: [TITLE, ...TEXT[ti]], textAlpha: base, strong2: ti === 4 });" "dio.render(t, f, { grow, text: [], textAlpha: 0, strong2: false });"

# 5 zhuangshi
Copy-Item -Recurse -Force "zhuangshi\projects\012_starlight" "zhuangshi\projects\913_sample"
Patch "zhuangshi\projects\913_sample\film.js" "if (!(Q && Q.has && Q.has('nosub'))) drawSubs(g, t);" "if (false) drawSubs(g, t);"

# 6 ditu
Copy-Item -Recurse -Force "ditu\projects\038_guanyu_fancheng" "ditu\projects\913_sample"
Patch "ditu\projects\913_sample\index.html" "if (!Q.has('nosubs')) subtitles(t);" "if (false) subtitles(t);"

Write-Host "全部补丁完成" -ForegroundColor Green
