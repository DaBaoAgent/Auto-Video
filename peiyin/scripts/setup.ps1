# setup.ps1 - PeiYin 一键初始化（新机器克隆后运行一次）
#
# 完成：
#   1. 检查仓库内置的 GPT-SoVITS 目录
#   2. 校验/拉取 LFS 模型与音色资源（约 2.4GB，可用 -WeightsFrom 从已有安装复制）
#   3. 用 Python 3.11 创建引擎 venv，安装 torch 2.6 CPU 与 requirements-win-cpu.txt
#   4. 启动 tts_server 做健康检查
#
# 用法：
#   pwsh -File .\scripts\setup.ps1
#   pwsh -File .\scripts\setup.ps1 -PipIndexUrl https://repo.huaweicloud.com/repository/pypi/simple/
#   pwsh -File .\scripts\setup.ps1 -WeightsFrom <旧 GPT-SoVITS 安装目录>
#
# 参数：
#   -WeightsFrom   已有 GPT-SoVITS 安装目录，缺失资源从这里按相同相对路径复制
#   -PipIndexUrl   pip 镜像源（默认官方源，失败自动回退华为云；国内建议直接指定华为云）
#   -TorchIndexUrl torch CPU wheel 源，默认交大镜像（失败自动回退官方源）
#   -Port          健康检查端口，默认 9880（与 preset 一致）
#   -SkipSmoke     跳过启动 tts_server 的冒烟测试

param(
    [string]$WeightsFrom = "",
    [string]$PipIndexUrl = "",
    [string]$TorchIndexUrl = "https://mirror.sjtu.edu.cn/pytorch-wheels/cpu",
    [int]$Port = 9880,
    [switch]$SkipSmoke
)

$ErrorActionPreference = "Stop"
try { [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false) } catch {}
# 避免用户全局 PYTHONPATH 污染 venv（部分 agent / 插件会把自身包注入 PYTHONPATH）
Remove-Item Env:PYTHONPATH -ErrorAction SilentlyContinue
Remove-Item Env:PYTHONHOME -ErrorAction SilentlyContinue

$projectRoot = Split-Path -Parent $PSScriptRoot
$engineDir   = Join-Path $projectRoot "GPT-SoVITS"
$venvPython  = Join-Path $engineDir ".venv\Scripts\python.exe"

function Info([string]$m) { Write-Host "[setup] $m" -ForegroundColor Cyan }
function Ok([string]$m)   { Write-Host "[ ok ] $m"  -ForegroundColor Green }
function Warn([string]$m) { Write-Host "[warn] $m"  -ForegroundColor Yellow }
function Fail([string]$m) { Write-Host "[fail] $m"  -ForegroundColor Red; exit 1 }

function Install-PipPackages([string[]]$pipArgs, [string]$desc) {
    $sources = New-Object System.Collections.Generic.List[string]
    if ($PipIndexUrl) { $sources.Add($PipIndexUrl) } else { $sources.Add("") }  # 空串 = PyPI 官方源
    $sources.Add("https://repo.huaweicloud.com/repository/pypi/simple/")
    foreach ($src in ($sources | Select-Object -Unique)) {
        $idx = @()
        if ($src) { $idx = @("-i", $src) }
        $label = if ($src) { $src } else { "PyPI 官方源" }
        Info "$desc（源：$label）"
        & $venvPython -m pip install @pipArgs @idx
        if ($LASTEXITCODE -eq 0) { return $true }
        Warn "$desc 失败，尝试下一个 pip 源..."
    }
    return $false
}

# 静默探测 Python 能否完成某个动作。PS 5.1 在 EAP=Stop 下对原生命令的
# stderr 重定向会抛 NativeCommandError，因此在内部临时切到 Continue。
function Invoke-PythonQuiet {
    param([string]$Python, [string[]]$PyArgs)
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        $out = & $Python @PyArgs 2>$null
        return [pscustomobject]@{ Code = $LASTEXITCODE; Output = @($out) }
    } catch {
        return [pscustomobject]@{ Code = 1; Output = @() }
    } finally {
        $ErrorActionPreference = $prev
    }
}

