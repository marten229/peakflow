/* ============================================================
   Zustand & Speicher
   ============================================================ */

window.storage = {
  get: function (key) {
    return Promise.resolve({ value: localStorage.getItem(key) });
  },
  set: function (key, value) {
    try { localStorage.setItem(key, value); } catch (e) { return Promise.reject(e); }
    return Promise.resolve();
  },
  remove: function (key) {
    localStorage.removeItem(key);
    return Promise.resolve();
  }
};

var KEY = "peakflow:v1";
var TAGS = ["Bedarfsspray", "Atemnot", "Husten", "Nachts wach", "Nach Belastung", "Erkältung", "Reizstoffe / Pollen"];
var WD = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

var state = {
  entries: [],
  settings: {
    best: null,
    greenPct: 80,
    redPct: 50,
    plans: { green: "", amber: "", red: "" },
    reminders: { on: true, morning: "07:30", evening: "19:30" }
  }
};

var ui = {
  value: 400,
  period: "morgens",
  tags: [],
  range: 14,
  selectedDay: null,
  ready: false
};

function applyStored(res) {
  try {
    if (!res || !res.value) return;
    var d = JSON.parse(res.value);
    if (d.entries) state.entries = d.entries;
    if (d.settings) {
      var s = d.settings;
      state.settings.best = (s.best == null ? null : Number(s.best));
      if (s.greenPct) state.settings.greenPct = Number(s.greenPct);
      if (s.redPct) state.settings.redPct = Number(s.redPct);
      if (s.plans) state.settings.plans = { green: s.plans.green || "", amber: s.plans.amber || "", red: s.plans.red || "" };
      if (s.reminders) state.settings.reminders = {
        on: s.reminders.on !== false,
        morning: s.reminders.morning || "07:30",
        evening: s.reminders.evening || "19:30"
      };
    }
  } catch (e) { }
}

function load() {
  return new Promise(function (resolve) {
    if (!window.storage) return resolve();
    try {
      var p = window.storage.get(KEY);
      if (!p || typeof p.then !== "function") return resolve();
      p.then(function (res) { applyStored(res); resolve(); }, function () { resolve(); });
    } catch (e) { resolve(); }
  });
}

var saveTimer = null;
function persist() {
  if (!window.storage) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(function () {
    try {
      window.storage.set(KEY, JSON.stringify(state))["catch"](function () {
        toast("Speichern hat nicht geklappt – Eintrag ist nur bis zum Neuladen da");
      });
    } catch (e) { }
  }, 120);
}
