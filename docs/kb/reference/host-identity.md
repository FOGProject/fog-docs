---
title: Host Identity
aliases:
    - Host Identity
    - SMBIOS Host Identity
    - FOG_HOST_IDENTIFY_SMBIOS
description: How FOG decides which host is booting - the MAC address first, the machine's SMBIOS firmware identity second - and how to move FOG_HOST_IDENTIFY_SMBIOS from Log to Enforce
context_id: host-identity
tags:
    - 1_6-changes
    - reference
    - hosts
    - identity
    - registration
    - smbios
---

# Host Identity

>[!info] FOG 1.6 and later
>This page describes a feature introduced in FOG 1.6. FOG 1.5 identifies a
>host by its MAC address alone and has no equivalent setting.

**FOG Configuration → FOG Settings → General Settings → FOG_HOST_IDENTIFY_SMBIOS.** New in 1.6.

When a machine PXE-boots, FOG has to answer one question before it can do
anything else: *which host record is this?* Historically the only answer was
the MAC address. FOG 1.6 adds a second answer, read from the machine's own
firmware, and a setting that decides how much that second answer is worth.

**The MAC address is still the identity.** The firmware identity is a second
opinion. It never guesses, it is off by default in the sense that it changes
no decision, and you turn it up only once your own logs tell you your hardware
can be trusted.

## Why the MAC is not always enough

A MAC address is unique in principle, but it is a property of a *network
interface*, not of a machine. Three situations break the assumption, and all
three are common in an imaging workflow:

- **A shared USB NIC.** One adapter carried around a bench and plugged into
  each machine in turn. Every one of them presents the same MAC, so FOG sees
  one host being re-imaged over and over instead of twenty different machines.
- **Docking stations.** The dock owns the NIC. Every laptop docked at that
  desk boots as the same host.
- **Laptops with no onboard Ethernet at all**, which is most of them now.
  Whatever adapter is to hand becomes the machine's identity for that boot.

The reverse case matters too: replace a failed NIC in a desktop and its MAC
changes, so a machine FOG has known for years arrives as a stranger and
registers itself a second time.

## What the machine reports

iPXE can read four values straight out of SMBIOS, with no custom iPXE build,
and sends all four with every boot request alongside the MAC list it has
always sent. FOS reads the same four with `dmidecode` during a hardware
inventory, so a value seen at boot and a value stored from an inventory are
the same bytes.

| Field | iPXE variable | SMBIOS source | Typical usefulness |
|---|---|---|---|
| `sysuuid` | `${uuid}` | System UUID (type 1) | Set on nearly everything, including VMs |
| `sysserial` | `${serial}` | System serial number (type 1) | Good on tier-one hardware, often a placeholder on white-box |
| `mbserial` | `${board-serial}` | Baseboard serial number (type 2) | Unique on Asus, HP, Lenovo, Surface; `none` on VMware and QEMU |
| `caseasset` | `${asset}` | Chassis asset tag (type 3) | Only what someone typed into firmware, so blank unless your organisation sets it |

>[!warning] `caseasset` is the *chassis* asset tag
>It is SMBIOS type 3, which is what iPXE's `${asset}` reads - not the
>baseboard asset tag FOS stores as `mbasset`. On plenty of hardware the
>chassis tag is set and the board tag is empty.

These are the same values exposed to the boot menu as iPXE variables; see
[[ipxe-menu-variables|iPXE menu variables]] if you want to branch a menu on
hardware rather than identify a host by it.

### The inventory row is the lookup table

The firmware identity is matched against the `inventory` table, one row per
host. A host created in the web UI, by CSV import or over the API has no
inventory row at all until something fills one, so until then nothing can
find it by firmware.

FOG 1.6 fills the gap at boot:

- If the host has **no inventory row**, the boot path creates one carrying
  just the four identity fields.
