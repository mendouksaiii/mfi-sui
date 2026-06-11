# M-Fi agent supervisor - keeps the perpetual on-chain loop alive forever.
# If the loop crashes (RPC blip, transient network error), it restarts after a
# short backoff. Logs everything to agents.log alongside the console.
#
#   Run:   powershell -ExecutionPolicy Bypass -File run-agents-forever.ps1
#   Stop:  close the window, or Ctrl+C, or kill the tsx/node process.

Set-Location $PSScriptRoot
$log = Join-Path $PSScriptRoot 'agents.log'
$delay = 5

while ($true) {
  $stamp = (Get-Date).ToString('o')
  "[$stamp] >> starting M-Fi agent loop" | Tee-Object -FilePath $log -Append
  # tsx runs the perpetual loop; it only returns here if it exits/crashes.
  npx tsx src/agents.ts 2>&1 | Tee-Object -FilePath $log -Append
  $code = $LASTEXITCODE
  $stamp = (Get-Date).ToString('o')
  "[$stamp] << agent loop exited (code $code), restarting in $delay s" | Tee-Object -FilePath $log -Append
  Start-Sleep -Seconds $delay
}
