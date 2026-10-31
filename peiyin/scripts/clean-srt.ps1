param(
  [Parameter(Mandatory=$true)][string]$SrtPath,
  [Parameter(Mandatory=$true)][string]$OutPath
)
$ErrorActionPreference = 'Stop'
# Read SRT as UTF8, strip BOM
$lines = [System.IO.File]::ReadAllLines($SrtPath, [System.Text.Encoding]::UTF8)
$texts = New-Object System.Collections.Generic.List[string]
foreach ($ln in $lines) {
  $t = $ln.Trim()
  if ($t -eq '') { continue }
  if ($t -match '^\d+$') { continue }          # sequence number
  if ($t -match '-->') { continue }             # timestamp
  $texts.Add($t)
}
# Overlap-merge: each new fragment shares a suffix/prefix with what we have
$sb = New-Object System.Text.StringBuilder
foreach ($frag in $texts) {
  $acc = $sb.ToString()
  if ($acc -eq '') { [void]$sb.Append($frag); continue }
  # find longest k (0..min(len)) such that acc ends with first k chars of frag
  $maxK = [Math]::Min($acc.Length, $frag.Length)
  $best = 0
  for ($k = $maxK; $k -ge 1; $k--) {
    if ($acc.Substring($acc.Length - $k) -ceq $frag.Substring(0, $k)) { $best = $k; break }
  }
  [void]$sb.Append($frag.Substring($best))
}
$out = $sb.ToString()
# tidy: collapse multiple spaces, normalize
$out = $out -replace '[ \t　]+', ' '
[System.IO.File]::WriteAllText($OutPath, $out, (New-Object System.Text.UTF8Encoding($false)))
Write-Output ("chars=" + $out.Length)
