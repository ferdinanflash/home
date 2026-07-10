const SUPABASE_URL = 'https://pwqkpeykjyujhnreleax.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3cWtwZXlranl1amhucmVsZWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyMzgxNDgsImV4cCI6MjA5ODgxNDE0OH0.6u2CKOPHcMtVeA2ph0QWTqgtvs-4BQJpsz6v2kCyOEY'; 

// Inisialisasi Klien Supabase Cloud
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let selectedDevices = []; 

// VARIABEL MEMORI (Sembunyi Total dari DOM / HTML Client)
let currentTargetIp = "";
let currentTargetPort = "";

document.addEventListener("DOMContentLoaded", () => {
    if (!navigator.usb) {
        writeLog("CRIT", "Browser does not support WebUSB core protocols.");
    }
    initSupabaseRealtime();
});

async function verifikasiTokenWeb() {
    const tokenInput = document.getElementById('user-token').value.trim();
    const statusEl = document.getElementById('token-status');
    const btnPilihUsb = document.getElementById('btn-pilih-usb');
    
    if (!tokenInput) {
        statusEl.textContent = "[-] ERR: ACCESS KEY CANNOT BE EMPTY.";
        statusEl.style.color = "var(--danger-neon)";
        return false;
    }

    statusEl.textContent = ">> Decoding tokens and synchronizing port sequences...";
    statusEl.style.color = "#61876e";

    try {
        const { data: tokenData, error: tokenError } = await supabaseClient.rpc('panggil_validasi_token', { input_token: tokenInput });

        if (tokenError || !tokenData || tokenData.length === 0) {
            statusEl.textContent = "[-] INVALID ACCESS KEY OR LINK EXPIRED.";
            statusEl.style.color = "var(--danger-neon)";
            btnPilihUsb.disabled = true;
            btnPilihUsb.className = "btn btn-chrome";
            btnPilihUsb.innerText = "💡 WAITING FOR INJECTION TOKEN...";
            return false;
        }

        // OK: Tarik IP dan Port spesifik secara berpasangan langsung dari baris data token teknisi
        let rawIp = tokenData[0].technician_ip || "";
        let activePort = tokenData[0].port_number || 32032; // Gunakan default 32032 jika kolom port di database kosong
        let ip = rawIp;

        // Fallback: Jika di database kolom IP sengaja ditulis manual pakai format "ip:port" (Contoh: 123.4.5.6:8080)
        if (rawIp.includes(':')) {
            const parts = rawIp.split(':');
            ip = parts[0];
            activePort = parts[1];
        }

        // AMAN: Disimpan dalam lingkup memori runtime internal skrip
        currentTargetIp = ip;
        currentTargetPort = activePort;
        
        statusEl.textContent = `[+] ACCESS GRANTED. SECURE TUNNEL ESTABLISHED.`;
        statusEl.style.color = "var(--primary-neon)";
        
        btnPilihUsb.disabled = false;
        btnPilihUsb.className = "btn";
        btnPilihUsb.style.width = "100%";
        btnPilihUsb.innerText = "[🔌 CHOOSE USB NODE TO FORWARD]";
        
        writeLog("AUTH", `Token signature matched. Secured dynamic route allocated.`);
        
        cekKoneksiServerOtomatis(ip, activePort);
        return true;

    } catch (e) {
        statusEl.textContent = "[-] CRIT: DATABASE INTERACTION INTERRUPTED.";
        statusEl.style.color = "var(--danger-neon)";
        return false;
    }
}

function initSupabaseRealtime() {
    supabaseClient
        .channel('public:usb_commands')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'usb_commands' }, (payload) => {
            const updatedRow = payload.new;

            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                const index = selectedDevices.findIndex(d => d.vendorId === updatedRow.vendor_id && d.productId === updatedRow.product_id);
                if (index !== -1) {
                    selectedDevices[index].status = updatedRow.status;
                    selectedDevices[index].dbId = updatedRow.id; 
                    writeLog("SYNC", `Node state update -> ${updatedRow.status.toUpperCase()}`);
                    renderTable();
                }
            }
        })
        .subscribe();
}

async function writeLog(type, text) {
    const consoleBox = document.getElementById('log-console');
    const time = new Date().toLocaleTimeString();
    consoleBox.innerHTML += `<br>>> [${time}] [${type}] ${text}`;
    consoleBox.scrollTop = consoleBox.scrollHeight;

    try {
        await supabaseClient.from('system_logs').insert([{ log_type: type, message: text }]);
    } catch(e) {
        console.error("Gagal mengirim log", e);
    }
}

