---
name: Cloudflare blocked-page scope
description: Domain restriction and browser-path coverage of the CocoX Security blocked page.
---

The user requested a fancy “you have been blocked” page “for cocox.wtf nothing else.” They explicitly confirmed that opening paths such as cocox.wtf/234j in a browser must show the blocked page, not Meow Cheatz.

**Why:** the user restricted the change to that domain, and corrected the initial homepage-only interpretation.

**How to apply:** keep this browser-facing change in the Cloudflare Worker, covering arbitrary browser page paths rather than just the homepage. Preserve functional API, Lua-client, and installer requests. Do not replace the main app homepage or apply the blocked page to unrelated domains when revising its appearance.
