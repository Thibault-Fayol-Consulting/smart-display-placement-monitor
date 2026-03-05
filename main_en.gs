/**
 * --------------------------------------------------------------------------
 * smart-display-placement-monitor - Google Ads Script for SMBs
 * --------------------------------------------------------------------------
 * Author: Thibault Fayol - Consultant SEA PME
 * Website: https://thibaultfayol.com
 * License: MIT
 * --------------------------------------------------------------------------
 */
var CONFIG = { TEST_MODE: true };
function main() {
    Logger.log("Extracting placements from Smart Display Campaigns...");
    var report = AdsApp.report("SELECT placement_view.placement, metrics.cost_micros FROM placement_view");
    // Parse URL logic...   
}
