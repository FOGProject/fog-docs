---
title: Image Management
description: Creating images is shared — what deleting one cleans up differs
context_id: images-versions
tags:
    - version-chooser
    - management
    - web-management
    - web-ui
    - images
---

# Image Management

Creating and managing image objects works the same way on both versions. What
differs is deletion: 1.5 has no referential-integrity checking, so removing an
image does not clean up or block on the records pointing at it the way 1.6 does.

- [[1.6/management/web/images|Image Management (1.6)]]
- [[1.5/management/web/images|Image Management (1.5)]]

>[!info] Which version am I on?
>Check **FOG Configuration → FOG Settings → General → FOG_VERSION** in the
>web UI, or the version string printed at the top of `installfog.sh`.
