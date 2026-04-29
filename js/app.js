const ERROR_BITS = [
    { n: "Calibration error", d: "Faulty calibration detected", t: "err" },
    { n: "Electronic settings error", d: "Faulty electronic calibration/settings", t: "err" },
    { n: "Cleaning error", d: "Error in cleaning cycle detected", t: "err" },
    { n: "Measuring module error", d: "Error in measuring module detected", t: "err" },
    { n: "System initialization", d: "Inconsistent settings detected, reset to factory settings", t: "err" },
    { n: "Hardware error", d: "Faulty hardware detected", t: "err" },
    { n: "Internal communication error", d: "Internal communication error detected", t: "err" },
    { n: "Humidity error", d: "Excessive humidity detected", t: "err" },
    { n: "Excessive temperature", d: "Excessive temperature detected", t: "err" },
    { n: "(Reserved)", d: "Bit 9 — not assigned", t: "" },
    { n: "Sample feed warning", d: "Error in sample feed detected", t: "warn" },
    { n: "Questionable calibration warning", d: "Accuracy of previous calibration inadequate", t: "warn" },
    { n: "Questionable measurement warning", d: "Accuracy of previous measurement inadequate/out of range", t: "warn" },
    { n: "Safety warning", d: "Safety equipment error detected", t: "warn" },
    { n: "Reagent warning", d: "Reagent warning, fill level below minimum detected", t: "warn" },
    { n: "Service request warning", d: "Service request detected", t: "warn" }
];

const STATUS_BITS = [
    { n: "Calibration activated", d: "Calibration in progress, measurement value not up to date", t: "warn" },
    { n: "Cleaning activated", d: "Cleaning in progress, measurement value not up to date", t: "warn" },
    { n: "Service mode activated", d: 'Device in "Service" mode, measurement value not up to date', t: "warn" },
    { n: "General error message", d: "General error detected, refer to error text for details", t: "err" },
    { n: "Ch0 — poor quality", d: "Measurement accuracy is not within specified limits", t: "warn" },
    { n: "Ch0 — range short-fall", d: "Measurement value falls short of the specified range", t: "warn" },
    { n: "Ch0 — range exceeded", d: "Measurement value exceeds the specified range", t: "err" },
    { n: "Ch1 — poor quality", d: "Measurement accuracy is not within specified limits", t: "warn" },
    { n: "Ch1 — range short-fall", d: "Measurement value falls short of the specified range", t: "warn" },
    { n: "Ch1 — range exceeded", d: "Measurement value exceeds the specified range", t: "err" },
    { n: "Ch2 — poor quality", d: "Measurement accuracy is not within specified limits", t: "warn" },
    { n: "Ch2 — range short-fall", d: "Measurement value falls short of the specified range", t: "warn" },
    { n: "Ch2 — range exceeded", d: "Measurement value exceeds the specified range", t: "err" },
    { n: "Ch3 — poor quality", d: "Measurement accuracy is not within specified limits", t: "warn" },
    { n: "Ch3 — range short-fall", d: "Measurement value falls short of the specified range", t: "warn" },
    { n: "Ch3 — range exceeded", d: "Measurement value exceeds the specified range", t: "err" }
];

let reg = 'error';
let value = 0;
let err_value = 0;
let status_value = 0;


function getBits() {
    return reg === 'error' ? ERROR_BITS : STATUS_BITS;
}

function switchReg(r) {
    reg = r;
    value = reg === 'error' ? err_value : status_value;
    //value = 0;
    document.getElementById('tab-error').classList.toggle('active', r === 'error');
    document.getElementById('tab-status').classList.toggle('active', r === 'status');
    document.getElementById('val-input').value = value === 0 ? '' : String(value);
    document.getElementById('parse-err').textContent = '';
    resetSummary();
    render();
}

