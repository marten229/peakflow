/* ============================================================
   Ansicht: Verlauf
   ============================================================ */
function renderChart(days) {
    var W = 340, H = 196, padL = 30, padR = 8, padT = 10, padB = 26;
    var plotW = W - padL - padR, plotH = H - padT - padB;
    var b = state.settings.best;
    var vals = [];
    days.forEach(function (d) { if (d.min != null) { vals.push(d.min); vals.push(d.max); } });

    if (!vals.length) {
        $("#chartWrap").innerHTML = '<div class="empty">Sobald zwei, drei Werte drin sind, wächst hier die Kurve.</div>';
        $("#chartLegend").innerHTML = "";
        $("#dayDetail").innerHTML = "";
        return;
    }

    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    if (b) { lo = Math.min(lo, b * state.settings.redPct / 100); hi = Math.max(hi, b); }
    lo = Math.floor((lo - 20) / 50) * 50;
    hi = Math.ceil((hi + 20) / 50) * 50;
    if (lo < 0) lo = 0;
    if (hi - lo < 100) hi = lo + 100;

    function y(v) { return padT + (hi - clamp(v, lo, hi)) / (hi - lo) * plotH; }
    var step = plotW / days.length;
    function x(i) { return padL + step * (i + 0.5); }

    var s = [];
    s.push('<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Verlauf der Peak-Flow-Werte">');

    if (b) {
        var yRed = y(b * state.settings.redPct / 100), yGreen = y(b * state.settings.greenPct / 100);
        s.push('<rect x="' + padL + '" y="' + padT + '" width="' + plotW + '" height="' + (yGreen - padT) + '" fill="#DCEAE3" opacity=".75"/>');
        s.push('<rect x="' + padL + '" y="' + yGreen + '" width="' + plotW + '" height="' + (yRed - yGreen) + '" fill="#F6E7CB" opacity=".75"/>');
        s.push('<rect x="' + padL + '" y="' + yRed + '" width="' + plotW + '" height="' + (padT + plotH - yRed) + '" fill="#F4DBD7" opacity=".75"/>');
    }

    var gs = (hi - lo) > 400 ? 100 : 50;
    for (var g = Math.ceil(lo / gs) * gs; g <= hi; g += gs) {
        s.push('<line x1="' + padL + '" y1="' + y(g).toFixed(1) + '" x2="' + (W - padR) + '" y2="' + y(g).toFixed(1) + '" stroke="#0F2233" stroke-opacity=".10"/>');
        s.push('<text x="' + (padL - 5) + '" y="' + (y(g) + 3).toFixed(1) + '" text-anchor="end" font-family="IBM Plex Mono,monospace" font-size="8" fill="#8AA0AF">' + g + '</text>');
    }

    if (b) {
        s.push('<line x1="' + padL + '" y1="' + y(b).toFixed(1) + '" x2="' + (W - padR) + '" y2="' + y(b).toFixed(1) + '" stroke="#0F2233" stroke-width="1" stroke-dasharray="2 3" stroke-opacity=".55"/>');
    }

    var bw = Math.max(3, Math.min(11, step * 0.5));
    days.forEach(function (d, i) {
        if (d.min == null) return;
        var col = zoneColor(zoneOf(d.min));
        var top = y(d.max), bot = y(d.min);
        if (bot - top < 3) { top -= 1.5; bot += 1.5; }
        s.push('<rect x="' + (x(i) - bw / 2).toFixed(1) + '" y="' + top.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + (bot - top).toFixed(1) + '" rx="' + (bw / 2).toFixed(1) + '" fill="' + col + '" opacity=".30"/>');
        s.push('<circle cx="' + x(i).toFixed(1) + '" cy="' + y(d.mean).toFixed(1) + '" r="' + Math.min(3.2, bw / 2.4).toFixed(1) + '" fill="' + col + '"/>');
        if (d.critical) {
            s.push('<path d="M' + (x(i) - 3.4).toFixed(1) + ' ' + (H - padB + 13) + ' L' + (x(i) + 3.4).toFixed(1) + ' ' + (H - padB + 13) + ' L' + x(i).toFixed(1) + ' ' + (H - padB + 7) + ' Z" fill="' + (d.severity === "red" ? "#A32B25" : "#A96C0E") + '"/>');
        }
    });

    var ma = movingAvg(days, 7), seg = [];
    ma.forEach(function (m, i) {
        if (m == null) {
            if (seg.length > 1) s.push('<polyline points="' + seg.join(" ") + '" fill="none" stroke="#0F2233" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" opacity=".8"/>');
            seg = [];
        } else {
            seg.push(x(i).toFixed(1) + "," + y(m).toFixed(1));
        }
    });
    if (seg.length > 1) s.push('<polyline points="' + seg.join(" ") + '" fill="none" stroke="#0F2233" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" opacity=".8"/>');

    var marks = [0, Math.floor(days.length / 2), days.length - 1];
    marks.forEach(function (i, n) {
        var anchor = n === 0 ? "start" : (n === 2 ? "end" : "middle");
        var xx = n === 0 ? padL : (n === 2 ? W - padR : x(i));
        s.push('<text x="' + xx.toFixed(1) + '" y="' + (H - 4) + '" text-anchor="' + anchor + '" font-family="IBM Plex Mono,monospace" font-size="8" fill="#8AA0AF">' + shortDate(days[i].key) + '</text>');
    });

    days.forEach(function (d, i) {
        s.push('<rect class="hit" data-key="' + d.key + '" x="' + (padL + step * i).toFixed(1) + '" y="' + padT + '" width="' + step.toFixed(1) + '" height="' + plotH + '" fill="transparent"/>');
    });

    s.push('</svg>');
    $("#chartWrap").innerHTML = s.join("");

    $("#chartLegend").innerHTML =
        '<span><i style="background:#16775A;opacity:.3"></i>Spanne des Tages</span>' +
        '<span><i style="background:#16775A"></i>Tagesmittel</span>' +
        '<span><i style="background:#0F2233"></i>Trend über 7 Tage</span>' +
        '<span><i style="background:#A96C0E;clip-path:polygon(50% 0,100% 100%,0 100%)"></i>Auffälliger Tag</span>';

    Array.prototype.forEach.call($("#chartWrap").querySelectorAll(".hit"), function (r) {
        r.addEventListener("click", function () {
            ui.selectedDay = r.dataset.key;
            renderDayDetail(days);
        });
    });
    renderDayDetail(days);
}

