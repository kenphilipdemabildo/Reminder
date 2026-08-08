const $ = id => document.getElementById(id);

const DEFAULTS = {
  date: "2024-03-08", // 29 months as of Aug 8, 2026
  day: 8,
  hour: 0,
  minute: 0
};

let settings = JSON.parse(localStorage.getItem("monthsarySettings") || "null") || DEFAULTS;
let deferredPrompt = null;

function saveSettings() {
  localStorage.setItem("monthsarySettings", JSON.stringify(settings));
}

function monthDiff(start, now = new Date()) {
  const s = new Date(start + "T00:00:00");
  let months = (now.getFullYear() - s.getFullYear()) * 12 +
               (now.getMonth() - s.getMonth());
  if (now.getDate() < s.getDate()) months--;
  return Math.max(0, months);
}

function ordinal(n) {
  const x = n % 100;
  if (x >= 11 && x <= 13) return n + "th";
  return n + ({1:"st",2:"nd",3:"rd"}[n % 10] || "th");
}

function render() {
  $("months").textContent = monthDiff(settings.date);
  $("dayText").textContent = ordinal(Number(settings.day));
  $("dateInput").value = settings.date;
  $("dayInput").value = settings.day;
  updateStatus();
}

function updateStatus() {
  if (!("Notification" in window)) {
    $("status").textContent = "This browser does not support notifications.";
    return;
  }
  $("status").textContent =
    Notification.permission === "granted"
      ? "✅ Notifications enabled. Reminder time: 12:00 AM."
      : "Notifications are not enabled yet.";
}

async function enableNotifications() {
  if (!("Notification" in window)) {
    alert("Your browser does not support notifications.");
    return;
  }
  const permission = await Notification.requestPermission();
  updateStatus();
  if (permission === "granted") {
    await registerServiceWorker();
    await showNotification(
      "❤️ Monthsary reminders are ON",
      `Your reminder is set for every ${ordinal(Number(settings.day))} at 12:00 AM.`
    );
  } else {
    alert("Please allow notifications in your browser/app settings.");
  }
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("./sw.js");
  } catch (e) {
    console.error("Service worker registration failed", e);
    return null;
  }
}

async function showNotification(title, body) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const reg = await navigator.serviceWorker.ready.catch(() => null);
  if (reg) {
    await reg.showNotification(title, {
      body,
      icon: "./icon.svg",
      badge: "./icon.svg",
      tag: "monthsary-reminder",
      renotify: true,
      vibrate: [300, 100, 300, 100, 600],
      data: { url: location.href }
    });
  } else {
    new Notification(title, { body });
  }
}

function isMonthsaryToday() {
  const now = new Date();
  return now.getDate() === Number(settings.day);
}

function dayKey() {
  const n = new Date();
  return `${n.getFullYear()}-${n.getMonth()}-${n.getDate()}`;
}

async function checkReminder() {
  if (!isMonthsaryToday()) return;
  const key = "monthsaryNotified-" + dayKey();
  if (localStorage.getItem(key)) return;

  const months = monthDiff(settings.date);
  if (months <= 0) return;

  if ("Notification" in window && Notification.permission === "granted") {
    await showNotification(
      `❤️ Happy ${ordinal(months)} Monthsary!`,
      `Today is your ${months}th month together. Happy monthsary! ❤️`
    );
    localStorage.setItem(key, "1");
  }
}

function playTestSound() {
  // Web audio is allowed only after a user gesture, so this is used by the test button.
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();
  const notes = [523.25, 659.25, 783.99];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.18);
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + i * 0.18 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.18 + 0.16);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime + i * 0.18);
    osc.stop(ctx.currentTime + i * 0.18 + 0.17);
  });
}

$("notifyBtn").addEventListener("click", enableNotifications);

$("testBtn").addEventListener("click", async () => {
  playTestSound();
  if ("Notification" in window && Notification.permission === "granted") {
    await showNotification("🔊 Monthsary Reminder Test", "Your notification is working!");
  } else {
    alert("Enable notifications first.");
  }
});

$("saveBtn").addEventListener("click", () => {
  const date = $("dateInput").value;
  const day = Number($("dayInput").value);

  if (!date || day < 1 || day > 31) {
    alert("Please enter a valid date and monthsary day.");
    return;
  }

  settings = { ...settings, date, day };
  saveSettings();
  render();
  alert("Settings saved!");
});

window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  deferredPrompt = e;
  $("installBtn").classList.remove("hidden");
});

$("installBtn").addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  $("installBtn").classList.add("hidden");
});

if ("serviceWorker" in navigator) registerServiceWorker();
render();
checkReminder();

// Keeps checking while the app is open.
setInterval(checkReminder, 30 * 1000);

// When returning to the app.
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) checkReminder();
});
