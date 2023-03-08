# Powershell version of make.bat that defaults to html make mode
param (
	$SOURCEDIR=".",
	$BUILDDIR="$SOURCEDIR\_build"
)


"Importing build/make helper functions..." | out-host;
import-module .\buildFunctions.psm1 

Get-Python;


Install-Requirements;

# Add-pagesToSiteMap # not yet implemented
Start-MkDocsBuild -sourceDir $SOURCEDIR -buildDir $BUILDDIR

# "Opening built index.html in default browser...." | Out-Host;
# & "$BUILDDIR\html\index.html"