# 必装模型与音色资源（相对引擎根目录、最小字节数）；与远端 LFS 文件一一对应。
$RequiredWeights = @(
    @{ Path = "GPT_SoVITS\pretrained_models\s1v3.ckpt";                                  Min = 155284856 },
    @{ Path = "GPT_SoVITS\pretrained_models\gsv-v5-pretrained\s2Gv5turbo.pth";           Min = 766406144 },
    @{ Path = "GPT_SoVITS\pretrained_models\gsv-v5-pretrained\vocoder.pth";              Min = 57761163 },
    @{ Path = "GPT_SoVITS\pretrained_models\chinese-hubert-base\pytorch_model.bin";      Min = 188811417 },
    @{ Path = "GPT_SoVITS\pretrained_models\chinese-roberta-wwm-ext-large\pytorch_model.bin"; Min = 651225145 },
    @{ Path = "GPT_SoVITS\pretrained_models\fast_langdetect\lid.176.bin";                Min = 131266198 },
    @{ Path = "GPT_SoVITS\text\G2PWModel\g2pW.onnx";                                     Min = 635212732 },
    @{ Path = "GPT_SoVITS\Accel\vendor\cuda\bin\cudart64_12.dll";                        Min = 500000 },
    @{ Path = "voices\dabao\ref_dabao3-1.wav";                                           Min = 1500000 }
)

function Get-MissingWeights([string]$root) {
    $missing = @()
    foreach ($w in $RequiredWeights) {
        $f = Join-Path $root $w.Path
        if (-not (Test-Path -LiteralPath $f)) {
            $missing += $w.Path
        } elseif ((Get-Item -LiteralPath $f).Length -lt $w.Min) {
            $missing += ("{0}（{1} 字节，疑似 LFS 指针或未完成下载）" -f $w.Path, (Get-Item -LiteralPath $f).Length)
        }
    }
    return $missing
}

function Test-Ffmpeg([string]$root) {
    $runtimeFfmpeg = Join-Path $root "runtime\ffmpeg.exe"
    $runtimeProbe  = Join-Path $root "runtime\ffprobe.exe"
    if ((Test-Path -LiteralPath $runtimeFfmpeg) -and (Test-Path -LiteralPath $runtimeProbe)) {
        # LFS 指针文件只有几百字节，必须排除，否则会被误判为可用
        $lenF = (Get-Item -LiteralPath $runtimeFfmpeg).Length
        $lenP = (Get-Item -LiteralPath $runtimeProbe).Length
        if ($lenF -gt 10MB -and $lenP -gt 10MB) { return "runtime" }
    }
    if ((Get-Command ffmpeg -ErrorAction SilentlyContinue) -and (Get-Command ffprobe -ErrorAction SilentlyContinue)) { return "PATH" }
    return ""
}

Write-Host "=== PeiYin 初始化 ===" -ForegroundColor Cyan
Info "项目目录：$projectRoot"
Info "引擎目录：$engineDir"

# ── 1. 前置工具 ────────────────────────────────────────
if (-not (Get-Command git -ErrorAction SilentlyContinue)) { Fail "未找到 git，请先安装 Git for Windows。" }
try { & git lfs version | Out-Null } catch { Fail "未找到 git-lfs，请先安装 Git LFS（https://git-lfs.com）。" }
if ($LASTEXITCODE -ne 0) { Fail "未找到 git-lfs，请先安装 Git LFS（https://git-lfs.com）。" }

if (-not (Test-Path -LiteralPath (Join-Path $engineDir "tts_server.py"))) {
    Fail "GPT-SoVITS 模块缺失。请重新克隆 PeiYin 仓库，确保 GPT-SoVITS/tts_server.py 存在。"
} else {
    Ok "GPT-SoVITS 模块已存在"
}

# ── 2. 模型权重 ────────────────────────────────────────
Info "[2/5] 校验模型与音色资源..."
$missing = @(Get-MissingWeights $engineDir)
if ($missing.Count -gt 0 -and $WeightsFrom) {
    if (-not (Test-Path -LiteralPath $WeightsFrom)) { Fail "-WeightsFrom 路径不存在：$WeightsFrom" }
    Info "从 $WeightsFrom 复制缺失资源..."
    foreach ($w in $RequiredWeights) {
        $src = Join-Path $WeightsFrom $w.Path
        $dst = Join-Path $engineDir $w.Path
        if (-not (Test-Path -LiteralPath $src)) { continue }
        if ((Get-Item -LiteralPath $src).Length -lt $w.Min) { Warn "源文件不完整，跳过：$src"; continue }
        if ((Test-Path -LiteralPath $dst) -and (Get-Item -LiteralPath $dst).Length -ge $w.Min) { continue }
        New-Item -ItemType Directory -Force -Path (Split-Path -Parent $dst) | Out-Null
        Copy-Item -LiteralPath $src -Destination $dst -Force
        Ok "已复制 $($w.Path)"
    }
    $missing = @(Get-MissingWeights $engineDir)
}

