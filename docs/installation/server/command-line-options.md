---
title: Fog installer command line options
description: FOG 1.6 adds install modes, netboot protocol and boot delay options that 1.5 does not have
context_id: command-line-options-versions
tags:
    - version-chooser
    - installation
    - fog-server
    - configuration
    - certificates
    - secure-boot
---

# Fog installer command line options

FOG 1.5 accepts a shorter list of installer options. It has no
`--install-mode`, no `--netboot-proto` and no `--boot-delay`, and
`-S`/`--force-https` still carries its pre-1.6 meaning there. 1.6 also records
more of what you pass into `.fogsettings`.

- [[1.6/installation/server/command-line-options|Fog installer command line options (1.6)]]
- [[1.5/installation/server/command-line-options|Fog installer command line options (1.5)]]

>[!info] Which version am I on?
>Check **FOG Configuration → FOG Settings → General → FOG_VERSION** in the
>web UI, or the version string printed at the top of `installfog.sh`.
