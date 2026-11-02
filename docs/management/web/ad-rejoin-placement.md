---
title: AD Rejoin and OU Placement
aliases:
    - AD Rejoin and OU Placement
    - AD Rejoin
    - Active Directory Rejoin
    - OU Placement Review
description: How FOG rejoins a deployed Windows computer to Active Directory with its own computer account, moves the account to the host's OU, and what to do when an operation needs review
context_id: ad-rejoin-placement
tags:
    - 1_6-changes
    - management
    - web-management
    - active-directory
    - ou
    - agent
    - fog-agent
---

# AD Rejoin and OU Placement

>[!info] FOG 1.6.0.N and later
>This feature is in the FOG 1.6.0.N release of 11 November 2026 and in
>later releases. Earlier 1.6.0 releases and FOG 1.5 do not have it. It
>works only with the [[fog-agent|FOG Agent]], not with the legacy FOG client.

## The problem it solves

You capture an image from a Windows computer that is a member of a domain.
You deploy that image to a different computer. The new computer starts with
the source computer's Active Directory (AD) membership and the source
computer's account. Two computers now use one computer account.

After a completed Deploy task, FOG plans one directory operation for the new
computer. The operation gives the new computer the correct computer account
for its FOG host name.

## Requirements

- **FOG**: the 1.6.0.N release of 11 November 2026 or later.
- **FOG Agent**: a release with directory rejoin support. The agent turns
  rejoin on only when the server advertises both
  `directory-join-target-v1` and `directory-task-operations-v1`. A server
  with this feature advertises both. Check the FOG Agent release notes for
  the first release that has this support.
- **Agent facts on.** `FOG_AGENT_INVENTORY_ENABLED` must be on (it is on by
  default). With it off, the server plans no operation.
- **AD settings on the host.** On the host's **Active Directory** tab,
  set **Enable Domain Joining**, **Domain Name**, **Domain Username** and
  **Domain Password**. The agent uses this account for the join. The account
  must have the AD rights for the operation it runs.
- **A directory connection.** FOG reads AD to find the computer account
  before it plans an operation. It uses the `FOG_DIRECTORY_*` settings under
  **FOG Configuration → FOG Settings → FOG Agent - Directory Placement**. Set
  `FOG_DIRECTORY_LDAP_URI`, `FOG_DIRECTORY_BIND_DN`,
  `FOG_DIRECTORY_BIND_PASSWORD`, `FOG_DIRECTORY_BASE_DN` and, for a private
  CA, `FOG_DIRECTORY_CA_CERT`. You need these settings for rejoin even when
  `FOG_DIRECTORY_PLACEMENT_ENABLED` is off. Without them, a Deploy task
  stops with `rejoin_lookup_failed`. The base DN must be the domain's own DN
  or a DN inside it.
- **Allow Computer Account Creation**, if FOG may create a new account. See
  below.
- **The machine identity must match.** The agent sends the computer's live
  SMBIOS and MAC values. They must resolve to the host that the agent's
  certificate belongs to. If they do not, the server refuses the poll with
  `identity_not_matched`.

## Configure the host

Open **Hosts**, select the host, and open the **Active Directory** tab. The
rejoin controls are on the same form as the AD fields. Click **Update** to
save them.

FOG looks for a computer account with the host's FOG name. What it finds
decides the operation:

| What FOG finds in AD | Operation | What you must do |
|---|---|---|
| An account with the host's name | **Rebind** to that existing account | Inspect it and confirm it (below) |
| No account with the host's name | **Create** a new account | Keep **Allow Computer Account Creation** on |
| The computer has a different name, and no account has the new name | **Rename** the computer's current account | Nothing. This applies only without a Deploy task |

A rename keeps the same account, so its GUID and SID do not change. A Deploy
task always plans a rebind or a create, not a rename.

### Allow Computer Account Creation

This checkbox is on until you turn it off. When it is off and no account
exists, the operation stops with `rejoin_create_not_permitted`.

### Inspect and confirm an existing account

FOG never rebinds to an existing account that you did not confirm.

1. Expand **Target computer account**.
2. Click **Inspect target candidate**. FOG reads AD and shows the
   **Account**, **Computer GUID**, **Computer SID** and **Distinguished
   Name**.
3. Make sure that this account belongs to this computer, or that its
   handoff is approved.
4. Select the confirmation checkbox under the details.
5. Click **Update**.

The inspection is a POST request and needs the `host.edit` permission. A
user who can only view the host cannot run it. If FOG finds no account, it
shows "No matching computer account was found." If it cannot read AD, it
shows "Target lookup is unavailable."

FOG stores the GUID and SID that you confirmed. Before the agent starts, and
again when the agent reports success, FOG reads AD again. A different
account with the same name stops the operation with `rejoin_target_changed`.

### Confirm Retry

**Confirm Retry** authorizes one rebind without a new Deploy task. The tab
shows it only when all of these are true:

