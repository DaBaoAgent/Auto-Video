# run_dabao_batch.ps1

> 徐艾伦历史口播 · 批量配音脚本（可复用模板）
> 用法：编辑下方【任务表】后执行 `./run_dabao_batch.ps1`（在项目根目录的 PowerShell 中）
> 依赖：仓库内置 GPT-SoVITS（GPT-SoVITS/ 目录，含 tts_server.py + dabao_tts.py）

$ErrorActionPreference = 'Continue'
# 避免全局 PYTHONPATH 污染引擎 venv
Remove-Item Env:PYTHONPATH -ErrorAction SilentlyContinue
Remove-Item Env:PYTHONHOME -ErrorAction SilentlyContinue

# ── 配置区：路径全部相对项目根目录，克隆后无需修改 ──
$projectRoot = Split-Path -Parent $PSScriptRoot
$engineDir   = Join-Path $projectRoot "GPT-SoVITS"
$py          = Join-Path $engineDir ".venv\Scripts\python.exe"   # TTS 引擎 Python 解释器
$engine      = Join-Path $engineDir "dabao_tts.py"               # dabao TTS 主脚本
$paragraphTts = Join-Path $PSScriptRoot "synthesize_dabao_paragraphs.py"
$audioGate    = Join-Path $PSScriptRoot "validate_dabao_audio.py"
$textDir     = Join-Path $projectRoot "lishi\workdir\tts"       # TTS 输入目录：XX_全篇.txt
$outBase     = Join-Path $projectRoot "lishi\出稿"              # 输出目录：0XX_人物名\配音.wav
$log         = Join-Path $projectRoot "lishi\workdir\logs\batch_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"

# ── 前置检查：引擎与 venv 必须就绪（初始化见 scripts\setup.ps1）──
if (-not (Test-Path -LiteralPath $engine) -or -not (Test-Path -LiteralPath $paragraphTts) -or -not (Test-Path -LiteralPath $audioGate)) {
    Write-Host "[fail] 缺少配音引擎、长稿入口或审查门禁" -ForegroundColor Red
    Write-Host "       请先在项目根目录运行：pwsh -File .\scripts\setup.ps1" -ForegroundColor Yellow
    exit 1
}
if (-not (Test-Path -LiteralPath $py)) {
    Write-Host "[fail] 引擎虚拟环境未初始化：$py" -ForegroundColor Red
    Write-Host "       请先运行：pwsh -File .\scripts\setup.ps1" -ForegroundColor Yellow
    Write-Host "       （Windows PowerShell 5.1 用：powershell -ExecutionPolicy Bypass -File .\scripts\setup.ps1）" -ForegroundColor Yellow
    exit 1
}

# ── 任务表：按需增删（n=人物目录名，txt=lishi/workdir/tts 下的输入文件名）──
$jobs = @(
    @{ n = '012_商纣王';  txt = '商纣王_全篇.txt'  }
    # 新增任务照此追加：@{ n = '038_人物名'; txt = '人物名_全篇.txt' }
)

# ── 执行（一般无需修改）──────────────────────────────
$logDir = Split-Path -Parent $log
if (-not (Test-Path -LiteralPath $logDir)) { New-Item -ItemType Directory -Force -Path $logDir | Out-Null }
"BATCH START $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" | Out-File -LiteralPath $log -Encoding utf8
foreach ($j in $jobs) {
    $outDir = Join-Path $outBase $j.n
    if (-not (Test-Path -LiteralPath $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }
    $txt = Join-Path $textDir $j.txt
    $wav = Join-Path $outDir '配音.wav'
    $meta = Join-Path $outDir '配音.json'
    $reviewMd = Join-Path $outDir '配音审查报告.md'
    $reviewJson = Join-Path $outDir '配音审查.json'
    $so  = Join-Path $outDir 'run_stdout.log'
    $gateLog = Join-Path $outDir 'audio_gate.log'
    if (-not (Test-Path -LiteralPath $txt)) {
        "SKIP $($j.n): 缺少输入 $txt" | Out-File -LiteralPath $log -Append -Encoding utf8
        continue
    }
    "===== START $($j.n) $(Get-Date -Format 'HH:mm:ss') =====" | Out-File -LiteralPath $log -Append -Encoding utf8
    & $py -X utf8 $paragraphTts --text-file $txt --out $wav --paragraph-gap-ms 200 2>&1 | Out-File -LiteralPath $so -Encoding utf8
    $synthExit = $LASTEXITCODE
    if ($synthExit -eq 0) {
        & $py -X utf8 $audioGate `
            --text-file $txt `
            --audio-file $wav `
            --metadata-file $meta `
            --report-file $reviewMd `
            --json-report $reviewJson `
            --asr-model small `
            --arbitration-model medium `
            --expected-paragraph-gap-ms 220 2>&1 | Out-File -LiteralPath $gateLog -Encoding utf8
        $gateExit = $LASTEXITCODE
    } else {
        $gateExit = 1
    }
    "===== END $($j.n) synth=$synthExit gate=$gateExit $(Get-Date -Format 'HH:mm:ss') =====" | Out-File -LiteralPath $log -Append -Encoding utf8
}
"DONE $(Get-Date -Format 'HH:mm:ss')" | Out-File -LiteralPath $log -Append -Encoding utf8
