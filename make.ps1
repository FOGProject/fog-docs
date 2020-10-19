# Powershell version of make.bat that defaults to html make mode
param (
	$makemode = "html"
)

# & python.exe -m pip install --upgrade pip
# Get-Content .\requirements.txt | ForEach-Object {
# 	pip install $_;
# }

if (! $ENV:SPHINXBUILD) {
	$sphinxBuild = "Sphinx-build.exe"
} else {
	$sphinxBuild = $ENV:SPHINXBUILD
}

$SOURCEDIR="."
$BUILDDIR="_build"

if (!(Test-Path .\_build)) {
	mkdir .\_build;
}


try {
	& $sphinxBuild | Out-Null
} catch {
	try {
		# try default windows path
		$sphinxBuild = "$ENV:USERPROFILE\AppData\Local\Programs\Python\Python37\Scripts\sphinx-build.exe"
		& $sphinxBuild | Out-Null
	} catch {

		"" | Out-Host
		"The 'sphinx-build' command was not found. Make sure you have Sphinx" | Out-Host
		"installed, then set the SPHINXBUILD environment variable to point" | Out-Host
		"to the full path of the 'sphinx-build' executable. Alternatively you" | Out-Host
		"may add the Sphinx directory to PATH." | Out-Host
		"" | Out-Host
		"If you don't have Sphinx installed, grab it from" | Out-Host
		"http://sphinx-doc.org/" | Out-Host
		return "sphinx-build not found";
	}
}

& $SPHINXBUILD -M $makemode $SOURCEDIR $BUILDDIR $SPHINXOPTS


& $SPHINXBUILD -M help $SOURCEDIR $BUILDDIR $SPHINXOPTS

