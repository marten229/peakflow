/* ============================================================
   Tagesauswertung
   ============================================================ */
function dayList(n) {
    var out = [], today = new Date();
    today.setHours(0, 0, 0, 0);
    for (var i = n - 1; i >= 0; i--) {
        var d = new Date(today.getTime() - i * 86400000);
        out.push(dayKey(d));
    }
    return out;
}

function buildDays(n) {
    var keys = dayList(n);
    var byDay = {};
    state.entries.forEach(function (e) {
        var k = dayKey(e.ts);
        (byDay[k] = byDay[k] || []).push(e);
    });
    return keys.map(function (k) {
        var list = (byDay[k] || []).slice().sort(function (a, b) { return new Date(a.ts) - new Date(b.ts); });
        var vals = list.map(function (e) { return e.value; });
        var d = { key: k, entries: list, vals: vals, min: null, max: null, mean: null, varPct: null, tags: [], critical: false, severity: null, reasons: [] };
        if (vals.length) {
            d.min = Math.min.apply(null, vals);
            d.max = Math.max.apply(null, vals);
            d.mean = Math.round(vals.reduce(function (a, b) { return a + b; }, 0) / vals.length);
            if (vals.length > 1 && d.max > 0) d.varPct = Math.round((d.max - d.min) / d.max * 1000) / 10;
            list.forEach(function (e) { (e.tags || []).forEach(function (t) { if (d.tags.indexOf(t) < 0) d.tags.push(t); }); });

            var z = zoneOf(d.min);
            if (z === "red") { d.critical = true; d.severity = "red"; d.reasons.push("Wert in der roten Zone"); }
            else if (z === "amber") { d.critical = true; d.severity = "amber"; d.reasons.push("Wert in der gelben Zone"); }
            if (d.varPct != null && d.varPct >= 20) { d.critical = true; d.severity = d.severity || "amber"; d.reasons.push("Tagesschwankung " + d.varPct + " %"); }
            if (d.tags.indexOf("Bedarfsspray") >= 0) { d.critical = true; d.severity = d.severity || "amber"; d.reasons.push("Bedarfsspray"); }
            if (d.tags.indexOf("Nachts wach") >= 0) { d.critical = true; d.severity = d.severity || "amber"; d.reasons.push("nachts wach"); }
        }
        return d;
    });
}

function movingAvg(days, win) {
    return days.map(function (_, i) {
        var acc = [], from = Math.max(0, i - win + 1);
        for (var j = from; j <= i; j++) { if (days[j].mean != null) acc.push(days[j].mean); }
        if (acc.length < 3) return null;
        return acc.reduce(function (a, b) { return a + b; }, 0) / acc.length;
    });
}
