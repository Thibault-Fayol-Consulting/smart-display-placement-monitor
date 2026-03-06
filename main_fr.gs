/**
 * --------------------------------------------------------------------------
 * smart-display-placement-monitor - Google Ads Script for SMBs
 * --------------------------------------------------------------------------
 * Author: Thibault Fayol - Consultant SEA PME
 * Website: https://thibaultfayol.com
 * License: MIT
 * --------------------------------------------------------------------------
 */
var CONFIG = { TEST_MODE: true, COST_THRESHOLD: 2.0 };
function main() {
    Logger.log("Vérification des PLACEMENTS AUTOMATIQUES pour des inventaires de mauvaise qualité...");
    var report = AdsApp.report("SELECT URL, CampaignName, Cost, Conversions FROM AUTOMATIC_PLACEMENTS_PERFORMANCE_REPORT WHERE Cost > " + CONFIG.COST_THRESHOLD + " AND Conversions = 0 DURING LAST_30_DAYS");
    var rows = report.rows();
    var suspiciousCount = 0;
    
    while(rows.hasNext()) {
        var row = rows.next();
        var url = row["URL"];
        if (url.indexOf("appspot.com") !== -1 || url.indexOf("anonymous.google") !== -1 || url.indexOf(".xyz") !== -1) {
             Logger.log("Placement douteux sans conversion : " + url + " dans " + row["CampaignName"]);
             suspiciousCount++;
        }
    }
    Logger.log("Trouvé " + suspiciousCount + " emplacements suspects à exclure manuellement au niveau du compte.");
}
