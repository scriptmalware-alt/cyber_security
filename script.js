const terminal = document.getElementById("terminal");
const progress = document.getElementById("progress");
const video = document.getElementById("video");
const systemLog = document.getElementById("system-log");
const map = document.getElementById("map");
const virtualBalanceEl = document.getElementById("virtual-balance");
const receiverBalanceEl = document.getElementById("receiver-balance");
const systemNotifyEl = document.getElementById("system-notify");
const systemNotifyMessageEl = document.getElementById("system-notify-message");
const systemNotifyContinueBtn = document.getElementById("system-notify-continue");
const lossAmountEl = document.getElementById("loss-amount");
const queryStatusEl = document.getElementById("query-status");
const verifyBtn = document.getElementById("verify-btn");
const progressText = document.getElementById("progress-text");
const withdrawBtn = document.getElementById("withdraw-btn");

const receiverAccountNumberEl = document.getElementById("receiver-account-number");
const receiverAccountNameEl = document.getElementById("receiver-account-name");
const receiverBankNameEl = document.getElementById("receiver-bank-name");

const virtualBankNameEl = document.getElementById("virtual-bank-name");
const virtualAccountNumberEl = document.getElementById("virtual-account-number");

const victimFullNameEl = document.getElementById("victim-full-name");
const victimAddressEl = document.getElementById("victim-address");
const victimPhoneEl = document.getElementById("victim-phone");
const victimJobEl = document.getElementById("victim-job");
const victimRoleEl = document.getElementById("victim-role");
const victimAccountNumberInputEl = document.getElementById("victim-account-number");
const victimBankNameEl = document.getElementById("victim-bank-name");

const targetScamAccountEl = document.getElementById("target-scam-account");
const targetBankNameEl = document.getElementById("target-bank-name");
const targetAccountNameEl = document.getElementById("target-account-name");
const virtualAccountNameEl = document.getElementById("virtual-account-name");

const activateAccountBtn = document.getElementById("activate-account-btn");
const activationPanelEl = document.getElementById("activation-panel");
const activationFeeEl = document.getElementById("activation-fee");
const activationTotalEl = document.getElementById("activation-total");

let virtualBalance = null;
let receiverBalance = 0;
let isVerifyingBalance = false;
let isWithdrawing = false;
let isActivating = false;

function showActionButton(visibleId) {
    [verifyBtn, withdrawBtn, activateAccountBtn].forEach((btn) => {
        if (!btn) return;
        btn.classList.toggle("hidden", btn.id !== visibleId);
        btn.disabled = false;
    });
}

/* ===================== UTIL ===================== */

function formatRupiah(value) {
    return Number(value).toLocaleString("id-ID");
}

function parseRupiahInput(rawText) {
    if (!rawText) return NaN;
    const digits = rawText.replace(/[^\d]/g, "");
    return digits ? Number(digits) : NaN;
}

/** Nilai input disimpan sebagai huruf besar; kursor tetap di posisi yang sama. */
function bindUppercaseInput(el, onInput) {
    if (!el) return;
    el.addEventListener("input", () => {
        const upper = el.value.toUpperCase();
        if (upper !== el.value) {
            const start = el.selectionStart;
            const end = el.selectionEnd;
            el.value = upper;
            if (start != null && end != null) {
                el.setSelectionRange(start, end);
            }
        }
        if (typeof onInput === "function") onInput();
    });
}

function updateBalanceUI() {
    virtualBalanceEl.innerText = virtualBalance === null ? "-" : formatRupiah(virtualBalance);
    receiverBalanceEl.innerText = receiverBalance === null ? "-" : formatRupiah(receiverBalance);
}

/* ===================== SYNC ===================== */

