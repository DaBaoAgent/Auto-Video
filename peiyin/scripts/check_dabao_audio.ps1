# check_dabao_audio.ps1 - 配音后审查门禁入口
#
# 示例：
#   .\scripts\check_dabao_audio.ps1 `
#     -TopicDir '.\weijie\出稿\006_羽人与不死民' `
#     -ExpectedParagraphGapMs 220

param(
    [Parameter(Mandatory = $true)]
    [string]$TopicDir,
    [string]$TextFile = "",
    [string]$AudioFile = "配音.wav",
    [string]$MetadataFile = "配音.json",
    [string]$ReportFile = "配音审查报告.md",
    [string]$JsonReport = "配音审查.json",
    [string]$AsrModel = "small",
    [string]$ArbitrationModel = "medium",
    [int]$ExpectedParagraphGapMs = -1,
    [switch]$AllowModelDownload,
    [switch]$StrictWarnings
)

$ErrorActionPreference = "Stop"
try { [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false) } catch {}
Remove-Item Env:PYTHONPATH -ErrorAction SilentlyContinue
Remove-Item Env:PYTHONHOME -ErrorAction SilentlyContinue

$projectRoot = Split-Path -Parent $PSScriptRoot
$python = Join-Path $projectRoot "GPT-SoVITS\.venv\Scripts\python.exe"
$gate = Join-Path $PSScriptRoot "validate_dabao_audio.py"
$topic = (Resolve-Path -LiteralPath $TopicDir).Path

if (-not $TextFile) {
    $textCandidates = @(
        (Join-Path $topic "口播稿_定稿.txt"),
        (Join-Path $topic "口播稿.txt")
    )
    $TextFile = $textCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
}
if (-not $TextFile) { throw "未找到口播稿，请用 -TextFile 指定。" }

$textPath = (Resolve-Path -LiteralPath $TextFile).Path
$audioPath = (Resolve-Path -LiteralPath (Join-Path $topic $AudioFile)).Path
$metadataPath = (Resolve-Path -LiteralPath (Join-Path $topic $MetadataFile)).Path
$reportPath = Join-Path $topic $ReportFile
$jsonReportPath = Join-Path $topic $JsonReport

if (-not (Test-Path -LiteralPath $python)) { throw "缺少引擎 Python：$python" }
if (-not (Test-Path -LiteralPath $gate)) { throw "缺少审查脚本：$gate" }

$arguments = @(
    "-X", "utf8", $gate,
    "--text-file", $textPath,
    "--audio-file", $audioPath,
    "--metadata-file", $metadataPath,
    "--report-file", $reportPath,
    "--json-report", $jsonReportPath,
    "--asr-model", $AsrModel,
    "--arbitration-model", $ArbitrationModel
)
if ($ExpectedParagraphGapMs -gt 0) {
    $arguments += @("--expected-paragraph-gap-ms", "$ExpectedParagraphGapMs")
}
if ($AllowModelDownload) { $arguments += "--allow-model-download" }
if ($StrictWarnings) { $arguments += "--strict-warnings" }

& $python @arguments
exit $LASTEXITCODE
