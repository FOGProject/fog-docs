---
title: Troubleshooting email
aliases:
    - Troubleshooting email
    - Image task email not sent
description: Why the image task completion email does not arrive, and how to test it
context_id: troubleshoot-email
tags:
    - troubleshooting
    - kb
    - email
---

# Troubleshooting email

FOG sends an email when an image task completes, if `FOG_EMAIL_ACTION` is on.
The settings are described in [[1.6/management/web/config#Email Settings]].

## Test first

On FOG 1.6, use **Send a test email to** under **FOG Configuration → FOG
Settings → FOG Email Settings**. It sends through the same path as the image
task email, so the result applies to both. The button is in dev-branch builds
from 27 November 2026, and on stable from the next monthly update. On an older
build, test from a shell on the FOG server, as the web server account
(`apache`, `www-data`, or `nginx`):

```bash
printf 'Subject: FOG test\n\nTest\n' | sudo -u www-data /usr/sbin/sendmail -t -i you@example.com
```

## "The mail command /usr/sbin/sendmail is not installed or is not executable"

**Cause:** `sendmail_path` in PHP's `php.ini` names a command that is not on
the server. A FOG install does not install a mail server.

**Fix:** install one, for example `postfix`, and start it. Or set
`sendmail_path` to a command that is installed, then restart PHP-FPM.

## "The mail command refused the email."

**Cause:** the mail command ran and returned an error. The text after the
message is PHP's reason.

**Fix:** run the shell test above to see the command's own error. Read the
mail server log, for example `journalctl -u postfix`.

## "Test Email Sent", but nothing arrives

**Cause:** the local mail server accepted the message, but it could not
deliver it. Common reasons:

- The mail server has no relay (smarthost), and the recipient's server refuses
  mail sent straight from your FOG server.
- The relay refuses the From address or the bounce address. The default From,
  `noreply@fogserver.com`, is not a real domain. Set `FOG_FROM_EMAIL` to an
  address on your own domain.
- The relay refuses the bounce address. FOG does not set it, so it is the web
  server account. See [[1.6/management/web/config#Bounce address]].

**Fix:** read the mail server log for the refusal, for example
`journalctl -u postfix`.

## Changing FOG_EMAIL_BINARY has no effect

**Cause:** the setting was never used. PHP always sends through
`sendmail_path` in `php.ini`. FOG 1.6 removes the setting in the same builds
that add the test button.

**Workaround:** change `sendmail_path` in `php.ini`, or in the PHP-FPM pool
file with `php_admin_value[sendmail_path]`. Then restart PHP-FPM.
