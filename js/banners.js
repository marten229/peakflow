/* ============================================================
   Hinweisleiste oben
   ============================================================ */
function renderBanners() {
    var box = $("#banners");
    box.innerHTML = "";
    var r = state.settings.reminders;
    var today = buildDays(1)[0];

    if (!state.settings.best && state.entries.length >= 3) {
        var b1 = el("div", "banner");
        b1.innerHTML = '<span class="grow">Setz deinen persönlichen Bestwert – erst dann rechnen die Zonen.</span>';
        var go = el("button", "linkbtn", "Öffnen");
        go.addEventListener("click", function () { show("settings"); $("#bestInput").focus(); });
        b1.appendChild(go);
        box.appendChild(b1);
    }

    if (r.on) {
        var now = new Date();
        var mins = now.getHours() * 60 + now.getMinutes();
        function toMin(t) { var p = String(t || "0:0").split(":"); return (+p[0]) * 60 + (+p[1]); }
        var hasM = today.entries.some(function (e) { return e.period === "morgens"; });
        var hasE = today.entries.some(function (e) { return e.period === "abends"; });
        var msg = null;
        if (mins >= toMin(r.evening) && !hasE) msg = "Abendmessung steht noch aus";
        else if (mins >= toMin(r.morning) && !hasM) msg = "Morgenmessung steht noch aus";
        if (msg) {
            var b2 = el("div", "banner");
            b2.innerHTML = '<span class="grow">' + msg + '</span>';
            var btn = el("button", "linkbtn", "Jetzt messen");
            btn.addEventListener("click", function () {
                ui.period = msg.indexOf("Abend") === 0 ? "abends" : "morgens";
                renderPeriodSeg();
                show("measure");
                window.scrollTo({ top: 0, behavior: "smooth" });
            });
            b2.appendChild(btn);
            box.appendChild(b2);
        }
    }

    var lastRed = state.entries.slice(-1)[0];
    if (lastRed && zoneOf(lastRed.value) === "red" && (Date.now() - new Date(lastRed.ts).getTime()) < 6 * 3600000) {
        var b3 = el("div", "banner alarm");
        b3.innerHTML = '<span class="grow">Letzter Wert lag in der roten Zone. Halt dich an deinen Notfallplan – bei Atemnot ärztliche Hilfe holen, im Notfall 112.</span>';
        box.appendChild(b3);
    }
}
