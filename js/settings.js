/* ============================================================
   Einstellungen
   ============================================================ */
function renderSettings() {
    $("#bestInput").value = state.settings.best == null ? "" : state.settings.best;
    $("#greenPct").value = state.settings.greenPct;
    $("#redPct").value = state.settings.redPct;
    $("#planGreen").value = state.settings.plans.green;
    $("#planAmber").value = state.settings.plans.amber;
    $("#planRed").value = state.settings.plans.red;
    $("#remOn").checked = state.settings.reminders.on;
    $("#remMorning").value = state.settings.reminders.morning;
    $("#remEvening").value = state.settings.reminders.evening;

    var b = state.settings.best;
    $("#zonePreview").textContent = b
        ? "Grün ab " + Math.round(b * state.settings.greenPct / 100) + " · Gelb ab " + Math.round(b * state.settings.redPct / 100) + " · Rot darunter (L/min)"
        : "Sobald ein Bestwert steht, erscheinen hier die Grenzwerte in L/min.";
}

function bindSettings() {
    $("#bestInput").addEventListener("change", function () {
        var v = parseInt(this.value, 10);
        state.settings.best = v ? clamp(round5(v), 50, 1200) : null;
        persist(); renderAll();
    });
    $("#bestFromData").addEventListener("click", function () {
        if (!state.entries.length) { toast("Dafür braucht es erst ein paar Messungen"); return; }
        var mx = Math.max.apply(null, state.entries.map(function (e) { return e.value; }));
        state.settings.best = mx;
        persist(); renderAll();
        toast("Bestwert steht jetzt bei " + mx);
    });
    $("#greenPct").addEventListener("change", function () {
        state.settings.greenPct = clamp(parseInt(this.value, 10) || 80, 55, 95);
        if (state.settings.greenPct <= state.settings.redPct) state.settings.redPct = state.settings.greenPct - 5;
        persist(); renderAll();
    });
    $("#redPct").addEventListener("change", function () {
        state.settings.redPct = clamp(parseInt(this.value, 10) || 50, 20, 70);
        if (state.settings.redPct >= state.settings.greenPct) state.settings.greenPct = state.settings.redPct + 5;
        persist(); renderAll();
    });
    ["Green", "Amber", "Red"].forEach(function (z) {
        $("#plan" + z).addEventListener("input", function () {
            state.settings.plans[z.toLowerCase()] = this.value;
            persist();
        });
    });
    $("#remOn").addEventListener("change", function () {
        state.settings.reminders.on = this.checked; persist(); renderBanners();
    });
    $("#remMorning").addEventListener("change", function () {
        state.settings.reminders.morning = this.value; persist(); renderBanners();
    });
    $("#remEvening").addEventListener("change", function () {
        state.settings.reminders.evening = this.value; persist(); renderBanners();
    });

    var wipeArmed = false;
    $("#wipeBtn").addEventListener("click", function () {
        var btn = this;
        if (!wipeArmed) {
            wipeArmed = true;
            btn.textContent = "Sicher? Nochmal tippen – das ist endgültig";
            setTimeout(function () { wipeArmed = false; btn.textContent = "Alle Daten löschen"; }, 5000);
            return;
        }
        wipeArmed = false;
        btn.textContent = "Alle Daten löschen";
        state.entries = [];
        state.settings.best = null;
        state.settings.plans = { green: "", amber: "", red: "" };
        persist(); renderAll(); toast("Alle Daten gelöscht");
    });

    $("#csvBtn").addEventListener("click", function () {
        var csv = buildCSV();
        try {
            var blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
            var a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "peak-flow-" + dayKey(new Date()) + ".csv";
            document.body.appendChild(a); a.click(); a.remove();
            toast("CSV wird heruntergeladen");
        } catch (e) { toast("Download blockiert – nimm das Kopieren"); }
    });

    $("#copyBtn").addEventListener("click", function () {
        var csv = buildCSV();
        function fallback() {
            var box = $("#csvFallback");
            box.hidden = false;
            box.value = csv;
            box.focus(); box.select();
            toast("Hier markieren und kopieren");
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(csv).then(function () { toast("CSV kopiert"); }, fallback);
        } else { fallback(); }
    });

    $("#printBtn").addEventListener("click", function () {
        buildReport();
        setTimeout(function () {
            try { window.print(); }
            catch (e) { toast("Drucken geht hier nicht – nimm den CSV-Export"); }
        }, 60);
    });
}
