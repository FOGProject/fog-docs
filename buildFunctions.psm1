#modular functions to help with building the site in powershell in windows


function Get-EnvironmentVariable {
    <#
    .SYNOPSIS
    Gets an Environment Variable.
    
    .DESCRIPTION
    This will will get an environment variable based on the variable name
    and scope while accounting whether to expand the variable or not
    (e.g.: `%TEMP%`-> `C:\User\Username\AppData\Local\Temp`).
    
    .NOTES
    This helper reduces the number of lines one would have to write to get
    environment variables, mainly when not expanding the variables is a
    must.
    
    .PARAMETER Name
    The environment variable you want to get the value from.
    
    .PARAMETER Scope
    The environment variable target scope. This is `Process`, `User`, or
    `Machine`.
    
    .PARAMETER PreserveVariables
    A switch parameter stating whether you want to expand the variables or
    not. Defaults to false. Available in 0.9.10+.
    
    .PARAMETER IgnoredArguments
    Allows splatting with arguments that do not apply. Do not use directly.
    
    .EXAMPLE
    Get-EnvironmentVariable -Name 'TEMP' -Scope User -PreserveVariables
    
    .EXAMPLE
    Get-EnvironmentVariable -Name 'PATH' -Scope Machine
    
    .LINK
    Get-EnvironmentVariableNames
    
    .LINK
    Set-EnvironmentVariable
    #>
    [CmdletBinding()]
    [OutputType([string])]
    param(
      [Parameter(Mandatory=$true)][string] $Name,
      [Parameter(Mandatory=$true)][System.EnvironmentVariableTarget] $Scope,
      [Parameter(Mandatory=$false)][switch] $PreserveVariables = $false,
      [parameter(ValueFromRemainingArguments = $true)][Object[]] $ignoredArguments
    )
    
      # Do not log function call, it may expose variable names
      ## Called from chocolateysetup.psm1 - wrap any Write-Host in try/catch
    
      [string] $MACHINE_ENVIRONMENT_REGISTRY_KEY_NAME = "SYSTEM\CurrentControlSet\Control\Session Manager\Environment\";
      [Microsoft.Win32.RegistryKey] $win32RegistryKey = [Microsoft.Win32.Registry]::LocalMachine.OpenSubKey($MACHINE_ENVIRONMENT_REGISTRY_KEY_NAME)
      if ($Scope -eq [System.EnvironmentVariableTarget]::User) {
        [string] $USER_ENVIRONMENT_REGISTRY_KEY_NAME = "Environment";
        [Microsoft.Win32.RegistryKey] $win32RegistryKey = [Microsoft.Win32.Registry]::CurrentUser.OpenSubKey($USER_ENVIRONMENT_REGISTRY_KEY_NAME)
      } elseif ($Scope -eq [System.EnvironmentVariableTarget]::Process) {
        return [Environment]::GetEnvironmentVariable($Name, $Scope)
      }
    
      [Microsoft.Win32.RegistryValueOptions] $registryValueOptions = [Microsoft.Win32.RegistryValueOptions]::None
    
      if ($PreserveVariables) {
        Write-Verbose "Choosing not to expand environment names"
        $registryValueOptions = [Microsoft.Win32.RegistryValueOptions]::DoNotExpandEnvironmentNames
      }
    
      [string] $environmentVariableValue = [string]::Empty
    
      try {
        #Write-Verbose "Getting environment variable $Name"
        if ($win32RegistryKey -ne $null) {
          # Some versions of Windows do not have HKCU:\Environment
          $environmentVariableValue = $win32RegistryKey.GetValue($Name, [string]::Empty, $registryValueOptions)
        }
      } catch {
        Write-Debug "Unable to retrieve the $Name environment variable. Details: $_"
      } finally {
        if ($win32RegistryKey -ne $null) {
          $win32RegistryKey.Close()
        }
      }
    
      if ($environmentVariableValue -eq $null -or $environmentVariableValue -eq '') {
        $environmentVariableValue = [Environment]::GetEnvironmentVariable($Name, $Scope)
      }
    
      return $environmentVariableValue
    }

