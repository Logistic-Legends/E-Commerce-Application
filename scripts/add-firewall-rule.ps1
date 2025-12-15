# Adds an inbound Windows Firewall rule to allow TCP on port 5000
# This script will request elevation (run as Administrator) when executed.
# Usage: Right-click -> Run with PowerShell (as Administrator) OR run from an elevated PowerShell:
#   .\scripts\add-firewall-rule.ps1

$port = 5000
$ruleName = "ECommerce-App-Allow-5000"

function Add-Rule {
    Write-Host "Adding firewall rule '$ruleName' for TCP port $port..."
    try {
        New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -LocalPort $port -Protocol TCP -Action Allow -EdgeTraversalPolicy Allow -Enabled True | Out-Null
        Write-Host "Firewall rule added successfully."
    } catch {
        Write-Error "Failed to add firewall rule: $_"
    }
}

# If not elevated, relaunch as admin
if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "Requesting elevation..."
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = "powershell.exe"
    $psi.Arguments = "-NoProfile -ExecutionPolicy Bypass -File \"$PSCommandPath\""
    $psi.Verb = "runas"
    try {
        [System.Diagnostics.Process]::Start($psi) | Out-Null
    } catch {
        Write-Error "Elevation request canceled or failed: $_"
    }
    exit
}

Add-Rule

Write-Host "Done. Verify by running: netstat -ano | findstr :$port"