function syncInfoPanels() {
    receiverAccountNameEl.innerText = victimFullNameEl.value || "-";
    receiverAccountNumberEl.innerText = victimAccountNumberInputEl.value || "-";
    receiverBankNameEl.innerText = victimBankNameEl.value || "-";

    virtualAccountNumberEl.innerText = targetScamAccountEl.value || "-";
    virtualBankNameEl.innerText = targetBankNameEl.value || "-";
    virtualAccountNameEl.innerText = targetAccountNameEl.value || "-";
}

/* ===================== PROGRESS VERIFY ===================== */

function runProgressBar(barEl, textEl, duration, onTick, onComplete) {
    const start = Date.now();

    if (barEl) barEl.style.width = "0%";
    if (textEl) textEl.innerText = "0%";

    const interval = setInterval(() => {
        const elapsed = Date.now() - start;
        const percent = Math.min(100, Math.floor((elapsed / duration) * 100));

        if (barEl) barEl.style.width = percent + "%";
        if (textEl) textEl.innerText = percent + "%";
        if (typeof onTick === "function") onTick(percent, elapsed);

        if (elapsed >= duration) {
            clearInterval(interval);
            if (barEl) barEl.style.width = "100%";
            if (textEl) textEl.innerText = "100%";
            if (typeof onComplete === "function") onComplete();
        }
    }, 100);
}

function verifyVirtualBalance() {
    if (isVerifyingBalance) return;

    const targetAmount = parseRupiahInput(lossAmountEl.value);
    if (!targetAmount) return;

    isVerifyingBalance = true;
    verifyBtn.disabled = true;
    startTrackingSession("verify", 3000);
    runProgressBar(progress, progressText, 3000, () => {
        virtualBalance = Math.floor(Math.random() * targetAmount);
        updateBalanceUI();
    }, () => {
        virtualBalance = targetAmount;
        updateBalanceUI();

        isVerifyingBalance = false;
        verifyBtn.disabled = false;
        showActionButton("withdraw-btn");

        appendWithdrawHistory(`==> Tracking Saldo terverifikasi di rekening target telah berhasil Rp ${formatRupiah(targetAmount)}`);
    });
}

/* ===================== WITHDRAW ===================== */

function withdrawVirtual() {
    if (isWithdrawing || virtualBalance === null || virtualBalance <= 0) return;

    isWithdrawing = true;
    if (withdrawBtn) withdrawBtn.disabled = true;
    const amount = virtualBalance;

    startTrackingSession("withdraw", 2000);
    runProgressBar(progress, progressText, 2000, null, () => {
        virtualBalance = 0;
        receiverBalance += amount;

        updateBalanceUI();

        appendWithdrawHistory(`==> Penarikan saldo berhasil di alihkan ke rekening utama Rp ${formatRupiah(amount)} lanjutkan activasi rekening untuk menerima saldo ke rekening tujuan`);

        showActionButton("activate-account-btn");
        isWithdrawing = false;
        if (withdrawBtn) withdrawBtn.disabled = false;
    });
}

/* ===================== ACTIVATION ===================== */

activateAccountBtn?.addEventListener("click", () => {
    if (isActivating) return;
    isActivating = true;
    activateAccountBtn.disabled = true;

    startTrackingSession("activate", 2000);
    runProgressBar(progress, progressText, 2000, null, () => {
        const loss = parseRupiahInput(lossAmountEl.value) || 0;
        const fee = parseRupiahInput(activationFeeEl.value) || 0;

        const total = loss + fee;

        // update total diterima
        receiverBalance = total;
        updateBalanceUI();

        updateActivationTotal();

        appendWithdrawHistory(
            `==> System pencairan saldo gagal sebesar Rp ${formatRupiah(loss)} diperlukan activasi rekening terlebih dahulu sebesar Rp ${formatRupiah(fee)} setelah activasi pada system, total pencairan saldo ke rekening penerima Rp ${formatRupiah(total)}`
        );

        isActivating = false;
        activateAccountBtn.disabled = false;
    });
});

/* ===================== INPUT FORMAT ===================== */

