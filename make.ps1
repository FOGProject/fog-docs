# Powershell helper to build/serve the Quartz-based docs site locally.
param (
	[switch]$Build,
	$QuartzDir = ".\quartz"
)

"Importing build/make helper functions..." | out-host;
import-module .\buildFunctions.psm1 -force

Get-NodeJS;

Install-QuartzDependencies -QuartzDir $QuartzDir;

if ($Build) {
	Start-QuartzBuild -QuartzDir $QuartzDir;
} else {
	Start-QuartzServe -QuartzDir $QuartzDir;
}
