/* ============================================================
   Ansicht: Messen
   ============================================================ */
function renderTags() {
    var row = $("#tagRow");
    row.innerHTML = "";
    TAGS.forEach(function (t) {
        var b = el("button", "chip", t);
        b.type = "button";
        b.setAttribute("aria-pressed", ui.tags.indexOf(t) >= 0 ? "true" : "false");
        b.addEventListener("click", function () {
            var i = ui.tags.indexOf(t);
            if (i >= 0) ui.tags.splice(i, 1); else ui.tags.push(t);
            b.setAttribute("aria-pressed", i >= 0 ? "false" : "true");
        });
        row.appendChild(b);
    });
}

function renderPeriodSeg() {
    Array.prototype.forEach.call($("#periodSeg").children, function (b) {
        b.setAttribute("aria-pressed", b.dataset.p === ui.period ? "true" : "false");
    });
}

function buildEntryTimestamp() {
    var dateVal = $("#entryDate").value;
    if (dateVal) {
        var timeVal = $("#entryTime").value || "12:00";
        var parts = dateVal.split("-");
        var timeParts = timeVal.split(":");
        var d = new Date(+parts[0], +parts[1] - 1, +parts[2], +timeParts[0], +timeParts[1]);
        return d.toISOString();
    }
    var sonstigeTime = $("#sonstigeTime").value;
    if (sonstigeTime) {
        var now = new Date();
        var tp = sonstigeTime.split(":");
        now.setHours(+tp[0], +tp[1], 0, 0);
        return now.toISOString();
    }
    return new Date().toISOString();
}

function isCustomDate() {
    return $("#entryDate").value !== "";
}

function resetDatePicker() {
    $("#entryDate").value = "";
    $("#entryTime").value = "";
    $("#sonstigeTime").value = "";
    $("#datePickerWrap").hidden = true;
    $("#periodWrap").hidden = false;
    $("#sonstigeTimeWrap").hidden = true;
    Array.prototype.forEach.call($("#dateSeg").children, function (b) {
        b.setAttribute("aria-pressed", b.dataset.d === "today" ? "true" : "false");
    });
    renderDateHint();
}

function renderDateHint() {
    var box = $("#dateHint");
    var dateVal = $("#entryDate").value;
    if (!dateVal) { box.innerHTML = ""; return; }
    var parts = dateVal.split("-");
    var d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    var label = WD[d.getDay()] + " " + d.getDate() + "." + (d.getMonth() + 1) + "." + d.getFullYear();
    var timeVal = $("#entryTime").value;
    if (timeVal) label += " · " + timeVal;
    box.innerHTML = '<div style="display:flex;align-items:center;gap:8px;padding:10px 0;font-size:14px;color:var(--ink2)">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>' +
        'Wird eingetragen für: <strong style="color:var(--ink)">' + label + '</strong></div>';
}

function saveEntry() {
    var v = parseInt($("#valInput").value, 10);
    if (!v || v < SCALE_MIN) { toast("Bitte einen Wert ab " + SCALE_MIN + " L/min eintragen"); return; }
    v = clamp(round5(v), SCALE_MIN, 1200);
    var customDate = isCustomDate();
    var entry = {
        id: String(Date.now()) + Math.random().toString(36).slice(2, 6),
        ts: buildEntryTimestamp(),
        value: v,
        period: ui.period,
        tags: ui.tags.slice(),
        note: ($("#noteField").value || "").trim()
    };
    state.entries.push(entry);
    persist();

    var z = zoneOf(v);
    ui.tags = [];
    $("#noteField").value = "";
    $("#noteField").hidden = true;
    $("#noteToggle").textContent = "Notiz hinzufügen";
    resetDatePicker();
    renderTags();
    renderAfterSave(entry, z, customDate);
    renderTodayCard();
    renderBanners();
    renderTrend();
    var toastMsg = "Gespeichert · " + v + " L/min";
    if (customDate) toastMsg += " · " + shortDate(dayKey(entry.ts));
    toast(toastMsg);
}

function renderAfterSave(entry, z, wasPastEntry) {
    var box = $("#afterSave");
    box.innerHTML = "";
    var wrap = el("div", "card");
    wrap.style.marginTop = "14px";

    var headText = wasPastEntry
        ? "Nachgetragen für " + shortDate(dayKey(entry.ts)) + " · " + timeOf(entry.ts)
        : "Eingetragen um " + timeOf(entry.ts);
    var head = el("p", "eyebrow", headText);
    wrap.appendChild(head);

    var line = el("div");
    line.style.cssText = "display:flex;align-items:center;gap:10px;font-family:var(--mono);font-size:20px";
    line.innerHTML = '<span class="dot ' + z + '"></span>' + entry.value + ' <span style="font-size:13px;color:var(--ink2)">L/min · ' + zoneName(z) + '</span>';
    wrap.appendChild(line);

    var planText = state.settings.plans[z];
    if (z !== "none") {
        if (planText) {
            var p = el("div", "plan " + z, planText);
            wrap.appendChild(p);
        } else if (z !== "green") {
            var hint = el("div", "plan " + z);
            hint.textContent = z === "red"
                ? "Für die rote Zone ist noch kein Plan hinterlegt. Wenn es dir jetzt schlecht geht, hol dir ärztliche Hilfe – im Notfall 112."
                : "Für die gelbe Zone ist noch kein Plan hinterlegt. In den Einstellungen kannst du eintragen, was ihr besprochen habt.";
            wrap.appendChild(hint);
        }
    }

    var b = state.settings.best;
    if (!b || entry.value > b) {
        var btn = el("button", "ghost", b ? "Neuen Bestwert übernehmen (" + entry.value + ")" : "Als persönlichen Bestwert setzen (" + entry.value + ")");
        btn.style.marginTop = "12px";
        btn.addEventListener("click", function () {
            state.settings.best = entry.value;
            persist();
            renderAll();
            toast("Bestwert steht jetzt bei " + entry.value);
        });
        wrap.appendChild(btn);
    }

    box.appendChild(wrap);
}

function renderTodayCard() {
    var box = $("#todayCard");
    var days = buildDays(1), d = days[0];
    box.innerHTML = "";
    if (!d.entries.length) {
        var e = el("div", "empty", "Heute noch kein Wert. Der erste Eintrag dauert keine zehn Sekunden.");
        e.style.marginTop = "14px";
        box.appendChild(e);
        return;
    }
    var card = el("div", "card");
    card.style.marginTop = "14px";
    card.appendChild(el("p", "eyebrow", "Heute"));

    var g = el("div", "grid");
    function cell(k, v, sub) {
        var c = el("div", "cell");
        c.appendChild(el("div", "k", k));
        var val = el("div", "v");
        val.innerHTML = v + (sub ? ' <small>' + sub + '</small>' : "");
        c.appendChild(val);
        return c;
    }
    var morn = d.entries.filter(function (x) { return x.period === "morgens"; }).pop();
    var eve = d.entries.filter(function (x) { return x.period === "abends"; }).pop();
    g.appendChild(cell("Morgens", morn ? morn.value : "—", morn ? "L/min" : ""));
    g.appendChild(cell("Abends", eve ? eve.value : "—", eve ? "L/min" : ""));
    g.appendChild(cell("Bester Wert heute", d.max, "L/min"));
    g.appendChild(cell("Schwankung", d.varPct != null ? d.varPct + " %" : "—", d.varPct != null && d.varPct >= 20 ? "auffällig" : ""));
    card.appendChild(g);
    box.appendChild(card);
}