if ($missing.Count -gt 0) {
    Info "LFS 资源缺失 $($missing.Count) 个，按文件拉取（约 2.4GB，速度取决于网络）..."
    Push-Location $engineDir
    try {
        foreach ($w in $RequiredWeights) {
            $f = Join-Path $engineDir $w.Path
            $need = -not (Test-Path -LiteralPath $f)
            if (-not $need -and (Get-Item -LiteralPath $f).Length -lt $w.Min) { $need = $true }
            if (-not $need) { continue }
            $lfsPath = $w.Path -replace '\\', '/'
            Info "拉取 $lfsPath"
            & git lfs pull -I $lfsPath
            if ($LASTEXITCODE -ne 0) { Warn "git lfs pull $lfsPath 返回 $LASTEXITCODE" }
        }
    } finally {
        Pop-Location
    }
    $missing = @(Get-MissingWeights $engineDir)
}

if ($missing.Count -gt 0) {
    $list = ($missing | ForEach-Object { "  - $_" }) -join "`n"
    Fail @"
模型与音色资源仍不完整：
$list

处理办法（任选）：
  1. 确认能访问 GitHub LFS（github-cloud.githubusercontent.com），重跑本脚本；
  2. 从已有 GPT-SoVITS 安装复制：
     pwsh -File .\scripts\setup.ps1 -WeightsFrom <旧 GPT-SoVITS 安装目录>
  3. 公司/学校网络需要代理时，先设置 HTTPS_PROXY 再重跑。
"@
}
Ok "模型与音色资源完整"

$ffmpegSource = Test-Ffmpeg $engineDir
if (-not $ffmpegSource) {
    Info "未找到 ffmpeg，尝试从 LFS 拉取 runtime/ffmpeg.exe 与 ffprobe.exe..."
    Push-Location $engineDir
    try {
        foreach ($lfsPath in @("runtime/ffmpeg.exe", "runtime/ffprobe.exe")) {
            & git lfs pull -I $lfsPath
            if ($LASTEXITCODE -ne 0) { Warn "git lfs pull $lfsPath 返回 $LASTEXITCODE" }
        }
    } finally {
        Pop-Location
    }
    $ffmpegSource = Test-Ffmpeg $engineDir
}
if (-not $ffmpegSource) {
    Fail @"
缺少 ffmpeg / ffprobe（合成 MP3 与时长校验必需）。
  - 安装后重跑：winget install Gyan.FFmpeg
  - 或重开终端确认 ffmpeg、ffprobe 在 PATH 上。
"@
}
Ok "ffmpeg 来源：$ffmpegSource"

# ── 3. Python 3.11 + venv ─────────────────────────────
Info "[3/5] 准备 Python 3.11 虚拟环境..."
$basePython = $null
$r = Invoke-PythonQuiet "py" @("-3.11", "-c", "import sys; print(sys.executable)")
if ($r.Code -eq 0 -and $r.Output.Count -gt 0) { $basePython = $r.Output[0].Trim() }
if (-not $basePython) {
    $pyCmd = Get-Command python -ErrorAction SilentlyContinue
    if ($pyCmd) {
        $r = Invoke-PythonQuiet $pyCmd.Source @("-c", "import sys; print('%d.%d' % sys.version_info[:2])")
        if ($r.Code -eq 0 -and $r.Output.Count -gt 0 -and $r.Output[0].Trim() -eq "3.11") { $basePython = $pyCmd.Source }
    }
}
if (-not $basePython) {
    Fail @"
未找到 Python 3.11（装好后的命令应为 py -3.11）。
  winget install Python.Python.3.11
安装后重开终端，再运行本脚本。
"@
}
Ok "Python 3.11：$basePython"

if (-not (Test-Path -LiteralPath $venvPython)) {
    Info "创建 venv：$engineDir\.venv"
    & $basePython -m venv (Join-Path $engineDir ".venv")
    if ($LASTEXITCODE -ne 0) { Fail "创建 venv 失败" }
} else {
    $r = Invoke-PythonQuiet $venvPython @("-c", "import sys; print('%d.%d' % sys.version_info[:2])")
    $venvVer = if ($r.Code -eq 0 -and $r.Output.Count -gt 0) { $r.Output[0].Trim() } else { "" }
    if ($venvVer -ne "3.11") {
        Fail "已有 .venv 不是 Python 3.11（$venvVer）。请删除 $engineDir\.venv 后重跑。"
    }
    Ok "复用已有 venv"
}

