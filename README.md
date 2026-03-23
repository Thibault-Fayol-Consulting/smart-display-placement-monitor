# Smart Display Placement Monitor

> Google Ads Script for SMBs — Audit and exclude suspicious automatic placements on Display/Video campaigns

## What it does
Audits automatic placements on Display and Video campaigns, flags suspicious or low-quality URLs (app inventory, parked domains, junk TLDs), and optionally excludes them at the campaign level. Prevents budget waste on inventory that never converts.

## Setup
1. Open Google Ads > Tools > Scripts
2. Create a new script and paste the code from `main_en.gs` (or `main_fr.gs` for French)
3. Update the `CONFIG` block at the top:
   - `EMAIL`: your alert email
   - `TEST_MODE`: set to `false` when ready to auto-exclude placements
   - `COST_THRESHOLD_MICROS`: minimum spend to flag (default $2.00)
   - `SUSPICIOUS_PATTERNS`: add/remove URL patterns to match your needs
4. Authorize and run a preview first
5. Schedule: **Weekly**

## CONFIG reference
| Parameter | Default | Description |
|-----------|---------|-------------|
| `TEST_MODE` | `true` | `true` = log only, `false` = exclude placements + send email |
| `EMAIL` | `contact@domain.com` | Email address for placement alerts |
| `COST_THRESHOLD_MICROS` | `2000000` | Minimum spend in micros to flag ($2.00) |
| `LOOKBACK` | `LAST_30_DAYS` | Analysis window |
| `SUSPICIOUS_PATTERNS` | *(array)* | URL substrings considered suspicious |

## How it works
1. Queries `group_placement_view` via GAQL for placements above the cost threshold with zero conversions
2. Checks each URL against the configurable list of suspicious patterns
3. For flagged placements, creates placement exclusions via `display().newPlacementExclusionBuilder()`
4. Sends a summary email with all excluded placements

## Requirements
- Google Ads account (not MCC)
- Google Ads Scripts access
- Display or Video campaigns active in the account

## License
MIT — Thibault Fayol Consulting