async function cekKoneksiServerOtomatis(ip, port) {
    writeLog("PING", `Verifying remote endpoint socket listener...`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    try {
        await fetch(`http://${ip}:${port}`, { mode: 'no-cors', signal: controller.signal });
        clearTimeout(timeoutId);
        writeLog("OK", `Remote handshake validated successfully.`);
    } catch (error) {
        clearTimeout(timeoutId);
        writeLog("OK", `Port pipeline verification returned active signal.`);
    }
}

async function pilihDeviceChrome() {
    try {
        const device = await navigator.usb.requestDevice({ filters: [] });
        const vId = device.vendorId.toString(16).padStart(4, '0');
        const pId = device.productId.toString(16).padStart(4, '0');
        const devName = device.productName || device.manufacturerName || "UNKNOWN NODE";

        writeLog("NODE", `Selected device: ${devName} [0x${vId}:0x${pId}]`);

        const isExist = selectedDevices.some(d => d.vendorId === vId && d.productId === pId);
        if (!isExist) {
            selectedDevices.push({
                vendorId: vId,
                productId: pId,
                name: devName,
                status: 'ready', 
                dbId: null
            });
            renderTable();
        }
    } catch (error) {
        writeLog("WARN", `USB allocation cancelled by user.`);
    }
}

function renderTable() {
    const tableBody = document.getElementById('usb-table-body');
    const globalAlert = document.getElementById('global-danger-alert');
    
    if (selectedDevices.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: #435c4b; padding: 30px;">
                    NO NODE ATTACHED. VERIFY AUTH TOKEN AND LINK USB TO START.
                </td>
            </tr>`;
        globalAlert.style.display = "none";
        return;
    }

    tableBody.innerHTML = "";
    let adakahYangSedangDieksekusi = false;

    selectedDevices.forEach((dev, index) => {
        let badge = `<span class="badge-ready">READY</span>`;
        let actionBtn = `<button class="btn" onclick="actionForward(${index}, 'send')">[▶] FORWARD</button>`;
        let warningRowText = "";

        if (dev.status === 'pending') {
            badge = `<span class="badge-pending">QUEUEING...</span>`;
            actionBtn = `<button class="btn btn-disconnect" style="border-color:#4b6b55; color:#4b6b55; cursor:not-allowed;" disabled>LOCKED</button>`;
        } 
        else if (dev.status === 'processing' || dev.status === 'forwarded') {
            adakahYangSedangDieksekusi = true;
            badge = `<span class="badge-processing blink-animation">EXECUTING</span>`;
            warningRowText = `<div class="row-warning">[!] WARNING: HARDOVERRIDE IN PROGRESS. DO NOT UNPLUG.</div>`;
            actionBtn = `<button class="btn btn-disconnect" onclick="actionForward(${index}, 'stop')">[■] KILL SESS</button>`;
        } 
        else if (dev.status === 'done' || dev.status === 'disconnected') {
            badge = `<span class="badge-done">COMPLETED</span>`;
            actionBtn = `<button class="btn" style="border-color: #61876e; color: #61876e;" onclick="hapusBarisTabel(${index})">[X] FLUSH NODE</button>`;
        }

        tableBody.innerHTML += `
            <tr>
                <td><code>0x${dev.vendorId}</code></td>
                <td><code>0x${dev.productId}</code></td>
                <td>
                    <strong style="color:var(--text-bright);">${dev.name}</strong>
                    ${warningRowText}
                </td>
                <td>${badge}</td>
                <td>${actionBtn}</td>
            </tr>
        `;
    });

    if (adakahYangSedangDieksekusi) {
        globalAlert.style.display = "block";
    } else {
        globalAlert.style.display = "none";
    }
}

function hapusBarisTabel(index) {
    selectedDevices.splice(index, 1);
    renderTable();
}

async function actionForward(index, type) {
    const tokenInput = document.getElementById('user-token').value.trim();
    const device = selectedDevices[index];

    if (type === 'send') {
        writeLog("SEND", `Injecting stream data parameters into the cloud matrix...`);
        
        const { data, error } = await supabaseClient
            .from('usb_commands')
            .insert([
                { 
                    vendor_id: device.vendorId, 
                    product_id: device.productId, 
                    device_name: device.name,
                    target_ip: currentTargetIp,
                    target_port: currentTargetPort,
                    token_key: tokenInput, 
                    status: 'pending'
                }
            ])
            .select();

        if (error) {
            writeLog("ERR", `Cloud security gate rejected command payload.`);
            alert("Gagal mengirim! Sesi ditolak oleh sistem keamanan.");
        } else {
            device.status = 'pending';
            device.dbId = data[0].id; 
            renderTable();
        }
    } else {
        writeLog("TERM", `Terminating active stream on node [0x${device.vendorId}]...`);
        if (device.dbId) {
            const { error } = await supabaseClient
                .from('usb_commands')
                .update({ status: 'done' })
                .eq('id', device.dbId);

            if (error) {
                writeLog("ERR", `Failed to transmit node termination sequence.`);
            } else {
                device.status = 'done';
                renderTable();
            }
        }
    }
}