function onInput() {
    const raw = document.getElementById('val-input').value.trim();
    const err = document.getElementById('parse-err');
    if (!raw) {
        value = 0;
        err.textContent = '';
        resetSummary();
        render();
        return;
    }
    let v;
    if (/^0x/i.test(raw)) {
        v = parseInt(raw, 16);
    } else if (/^0b/i.test(raw)) {
        v = parseInt(raw.slice(2), 2);
    } else {
        v = parseInt(raw, 10);
    }
    if (isNaN(v) || v < 0 || v > 65535) {
        err.textContent = 'Enter a value 0–65535, 0x0000–0xFFFF, or 0b…';
        return;
    }
    err.textContent = '';
    value = v;
    if (reg === 'error') {
        err_value = value;
    } else {
        status_value = value;
    }
    resetSummary();
    render();
}

function toggleBit(i) {
    value ^= (1 << i);
    document.getElementById('val-input').value = value === 0 ? '' : String(value);
    resetSummary();
    render();
}

function clearAll() {
    value = 0;
    err_value = 0;
    status_value = 0;
    document.getElementById('val-input').value = '';
    document.getElementById('parse-err').textContent = '';
    resetSummary();
    render();
}

function resetSummary() {
    const st = document.getElementById('summary-text');
    const active = getActiveItems();
    if (active.length === 0) {
        st.textContent = 'No bits active — enter a value above to see the summary.';
    } else {
        st.textContent = generateLocalSummary(active);
    }
}

function fmtBin(v) {
    const s = v.toString(2).padStart(16, '0');
    return s.slice(0, 4) + ' ' + s.slice(4, 8) + ' ' + s.slice(8, 12) + ' ' + s.slice(12);
}

function fmtHex(v) {
    return '0x' + v.toString(16).toUpperCase().padStart(4, '0');
}

function getActiveItems() {
    const bits = getBits();
    const active = [];
    for (let i = 0; i < 16; i++) {
        if (value & (1 << i)) {
            active.push({ bit: i, ...bits[i] });
        }
    }
    return active.reverse();
}

function generateLocalSummary(active) {
    const errors = active.filter(a => a.t === 'err');
    const warnings = active.filter(a => a.t === 'warn');
    const others = active.filter(a => a.t === '');

    const parts = [];
    
    if (errors.length > 0) {
        const names = errors.map(e => e.n).join(', ');
        parts.push(`Errors: ${names}`);
    }
    
    if (warnings.length > 0) {
        const names = warnings.map(w => w.n).join(', ');
        parts.push(`Warnings: ${names}`);
    }
    
    if (others.length > 0) {
        const names = others.map(o => o.n).join(', ');
        parts.push(`Other: ${names}`);
    }
    
    return parts.join(' | ');
}

function render() {
    document.getElementById('vc-dec').textContent = value;
    document.getElementById('vc-hex').textContent = fmtHex(value);
    document.getElementById('vc-bin').textContent = fmtBin(value);
    
    const bits = getBits();
    const grid = document.getElementById('bits-grid');
    grid.innerHTML = '';
    
    for (let i = 15; i >= 0; i--) {
        const on = !!(value & (1 << i));
        const b = bits[i];
        
        const cell = document.createElement('div');
        cell.className = 'bit-cell' + (on ? ' on' : '');
        cell.onclick = () => toggleBit(i);
        cell.innerHTML = `
            <div class="bit-num">${i}</div>
            <div class="bit-sq"></div>
            <div class="bit-tooltip">${b.n}</div>
        `;
        grid.appendChild(cell);
    }
    
    const list = document.getElementById('active-list');
    list.innerHTML = '';
    
    const active = getActiveItems();
    if (!active.length) {
        list.innerHTML = '<div class="none-msg">No bits set — value is 0x0000</div>';
        return;
    }
    
    active.forEach(({ bit, n, d, t }) => {
        const item = document.createElement('div');
        item.className = 'active-item' + (t === 'err' ? ' err' : t === 'warn' ? ' warn' : '');
        item.innerHTML = `
            <div class="ai-bit">B${bit}</div>
            <div>
                <div class="ai-name">${n}</div>
                <div class="ai-desc">${d}</div>
            </div>
        `;
        list.appendChild(item);
    });
}

function copySummary() {
    const text = document.getElementById('summary-text').textContent;
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.querySelector('.copy-btn');
        btn.textContent = 'Copied';
        setTimeout(() => {
            btn.textContent = 'Copy';
        }, 1500);
    });
}

render();
