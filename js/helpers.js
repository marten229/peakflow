/* ============================================================
   Kleine Helfer
   ============================================================ */
function $(s) { return document.querySelector(s); }
function el(t, c, txt) { var e = document.createElement(t); if (c) e.className = c; if (txt != null) e.textContent = txt; return e; }
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]; }); }

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function round5(v) { return Math.round(v / 5) * 5; }
function scaleMax() {
    var b = state.settings.best || 600;
    return Math.max(700, Math.ceil((b * 1.15) / 50) * 50);
}
var SCALE_MIN = 60;

function dayKey(d) {
    var x = new Date(d);
    return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0");
}
function dateFromKey(k) { var p = k.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
function shortDate(k) { var d = dateFromKey(k); return WD[d.getDay()] + " " + d.getDate() + "." + (d.getMonth() + 1) + "."; }
function timeOf(ts) { var d = new Date(ts); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); }

function zoneOf(v) {
    var b = state.settings.best;
    if (!b || !v) return "none";
    var p = v / b * 100;
    if (p >= state.settings.greenPct) return "green";
    if (p >= state.settings.redPct) return "amber";
    return "red";
}
function zoneName(z) { return z === "green" ? "Grüne Zone" : z === "amber" ? "Gelbe Zone" : z === "red" ? "Rote Zone" : "Ohne Bestwert"; }
function zoneColor(z) { return z === "green" ? "#16775A" : z === "amber" ? "#A96C0E" : z === "red" ? "#A32B25" : "#8AA0AF"; }
function pctOfBest(v) {
    var b = state.settings.best;
    return b ? Math.round(v / b * 100) : null;
}

function toast(msg) {
    var t = $("#toast");
    t.textContent = msg;
    t.classList.add("on");
    clearTimeout(t._h);
    t._h = setTimeout(function () { t.classList.remove("on"); }, 2600);
}

function defaultPeriod() {
    var h = new Date().getHours();
    if (h < 11) return "morgens";
    if (h >= 16) return "abends";
    return "sonstige";
}
