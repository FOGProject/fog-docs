---
title: Software Installs and Uninstalls on Every Check
aliases:
    - Software Installs and Uninstalls on Every Check
description: Two software entries for the same package, one Present and one Absent, make the FOG Agent install and remove the package on every drift check
context_id: software-installs-and-uninstalls-repeatedly
tags:
    - 1_6-changes
    - troubleshooting
    - software
    - fog-agent
---

# Software Installs and Uninstalls on Every Check

>[!info] Applies to FOG 1.6 and later

## Symptom

A package managed on the [[software|Software]] page installs, then uninstalls,
then installs again. It changes on every drift check. The host's
**Software Status** tab shows two rows for the same package. One row says
`installed`, the other row says `removed`, and both rows update on every
check.

## Cause

The host has two software entries for the same backend and package. One entry
is **Present** and the other entry is **Absent**. For example, a group
installs `everything`, and a second entry, "everything (remove)", is set to
Absent and assigned directly to one host.

Only the entry name must be unique. Earlier 1.6 builds sent both entries to
the FOG Agent. The agent applied both, one after the other, on every check.

## Fixed in

The first FOG 1.6.0 patch release after 1.6.0.158
([fogproject#2132](https://github.com/FOGProject/fogproject/pull/2132)). FOG
now sends one entry for each backend and package. It sends the first entry in
precedence order: the host's own entries first, then each group's entries in
group order. A disabled entry does not count. So in the example, the host's
Absent entry applies to that host, and the rest of the group keeps the
package.

## Workaround for older versions

Do not let one host get two entries for the same package. To remove a package
from one host of a group:

- Remove the host from the group, and assign the group's other entries to the
  host directly.
- Or, move the host into a separate group that has the Absent entry instead of
  the Present entry.
