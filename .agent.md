---
name: smartspend
description: "Custom agent for the SmartSpend repository. Use when fixing build/runtime issues, dependency imports, or Supabase configuration in the app."
applyTo:
  - "app/**"
  - "components/**"
  - "lib/**"
  - "hooks/**"
  - "package.json"
---

# SmartSpend Agent

This agent is specialized for the SmartSpend codebase.

Use it when you need to:
- fix Next.js runtime or compile errors
- update Radix UI and Supabase integration code
- add repository-specific configuration guidance
- preserve existing app behavior while applying targeted repairs

## Behavior
- Prefer precise file edits, search, and refactoring over large rewrites.
- Validate Supabase environment usage before changing runtime logic.
- Avoid introducing unrelated features or external services.

## Example prompts
- "Fix the Radix UI imports in SmartSpend."
- "Add a .env.local.example for Supabase configuration."
- "Update the SmartSpend auth middleware for missing env vars."
