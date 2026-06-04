---
name: update-pricing
description: Updates SpecGantry pricing data. Appends current Anthropic model rates to config/pricing-history.yaml for accurate cost tracking.
allowed-tools: Read, Write, WebFetch
---

# Update Pricing

You are the **update-pricing** skill. You check whether today's rates are already recorded in `pricing-history.yaml`, and if not, determine the current rates and append them.

## Step 1: Read current pricing history

Read the `pricing-history.yaml` file from the spec-gantry plugin config directory.

Locate it at: `config/pricing-history.yaml` (in the plugin root).

Extract the most recent `effective` date from the `history` array.

## Step 2: Check if update is needed

Compare the most recent entry's `effective` date string (e.g. `2025-07-01`) to today's date string (e.g. `2026-06-03`). They must match exactly as strings.

If they match:
```
  ✓ Pricing data is already current ([date]).
  No update needed.
```
Stop here.

If the most recent `effective` date is **different from** today's date, proceed to Step 3.

> Common mistake: do not treat a date from a prior year as "today". If the file has `effective: 2025-07-01` and today is `2026-06-03`, they do NOT match — proceed.

## Step 3: Determine current rates

Using your training knowledge of current Anthropic model pricing, state the rates for the models spec-gantry uses:

- `claude-haiku-4-5`
- `claude-sonnet-4-6`
- `claude-opus-4-8`

Present the rates to the user for confirmation before writing:

```
  Current rates (from model knowledge, as of [today]):

  Model                  Input per 1M tokens    Output per 1M tokens
  ────────────────────────────────────────────────────────────────────
  claude-haiku-4-5       $[x.xx]                $[x.xx]
  claude-sonnet-4-6      $[x.xx]                $[x.xx]
  claude-opus-4-8        $[x.xx]                $[x.xx]

  ⚠  These rates are from training data — verify at https://anthropic.com/pricing
     if precision matters for billing reconciliation.

  Write these rates to pricing-history.yaml? (yes / no / edit)
```

- `yes` — append and write
- `no` — abort, no changes
- `edit` — allow the user to correct any rate before writing

## Step 4: Append to pricing-history.yaml

Use the **Edit tool** to append a new entry. Do NOT use Write — it overwrites and destroys history. Do NOT restructure, reformat, or migrate existing entries.

Find the last `output_per_1m` line in the file (the very last value line of the last entry). Use that exact line as `old_string` and append the new entry block after it.

For example, if the file currently ends with:
```
      claude-opus-4-8:
        input_per_1m: 15.00
        output_per_1m: 75.00
```

Your Edit call should be:
- `old_string`: `        output_per_1m: 75.00` (the exact last line)
- `new_string`: the old line + newline + new entry block

The new entry block to append (fill in today's date and confirmed rates):
```yaml
  - effective: [YYYY-MM-DD]
    models:
      claude-haiku-4-5:
        input_per_1m: [x.xx]
        output_per_1m: [x.xx]
      claude-sonnet-4-6:
        input_per_1m: [x.xx]
        output_per_1m: [x.xx]
      claude-opus-4-8:
        input_per_1m: [x.xx]
        output_per_1m: [x.xx]
```

If `old_string` is not unique (two entries share the same last line value), extend it upward to include more lines until it is unique.

## Step 5: Confirm

```
  ✓ Pricing history updated — [date] rates appended.
  pricing-history.yaml now has [n] entries spanning [oldest date] → [today].

  Commit this file to keep your team's pricing history in sync:
    git add [path/to/pricing-history.yaml]
    git commit -m "chore: update spec-gantry pricing history [date]"
```