function renderDayDetail(days) {
    var box = $("#dayDetail");
    var d = null;
    if (ui.selectedDay) d = days.filter(function (x) { return x.key === ui.selectedDay; })[0];
    if (!d) {
        for (var i = days.length - 1; i >= 0; i--) { if (days[i].min != null) { d = days[i]; break; } }
    }
    if (!d) { box.innerHTML = ""; return; }
    var h = '<div class="d">' + shortDate(d.key) + ' · auf einen Tag tippen für Details</div>';
    if (!d.entries.length) {
        h += '<div style="margin-top:4px;color:var(--ink2)">Keine Messung an diesem Tag.</div>';
    } else {
        h += '<div style="margin-top:6px">';
        d.entries.forEach(function (e) {
            var z = zoneOf(e.value);
            h += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">' +
                '<span class="dot ' + z + '"></span>' +
                '<span style="font-family:var(--mono)">' + e.value + '</span>' +
                '<span style="color:var(--ink2);font-size:13px">' + timeOf(e.ts) + ' · ' + e.period + '</span></div>';
        });
        h += '</div>';
        if (d.varPct != null) h += '<div style="color:var(--ink2);font-size:13px">Schwankung ' + d.varPct + ' %</div>';
        if (d.tags.length) h += '<div style="color:var(--ink2);font-size:13px;margin-top:4px">' + esc(d.tags.join(" · ")) + '</div>';
    }
    box.innerHTML = h;
}