Info "升级 pip / setuptools / wheel..."
$pipOk = Install-PipPackages -pipArgs @("--upgrade", "pip", "setuptools", "wheel") -desc "升级 pip"
if (-not $pipOk) { Fail "升级 pip 失败（可尝试 -PipIndexUrl 指定国内镜像）" }

$torchVersion = ""
try {
    $torchVersion = (& $venvPython -c "import torch; print(torch.__version__)" 2>$null | Select-Object -First 1)
} catch {}
if (-not $torchVersion -or -not $torchVersion.Trim().StartsWith("2.6.0")) {
    Info "安装 torch / torchaudio 2.6.0 CPU（约 250MB）..."
    $torchSources = @(
        $TorchIndexUrl,
        "https://download.pytorch.org/whl/cpu",
        "https://mirror.sjtu.edu.cn/pytorch-wheels/cpu"
    ) | Select-Object -Unique
    $torchOk = $false
    foreach ($src in $torchSources) {
        Info "torch 源：$src"
        & $venvPython -m pip install "torch==2.6.0" "torchaudio==2.6.0" --index-url $src
        if ($LASTEXITCODE -eq 0) { $torchOk = $true; break }
        Warn "该源安装失败，尝试下一个..."
    }
    if (-not $torchOk) { Fail "torch 安装失败（检查网络或用 -TorchIndexUrl 指定可用镜像）" }
} else {
    Ok "torch 已安装：$($torchVersion.Trim())"
}

# ── 4. 依赖 ────────────────────────────────────────────
$reqFile = Join-Path $engineDir "requirements-win-cpu.txt"
if (-not (Test-Path -LiteralPath $reqFile)) { Fail "缺少依赖清单：$reqFile" }
Info "[4/5] 安装 Python 依赖（首次约 1~2GB，耗时取决于网络）..."
$pipOk = Install-PipPackages -pipArgs @("-r", $reqFile) -desc "安装 Python 依赖"
if (-not $pipOk) { Fail "依赖安装失败（可尝试 -PipIndexUrl 指定国内镜像）" }

# jieba_fast 没有 Python 3.11 的 Windows 轮子，缺 MSVC 时无法编译；
# 引擎只用它的 jieba 兼容 API，缺包时把 compat 垫片复制进 site-packages。
$r = Invoke-PythonQuiet $venvPython @("-c", "import jieba_fast, jieba_fast.posseg")
if ($r.Code -ne 0) {
    $compat = Join-Path $engineDir "compat\jieba_fast"
    if (-not (Test-Path -LiteralPath (Join-Path $compat "__init__.py"))) {
        Fail "缺少 jieba_fast 兼容垫片：$compat"
    }
    $r = Invoke-PythonQuiet $venvPython @("-c", "import sysconfig; print(sysconfig.get_paths()['purelib'])")
    if ($r.Code -ne 0 -or $r.Output.Count -eq 0) { Fail "无法定位 venv site-packages" }
    $sitePackages = $r.Output[0].Trim()
    $shimTarget = Join-Path $sitePackages "jieba_fast"
    if (Test-Path -LiteralPath $shimTarget) { Remove-Item -LiteralPath $shimTarget -Recurse -Force }
    Copy-Item -LiteralPath $compat -Destination $sitePackages -Recurse -Force
    $r = Invoke-PythonQuiet $venvPython @("-c", "import jieba_fast, jieba_fast.posseg")
    if ($r.Code -ne 0) { Fail "jieba_fast 兼容垫片安装失败" }
    Ok "已安装 jieba_fast 兼容垫片（转发到 jieba）"
}

$prev = $ErrorActionPreference
$ErrorActionPreference = "Continue"
& $venvPython -c "import torch, torchaudio, numpy, transformers, peft, librosa, soundfile, requests, onnxruntime, yaml, jieba_fast, jieba_fast.posseg, faster_whisper, pypinyin, cn2an; print('deps ok')"
$depsOk = ($LASTEXITCODE -eq 0)
$ErrorActionPreference = $prev
if (-not $depsOk) { Fail "依赖导入校验失败（见上方 traceback）" }
Ok "依赖导入正常"