- The agent's latest observation is current for this host.
- That observation says the secure channel check returned False.
- There is no earlier operation, or the earlier operation is verified.

Confirm Retry cannot clear an operation that needs review. Clear the
review first (see [[management/web/ad-rejoin-placement#Clear a failed or unknown operation|below]]).

### Changes while an operation is open

**Update** on this tab also saves the rejoin settings. So while an
operation is Ready, In progress or needs review, **Update** fails with
`rejoin_attempt_requires_review`. FOG saves none of the form, including the
AD fields. While an OU move needs review, **Update** fails with
`directory_placement_owner_protected`. Finish or clear the review first.

## What happens after a Deploy task

1. A Deploy task for the host completes.
2. The computer reboots. The agent polls and reports what it sees: the
   computer name, the domain, the secure channel and the boot time.
3. The server checks the Deploy task. The task must be the host's latest
   Deploy task. It must have completed in the last 24 hours, and the computer
   must have booted after it completed. No other imaging task can be in
   progress.
4. The server reads AD and plans one operation. The phase is **Ready**.
5. The agent claims the plan once. Only then does the server send the join
   credential. The phase is **In progress**.
6. The agent runs the operation and reports the result.

**One Deploy task authorizes one operation.** When the agent claims the
plan, the task is used. A second claim with the same task is refused. To
run the operation again, deploy again or use Confirm Retry.

A Deploy task for a computer that is in a workgroup plans a domain join
instead of a rebind.

### Phases you see

The **Directory operation history** section of the tab shows the
**Directory operation phase**:

| Phase on the tab | Meaning |
|---|---|
| Ready | The server planned the operation. The agent has not claimed it. |
| In progress | The agent claimed it. It may have changed the computer or its account. |
| Awaiting reboot | The operation succeeded. The computer must reboot to finish. |
| Verified | After the reboot the agent reported a healthy secure channel, the planned name and the planned domain. |
| Failed | The agent reported a failure. |
| Unknown | The agent could not tell whether the operation ran. |

The phases move forward only: In progress to Awaiting reboot, Failed or
Unknown, and Awaiting reboot to Verified or Unknown. A late or repeated
result cannot rewrite a finished phase.

The same section also shows **Saved diagnostic reason (may be historical)**,
**Native status (history)** and **Last operation result time (UTC)**. The
**Domain Join Status** line above it shows the latest observation, for
example "Joined and secure channel healthy".

### The name rule

The host name must be a valid AD computer name:

- letters, digits and hyphens only;
- 1 to 15 characters;
- not all digits;
- no hyphen at the start or the end.

Any other name stops the plan with `rejoin_name_invalid`. The poll still
succeeds, so the agent keeps checking in. Rename the host in FOG to fix it.

## OU placement

When OU placement is on, FOG moves the host's computer account into the OU
set in the host's **Organizational Unit** field. FOG sends one LDAP move from
the server. The computer does not reboot or rejoin.
[[management/web/fog-agent#Hostname and directory membership|The FOG Agent]] page describes
how to turn placement on and which rights the bind account needs.

This release makes each move safe to repeat:

- **FOG moves the account by its GUID**, not by its name. A different
  object with the same name is never moved.
- **FOG sends a move at most once.** FOG records the request before it sends
  it. It never sends a recorded request a second time.
- **Placement waits for rejoin.** FOG does not move the account while a
  rejoin operation is open. It also waits until the agent reports a healthy
  secure channel, with the host's FOG name and domain.

A successful move is audited as `agent.directory.move`.

### When a move needs review

FOG cannot always know what the directory did. The tab then shows one of
two messages:

- "A request to move this computer object to *OU* may have run, or may still
  be running." FOG sent the move and has no answer yet.
- "A request to move this computer object to *OU* has an unknown result."
  The answer was lost, or the directory refused the move.

While either message shows, FOG does not move that account again.

To clear it:

1. Read AD and find where the computer account is now.
2. On the host's **Active Directory** tab, select **Clear OU placement
   review**.
3. Click **Update**.

Clearing records your decision. It undoes nothing in AD. On a later
check-in FOG may send the move again. It needs the `host.edit` permission
and is audited as `host.directory.intent_review_cleared`.

>[!warning] The 10-minute clear window
>FOG refuses the clear until 10 minutes after the request last changed. The
>refusal reason is `directory_placement_move_may_be_running`.
>
>FOG waits up to 60 seconds for the directory to answer a move. After that
>timeout, the directory can still apply the move. If you clear the request
>too soon, the next check-in can send a second move while the first one is
>still live. The 10-minute window is well above the timeout. Wait, then try
>again.

## Clear a failed or unknown operation

An operation in **In progress**, **Awaiting reboot**, **Failed** or
**Unknown** needs review. FOG also needs review when it cannot read the
stored state ("Directory operation state is unreadable"). Until you clear
it, FOG plans nothing new for the host.

In progress and Awaiting reboot normally move on when the agent reports.
Clear them only when they do not.

1. Look at the computer and at AD. Keep any evidence that you need.
2. On the host's **Active Directory** tab, select **Clear directory
   operation review**.
3. Click **Update**. FOG does not apply the other rejoin settings in the
   same update.

What a clear does:

- It needs the `host.edit` permission.
- It undoes nothing in AD and nothing on the computer.
- It is audited as `host.directory.review_cleared`, with the attempt that
  you cleared.
- It uses up every Deploy task that exists for the host. An old task cannot
  start a new operation. To try again, deploy again or use Confirm Retry.
- It clears the server's record only. The agent can still hold its own
  record of the operation.

If the operation changed after the tab loaded, the clear fails with
`rejoin_review_changed`. Reload the tab and check again.

## Deleting a host

FOG refuses to delete a host (HTTP 409) while any of these is true:

- its operation is In progress, Awaiting reboot, Failed or Unknown;
- its stored operation state is unreadable;
- it has an OU move that may have run or has an unknown result.

The message is "Host *name* has a directory operation in progress or
awaiting review. Clear it on the Active Directory tab before deleting." This
applies to a single delete, a mass delete and the API.

## Troubleshooting

The server saves a reason on the host when a plan stops. Find it under
**Directory operation history → Saved diagnostic reason (may be
historical)**.

| Reason | Meaning | What to do |
|---|---|---|
| `rejoin_name_invalid` | The host name breaks the name rule | Rename the host in FOG |
| `rejoin_target_confirmation_required` | An account with the host's name exists, and you did not confirm it | Inspect and confirm it |
| `rejoin_create_not_permitted` | No account exists, and creation is off | Turn on **Allow Computer Account Creation**, or create and confirm the account |
| `rejoin_lookup_failed` | FOG could not read AD, or the directory connection is not set | Check the `FOG_DIRECTORY_*` settings and the bind account |
| `rejoin_directory_unconfigured` | `FOG_DIRECTORY_LDAP_URI` is not a valid `ldap://` or `ldaps://` URI | Fix the URI |
| `rejoin_directory_unavailable` | FOG could not connect or bind to the directory | Check the URI, the bind account, the password and the CA file |
| `rejoin_domain_unverified` | The directory did not confirm the host's domain | Check **Domain Name** on the host |
| `rejoin_scope_invalid` | `FOG_DIRECTORY_BASE_DN` is empty or outside the host's domain | Set a base DN inside the domain |
| `rejoin_target_invalid` | The account found does not have a valid GUID, SID or name | Check the account in AD |
| `directory_domain_mismatch` | The computer is in a different domain from the host's **Domain Name** | Fix the domain on the host or on the computer |
| `directory_recovery_confirmation_required` | The secure channel is not healthy, and nothing authorizes a rebind | Deploy again, or use Confirm Retry |
| `directory_pending_name_conflict` | The computer has a pending rename to a different name | Let the computer reboot, then check the name |
| `rename_identity_unverified` | FOG could not confirm the account that a rename would change | Check the computer's current account in AD |

FOG saves a reason only while no operation is open. An open operation
keeps its own phase and reason.

These reasons come back as **Host Update Fail** when you click **Update**
on the tab. FOG saves nothing from that update.

| Reason | Meaning | What to do |
|---|---|---|
| `rejoin_attempt_requires_review` | An operation is open | Wait for it to finish, or clear the review |
| `directory_placement_owner_protected` | An OU move for this host needs review | Clear the OU placement review |
| `rejoin_target_confirmation_required` | The account you confirmed is no longer the account in AD | Inspect and confirm again |
| `rejoin_review_changed` | The operation changed after the tab loaded | Reload the tab |
| `directory_intent_review_changed` | The OU move request changed after the tab loaded | Reload the tab |
| `directory_placement_move_may_be_running` | You tried to clear an OU move too soon | Wait 10 minutes after the request last changed |

The server sends some reasons to the agent and does not save them on the
host. The most common are these:

| Reason | Meaning |
|---|---|
| `rejoin_target_changed` | The account in AD is not the one you confirmed. Inspect and confirm again |
| `directory_task_in_progress` | An imaging task for the host is still open |
| `directory_task_expired` | The Deploy task completed more than 24 hours ago |
| `directory_task_unknown` | FOG cannot tell whether the Deploy task applies, for example because the computer has not booted since it completed |
| `directory_observation_required` | The agent must send a new observation first |
| `identity_not_matched` | The computer's SMBIOS and MAC values do not match the host |
| `directory_placement_target_protected` | An OU move that may have run still holds the same account. Clear the OU placement review first |

## Known limits

- **Two hosts can race for one name.** If two different hosts claim the
  same account name at the same instant, FOG cannot stop both. AD allows
  one account for each name, so one of the two operations cannot succeed.
  That host's operation then needs review. Clear it, fix the names, and
  deploy again.
- **The legacy FOG client is not supported.** Only the FOG Agent runs these
  operations.

See also: [[ad-integration|Active Directory Integration]] and
[[fog-agent|The FOG Agent]].