function renderVarChart(days) {
    var W = 340, H = 78, padL = 30, padR = 8, padT = 8, padB = 14;
    var plotW = W - padL - padR, plotH = H - padT - padB;
    var withVar = days.filter(function (d) { return d.varPct != null; });
    if (!withVar.length) {
        $("#varWrap").innerHTML = '<div class="empty" style="padding:16px">Für die Schwankung braucht es zwei Messungen am selben Tag – morgens und abends.</div>';
        return;
    }
    var maxV = Math.max(30, Math.ceil(Math.max.apply(null, withVar.map(function (d) { return d.varPct; })) / 10) * 10);
    var step = plotW / days.length;
    function y(v) { return padT + (1 - clamp(v, 0, maxV) / maxV) * plotH; }

    var s = ['<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Tägliche Schwankung in Prozent">'];
    s.push('<line x1="' + padL + '" y1="' + (padT + plotH) + '" x2="' + (W - padR) + '" y2="' + (padT + plotH) + '" stroke="#D3DEE4"/>');
    s.push('<line x1="' + padL + '" y1="' + y(20).toFixed(1) + '" x2="' + (W - padR) + '" y2="' + y(20).toFixed(1) + '" stroke="#A96C0E" stroke-dasharray="3 3" stroke-width="1"/>');
    s.push('<text x="' + (padL - 5) + '" y="' + (y(20) + 3).toFixed(1) + '" text-anchor="end" font-family="IBM Plex Mono,monospace" font-size="8" fill="#A96C0E">20 %</text>');
    s.push('<text x="' + (padL - 5) + '" y="' + (y(maxV) + 3).toFixed(1) + '" text-anchor="end" font-family="IBM Plex Mono,monospace" font-size="8" fill="#8AA0AF">' + maxV + '</text>');

    var bw = Math.max(2.5, Math.min(9, step * 0.5));
    days.forEach(function (d, i) {
        if (d.varPct == null) return;
        var xx = padL + step * (i + 0.5) - bw / 2;
        var yy = y(d.varPct);
        s.push('<rect x="' + xx.toFixed(1) + '" y="' + yy.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + (padT + plotH - yy).toFixed(1) + '" rx="1.5" fill="' + (d.varPct >= 20 ? "#A96C0E" : "#0E5C7A") + '" opacity="' + (d.varPct >= 20 ? ".95" : ".45") + '"/>');
    });
    s.push('</svg>');
    $("#varWrap").innerHTML = s.join("");
}

function renderStats(days) {
    var box = $("#statsWrap");
    box.innerHTML = "";
    var withData = days.filter(function (d) { return d.mean != null; });
    if (!withData.length) return;

    var last7 = days.slice(-7).filter(function (d) { return d.mean != null; });
    var avg7 = last7.length ? Math.round(last7.reduce(function (a, d) { return a + d.mean; }, 0) / last7.length) : null;

    var mornVals = [], eveVals = [];
    days.forEach(function (d) {
        d.entries.forEach(function (e) {
            if (e.period === "morgens") mornVals.push(e.value);
            if (e.period === "abends") eveVals.push(e.value);
        });
    });
    function mean(a) { return a.length ? Math.round(a.reduce(function (x, y) { return x + y; }, 0) / a.length) : null; }

    var vars = withData.filter(function (d) { return d.varPct != null; }).map(function (d) { return d.varPct; });
    var avgVar = vars.length ? Math.round(vars.reduce(function (a, b) { return a + b; }, 0) / vars.length * 10) / 10 : null;
    var crit = days.filter(function (d) { return d.critical; }).length;

    var card = el("div", "card");
    card.appendChild(el("p", "eyebrow", "Überblick über " + days.length + " Tage"));
    var g = el("div", "grid");
    function cell(k, v, sub, color) {
        var c = el("div", "cell");
        c.appendChild(el("div", "k", k));
        var val = el("div", "v");
        val.innerHTML = v + (sub ? ' <small>' + sub + '</small>' : "");
        if (color) val.style.color = color;
        c.appendChild(val);
        return c;
    }
    g.appendChild(cell("Mittel 7 Tage", avg7 == null ? "—" : avg7, avg7 != null && state.settings.best ? Math.round(avg7 / state.settings.best * 100) + " %" : "L/min", avg7 != null ? zoneColor(zoneOf(avg7)) : null));
    g.appendChild(cell("Erfasste Tage", withData.length, "von " + days.length));
    g.appendChild(cell("Ø morgens", mean(mornVals) == null ? "—" : mean(mornVals), "L/min"));
    g.appendChild(cell("Ø abends", mean(eveVals) == null ? "—" : mean(eveVals), "L/min"));
    g.appendChild(cell("Ø Schwankung", avgVar == null ? "—" : avgVar + " %", "", avgVar != null && avgVar >= 20 ? "#A96C0E" : null));
    g.appendChild(cell("Auffällige Tage", crit, "", crit ? "#A96C0E" : null));
    card.appendChild(g);
    box.appendChild(card);
}