# ── 5. 冒烟测试 ────────────────────────────────────────
if ($SkipSmoke) {
    Warn "已跳过 tts_server 冒烟测试（-SkipSmoke）"
} else {
    Info "[5/5] 启动 tts_server 做健康检查（首次加载模型约 1 分钟）..."
    $healthUrl = "http://127.0.0.1:$Port/health"
    $already = $null
    try { $already = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 2 -UseBasicParsing } catch {}
    if ($already -and $already.ok) {
        Ok "已有 tts_server 在 $Port 运行（voice=$($already.voice)），复用"
    } else {
        $smokeDir = Join-Path $engineDir "logs"
        New-Item -ItemType Directory -Force -Path $smokeDir | Out-Null
        $smokeOut = Join-Path $smokeDir "setup_smoke.out.log"
        $smokeErr = Join-Path $smokeDir "setup_smoke.err.log"
        $oldPreset = $env:TTS_PRESET
        $env:TTS_PRESET = Join-Path $engineDir "voices\dabao\preset.json"
        $proc = Start-Process -FilePath $venvPython `
            -ArgumentList @((Join-Path $engineDir "tts_server.py"), "$Port") `
            -WorkingDirectory $engineDir -PassThru -WindowStyle Hidden `
            -RedirectStandardOutput $smokeOut -RedirectStandardError $smokeErr
        if ($null -eq $oldPreset) { Remove-Item Env:TTS_PRESET -ErrorAction SilentlyContinue } else { $env:TTS_PRESET = $oldPreset }

        $deadline = (Get-Date).AddSeconds(240)
        $health = $null
        while ((Get-Date) -lt $deadline) {
            if ($proc.HasExited) { break }
            try { $health = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 2 -UseBasicParsing; break } catch {}
            Start-Sleep -Seconds 2
        }
        if ($health -and $health.ok) {
            Ok "tts_server 健康检查通过（voice=$($health.voice), model=$($health.model)）"
            Info "合成一句测试文本，校验 MP3 编码链路..."
            $synthOk = $false
            $synthMsg = ""
            try {
                $payload = @{ input = "初始化测试。" } | ConvertTo-Json -Compress
                $resp = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/tts" -Method Post `
                    -Body ([Text.Encoding]::UTF8.GetBytes($payload)) `
                    -ContentType "application/json; charset=utf-8" -TimeoutSec 180 -UseBasicParsing
                if ($resp.StatusCode -eq 200 -and $resp.RawContentLength -gt 1000) {
                    $synthOk = $true
                    $synthMsg = "{0:N1} KB MP3" -f ($resp.RawContentLength / 1024)
                } else {
                    $synthMsg = "HTTP $($resp.StatusCode)，响应 $($resp.RawContentLength) 字节"
                }
            } catch {
                $synthMsg = $_.Exception.Message
            }
            if ($synthOk) {
                Ok "合成测试通过（$synthMsg）"
            } else {
                try { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue } catch {}
                $errTail = ""
                if (Test-Path -LiteralPath $smokeErr) { $errTail = (Get-Content -LiteralPath $smokeErr -Tail 20) -join "`n" }
                $outTail = ""
                if (Test-Path -LiteralPath $smokeOut) { $outTail = (Get-Content -LiteralPath $smokeOut -Tail 20) -join "`n" }
                Fail "tts_server 合成测试失败：$synthMsg`nstdout:`n$outTail`nstderr:`n$errTail`n详见 $smokeDir\setup_smoke.*.log 与 tts_server.log"
            }
        } else {
            try { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue } catch {}
            $errTail = ""
            if (Test-Path -LiteralPath $smokeErr) { $errTail = (Get-Content -LiteralPath $smokeErr -Tail 20) -join "`n" }
            $outTail = ""
            if (Test-Path -LiteralPath $smokeOut) { $outTail = (Get-Content -LiteralPath $smokeOut -Tail 20) -join "`n" }
            Fail "tts_server 未就绪。stdout:`n$outTail`nstderr:`n$errTail`n详见 $smokeDir\setup_smoke.*.log 与 tts_server.log"
        }
        try { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue } catch {}
        try { $proc.WaitForExit(5000) | Out-Null } catch {}
    }
}

Write-Host ""
Ok "初始化完成"
Write-Host "  单篇配音：GPT-SoVITS\dabao_tts.cmd --text-file <全篇.txt> --out <配音.wav> --force"
Write-Host "  批量配音：.\scripts\run_dabao_batch.ps1"
Write-Host "  健康检查：Invoke-RestMethod http://127.0.0.1:9880/health"