activationFeeEl?.addEventListener("input", () => {
    const val = parseRupiahInput(activationFeeEl.value);
    if (val) activationFeeEl.value = formatRupiah(val);
    updateActivationTotal();
});

lossAmountEl?.addEventListener("input", () => {
    const val = parseRupiahInput(lossAmountEl.value);
    if (val) lossAmountEl.value = formatRupiah(val);
    updateActivationTotal();
});

/* ===================== TOTAL ===================== */

function updateActivationTotal() {
    const loss = parseRupiahInput(lossAmountEl.value) || 0;
    const fee = parseRupiahInput(activationFeeEl.value) || 0;

    if (activationTotalEl) {
        activationTotalEl.innerText = formatRupiah(loss + fee);
    }
}

/* ===================== NOTIFIKASI POPUP ===================== */

function escapeNotifyHtml(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

/** Warna khusus untuk kata kunci & nominal di popup notifikasi */
function highlightNotifyMessage(raw) {
    let html = escapeNotifyHtml(raw);

    html = html.replace(/^==>/, '<span class="notify-hl-prefix">==></span>');
    html = html.replace(/total pencairan saldo ke rekening penerima/gi, (m) => `<span class="notify-hl-total">${m}</span>`);
    html = html.replace(/Rp\s[\d.,]+/g, (match) => `<span class="notify-hl-amount">${match}</span>`);
    html = html.replace(/activasi rekening/gi, (m) => `<span class="notify-hl-activation">${m}</span>`);
    html = html.replace(/\bgagal\b/gi, (m) => `<span class="notify-hl-fail">${m}</span>`);
    html = html.replace(/\bberhasil\b/gi, (m) => `<span class="notify-hl-success">${m}</span>`);
    html = html.replace(/\bsaldo\b/gi, (m) => `<span class="notify-hl-saldo">${m}</span>`);
    html = html.replace(/\bTracking\b/g, (m) => `<span class="notify-hl-tracking">${m}</span>`);
    html = html.replace(/\bPenarikan\b/gi, (m) => `<span class="notify-hl-action">${m}</span>`);

    return html;
}

const notifyQueue = [];
let notifyVisible = false;

function showSystemNotify(msg) {
    notifyQueue.push(msg);
    if (!notifyVisible) {
        displayNextNotify();
    }
}

function displayNextNotify() {
    if (!systemNotifyEl || !systemNotifyMessageEl) return;

    if (notifyQueue.length === 0) {
        notifyVisible = false;
        systemNotifyEl.classList.add("hidden");
        systemNotifyEl.setAttribute("aria-hidden", "true");
        return;
    }

    notifyVisible = true;
    systemNotifyMessageEl.innerHTML = highlightNotifyMessage(notifyQueue.shift());
    systemNotifyEl.classList.remove("hidden");
    systemNotifyEl.setAttribute("aria-hidden", "false");
    systemNotifyContinueBtn?.focus();
}

function appendWithdrawHistory(msg) {
    showSystemNotify(msg);

    if (terminal) {
        const line = document.createElement("div");
        line.innerText = msg;
        terminal.prepend(line);
    }
}

systemNotifyContinueBtn?.addEventListener("click", () => {
    displayNextNotify();
});

/* ===================== LIVE EFFECT ===================== */

setInterval(() => {
    if (!systemLog) return;

    const line = document.createElement("div");
    line.innerText = "[OK] Update sistem...";
    systemLog.appendChild(line);

    if (systemLog.childNodes.length > 20) {
        systemLog.removeChild(systemLog.firstChild);
    }
}, 1000);

(function initLiveMap() {
    if (!map) return;

    const routesSvg = document.getElementById("map-routes");
    const nodesLayer = document.getElementById("map-nodes");
    const packetsLayer = document.getElementById("map-packets");
    const hudNodes = document.getElementById("map-hud-nodes");
    const hudRoutes = document.getElementById("map-hud-routes");
    const hudPing = document.getElementById("map-hud-ping");
    const lockLabel = document.getElementById("map-lock-label");

    const HUBS = [
        { name: "NEW YORK", x: 26, y: 38, hub: true },
        { name: "LONDON", x: 47.5, y: 32, hub: true },
        { name: "MOSCOW", x: 58, y: 29 },
        { name: "DUBAI", x: 59.5, y: 45 },
        { name: "MUMBAI", x: 66.5, y: 48 },
        { name: "SINGAPORE", x: 76, y: 57, hub: true },
        { name: "JAKARTA", x: 77.5, y: 61, target: true },
        { name: "TOKYO", x: 83, y: 39, hub: true },
        { name: "SYDNEY", x: 86.5, y: 73 },
        { name: "SAO PAULO", x: 33, y: 70 },
        { name: "LAGOS", x: 49, y: 55 },
        { name: "CAIRO", x: 54.5, y: 44 },
    ];

    HUBS.forEach((hub) => {
        const node = document.createElement("div");
        node.className = "map-node" + (hub.hub ? " is-hub" : "") + (hub.target ? " is-target" : "");
        node.style.left = hub.x + "%";
        node.style.top = hub.y + "%";
        node.title = hub.name;
        nodesLayer.appendChild(node);
    });

    if (hudNodes) hudNodes.textContent = String(HUBS.length);

    const activePackets = [];
    let activeRouteCount = 0;

    function curvePath(a, b) {
        const midX = (a.x + b.x) / 2;
        const midY = Math.min(a.y, b.y) - Math.max(8, Math.abs(a.x - b.x) * 0.22);
        return `M ${a.x} ${a.y} Q ${midX} ${midY} ${b.x} ${b.y}`;
    }

    function spawnRoute() {
        const from = HUBS[Math.floor(Math.random() * HUBS.length)];
        let to = HUBS[Math.floor(Math.random() * HUBS.length)];
        if (to === from) to = HUBS[(HUBS.indexOf(from) + 3) % HUBS.length];

        const alert = Boolean(from.target || to.target || Math.random() < 0.18);
        const d = curvePath(from, to);
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", d);
        path.setAttribute("class", "map-arc" + (alert ? " is-alert" : ""));
        routesSvg.appendChild(path);
        activeRouteCount += 1;
        if (hudRoutes) hudRoutes.textContent = String(activeRouteCount);

        const length = path.getTotalLength();
        const packet = document.createElement("div");
        packet.className = "map-packet" + (alert ? " is-alert" : "");
        packetsLayer.appendChild(packet);

        const duration = 1600 + Math.random() * 1400;
        const started = performance.now();
        activePackets.push({ path, packet, length, duration, started, from, to, alert });

        if (alert && lockLabel) {
            lockLabel.textContent = `LOCK ${to.name}`;
            lockLabel.style.left = to.x + "%";
            lockLabel.style.top = to.y + "%";
            lockLabel.classList.add("is-on");
            setTimeout(() => lockLabel.classList.remove("is-on"), 1400);
        }

        setTimeout(() => {
            path.remove();
            packet.remove();
            activeRouteCount = Math.max(0, activeRouteCount - 1);
            if (hudRoutes) hudRoutes.textContent = String(activeRouteCount);
        }, duration + 80);
    }

    function tickPackets(now) {
        for (let i = activePackets.length - 1; i >= 0; i -= 1) {
            const item = activePackets[i];
            const t = Math.min(1, (now - item.started) / item.duration);
            if (t >= 1 || !item.path.isConnected) {
                activePackets.splice(i, 1);
                continue;
            }
            const pt = item.path.getPointAtLength(item.length * t);
            item.packet.style.left = pt.x + "%";
            item.packet.style.top = pt.y + "%";
        }
        requestAnimationFrame(tickPackets);
    }

    spawnRoute();
    spawnRoute();
    setInterval(spawnRoute, 900);
    requestAnimationFrame(tickPackets);

    setInterval(() => {
        if (hudPing) hudPing.textContent = `${10 + Math.floor(Math.random() * 28)}ms`;
    }, 1200);
})();

/* ===================== TRACKING PROCESS ===================== */

const trackingLogEl = document.getElementById("tracking-log");
const trackingProgressEl = document.getElementById("tracking-progress");
const trackingPercentEl = document.getElementById("tracking-percent");

const TRACKING_FLOWS = {
    verify: {
        label: "VERIFIKASI REKENING",
        steps: [
            () => `[CMD] Eksekusi perintah VERIFIKASI REKENING TARGET`,
            () => `[NET] Handshake gateway ${randomOctet()}.${randomOctet()}.${randomOctet()}.${randomOctet()}`,
            () => `[SCAN] Membaca metadata rekening pelaku...`,
            () => `[QUERY] Mencocokkan saldo dengan total kerugian...`,
            () => `[HASH] Verifikasi checksum: ${randomHex(8).toUpperCase()}`,
            () => `[TRACE] Melacak jejak transaksi NODE-${randomHex(4)}`,
            () => `[OK-PARTIAL] Saldo virtual target terdeteksi`,
        ],
        done: () => `[DONE] Verifikasi rekening selesai — saldo target dikonfirmasi`,
    },
    withdraw: {
        label: "TARIK SALDO",
        steps: [
            () => `[CMD] Eksekusi perintah TARIK SALDO VIRTUAL`,
            () => `[LOCK] Mengunci channel rekening pelaku...`,
            () => `[TRANSFER] Mengalihkan saldo ke rekening utama penerima...`,
            () => `[NET] Relay transfer ${randomOctet()}.${randomOctet()}.${randomOctet()}.${randomOctet()}`,
            () => `[SYNC] Sinkronisasi ledger internal...`,
            () => `[WARN] Diperlukan activasi rekening untuk pencairan tujuan`,
        ],
        done: () => `[DONE] Penarikan saldo virtual selesai — lanjut activasi rekening`,
    },
    activate: {
        label: "ACTIVASI REKENING",
        steps: [
            () => `[CMD] Eksekusi perintah ACTIVASI REKENING`,
            () => `[AUTH] Validasi biaya activasi rekening...`,
            () => `[CALC] Menghitung total pencairan + biaya activasi...`,
            () => `[ROUTE] Menyiapkan jalur pencairan ke rekening penerima...`,
            () => `[CHECK] Status pencairan: menunggu activasi`,
            () => `[GEO] Update titik tracking peta (${randomCoord()}, ${randomCoord()})`,
        ],
        done: () => `[DONE] Proses activasi selesai — data siap divisualisasikan di peta`,
    },
};

let trackingProgressTimer = null;
let trackingStepTimeouts = [];

function randomOctet() {
    return Math.floor(Math.random() * 220) + 10;
}

function randomHex(len) {
    let out = "";
    for (let i = 0; i < len; i += 1) {
        out += Math.floor(Math.random() * 16).toString(16);
    }
    return out;
}

function randomCoord() {
    return (Math.random() * 180 - 90).toFixed(4);
}

function pushTrackingLine(text) {
    if (!trackingLogEl) return;

    const prevActive = trackingLogEl.querySelector(".tracking-log-line.is-active");
    if (prevActive) prevActive.classList.remove("is-active");

    const line = document.createElement("p");
    line.className = "tracking-log-line is-active";
    line.textContent = text;
    trackingLogEl.appendChild(line);

    const maxLines = 6;
    while (trackingLogEl.children.length > maxLines) {
        trackingLogEl.removeChild(trackingLogEl.firstChild);
    }
}

function setTrackingPercent(percent) {
    const p = Math.max(0, Math.min(100, percent));
    if (trackingPercentEl) trackingPercentEl.textContent = `${p}%`;
    if (trackingProgressEl) trackingProgressEl.style.width = `${p}%`;
}

function clearTrackingSession() {
    if (trackingProgressTimer) {
        clearInterval(trackingProgressTimer);
        trackingProgressTimer = null;
    }
    trackingStepTimeouts.forEach(clearTimeout);
    trackingStepTimeouts = [];
}

function startTrackingSession(flowKey, durationMs) {
    const flow = TRACKING_FLOWS[flowKey];
    if (!flow || !trackingLogEl) return;

    clearTrackingSession();
    trackingLogEl.innerHTML = "";
    setTrackingPercent(0);

    document.querySelector(".tracking-process-panel")?.scrollIntoView({ behavior: "smooth", block: "nearest" });

    pushTrackingLine(`[START] PROSES TRACKING — ${flow.label}`);

    const steps = flow.steps.map((step) => (typeof step === "function" ? step() : step));
    steps.forEach((text, index) => {
        const delay = ((index + 1) / steps.length) * durationMs * 0.9;
        const timeoutId = setTimeout(() => pushTrackingLine(text), delay);
        trackingStepTimeouts.push(timeoutId);
    });

    const start = Date.now();
    trackingProgressTimer = setInterval(() => {
        const elapsed = Date.now() - start;
        const percent = Math.min(100, Math.floor((elapsed / durationMs) * 100));
        setTrackingPercent(percent);

        if (elapsed >= durationMs) {
            clearTrackingSession();
            setTrackingPercent(100);
            pushTrackingLine(typeof flow.done === "function" ? flow.done() : flow.done);
        }
    }, 100);
}

if (trackingLogEl) {
    pushTrackingLine("[SYS] Siap. Proses tracking dimulai.");
}

/* ===================== INIT ===================== */

bindUppercaseInput(victimFullNameEl, syncInfoPanels);
bindUppercaseInput(victimAddressEl);
bindUppercaseInput(victimPhoneEl);
bindUppercaseInput(victimJobEl);
bindUppercaseInput(victimRoleEl);
bindUppercaseInput(victimAccountNumberInputEl, syncInfoPanels);
bindUppercaseInput(victimBankNameEl, syncInfoPanels);
bindUppercaseInput(targetScamAccountEl, syncInfoPanels);
bindUppercaseInput(targetBankNameEl, syncInfoPanels);
bindUppercaseInput(targetAccountNameEl, syncInfoPanels);

updateBalanceUI();
updateActivationTotal();
syncInfoPanels();

/* ===================== SIDEBAR TOGGLE ===================== */

const SIDEBAR_STORAGE_KEY = "cyber-panel-sidebar-hidden";

function setSidebarHidden(hidden) {
    document.body.classList.toggle("sidebar-collapsed", hidden);

    const hideBtn = document.getElementById("sidebar-hide-btn");
    const reopenBtn = document.getElementById("sidebar-reopen");

    if (hideBtn) {
        hideBtn.setAttribute("aria-expanded", hidden ? "false" : "true");
    }
    if (reopenBtn) {
        reopenBtn.classList.toggle("hidden", !hidden);
    }

    try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, hidden ? "1" : "0");
    } catch (_) {
        /* ignore */
    }
}

(function initSidebarToggle() {
    const hideBtn = document.getElementById("sidebar-hide-btn");
    const reopenBtn = document.getElementById("sidebar-reopen");
    if (!hideBtn || !reopenBtn) return;

    hideBtn.addEventListener("click", () => setSidebarHidden(true));
    reopenBtn.addEventListener("click", () => setSidebarHidden(false));

    let storedHidden = false;
    try {
        storedHidden = localStorage.getItem(SIDEBAR_STORAGE_KEY) === "1";
    } catch (_) {
        storedHidden = false;
    }
    setSidebarHidden(storedHidden);
})();