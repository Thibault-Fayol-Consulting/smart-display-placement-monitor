/**
 * --------------------------------------------------------------------------
 * Smart Display Placement Monitor — Google Ads Script
 * --------------------------------------------------------------------------
 * Audits automatic placements on Display and Video campaigns, flags
 * suspicious or low-quality URLs (app inventory, parked domains, etc.),
 * and optionally excludes them at the campaign level.
 *
 * Author:  Thibault Fayol — Consultant SEA PME
 * Website: https://thibaultfayol.com
 * License: MIT
 * --------------------------------------------------------------------------
 */

var CONFIG = {
  TEST_MODE: true,                      // true = log only, false = exclude placements + send email
  EMAIL: 'contact@domain.com',          // Alert recipient
  COST_THRESHOLD_MICROS: 2000000,       // Min spend in micros (2 000 000 = $2.00)
  LOOKBACK: 'LAST_30_DAYS',            // Analysis window
  SUSPICIOUS_PATTERNS: [                // URL patterns considered suspicious
    'appspot.com',
    'anonymous.google',
    '.xyz',
    '.tk',
    '.top',
    '.buzz',
    '.club',
    'mobileapp::',
    'googleusercontent.com'
  ]
};

function main() {
  try {
    Logger.log('Auditing automatic placements for suspicious inventory...');

    var query = 'SELECT group_placement_view.display_name, ' +
                'group_placement_view.target_url, ' +
                'metrics.cost_micros, ' +
                'metrics.clicks, ' +
                'metrics.impressions, ' +
                'metrics.conversions, ' +
                'campaign.name, ' +
                'campaign.id ' +
                'FROM group_placement_view ' +
                'WHERE metrics.cost_micros > ' + CONFIG.COST_THRESHOLD_MICROS +
                ' AND segments.date DURING ' + CONFIG.LOOKBACK;

    var rows = AdsApp.search(query);
    var suspicious = [];
    var totalChecked = 0;

    while (rows.hasNext()) {
      var row = rows.next();
      totalChecked++;
      var url = row.groupPlacementView.targetUrl || row.groupPlacementView.displayName || '';
      var cost = (row.metrics.costMicros / 1000000).toFixed(2);
      var conversions = row.metrics.conversions || 0;

      if (conversions > 0) continue; // Skip placements that convert

      var isSuspicious = CONFIG.SUSPICIOUS_PATTERNS.some(function(pattern) {
        return url.toLowerCase().indexOf(pattern.toLowerCase()) !== -1;
      });

      if (isSuspicious) {
        var entry = {
          url: url,
          campaign: row.campaign.name,
          campaignId: row.campaign.id,
          cost: cost,
          clicks: row.metrics.clicks
        };
        suspicious.push(entry);
        Logger.log('SUSPICIOUS: ' + url + ' | Campaign: ' + entry.campaign +
                    ' | Cost: $' + cost + ' | Clicks: ' + entry.clicks);

        if (!CONFIG.TEST_MODE) {
          try {
            var campIter = AdsApp.campaigns().withIds([entry.campaignId]).get();
            if (campIter.hasNext()) {
              campIter.next().display()
                .newPlacementExclusionBuilder()
                .withUrl(url)
                .build();
              Logger.log('  -> Excluded: ' + url);
            }
          } catch (exErr) {
            Logger.log('  -> Exclusion failed for ' + url + ': ' + exErr.message);
          }
        }
      }
    }

    Logger.log('Checked ' + totalChecked + ' placements. Found ' +
               suspicious.length + ' suspicious.');

    if (suspicious.length > 0 && !CONFIG.TEST_MODE && CONFIG.EMAIL !== 'contact@domain.com') {
      var lines = suspicious.map(function(s) {
        return s.url + ' | ' + s.campaign + ' | $' + s.cost;
      });
      MailApp.sendEmail(CONFIG.EMAIL,
        'Placement Alert: ' + suspicious.length + ' suspicious placement(s) excluded',
        'The following placements were excluded:\n\n' + lines.join('\n'));
      Logger.log('Alert email sent to ' + CONFIG.EMAIL);
    }
  } catch (e) {
    Logger.log('FATAL ERROR: ' + e.message);
    if (!CONFIG.TEST_MODE && CONFIG.EMAIL !== 'contact@domain.com') {
      MailApp.sendEmail(CONFIG.EMAIL, 'Placement Monitor — Script Error', e.message);
    }
  }
}