- If the row exists but a field is **empty**, boot fills it.
- Boot **never overwrites** a serial or asset tag that FOS stored. FOS's
  `dmidecode` is the authority for those. Where the stored value and what
  iPXE reported disagree, the stored one is kept and the pair is written to
  the log (see [[kb/reference/host-identity#Reading the log|Reading the log]]).
- The system UUID keeps its long-standing rule: a well-formed UUID that
  differs from the stored one replaces it, which is how a motherboard swap is
  absorbed. A malformed or absent UUID leaves the stored value alone.

So a CSV-imported host becomes findable by firmware after its **first PXE
boot**, not after its first full inventory.

Two qualifiers. This filling happens only for a host FOG already recognises -
an unregistered machine has no row to write to. And it happens **regardless of
the setting below**, including `off`: the values are collected either way, so
switching a long-running install from Off to Log to Enforce works against data
it has already been gathering.

## How a firmware match is decided

Every rule below is deliberately conservative. The first attempt at this
feature, in 2018, resolved the UUID and took the first hit; it met MSI boards
that all report `FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF`, cheerfully identified
every one of them as the same host, and was reverted wholesale. The rules
exist so that cannot happen again.

### Values that do not count

Before anything is compared, each value is trimmed and internal runs of
whitespace are collapsed. Comparison is case-insensitive. A value is then
discarded entirely - it scores nothing and is not even searched for - if it
is:

- **empty**;
- **a known firmware placeholder**, compared case-insensitively. The list
  includes `Not Specified`, `Not Present`, `Not Settable`, `Not Applicable`,
  `Not Available`, `None`, `N/A`, `Unknown`, `Default string`,
  `To be filled by O.E.M.`, `To Be Set By OEM`, `Enter Serial`,
  `System Serial Number`, `Base Board Serial Number`, `Chassis Serial Number`,
  `Chassis Asset Tag`, `Asset Tag`, `No Asset Tag`, `No Asset Information`,
  and a handful of specific junk UUIDs seen in the wild;
- **one character repeated**, after dashes, slashes and spaces are removed.
  This is what catches `0`, `000000000`, `FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF`
  and Dell's `/0000000/` form without anyone having to enumerate them.

### Scoring

What survives is compared against the `inventory` table:

1. **One point per field that matches, compared field to field.** A serial
   that matches is only a match *in the same column*. A system serial that
   happens to equal some other host's board serial scores nothing.
2. **At least one of the UUID, system serial or board serial must match**
   before the asset tag counts at all.
3. **The chassis asset tag breaks ties but cannot win alone.** It is the one
   value a person sets by hand, which makes it the right tiebreaker for
   machines whose other three fields are all placeholders - and the wrong
   thing to trust on its own.
4. **The winner must hold the top score alone.** If two hosts tie, the
   firmware has no opinion and says so. It does not pick one.

Worked examples:

| Machine reports | Inventory holds | Result |
|---|---|---|
| UUID `aaaa1111-…`, serial `SER-11` | Host A: same UUID, same serial. Host B: same UUID, no serial | **Host A** - 2 points beats 1 |
| UUID `aaaa1111-…` only | Host A and Host B: both hold that UUID | **No opinion** - a tie is not an answer |
| Asset tag `TAG-1` only | Host A: that asset tag, nothing else | **No opinion** - the asset tag cannot win by itself |
| System serial `SAME` | Host A: `SAME` in its *board* serial column | **No opinion** - fields are compared to their own kind |
| UUID `FFFFFFFF-FFFF-…`, board serial `ABC1234` | Host A: that board serial | **Host A** - the junk UUID was discarded before the search, so only the board serial was in play |

**No MAC address takes part in any of this.** The lookup runs against the
`inventory` table and returns a host id. This has been verified end to end: a
host stripped of every MAC address it owned is still resolved correctly by its
firmware under Enforce. That is not a supported state to run in - see
[[kb/reference/host-identity#What the firmware identity does not do|What the firmware identity does not do]] - but
it demonstrates that the MAC is the *default* identity, not a prerequisite for
the firmware one.

## The three modes

> FOG Configuration → FOG Settings → General Settings → FOG_HOST_IDENTIFY_SMBIOS

| Mode | UI label | What it does |
|---|---|---|
| `off` | Off - MAC address only | The SMBIOS values are ignored. FOG behaves exactly as 1.5 did. |
| `log` **(default)** | Log - MAC decides, log disagreements | The MAC's answer stands. Every time the firmware would have answered differently, one line goes to the web server error log naming both. |
| `enforce` | Enforce - firmware identity wins | A unique firmware match wins over the MAC at boot, and attaches an unknown MAC to a firmware-identified host at registration. Every override is still logged. |

A missing or unrecognised setting is treated as `off`, so an install whose
schema has not been updated yet behaves exactly as it did before the setting
existed.

**FOG ships in `log`.** That is deliberate, and it is the whole point of the
design: there is no lab anywhere that can enumerate what every vendor writes
into SMBIOS, so your own fleet is the lab. Log mode turns each install into a
reporter without changing a single decision it makes.

### What happens at boot

The decision runs once, on the iPXE boot path, before the menu is drawn.

- Firmware silent, ambiguous, or in agreement with the MAC → nothing happens,
  in every mode.
- Firmware names a host and the MAC found **none** → `log` logs it and the
  machine still gets the unregistered menu; `enforce` boots it as that host.
- Firmware names a **different** host than the MAC found → `log` logs it and
  the MAC's host is kept; `enforce` switches to the firmware's host.

### What happens at registration

Full registration asks the firmware too, and the rule here is deliberately
stricter than at boot. A current FOS sends all four fields with a
registration; an older FOS sends only the system UUID, which still works but
gives the scoring one field to go on instead of four.

| Mode | MAC resolves | Firmware resolves | Outcome |
|---|---|---|---|
| `enforce` | nothing | one host | **Attach.** The machine's MACs are added to that host and registration answers "already registered as *name*". Recorded in the audit log under `host.register`. |
| `log` | nothing | one host | Logged, then registers a new host as before. |
| `off` | nothing | one host | Nothing. Registers a new host. |
| `enforce` | a host | a **different** host | Logged. **The MAC wins.** A known MAC is never overruled at registration, in any mode. |
| any | a host | the same host | Silence. They agree. |
| any | anything | nothing | Silence. |

The asymmetry is intentional. At boot, nothing is written and a wrong answer
costs one reboot. At registration, attaching MACs to the wrong host edits the
database, so the bar is higher.

The practical effect of the Enforce row: **a machine whose NIC was replaced
keeps its host record** instead of becoming a duplicate that someone later has
to merge by hand.

## Reading the log

Every line is written with PHP's `error_log()` and is prefixed
`FOG host identity`, so one grep finds all of them.

Where they land depends on how your server serves PHP:

| Server | File |
|---|---|
| Apache | Apache's `ErrorLog` - usually `/var/log/httpd/error_log` (RHEL family) or `/var/log/apache2/error.log` (Debian family) |
| nginx + PHP-FPM | The PHP-FPM pool's error log - usually `/var/log/php-fpm/www-error.log` |

If neither holds them, check the `error_log` directive in `php.ini`.

```bash
grep 'FOG host identity' /var/log/php-fpm/www-error.log
```

There are three line shapes.

**A boot-time disagreement.** The mode is in the parentheses and the verdict is
the last clause:

```
FOG host identity (log): MAC resolved no host; SMBIOS resolved "lab-desk-04" (id 264) on sysuuid=5c1a17de-0000-4000-8000-000000000198, sysserial=CLAUDEID1SER; MAC kept (log mode)
```

```
FOG host identity (enforce): MAC resolved "old-name" (id 12); SMBIOS resolved "lab-desk-04" (id 264) on sysuuid=5c1a17de-0000-4000-8000-000000000198; SMBIOS wins
```

**A registration disagreement**, which additionally names the MACs presented:

```
FOG host identity (registration, enforce): MAC 00:11:22:33:44:55 resolved no host; SMBIOS resolved "lab-desk-04" (id 264) on sysuuid=5c1a17de-…; MACs attached to it, registration answered as existing
```

**A field disagreement** between what iPXE read and what FOS stored. This one
carries no mode, because it is not an identity decision - it is the raw
byte-fidelity question, and it is arguably the most useful thing log mode
produces:

```
FOG host identity: host "lab-desk-04" (id 264) mbserial is "ABC1234" in inventory but iPXE reports "/ABC1234/X/"; inventory kept
```

## Moving from Log to Enforce

Do not flip the setting because the feature sounds useful. Flip it because
your own log said your hardware is trustworthy. The procedure:

1. **Leave it on `log`** and let the fleet boot normally for long enough that
   most models have been through PXE at least once.
2. **Collect the lines**: `grep 'FOG host identity' <your error log>`.
3. **Look for the failure shape first.** The thing that would hurt is *one
   host id appearing as the SMBIOS answer for many different machines*. That
   means a placeholder value got past the filters on that model, and it is the
   exact 2018 failure. Count them:

   ```bash
   grep 'FOG host identity (' <error log> \
     | grep -o 'SMBIOS resolved "[^"]*" (id [0-9]*)' \
     | sort | uniq -c | sort -rn | head
   ```

   A healthy fleet gives you a long tail of counts near 1. A count in the
   dozens against one host id is a model to investigate before going further.
4. **Read the field-disagreement lines.** They tell you which fields your
   vendors report inconsistently between iPXE and `dmidecode`. A field that
   disagrees constantly on a model is a field you would rather not have
   scoring points on that hardware.
5. **Check that the disagreements you do see are the ones you want.** Lines
   saying the MAC found nothing and the firmware found a host are the feature
   working - typically a replaced NIC or a shared USB adapter.
6. **Switch to `enforce`.** It is one setting, and going back to `log` or
   `off` is the same single change. Nothing about the stored data changes when
   you switch, so it is a toggle, not a migration.

>[!tip] Mixed fleets
>The setting is install-wide. If one model in your estate reports garbage and
>the rest are clean, you are choosing between leaving the whole install on
>`log` and accepting that model's behaviour under `enforce`. Correcting that
>model's firmware - most vendors allow the asset tag or serial to be
>programmed - is often less work than it sounds, and the chassis asset tag
>exists in the scoring precisely so a human can settle these cases.

## What the firmware identity does not do

- **The FOG client still identifies itself by MAC address, always.** The
  firmware decision runs on the iPXE boot path only. Extending it to the
  client's check-in is tracked upstream and is not in 1.6 today.
- **The API, CSV import and the web UI all key on MAC.** Nothing there
  consults SMBIOS.
- **A host still needs a primary MAC address to be usable.** Every imaging
  task hands FOS the host's *stored* primary MAC on its kernel command line,
  so a host with no MAC at all can be recognised by firmware but cannot be
  tasked. The web UI will not let you get there - it refuses with *"Cannot
  delete the primary mac address, please reselect"* - but a direct
  `DELETE` on the API's `macaddressassociation` endpoint carries no such
  guard. If you have arrived at a host in that state, see
  [[primary-mac-address-issues|Primary Mac Address Issues]].
- **It does not deduplicate hosts you already have.** It prevents new
  duplicates at registration under `enforce`; it does not go back and merge
  the ones already in your database.

## See also

- [[primary-mac-address-issues|Primary Mac Address Issues]] - fixing a host whose primary MAC is missing or stuck pending
- [[hosts|Host Management]] - registration methods and multiple MAC address support
- [[config|Fog Configuration]] - the settings page this setting lives on
- [[ipxe-menu-variables|iPXE menu variables]] - the same SMBIOS values, used for branching a boot menu on hardware
