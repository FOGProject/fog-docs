The sysprep.exe file is located at C:\\windows\\system32\\sysprep.exe.
There are a few other files around there, and it is recommended that
they be left untouched. However, that does not mean that you cannot add
information to this directory. The approaches to managing the sysprep
process is varied, and this is just one recommendation.

Additional Necessary Files: c:\\windows\\system32\\sysprepme.bat
c:\\windows\\system32\\unattend.noskiprearm.xml
c:\\windows\\system32\\unattend.skiprearm.xml

Contents sysprepme.bat:

`:start`\
`echo off`\
`echo ================================================================================`\
`echo ================================================================================`\
`echo Choose the appropriate sysprep stage:`\
`echo.`\
`echo 1) For Deployment`\
`echo 2) Create Build Process Restore Point`\
`echo ================================================================================`\
`echo ================================================================================`\
`echo.`\
`set /p type= `\
\
`if %type% == 1 goto 1`\
`if %type% == 2 goto 2`\
`goto 3`\
\
`:1`\
`c:\windows\system32\sysprep\sysprep.exe /quiet /generalize /oobe /shutdown /unattend:c:\windows\system32\sysprep\unattend.noskiprearm.xml`\
`goto 4`\
`:2`\
`c:\windows\system32\sysprep\sysprep.exe /quiet /generalize /oobe /shutdown /unattend:c:\windows\system32\sysprep\unattend.skiprearm.xml`\
`goto 4`\
\
`:3 `\
`echo.`\
`echo ================================================================================`\
`echo ================================================================================`\
`echo   That didn't look like a 1 or a 2, please try again and make a VALID choice.`\
`echo ================================================================================`\
`echo ================================================================================`\
`pause`\
`goto start`\
`:4`

Contents Unattend.{skiprearm\|noskiprearm}.xml:

```{=html}
<?xml version="1.0" encoding="utf-8"?>
```
`<unattend xmlns="urn:schemas-microsoft-com:unattend">`{=html}\
`   ``<settings pass="oobeSystem">`{=html}\
`      ``<component name="Microsoft-Windows-Shell-Setup" processorArchitecture="x86" publicKeyToken="31bf3856ad364e35" language="neutral" versionScope="nonSxS" xmlns:wcm="http://schemas.microsoft.com/WMIConfig/2002/State" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">`{=html}\
`         ``<OOBE>`{=html}\
`            ``<HideEULAPage>`{=html}`true``</HideEULAPage>`{=html}\
`                ``<NetworkLocation>`{=html}`Work``</NetworkLocation>`{=html}\
`                ``<ProtectYourPC>`{=html}`3``</ProtectYourPC>`{=html}\
`                ``<SkipMachineOOBE>`{=html}`true``</SkipMachineOOBE>`{=html}\
`                ``<SkipUserOOBE>`{=html}`true``</SkipUserOOBE>`{=html}\
`         ``</OOBE>`{=html}\
`         `\
`            ``<RegisteredOwner>`{=html}`COMPANY-NAME-EMPLOYEE``</RegisteredOwner>`{=html}\
`            ``<RegisteredOrganization>`{=html}`COMPANY-NAME``</RegisteredOrganization>`{=html}\
`            ``<TimeZone>`{=html}`Central Standard Time``</TimeZone>`{=html}\
`   ``</component>`{=html}\
`        ``<component name="Microsoft-Windows-International-Core" processorArchitecture="x86" publicKeyToken="31bf3856ad364e35" language="neutral" versionScope="nonSxS" xmlns:wcm="http://schemas.microsoft.com/WMIConfig/2002/State" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">`{=html}\
`            ``<InputLocale>`{=html}`en-US``</InputLocale>`{=html}\
`            ``<SystemLocale>`{=html}`en-US``</SystemLocale>`{=html}\
`            ``<UILanguage>`{=html}`en-US``</UILanguage>`{=html}\
`            ``<UserLocale>`{=html}`en-US``</UserLocale>`{=html}\
`        ``</component>`{=html}\
`   ``</settings>`{=html}\
`    ``<settings pass="generalize">`{=html}\
`        ``<component name="Microsoft-Windows-PnpSysprep" processorArchitecture="x86" publicKeyToken="31bf3856ad364e35" language="neutral" versionScope="nonSxS" xmlns:wcm="http://schemas.microsoft.com/WMIConfig/2002/State" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">`{=html}\
`            ``<PersistAllDeviceInstalls>`{=html}`true``</PersistAllDeviceInstalls>`{=html}\
`        ``</component>`{=html}\
`        ``<component name="Microsoft-Windows-Security-Licensing-SLC" processorArchitecture="x86" publicKeyToken="31bf3856ad364e35" language="neutral" versionScope="nonSxS" xmlns:wcm="http://schemas.microsoft.com/WMIConfig/2002/State" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">`{=html}\
`OPTION 1:            ``<SkipRearm>`{=html}`0``</SkipRearm>`{=html}\
`OPTION 2:            ``<SkipRearm>`{=html}`1``</SkipRearm>`{=html}\
`        ``</component>`{=html}\
`    ``</settings>`{=html}\
`    ``<settings pass="specialize">`{=html}\
`        ``<component name="Microsoft-Windows-UnattendedJoin" processorArchitecture="x86" publicKeyToken="31bf3856ad364e35" language="neutral" versionScope="nonSxS" xmlns:wcm="http://schemas.microsoft.com/WMIConfig/2002/State" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">`{=html}\
`            ``<Identification>`{=html}\
`                ``<JoinWorkgroup>`{=html}`ghost``</JoinWorkgroup>`{=html}\
`            ``</Identification>`{=html}\
`        ``</component>`{=html}\
`       ``<component name="Microsoft-Windows-Shell-Setup" processorArchitecture="x86" publicKeyToken="31bf3856ad364e35" language="neutral" versionScope="nonSxS" xmlns:wcm="http://schemas.microsoft.com/WMIConfig/2002/State" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">`{=html}\
`            ``<ComputerName>`{=html}`COMPANY-BASE``</ComputerName>`{=html}\
`            ``<ProductKey>`{=html}`ZZZZZ-ZZZZZ-ZZZZZ-ZZZZZ-ZZZZZ``</ProductKey>`{=html}\
`        ``</component>`{=html}\
`    ``</settings>`{=html}\
`   ``<cpi:offlineImage cpi:source="wim:c:/vista/x86/image.wim#Windows Vista ULTIMATE" xmlns:cpi="urn:schemas-microsoft-com:cpi"/>`{=html}\
`</unattend>`{=html}

The reason that you want to use two unattend files is because one will
reset some internal Windows stuff, but can only be done three times. The
other can be done an infinite number of times, and is what you want to
use for the image that you are updating. Once you are ready to capture,
use option 1. Just be sure to have a backup from option 2 created so
that you don\'t have to do that work again when you update your image.
