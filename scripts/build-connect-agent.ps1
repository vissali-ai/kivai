$ErrorActionPreference = 'Stop'
$connectRoot = Split-Path -Parent $PSScriptRoot
Push-Location $connectRoot
try {
    $compiler = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
    & $compiler /nologo /r:System.Web.Extensions.dll '/out:connect-agent\KivaiConnect.exe' 'connect-agent\KivaiConnect.cs'
    if ($LASTEXITCODE -ne 0) { throw 'Agent compilation failed' }
    & '.\connect-agent\KivaiConnect.exe' --self-test
    if ($LASTEXITCODE -ne 0) { throw 'Agent security self-test failed' }
    New-Item -ItemType Directory -Force -Path public/downloads | Out-Null
    Compress-Archive -LiteralPath connect-agent/KivaiConnect.exe,connect-agent/KivaiConnect.cs,connect-agent/LEIA-ME.txt -DestinationPath public/downloads/kivai-connect-windows.zip -Force
    Get-FileHash -Algorithm SHA256 public/downloads/kivai-connect-windows.zip | Select-Object Algorithm, Hash
} finally { Pop-Location }
