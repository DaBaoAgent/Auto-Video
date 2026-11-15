param(
  [Parameter(Mandatory=$true)][string]$TxtPath
)
$ErrorActionPreference = 'Stop'
$text = [System.IO.File]::ReadAllText($TxtPath, [System.Text.Encoding]::UTF8)

$han = ([regex]::Matches($text, '[一-鿿]')).Count
$nonws = ([regex]::Matches($text, '\S')).Count
$dash = ([regex]::Matches($text, '——')).Count
$bushi = ([regex]::Matches($text, '不是[^。！？\n]{0,30}?而是')).Count
$digits = ([regex]::Matches($text, '[0-9]')).Count
$paras = ($text -split "`r?`n" | Where-Object { $_.Trim() -ne '' }).Count
$ending = [string][char]0x6211 + [string][char]0x662F + [string][char]0x827E + [string][char]0x4F26 + [string][char]0xFF0C + [string][char]0x905B + [string][char]0x72D7 + [string][char]0x53BB + [string][char]0x4E86 + [string][char]0xFF0C + [string][char]0x767D + [string][char]0x4E86 + [string][char]0x4E2A + [string][char]0x767D + [string][char]0x3002
$hasEnding = $text.TrimEnd().EndsWith($ending)

Write-Output ("han=$han")
Write-Output ("nonws=$nonws")
Write-Output ("dash_pairs=$dash")
Write-Output ("bushi_ershi=$bushi")
Write-Output ("arabic_digits=$digits")
Write-Output ("paragraphs=$paras")
Write-Output ("has_ending=$hasEnding")