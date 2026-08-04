/* ============================================================
   Skala – das Herzstück der Eingabe
   ============================================================ */
var VB_W = 340, TX0 = 14, TX1 = 326;

function valToX(v) {
    var mx = scaleMax();
    return TX0 + (clamp(v, SCALE_MIN, mx) - SCALE_MIN) / (mx - SCALE_MIN) * (TX1 - TX0);
}
function xToVal(x) {
    var mx = scaleMax();
    var t = clamp((x - TX0) / (TX1 - TX0), 0, 1);
    return round5(SCALE_MIN + t * (mx - SCALE_MIN));
}

function renderScale() {
    var mx = scaleMax(), b = state.settings.best;
    var parts = [];
    parts.push('<svg viewBox="0 0 340 62" aria-hidden="true">');

    if (b) {
        var xr = valToX(b * state.settings.redPct / 100);
        var xg = valToX(b * state.settings.greenPct / 100);
        parts.push('<rect x="' + TX0 + '" y="20" width="' + (xr - TX0) + '" height="15" fill="#F4DBD7"/>');
        parts.push('<rect x="' + xr + '" y="20" width="' + (xg - xr) + '" height="15" fill="#F6E7CB"/>');
        parts.push('<rect x="' + xg + '" y="20" width="' + (TX1 - xg) + '" height="15" fill="#DCEAE3"/>');
    } else {
        parts.push('<rect x="' + TX0 + '" y="20" width="' + (TX1 - TX0) + '" height="15" fill="#E7EDF1"/>');
    }
    parts.push('<rect x="' + TX0 + '" y="20" width="' + (TX1 - TX0) + '" height="15" fill="none" stroke="#D3DEE4"/>');

    for (var v = Math.ceil(SCALE_MIN / 20) * 20; v <= mx; v += 20) {
        var x = valToX(v), major = (v % 100 === 0);
        parts.push('<line x1="' + x.toFixed(1) + '" y1="35" x2="' + x.toFixed(1) + '" y2="' + (major ? 43 : 39) + '" stroke="#8AA0AF" stroke-width="' + (major ? 1 : .6) + '"/>');
        if (v % 200 === 0) {
            parts.push('<text x="' + x.toFixed(1) + '" y="55" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="9" fill="#8AA0AF">' + v + '</text>');
        }
    }

    if (b) {
        var xb = valToX(b);
        parts.push('<path d="M' + (xb - 4).toFixed(1) + ' 12 L' + (xb + 4).toFixed(1) + ' 12 L' + xb.toFixed(1) + ' 18 Z" fill="#0F2233"/>');
        parts.push('<text x="' + clamp(xb, 20, TX1 - 16).toFixed(1) + '" y="8" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="8" letter-spacing="1" fill="#54697A">BEST</text>');
    }

    parts.push('<g id="ptr" transform="translate(' + valToX(ui.value).toFixed(1) + ',0)">');
    parts.push('<line x1="0" y1="14" x2="0" y2="45" stroke="#0F2233" stroke-width="2.4" stroke-linecap="round"/>');
    parts.push('<circle cx="0" cy="14" r="4.6" fill="#0F2233"/>');
    parts.push('</g>');

    parts.push('<rect class="focusring" x="1" y="1" width="338" height="60" rx="8" fill="none" stroke="none"/>');
    parts.push('</svg>');
    $("#scale").innerHTML = parts.join("");
    var sc = $("#scale");
    sc.setAttribute("aria-valuemax", mx);
    sc.setAttribute("aria-valuenow", ui.value);
    sc.setAttribute("aria-valuetext", ui.value + " Liter pro Minute, " + zoneName(zoneOf(ui.value)));
}

function movePointer() {
    var g = document.getElementById("ptr");
    if (g) g.setAttribute("transform", "translate(" + valToX(ui.value).toFixed(1) + ",0)");
    var sc = $("#scale");
    sc.setAttribute("aria-valuenow", ui.value);
    sc.setAttribute("aria-valuetext", ui.value + " Liter pro Minute, " + zoneName(zoneOf(ui.value)));
}

function setValue(v, fromInput) {
    ui.value = clamp(round5(v), SCALE_MIN, scaleMax());
    if (!fromInput) $("#valInput").value = ui.value;
    movePointer();
    renderZoneLine();
}

function renderZoneLine() {
    var z = zoneOf(ui.value), p = pctOfBest(ui.value);
    var h = '<span class="zonepill ' + z + '">' + zoneName(z) + '</span>';
    if (p != null) h += '<span class="pct">' + p + ' % vom Bestwert</span>';
    else h += '<span class="pct">Bestwert fehlt noch</span>';
    $("#zoneLine").innerHTML = h;
}

function bindScale() {
    var sc = $("#scale"), dragging = false;
    function fromEvent(e) {
        var svg = sc.querySelector("svg");
        if (!svg) return;
        var r = svg.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width * VB_W;
        setValue(xToVal(x));
    }
    sc.addEventListener("pointerdown", function (e) {
        dragging = true;
        sc.setPointerCapture(e.pointerId);
        fromEvent(e);
        e.preventDefault();
    });
    sc.addEventListener("pointermove", function (e) { if (dragging) fromEvent(e); });
    sc.addEventListener("pointerup", function () { dragging = false; });
    sc.addEventListener("pointercancel", function () { dragging = false; });
    sc.addEventListener("keydown", function (e) {
        var d = 0;
        if (e.key === "ArrowRight" || e.key === "ArrowUp") d = 5;
        if (e.key === "ArrowLeft" || e.key === "ArrowDown") d = -5;
        if (e.key === "PageUp") d = 50;
        if (e.key === "PageDown") d = -50;
        if (d) { setValue(ui.value + d); e.preventDefault(); }
    });
}
