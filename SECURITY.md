# SECURITY.md — disclosure policy

## Reporting a Security Issue

Single contact channel for v1:

- Open a GitHub Issue with label `security` (preferred — public traceability for non-sensitive issues), OR
- Email the maintainer at `PLACEHOLDER@example.com` for sensitive issues that should not be public.

There is no anonymous reporting infrastructure in v1.

## What's In Scope

- Cross-site scripting (XSS) in any page render, including chat output (Phase 5).
- Prompt-injection or data exfiltration via the chat endpoint (Phase 5).
- Exposed secrets in the repository (`.env*`, API keys, tokens).
- Outdated dependencies with published CVEs that affect site build, deploy, or runtime.
- Site rendering bugs that leak personally identifying data (this site collects none — the surface is small).

## Out of Scope

- DDoS or volumetric attacks — Cloudflare's responsibility (free-tier shielding is configured per `SETUP.md`).
- Social-engineering of maintainers.
- Missing security headers on third-party CDN content — there are no third-party CDNs in v1 (verified in `CONTRIBUTING.md` anti-features list).
- Issues that require a privileged position to exploit (e.g., compromised contributor machine).

## Response Targets

| Severity | Acknowledgement | Fix / mitigation plan |
|---|---|---|
| HIGH (exploitable, data exposure or RCE) | 72 hours | 14 days |
| MEDIUM (significant impact, no immediate exploit) | 5 business days | 30 days |
| LOW (informational, hardening suggestion) | 10 business days | Best effort |

Sustainability mode (`MAINTENANCE.md`) doubles the targets above.

## Bug Bounty

No bug-bounty program in v1. May launch in v1.1 if funding allows (`FUT-08`).

## Disclosure Policy

Coordinated disclosure preferred. Please give the maintainer **30 days** before public disclosure of an unpatched HIGH-severity issue. Lower severities can be disclosed sooner with reasonable notice.