function renderCritical(days) {
    var box = $("#criticalWrap");
    box.innerHTML = "";
    var crit = days.filter(function (d) { return d.critical; }).reverse();
    var card = el("div", "card");
    card.appendChild(el("p", "eyebrow", "Auffällige Tage"));
    if (!crit.length) {
        var ok = el("div", "note", "In diesem Zeitraum ist nichts aufgefallen: keine Werte unter " + state.settings.greenPct + " %, keine großen Tagesschwankungen, kein Bedarfsspray notiert.");
        card.appendChild(ok);
        box.appendChild(card);
        return;
    }
    var list = el("div", "list");
    crit.slice(0, 12).forEach(function (d) {
        var row = el("div", "row");
        var top = el("div", "top");
        top.innerHTML = '<span class="dot ' + (d.severity || "amber") + '"></span>' +
            '<span class="num">' + d.min + '</span>' +
            '<span class="meta">' + shortDate(d.key) + ' · tiefster Wert' + (state.settings.best ? " · " + Math.round(d.min / state.settings.best * 100) + " %" : "") + '</span>';
        row.appendChild(top);
        row.appendChild(el("div", "tags", d.reasons.join(" · ")));
        list.appendChild(row);
    });
    card.appendChild(list);
    box.appendChild(card);
}

function renderJournal(days) {
    var box = $("#journalWrap");
    box.innerHTML = "";
    var any = days.some(function (d) { return d.entries.length; });
    if (!any) {
        box.appendChild(el("div", "empty", "Noch keine Einträge in diesem Zeitraum."));
        return;
    }
    days.slice().reverse().forEach(function (d) {
        if (!d.entries.length) return;
        box.appendChild(el("div", "daygroup", shortDate(d.key) + (d.varPct != null ? "  ·  Schwankung " + d.varPct + " %" : "")));
        var list = el("div", "list");
        d.entries.slice().reverse().forEach(function (e) {
            var z = zoneOf(e.value);
            var row = el("div", "row");
            var top = el("div", "top");
            top.innerHTML = '<span class="dot ' + z + '"></span>' +
                '<span class="num">' + e.value + '</span>' +
                '<span class="meta">' + timeOf(e.ts) + ' · ' + e.period + (pctOfBest(e.value) != null ? ' · ' + pctOfBest(e.value) + ' %' : '') + '</span>' +
                '<span style="color:var(--ink3);font-size:12px">bearbeiten</span>';
            row.appendChild(top);
            if ((e.tags && e.tags.length) || e.note) {
                var t = el("div", "tags");
                t.textContent = (e.tags || []).join(" · ") + (e.note ? (e.tags && e.tags.length ? " — " : "") + e.note : "");
                row.appendChild(t);
            }
            var acts = el("div", "acts");
            acts.hidden = true;
            var field = document.createElement("input");
            field.type = "number"; field.inputMode = "numeric"; field.step = "5"; field.value = e.value;
            field.setAttribute("aria-label", "Wert in L/min ändern");
            field.style.cssText = "flex:1;padding:9px;font-size:15px";
            field.addEventListener("click", function (ev) { ev.stopPropagation(); });
            var edit = el("button", null, "Übernehmen");
            edit.addEventListener("click", function (ev) {
                ev.stopPropagation();
                var n = parseInt(field.value, 10);
                if (!n || n < SCALE_MIN) { toast("Wert ab " + SCALE_MIN + " L/min eintragen"); return; }
                e.value = clamp(round5(n), SCALE_MIN, 1200);
                persist(); renderAll(); toast("Wert geändert");
            });
            var del = el("button", "del", "Löschen");
            var armed = false;
            del.addEventListener("click", function (ev) {
                ev.stopPropagation();
                if (!armed) {
                    armed = true;
                    del.textContent = "Wirklich löschen?";
                    setTimeout(function () { armed = false; del.textContent = "Löschen"; }, 4000);
                    return;
                }
                state.entries = state.entries.filter(function (x) { return x.id !== e.id; });
                persist(); renderAll(); toast("Eintrag gelöscht");
            });
            acts.appendChild(field); acts.appendChild(edit); acts.appendChild(del);
            row.appendChild(acts);
            top.addEventListener("click", function () { acts.hidden = !acts.hidden; });
            list.appendChild(row);
        });
        box.appendChild(list);
    });
}

function renderTrend() {
    var days = buildDays(ui.range);
    renderChart(days);
    renderVarChart(days);
    renderStats(days);
    renderCritical(days);
    renderJournal(days);
}
