$ErrorActionPreference = 'Stop'
$server = Start-Process -FilePath 'node' -ArgumentList @('node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4173') -WorkingDirectory $PSScriptRoot\.. -WindowStyle Hidden -PassThru
try {
  $ready = $false
  for ($attempt = 0; $attempt -lt 40; $attempt++) {
    try { $response = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:4173' -TimeoutSec 1; if ($response.StatusCode -eq 200) { $ready = $true; break } } catch {}
    Start-Sleep -Milliseconds 250
  }
  if (-not $ready) { throw 'Vite E2E server did not become ready.' }
  & npx.cmd playwright test @args
  $testExitCode = $LASTEXITCODE
} finally {
  if ($server -and -not $server.HasExited) { Stop-Process -Id $server.Id -Force }
}
exit $testExitCode
