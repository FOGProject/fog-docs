#modular functions to help with building the Quartz site in powershell in windows

function Get-NodeJS {
    [CmdletBinding()]
    param (
        [int]$MinimumMajorVersion = 22
    )

    process {
        "Ensuring Node.js $MinimumMajorVersion+ is installed...." | out-host;

        $nodeOk = $false
        if (Get-Command "node" -ea 0) {
            $nodeVersion = (& node --version) -replace '^v', ''
            $nodeMajor = [int]($nodeVersion -split '\.')[0]
            if ($nodeMajor -ge $MinimumMajorVersion) {
                $nodeOk = $true
            } else {
                Write-Warning "Node.js $nodeVersion found, but $MinimumMajorVersion+ is required."
            }
        }

        if (!$nodeOk) {
            Write-Warning "Node.js $MinimumMajorVersion+ not detected in path! Attempting to install with chocolatey package manager"
            Write-Warning "May we install/use chocolatey package manager and install Node.js? This will require admin rights in an elevated shell and the package will handle updating path variables"
            $installChoco = Read-Host -Prompt "Install choco and Node.js with choco? (Y/N)"
            if ($installChoco -eq "Y") {
                if (!(Get-Command 'choco' -ea 0)) {
                    Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
                }
                choco upgrade nodejs-lts -y --no-progress;
                Import-Module C:\ProgramData\chocolatey\helpers\chocolateyInstaller.psm1 -force -ea 0;
                Update-SessionEnvironment
            } else {
                Write-Warning "Node.js not detected in path! Attempting to install with winget"
                if (Get-Command "winget" -ea 0) {
                    winget.exe install "OpenJS.NodeJS.LTS"
                    Update-SessionEnvironment -ea 0
                } else {
                    Write-Error "Please manually install Node.js $MinimumMajorVersion+ and add it to the environment path then re-run this build/make script";
                    pause;
                    exit;
                }
            }

            if (!(Get-Command "node" -ea 0)) {
                Write-Error "Node.js still not found on PATH after install attempt. Please install it manually (https://nodejs.org/) and re-run this script.";
                pause;
                exit;
            }
        }
    }
}

function Install-QuartzDependencies {
    [CmdletBinding()]
    param (
        $QuartzDir = ".\quartz"
    )

    process {
        "Installing Quartz npm dependencies if needed..." | out-host;
        Push-Location $QuartzDir
        try {
            $packageJson = Get-Item ".\package.json"
            $nodeModules = ".\node_modules"

            $shouldInstall = $true
            if (Test-Path $nodeModules) {
                if ((Get-Item $nodeModules).LastWriteTime -ge $packageJson.LastWriteTime) {
                    $shouldInstall = $false
                }
            }

            if ($shouldInstall) {
                npm i
            } else {
                "Dependencies already up to date, skipping npm i" | out-host;
            }
        } finally {
            Pop-Location
        }
    }
}

function Start-QuartzBuild {
    [CmdletBinding()]
    param (
        $QuartzDir = ".\quartz"
    )

    process {
        Push-Location $QuartzDir
        try {
            npm run docs:build
        } finally {
            Pop-Location
        }
        return "Static build complete, output in $QuartzDir\public"
    }
}

function Start-QuartzServe {
    [CmdletBinding()]
    param (
        $QuartzDir = ".\quartz"
    )

    process {
        Push-Location $QuartzDir
        try {
            Start-Process "http://localhost:8080"
            npm run docs:serve
        } finally {
            Pop-Location
        }
    }
}
