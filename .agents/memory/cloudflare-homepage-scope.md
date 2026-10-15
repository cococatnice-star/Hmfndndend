---
name: Cloudflare homepage scope
description: Domain-specific scope of the CocoX Security blocked-page request.
---

The user requested a fancy “you have been blocked” page “for cocox.wtf nothing else.”

**Why:** the user explicitly restricted the change to that domain, rather than the underlying Replit website or other hostnames.

**How to apply:** keep this browser-facing change in the Cloudflare Worker. Do not replace the main app homepage or apply the blocked page to unrelated domains when revising its appearance.
