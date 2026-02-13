# Testing Enrichment & Qualification Consistency

## Prerequisites

- `GOOGLE_GENERATIVE_AI_API_KEY` set
- App running: `npm run dev` (and `npx convex dev` if using Convex locally)
- At least one sheet with some leads

---

## 1. Enrichment consistency

**Goal:** Same leads → same enriched URLs (no random variation).

1. Pick **3 leads** (e.g. by name) and note their current `website` / `instagram` (or clear them for a clean test).
2. Run **Enrich** on those leads (or the whole sheet if it’s small).
3. Record the returned URLs (e.g. copy from table or export CSV).
4. **Run Enrich again** on the same leads.
5. **Check:** Enriched URLs are **identical** both times (and no new “made up” URLs).

**Optional:** Open DevTools → Console. You should see `[enrichLeads]` logs; any `[validateUrl]` or `[validateEnrichedData]` warnings mean invalid URLs/emails were stripped.

---

## 2. URL & email validation

**Goal:** Invalid URLs/emails are removed, not stored.

1. In Console, watch for:
  - `[validateUrl] Invalid URL format: ...` when the model returns a malformed URL.
  - `[validateEnrichedData] Invalid email format: ...` when email doesn’t match `...@... . ...`.
2. **Check:** After enrichment, no invalid URLs/emails appear in the table; affected fields are empty.

*(If you ever inject a fake URL/email in code or via a test, validation should clear it.)*

---

## 3. Qualification consistency & scoring

**Goal:** Same leads + same criteria → same score and classification every time.

1. Pick **5 leads** and a **fixed criteria** (e.g. “Must have website and Instagram”).
2. Open **Qualify** and enter that exact criteria.
3. Run qualification → note **score and classification** per lead (e.g. “High (80/100)”).
4. **Run qualification again** on the same 5 leads with the **same** criteria (no edits).
5. **Repeat once more** (3 runs total).
6. **Check:**
  - Same lead always gets the **same score** (e.g. always 80).
  - Same **qualification** (High/Low/Skip) each time.
  - Score matches the rule: `(points / criteria count) × 100` (e.g. 2/2 criteria = 100, 1/2 = 50).

---

## 4. Score calculation sanity check

**Goal:** `total_score` matches criteria evaluations.

1. After qualifying, open the **info tooltip** (ℹ️) on a few leads.
2. For each criterion: **met = 1 point**, not met = 0.
3. **Check:**
  `total_score ≈ (sum of points) / (number of criteria) × 100`  
   (e.g. 3 criteria, 2 met → 2/3×100 ≈ 67).

---

## 5. Frontend: score & tooltip

**Goal:** UI shows score and details correctly.

1. Qualify some leads (with criteria that produce a mix of High/Low/Skip).
2. **Check:**
  - Qualification badge shows **"High (75/100)"** style when a score exists (not just "High").
  - Leads without a score (e.g. only manually set) show **"High"** (or "–" if unset).
  - **ℹ️** appears when there is reasoning or criteria.
  - Clicking ℹ️ shows **reasoning** and **criteria list** (✓/✗ + evidence).

---

## 6. Quick manual smoke test

1. **Search** for a category + location → get leads.
2. **Enrich** → confirm websites/socials appear and look real (no obvious fake domains).
3. **Qualify** with e.g. “Must have website” → confirm scores and High/Low/Skip look reasonable.
4. **Export CSV** → confirm qualification and score columns (if you added them) are present and consistent with the UI.

---

## Success criteria (from plan)

- `temperature: 0` is set on all relevant `generateObject` calls (already done in code).
- Same enrichment input → same URLs on repeated runs.
- No hallucinated URLs (only from search); validation strips invalid URLs/emails.
- Same qualification input (leads + criteria) → same score and classification (test 3×).
- Score = (points / total criteria) × 100.
- Frontend shows qualification with score and optional tooltip with reasoning/criteria.

