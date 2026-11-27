---
title: OIDC Sign-in Fails — Configuration for a Different Issuer
aliases:
    - The provider returned a configuration for a different issuer
    - Authentik OIDC sign-in fails
    - OIDC issuer trailing slash
description: Why an OIDC sign-in fails with "The provider returned a configuration for a different issuer" when the provider's issuer ends in a slash, such as Authentik, and what to do
context_id: oidc-issuer-trailing-slash
tags:
    - troubleshooting
    - oidc
    - plugins
    - users
---

# OIDC Sign-in Fails — Configuration for a Different Issuer

>[!info] FOG 1.6 and later
>The fix is in the bundled plugins release `v1.6.32`. FOG 1.6 dev-branch builds after 2026-11-27 install it. It ships in FOG 1.6.1.

## Symptom

A sign-in through the OpenID Connect plugin stops with this message:

```
The provider returned a configuration for a different issuer
```

The issuer is copied correctly from the provider. The provider is one whose issuer ends in a slash. Authentik is one, for example `https://authentik.example.com/application/o/fog/`.

## Cause

Earlier versions of the plugin removed a trailing slash from the **Issuer** field when the provider was saved. OpenID Connect requires the issuer in the provider's discovery document, and the `iss` claim in each ID token, to match the configured issuer exactly. The provider's issuer still ends in the slash, so the two never matched.

## Fix

Update to a FOG version that has the fix. The plugin then keeps the **Issuer** exactly as you type it. It removes a trailing slash only to build the discovery URL, as the OpenID Connect Discovery specification requires.

After the update, open the provider. Set **Issuer** to the value the provider shows, with its trailing slash, and save.

The match is exact in both directions. Do not add a slash that the provider does not show. Keycloak's issuer, for example, has no trailing slash.

## Workaround on earlier versions

There is no workaround in FOG. The plugin removes the slash at every save.

## See also

- [[management/web/oidc|OpenID Connect Sign-in]]
