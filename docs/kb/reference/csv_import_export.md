---
title: CSV Import / Export
description: Both versions have CSV import/export, but 1.6 reworked the format substantially
context_id: csv_import_export-versions
tags:
    - version-chooser
    - import
    - export
    - csv
    - configuration
    - management
---

# CSV Import / Export

CSV import/export is not new — 1.5 has had it for a long time — but 1.6 reworked
the format significantly. 1.5 uses raw, positional columns with no header row,
no associations column and no foreign-key name resolution; 1.6 adds all three.

- [[1.6/kb/reference/csv_import_export|CSV Import / Export (1.6)]]
- [[1.5/kb/reference/csv_import_export|CSV Import / Export (1.5)]]

>[!info] Which version am I on?
>Check **FOG Configuration → FOG Settings → General → FOG_VERSION** in the
>web UI, or the version string printed at the top of `installfog.sh`.
