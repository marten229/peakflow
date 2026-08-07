/* ============================================================
   Navigation & Start
   ============================================================ */
function show(name) {
    ["measure", "trend", "settings"].forEach(function (v) {
        $("#view-" + v).classList.toggle("on", v === name);
    });
    document.querySelectorAll(".nav button").forEach(function (b) {
        if (b.dataset.view === name) b.setAttribute("aria-current", "page");
        else b.removeAttribute("aria-current");
    });
    if (name === "trend") renderTrend();
    if (name === "settings") renderSettings();
}

function renderAll() {
    renderScale();
    renderZoneLine();
    renderTodayCard();
    renderBanners();
    if ($("#view-trend").classList.contains("on")) renderTrend();
    if ($("#view-settings").classList.contains("on")) renderSettings();
}

function init() {
    var now = new Date();
    $("#todayLabel").textContent = WD[now.getDay()] + " " + String(now.getDate()).padStart(2, "0") + "." + String(now.getMonth() + 1).padStart(2, "0") + ".";

    ui.period = defaultPeriod();
    renderPeriodSeg();
    renderTags();

    if (state.settings.best) ui.value = round5(state.settings.best * 0.9);
    else if (state.entries.length) ui.value = state.entries[state.entries.length - 1].value;
    $("#valInput").value = ui.value;

    renderAll();
    bindScale();
    bindSettings();

    $("#valInput").addEventListener("input", function () {
        var v = parseInt(this.value.replace(/\D/g, ""), 10);
        if (!isNaN(v)) { setValue(v, true); }
    });
    $("#valInput").addEventListener("blur", function () { setValue(parseInt(this.value, 10) || ui.value); });

    $("#minus").addEventListener("click", function () { setValue(ui.value - 5); });
    $("#plus").addEventListener("click", function () { setValue(ui.value + 5); });

    Array.from($("#periodSeg").children).forEach(function (b) {
        b.addEventListener("click", function () {
            ui.period = b.dataset.p;
            renderPeriodSeg();
            $("#sonstigeTimeWrap").hidden = ui.period !== "sonstige";
            if (ui.period !== "sonstige") $("#sonstigeTime").value = "";
        });
    });
    Array.from($("#rangeSeg").children).forEach(function (b) {
        b.addEventListener("click", function () {
            ui.range = parseInt(b.dataset.r, 10);
            Array.from($("#rangeSeg").children).forEach(function (x) {
                x.setAttribute("aria-pressed", x === b ? "true" : "false");
            });
            ui.selectedDay = null;
            renderTrend();
        });
    });

    $("#noteToggle").addEventListener("click", function () {
        var f = $("#noteField");
        f.hidden = !f.hidden;
        this.textContent = f.hidden ? "Notiz hinzufügen" : "Notiz ausblenden";
        if (!f.hidden) f.focus();
    });

    Array.from($("#dateSeg").children).forEach(function (b) {
        b.addEventListener("click", function () {
            Array.from($("#dateSeg").children).forEach(function (x) {
                x.setAttribute("aria-pressed", x === b ? "true" : "false");
            });
            var isOther = b.dataset.d === "other";
            $("#datePickerWrap").hidden = !isOther;
            $("#periodWrap").hidden = isOther;
            if (isOther) {
                ui.period = "sonstige";
                $("#entryDate").max = dayKey(new Date());
                $("#entryDate").focus();
            } else {
                $("#entryDate").value = "";
                $("#entryTime").value = "";
                ui.period = defaultPeriod();
                renderPeriodSeg();
                $("#sonstigeTimeWrap").hidden = ui.period !== "sonstige";
                renderDateHint();
            }
        });
    });
    $("#entryDate").addEventListener("change", renderDateHint);
    $("#entryTime").addEventListener("change", renderDateHint);

    $("#saveBtn").addEventListener("click", saveEntry);

    document.querySelectorAll(".nav button").forEach(function (b) {
        b.addEventListener("click", function () { show(b.dataset.view); window.scrollTo({ top: 0, behavior: "instant" }); });
    });
}

load().then(init)["catch"](init);
