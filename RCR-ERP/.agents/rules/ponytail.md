# Ponytail Rule (Clean, Minimalist & Anti-Bloat Code Philosophy)

## Core Philosophy: "The Pragmatic Senior Developer"
Write only what is strictly necessary. Never add speculative code, redundant boilerplate, unnecessary abstractions, or bloated third-party dependencies.

---

## The Ponytail Decision Ladder (Before Writing ANY Code)
Always climb this ladder in order:
1. **Do you even need this? (YAGNI):** If it is not solving a real, immediate requirement, delete it or do not write it.
2. **Does the standard library/language already do it?:** Use native JavaScript/TypeScript features (e.g. `Array.prototype.map/filter/reduce`, `Intl.NumberFormat`, `Date`, `Set`, `Map`) instead of writing custom looping utility libraries.
3. **Can a native platform/HTML feature be used?:** Use native elements (e.g. `<input type="date">`, standard CSS flexbox/grid) instead of heavy 500-line custom component libraries when native works perfectly.
4. **Can it be solved with an existing dependency?:** Do not install new packages if existing installed libraries (`zod`, `tailwind`, `prisma`, `lucide-react`, `date-fns`) can solve it.
5. **Can it be written in one/minimal clean lines?:** Prefer direct, expressive code over multi-layer wrapper functions.

---

## Anti-Bloat & Clean Code Principles
1. **No Duplicate Code (DRY):**
   - If identical calculation/formatting logic exists in multiple places, centralize it in `src/lib/utils.ts` or a shared helper.
2. **No Dead or Orphaned Code:**
   - Remove unused variables, deprecated helper functions, uncalled handlers, and obsolete imports.
3. **Keep Functions Focused & Short:**
   - Avoid 300+ line monolith functions where 3-4 smaller, composable helpers improve readability and testability.
4. **Zero-Fluff State Management:**
   - Derive state dynamically rather than syncing redundant state variables with `useEffect`.
5. **Security & Boundary Protection Guarantee (Non-Negotiable):**
   - NEVER simplify away authentication, validation, sanitization, database transactions, or error handling. Efficiency must never compromise security.
