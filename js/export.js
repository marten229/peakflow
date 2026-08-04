/* ============================================================
   CSV & Druckbericht
   ============================================================ */
function buildCSV() {
    var rows = [["Datum", "Uhrzeit", "Wert_L_min", "Zeitpunkt", "Zone", "Prozent_vom_Bestwert", "Beobachtungen", "Notiz"].join(";")];
    state.entries.slice().sort(function (a, b) { return new Date(a.ts) - new Date(b.ts); }).forEach(function (e) {
        var d = new Date(e.ts);
        rows.push([
            String(d.getDate()).padStart(2, "0") + "." + String(d.getMonth() + 1).padStart(2, "0") + "." + d.getFullYear(),
            timeOf(e.ts),
            e.value,
            e.period,
            zoneName(zoneOf(e.value)),
            pctOfBest(e.value) == null ? "" : pctOfBest(e.value),
            (e.tags || []).join(", "),
            (e.note || "").replace(/[\r\n;]/g, " ")
        ].join(";"));
    });
    return rows.join("\r\n");
}

function buildReport() {
    var days = buildDays(Math.max(ui.range, 30));
    var withData = days.filter(function (d) { return d.mean != null; });
    var vals = [];
    withData.forEach(function (d) { vals = vals.concat(d.vals); });
    var b = state.settings.best;
    var h = "";
    h += '<h1>Peak-Flow-Verlauf</h1>';
    h += '<div class="sub">Zeitraum ' + shortDate(days[0].key) + " – " + shortDate(days[days.length - 1].key) +
        " · erstellt am " + new Date().toLocaleDateString("de-DE") + '</div>';
    h += '<div class="stats">';
    h += '<div><strong>Persönlicher Bestwert:</strong> ' + (b ? b + " L/min" : "nicht gesetzt") + '</div>';
    h += '<div><strong>Zonen:</strong> grün ab ' + state.settings.greenPct + ' %, rot unter ' + state.settings.redPct + ' %</div>';
    h += '<div><strong>Messungen:</strong> ' + vals.length + ' an ' + withData.length + ' Tagen</div>';
    if (vals.length) h += '<div><strong>Spanne:</strong> ' + Math.min.apply(null, vals) + "–" + Math.max.apply(null, vals) + ' L/min</div>';
    h += '<div><strong>Auffällige Tage:</strong> ' + days.filter(function (d) { return d.critical; }).length + '</div>';
    h += '</div>';
    h += '<table><thead><tr><th>Datum</th><th>Morgens</th><th>Abends</th><th>Tief</th><th>% vom Best</th><th>Schwankung</th><th>Beobachtungen</th></tr></thead><tbody>';
    days.slice().reverse().forEach(function (d) {
        if (!d.entries.length) return;
        var m = d.entries.filter(function (e) { return e.period === "morgens"; }).pop();
        var ev = d.entries.filter(function (e) { return e.period === "abends"; }).pop();
        h += "<tr><td>" + shortDate(d.key) + "</td><td>" + (m ? m.value : "–") + "</td><td>" + (ev ? ev.value : "–") + "</td><td>" + d.min + "</td><td>" +
            (b ? Math.round(d.min / b * 100) + " %" : "–") + "</td><td>" + (d.varPct != null ? d.varPct + " %" : "–") + "</td><td>" + esc(d.tags.join(", ")) + "</td></tr>";
    });
    h += "</tbody></table>";
    h += '<p style="font-size:9pt;color:#555;margin-top:14px">Selbst erfasste Werte aus einem Peak-Flow-Tagebuch. Keine ärztliche Beurteilung.</p>';
    $("#report").innerHTML = h;
}
