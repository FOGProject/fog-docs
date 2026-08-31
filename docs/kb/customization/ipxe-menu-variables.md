---
title: iPXE Menu Variables
aliases:
    - iPXE Menu Variables
    - PXE Menu Variables
    - Boot Menu Variables
description: The variables FOG sets in the iPXE boot script, and how to use them in a custom menu item's parameters
context_id: ipxe-menu-variables
tags:
    - customization
    - boot-menu
    - ipxe
    - 1_6-changes
---

# iPXE Menu Variables

When a machine PXE boots, FOG generates an iPXE script for *that* machine and
sends it as the boot menu. Before the menu is drawn, the script sets a number
of variables, and anything you write in a menu item's **Menu Parameters** can
reference them with iPXE's `${name}` syntax.

That is what lets one menu entry serve a whole fleet. Instead of a per-machine
entry hard-coding a filename:

```
kernel ${boot-url}/os/installer-vmlinuz config_url=http://server/config-hyper09.yaml
```

…one entry covers every registered host:

```
kernel ${boot-url}/os/installer-vmlinuz config_url=http://server/config-${hostname}.yaml
```

>[!note] Where you edit this
>**iPXE Menu** in the sidebar → pick or create a menu item → the **Menu
>Parameters** box. The contents are passed to iPXE verbatim, so these are raw
>iPXE commands, not a FOG template language. See
>[[kb/customization/ipxe|Customizing FOG iPXE Settings]] for worked examples of
>custom entries.

## Always set

These are present on every boot, registered host or not.

| Variable | What it holds |
| --- | --- |
| `${fog-ip}` | The address clients use to reach the FOG server |
| `${fog-webroot}` | The web root, with no surrounding slashes (usually `fog`) |
| `${boot-url}` | Scheme + server + web root, ready to build a URL from |
| `${setmacto}` | The MAC iPXE actually booted with, for FOS to adopt |
| `${arch}` | `x86_64` or `i386`, resolved from the firmware's own report |
| `${storage-ip}` | The storage node's address. Absent if no node is enabled |

Two more appear only in specific situations: `${key}` and `${keyName}` when the
menu is hidden behind a key press, and `${imageID}` during an imaging task.

## Set for a registered host

Everything below comes from the host's own record, so an **unregistered machine
gets none of it** — guard with `isset` if a menu item has to work in both cases.

| Variable | Host page field |
| --- | --- |
| `${hostname}` | Host Name |
| `${primac}` | Primary MAC |
| `${macs0}`, `${macs1}`, … | Every MAC on the host, primary first |
| `${ip}` | Host IP |
| `${imageID}`, `${imagename}` | The assigned image |
| `${archID}`, `${archname}` | Architecture last seen from this machine |
| `${building}` | Building / location id |
| `${useAD}`, `${enforce}`, `${pending}` | Flags, as `0` or `1` |
| `${kernel}`, `${init}`, `${kernelArgs}`, `${kernelDevice}` | Per-host boot overrides |
| `${biosexit}`, `${efiexit}` | Per-host exit type |
| `${pingstatus}`, `${pingmethod}`, `${lastping}`, `${lastcheckin}` | Ping/check-in state |
| `${printerLevel}` | Printer management level |

## Set from the host's inventory

Present once the machine has been inventoried, and useful for branching on
hardware rather than on identity:

`${sysman}` `${sysproduct}` `${sysversion}` `${sysserial}` `${sysuuid}`
`${systype}` `${biosversion}` `${biosvendor}` `${biosdate}` `${mbman}`
`${mbproductname}` `${mbversion}` `${mbserial}` `${mbasset}` `${cpuman}`
`${cpuversion}` `${cpucurrent}` `${cpumax}` `${mem}` `${hdmodel}` `${hdserial}`
`${hdfirmware}` `${caseman}` `${casever}` `${caseserial}` `${caseasset}`
`${gpuvendors}` `${gpuproducts}` `${primaryUser}` `${other1}` `${other2}`

`${other1}` and `${other2}` are the **Other Tag** fields on the host's Inventory
tab. Nothing in FOG reads them, which makes them the natural place to park a
flag your own menu logic branches on.

## The rule, rather than the list

The list above is not hand-maintained inside FOG — the script is generated from
the host and inventory rows as they are, so a field added to either shows up
here on its own. What you get is **every column on those two records except**:

- row plumbing: ids, creation and deletion timestamps, who created it;
- anything the REST API classes as a secret: tokens, keys, passwords, the
  Windows product key, and the Active Directory credentials;
- the host **Description**, deliberately withheld.

>[!warning] Do not put anything sensitive in a field listed above
>The boot script is served to a machine that has not authenticated — a booting
>NIC has no credential to present — so treat every variable here as public to
>anything that can reach the FOG server and guess a MAC. That is why the
>secrets are excluded, and why you should not repurpose, say, an Other Tag to
>carry a licence key.

## Dumping the exact set for one machine

The authoritative answer for your own server is the script itself. Ask for it
the way a booting machine would, substituting a MAC you have registered:

```bash
curl -sk -X POST -d "mac=00:11:22:33:44:55&arch=x86_64&platform=efi" \
  https://your-fog-server/fog/service/ipxe/boot.php | grep '^set '
```

Every `set` line above the menu is a variable you can use. Run it against a
machine that is registered *and* inventoried to see the widest set.

## Things that catch people out

- **A field that is empty emits nothing at all.** `isset ${mbasset}` is false
  when the column is blank, so test with `isset` before comparing.
- **A flag that is off is `0`, not missing.** `${enforce}`, `${useAD}` and
  `${pending}` emit `0` rather than being skipped, so `iseq ${enforce} 0` works
  and is the right way to branch on a flag being off.
- **Values are sanitized.** iPXE treats a newline and `&&`/`||` as command
  separators, so those characters — along with `$`, `{` and `}` — are stripped
  from values before they are written, and values are cut at 255 characters. A
  value carrying them is not a way to inject extra iPXE commands.
- **Menu Parameters are not sanitized**, because they are yours: whatever you
  type is passed to iPXE as written. A syntax error there is a machine that
  does not boot, so test on one host before making an entry the default.
- **This is FOG 1.6.** FOG 1.5 sets only the "always" group; the host and
  inventory variables do not exist there.

## Related

- [[kb/customization/ipxe|Customizing FOG iPXE Settings]] — adding custom entries and a custom background
- [[1.6/management/fos/using-fog-boot-menu|Using the FOG Boot Menu]] — the built-in menu entries
- [iPXE command reference](https://ipxe.org/cmd) — upstream, for the commands themselves