function Get-EnvironmentVariableNames([System.EnvironmentVariableTarget] $Scope) {
    <#
    .SYNOPSIS
    Gets all environment variable names.
    
    .DESCRIPTION
    Provides a list of environment variable names based on the scope. This
    can be used to loop through the list and generate names.
    
    .NOTES
    Process dumps the current environment variable names in memory /
    session. The other scopes refer to the registry values.
    
    .INPUTS
    None
    
    .OUTPUTS
    A list of environment variables names.
    
    .PARAMETER Scope
    The environment variable target scope. This is `Process`, `User`, or
    `Machine`.
    
    .EXAMPLE
    Get-EnvironmentVariableNames -Scope Machine
    
    .LINK
    Get-EnvironmentVariable
    
    .LINK
    Set-EnvironmentVariable
    #>
    
      # Do not log function call
    
      # HKCU:\Environment may not exist in all Windows OSes (such as Server Core).
      switch ($Scope) {
        'User' { Get-Item 'HKCU:\Environment' -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Property }
        'Machine' { Get-Item 'HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager\Environment' | Select-Object -ExpandProperty Property }
        'Process' { Get-ChildItem Env:\ | Select-Object -ExpandProperty Key }
        default { throw "Unsupported environment scope: $Scope" }
      }
    }    

function Update-SessionEnvVariables {
    [CmdletBinding()]
	param (
		
	)

    process {
        #this is taken from update-sessionenvironment, a chocolatey helper function, it will refresh the environment variables without restarting the shell, putting it in its own function so choco isn't required for running the build
        $userName = $env:USERNAME
        $architecture = $env:PROCESSOR_ARCHITECTURE
        $psModulePath = $env:PSModulePath

        #ordering is important here, $user should override $machine...
        $ScopeList = 'Process', 'Machine'
        if ('SYSTEM', "${env:COMPUTERNAME}`$" -notcontains $userName) {
            # but only if not running as the SYSTEM/machine in which case user can be ignored.
            $ScopeList += 'User'
        }
        foreach ($Scope in $ScopeList) {
            Get-EnvironmentVariableNames -Scope $Scope |
                ForEach-Object {
                Set-Item "Env:$_" -Value (Get-EnvironmentVariable -Scope $Scope -Name $_)
                }
        }

        #Path gets special treatment b/c it munges the two together
        $paths = 'Machine', 'User' |
            ForEach-Object {
            (Get-EnvironmentVariable -Name 'PATH' -Scope $_) -split ';'
            } |
            Select-Object -Unique
        $Env:PATH = $paths -join ';'

        # PSModulePath is almost always updated by process, so we want to preserve it.
        $env:PSModulePath = $psModulePath

        # reset user and architecture
        if ($userName) { $env:USERNAME = $userName; }
        if ($architecture) { $env:PROCESSOR_ARCHITECTURE = $architecture; }
    }
    
	
}

function Get-Python {
    [CmdletBinding()]
    param (
        
    )
    
    process {
        "Ensuring Python is installed...." | out-host;

        Update-SessionEnvVariables;

        if (!(Get-Command "python.exe" -ea 0)) {
            Write-Warning "Python not detected in path! Attempting to install with chocolatey package manager"
            Write-Warning "May we install/use chocolatey package manager and install python? This will require admin rights in an elevated shell and the package will handle updating path variables"
            $installCHoco = Read-Host -Prompt "Install choco and python with choco? (Y/N)"
            if ($installCHoco -eq "Y") {
                if (!(Get-Command 'choco' -ea 0)) {
                    Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
                }
                choco upgrade python -y --no-progress;
                Update-SessionEnvVariables;
            } else {
                Write-Warning "Python not detected in path! Attempting to Install with winget via msstore or winget version and adding to the path"
                if (Get-Command "winget" -ea 0) {
                    try {
                        winget.exe install "Python 3.11" -s msstore
                    }  catch {
                        "There was an error with winget install, trying winget source" | Out-Host
                        winget.exe install "Python 3.11" -s winget
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
                Update-SessionEnvVariables;
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
        & python.exe -m pip install --upgrade pip
        Get-Content $requirements | Where-Object { $_ -notmatch "#"} | ForEach-Object {
            pip install $_;
        }    
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
                	Write-Warning "Multiple versions of mkdocs.exe found in system, will try first one $($mkdocs | out-string). Set the correct one with $ENV:mkdocs = 'correct\path\to\sphinx-build.exe'"
                
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
        return "$buildDir\site\index.html"
        
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

