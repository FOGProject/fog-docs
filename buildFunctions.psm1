#modular functions to help with building the site in powershell in windows

function Get-Python {
    [CmdletBinding()]
    param (
        
    )
    
    process {
        "Ensuring Python is installed...." | out-host;

        if (!(Get-Command "python.exe" -ea 0)) {
            Write-Warning "Python not detected in path! Attempting to install with chocolatey package manager"
            Write-Warning "May we install/use chocolatey package manager and install python? This will require admin rights in an elevated shell and the package will handle updating path variables"
            $installCHoco = Read-Host -Prompt "Install choco and python with choco? (Y/N)"
            if ($installCHoco -eq "Y") {
                if (!(Get-Command 'choco' -ea 0)) {
                    Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
                }
                choco upgrade python312 -y --no-progress;
                Import-Module C:\ProgramData\chocolatey\helpers\chocolateyInstaller.psm1 -force -ea 0;
                Update-SessionEnvironment
            } else {
                Write-Warning "Python not detected in path! Attempting to Install with winget via msstore or winget version and adding to the path"
                if (Get-Command "winget" -ea 0) {
                    try {
                        winget.exe install "Python 3.12" -s msstore
                    }  catch {
                        "There was an error with winget install, trying winget source" | Out-Host
                        winget.exe install "Python 3.12" -s winget
                    }
                } else {
                    Write-Error "Please manually install python and add it to the environment path then re-run this build/make script";
                    pause;
                    exit;
                }
            }	
            #python should now be installed, make sure it is in $ENV:PATH as well as the script subdir for putting mkdocs in the path
            if (!(Get-Command "python.exe" -ea 0)) {
                "searching for python.exe..."
                $pythonPth = (Get-ChildItem -Filter "python.exe" -Recurse -file -Path "\" -force -ea 0).FullName
                if ($null -ne $pythonPth.count) {
                    if ($pythonPth.count -gt 1) {
                        $pythonPath = $pythonPth | Where-Object {
                            Test-path ("$(Split-Path $($_) -Parent)\Scripts")
                        }
                        $pythonPth = $pythonPath[0];
                    }
                }
                "python found at $($pythonPth), adding parent folder to path, and scripts folder to path" | out-host;
                $ENV:PATH += ";$(Split-Path $($pythonPth[0]) -Parent)"
                $ENV:PATH += ";$(Split-Path $($pythonPth[0]) -Parent)\Scripts"
                Update-SessionEnvironment
            }
        }
        
    }
    
}

function Install-Requirements {
    [CmdletBinding()]
    param (
        $requirements = ".\requirements.txt"
    )
    
    
    process {
        "Installing Pre-requisites if needed..." | out-host;
        $log = ".\.lastprereqrun"
        $requirementsLastUpdate = (Get-item $requirements).LastWriteTime;
        
        if (Test-Path $log) {
            if ((Get-item $log).LastWriteTime -lt $requirementsLastUpdate) {
                $shouldUpdate = $true;
            } else {
                $shouldUpdate = $false;
            }
        } else {
            $shouldUpdate = $true;
        }

        if ($shouldUpdate) {
            $results = New-Object -TypeName 'System.collections.generic.List[System.Object]';
            $result = & python.exe -m pip install --upgrade pip
            $results.add(($result))
            Get-Content $requirements | Where-Object { $_ -notmatch "#"} | ForEach-Object {
                $result = pip install $_;
                $results.add(($result))
            }
            New-Item $log -ItemType File -force -Value "requirements last installed with pip on $(Get-date)`n`n$($results | out-string)";
        } else {
            "Requirements already up to date" | out-host;
        }
        return (Get-Content $log)
    }
    
}

function Start-MkDocsBuild {
    [CmdletBinding()]
    param (
        $SOURCEDIR=".",
	    $BUILDDIR="$SOURCEDIR\_build"
    )
    
    
    process {
        Set-Location $SOURCEDIR
        if (!(Test-Path $BUILDDIR)) {
            mkdir $BUILDDIR;
        }


        try {
            & mkdocs build -d $BUILDDIR | Out-Null
        } catch {
            try {
                $mkDocs = (Get-ChildItem -Filter "mkdocs.exe" -Recurse -file -Path "\" -force -ea 0).FullName;
                if ( !($mkdocs.count -eq 1) ) {
                	Write-Warning "Multiple versions of mkdocs.exe found in system, will try first one $($mkdocs | out-string). "
                
                    $mkDocs = $mkdocs[0]
                } 
                & $mkDocs build -d $BUILDDIR
            } catch {
                "" | Out-Host
                "The 'mkdocs.exe' command was not found. Make sure you have mkdocs installed with pip python package manager and that the path to python scripts is added to your path" | Out-Host
                "This should have been done automatically with the make.ps1 make/build script" | Out-Host
                return "mkdocs not found";
            }
        }
        start "http:\\localhost:8000"
        & mkdocs.exe serve 
        # "$buildDir\index.html"
        return "local dev server version opened in default browser"
        
    }
}

function Add-PagesToSiteMap {
    <#
    .SYNOPSIS
    This needs more work, copy pasted from another build script I've written that needs to be adapted. Basically, we can dynamically build the page tree in the mkdocs.yml in local builds.
    Making this also work in cloud builds will be another story
    
    .DESCRIPTION
    Long description
    
    .EXAMPLE
    An example
    
    .NOTES
    General notes
    #>
    [CmdletBinding()]
    param (
        $docsPth
    )
    
    
    
    process {
        
        $mkdocsYml = "$PSScriptRoot\mkdocs.yml";
        $mkdocs = @"
nav:
  - Home: index.md
"@
	$mkdocs += "`n";
	$index = "# FogAPI`n`n"
	Get-ChildItem "$docsPth" -Recurse | Where-Object name -NotMatch 'index' | Foreach-Object {

		# if is directory make category
        if ($_.Attributes -contains "Directory") {
            "- $($_.BaseName): "
        }
        #if is 
		$name = $_.Name;
		$baseName = $_.BaseName
		$file = $_.FullName;
		$link = "https://fogapi.readthedocs.io/en/latest/commands/$basename";
		#insert in onlineVersion at top
		$content = Get-Content $file;
		$onlineStr = ($content | Select-String "online version: *" -Raw).tostring();
		$newOnlineStr = "$onlineStr $link";
		$content = $content.replace($onlineStr,$newOnlineStr);
		Set-Content -Path $file -Value $content;
		
		#Update commands index
		$index += "## [$basename]($name)`n`n"
		#Update readthedocs nav index
		$mkdocs += "    - '$basename': 'commands/$name'`n";
		#maybe later add something that converts any functions in .link to related links

	}

	$mkdocs += "`ntheme: readthedocs"

	Set-Content $mkdocsYml -value $mkdocs;
	Set-Content $indexFile -Value $index;
        
    }
    
    
}

