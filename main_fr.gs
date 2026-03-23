/**
 * --------------------------------------------------------------------------
 * Smart Display Placement Monitor — Script Google Ads
 * --------------------------------------------------------------------------
 * Audite les emplacements automatiques des campagnes Display et Video,
 * signale les URL suspectes ou de mauvaise qualite (inventaire app,
 * domaines parkes, etc.) et les exclut au niveau campagne.
 *
 * Auteur :  Thibault Fayol — Consultant SEA PME
 * Site :    https://thibaultfayol.com
 * Licence : MIT
 * --------------------------------------------------------------------------
 */

var CONFIG = {
  TEST_MODE: true,                      // true = log uniquement, false = exclut les placements + envoie email
  EMAIL: 'contact@votredomaine.com',    // Destinataire des alertes
  COST_THRESHOLD_MICROS: 2000000,       // Depense min en micros (2 000 000 = 2,00 EUR)
  LOOKBACK: 'LAST_30_DAYS',            // Fenetre d'analyse
  SUSPICIOUS_PATTERNS: [                // Patterns d'URL consideres suspects
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
    Logger.log('Audit des placements automatiques pour inventaire suspect...');

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
    var suspects = [];
    var totalVerifies = 0;

    while (rows.hasNext()) {
      var row = rows.next();
      totalVerifies++;
      var url = row.groupPlacementView.targetUrl || row.groupPlacementView.displayName || '';
      var cost = (row.metrics.costMicros / 1000000).toFixed(2);
      var conversions = row.metrics.conversions || 0;

      if (conversions > 0) continue;

      var estSuspect = CONFIG.SUSPICIOUS_PATTERNS.some(function(pattern) {
        return url.toLowerCase().indexOf(pattern.toLowerCase()) !== -1;
      });

      if (estSuspect) {
        var entry = {
          url: url,
          campaign: row.campaign.name,
          campaignId: row.campaign.id,
          cost: cost,
          clicks: row.metrics.clicks
        };
        suspects.push(entry);
        Logger.log('SUSPECT : ' + url + ' | Campagne : ' + entry.campaign +
                    ' | Cout : ' + cost + ' EUR | Clics : ' + entry.clicks);

        if (!CONFIG.TEST_MODE) {
          try {
            var campIter = AdsApp.campaigns().withIds([entry.campaignId]).get();
            if (campIter.hasNext()) {
              campIter.next().display()
                .newPlacementExclusionBuilder()
                .withUrl(url)
                .build();
              Logger.log('  -> Exclu : ' + url);
            }
          } catch (exErr) {
            Logger.log('  -> Exclusion echouee pour ' + url + ' : ' + exErr.message);
          }
        }
      }
    }

    Logger.log('Verifie ' + totalVerifies + ' placements. ' +
               suspects.length + ' suspects trouves.');

    if (suspects.length > 0 && !CONFIG.TEST_MODE && CONFIG.EMAIL !== 'contact@votredomaine.com') {
      var lines = suspects.map(function(s) {
        return s.url + ' | ' + s.campaign + ' | ' + s.cost + ' EUR';
      });
      MailApp.sendEmail(CONFIG.EMAIL,
        'Alerte Placements : ' + suspects.length + ' placement(s) suspect(s) exclu(s)',
        'Les placements suivants ont ete exclus :\n\n' + lines.join('\n'));
      Logger.log('Email d\'alerte envoye a ' + CONFIG.EMAIL);
    }
  } catch (e) {
    Logger.log('ERREUR FATALE : ' + e.message);
    if (!CONFIG.TEST_MODE && CONFIG.EMAIL !== 'contact@votredomaine.com') {
      MailApp.sendEmail(CONFIG.EMAIL, 'Placement Monitor — Erreur script', e.message);
    }
  }
}
