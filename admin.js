const SUPABASE_URL = 'https://pwqkpeykjyujhnreleax.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3cWtwZXlranl1amhucmVsZWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyMzgxNDgsImV4cCI6MjA5ODgxNDE0OH0.6u2CKOPHcMtVeA2ph0QWTqgtvs-4BQJpsz6v2kCyOEY'; 

const NAMA_TABEL_TOKEN_ANDA = 'tokens'; 
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener("DOMContentLoaded", () => {
    if (sessionStorage.getItem("admin_logged_in") === "true") {
        bukaAksesAdmin();
    }
});

// ================= LOGIKA AUTENTIKASI ADMIN =================
async function loginAdmin() {
    const passwordInput = document.getElementById('admin-password').value.trim();

    if (!passwordInput) {
        alert("Password wajib diisi!");
        return;
    }

    const { data, error } = await supabaseClient
        .from('admin_config')
        .select('id')
        .eq('password', passwordInput);

    if (error) {
        alert("Gagal memverifikasi keamanan: " + error.message);
        return;
    }

    if (data && data.length > 0) {
        sessionStorage.setItem("admin_logged_in", "true");
        bukaAksesAdmin();
    } else {
        alert("[!] ACCESS DENIED: PASSWORD SALAH.");
    }
}

function bukaAksesAdmin() {
    document.getElementById('login-panel').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
    loadTokens();
}

// ================= LOGIKA MANAGEMENT NODE (TOKEN, IP, PORT) =================
async function loadTokens() {
    const tbody = document.getElementById('token-table-body');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--info-neon);">CONNECTING TO NODE...</td></tr>`;

    const { data, error } = await supabaseClient.from(NAMA_TABEL_TOKEN_ANDA).select('*').order('id', { ascending: true });
    
    if (error) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--danger-neon); padding:20px;">[!] DATABASE ERROR: ${error.message.toUpperCase()}</td></tr>`;
        return;
    }

    tbody.innerHTML = "";

    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#435c4b; padding:20px;">Tidak ada konfigurasi aktif.</td></tr>`;
        return;
    }

    data.forEach(row => {
        tbody.innerHTML += `
            <tr>
                <td><code class="copy-click" title="Klik untuk salin" onclick="salinTeksKeClipboard(this)">${row.token_key || '-'}</code></td>
                <td><code class="copy-click" title="Klik untuk salin" onclick="salinTeksKeClipboard(this)">${row.technician_ip || '-'}</code></td>
                <td><code class="copy-click" style="color:var(--info-neon);" title="Klik untuk salin" onclick="salinTeksKeClipboard(this)">${row.port_number || '-'}</code></td>
                <td><button class="btn btn-disconnect" onclick="hapusToken('${row.id}')">[X]</button></td>
            </tr>
        `;
    });
}

// ================= UTILITY: AUTO COPY TO CLIPBOARD =================
function salinTeksKeClipboard(elemen) {
    const teks = elemen.innerText;
    if (teks === "-") return; // Abaikan jika kosong/strip

    navigator.clipboard.writeText(teks).then(() => {
        // Efek visual feedback kilat warna hijau terang saat berhasil disalin
        const warnaAsli = elemen.style.color;
        elemen.style.color = "#00ff00";
        elemen.style.textShadow = "0 0 10px #00ff00";
        
        // Kembalikan ke tampilan normal setelah 500ms
        setTimeout(() => {
            elemen.style.color = warnaAsli;
            elemen.style.textShadow = "none";
        }, 500);
    }).catch(err => {
        console.error("Gagal menyalin teks: ", err);
    });
}


async function tambahToken() {
    const token = document.getElementById('new-token').value.trim();
    const ip = document.getElementById('new-ip').value.trim();
    const port = document.getElementById('new-port').value.trim();

    if (!token || !ip || !port) {
        alert("Semua kolom (Token, IP, dan Port) wajib diisi!");
        return;
    }

    const { error } = await supabaseClient
        .from(NAMA_TABEL_TOKEN_ANDA)
        .insert([{ token_key: token, technician_ip: ip, port_number: parseInt(port) }]);

    if (error) {
        alert("Gagal menambahkan data: " + error.message);
    } else {
        alert("Node baru berhasil di-inject ke database!");
        document.getElementById('new-token').value = "";
        document.getElementById('new-ip').value = "";
        document.getElementById('new-port').value = "";
        loadTokens();
    }
}

async function hapusToken(id) {
    if (!confirm("Hapus seluruh konfigurasi node ini?")) return;
    
    const { error } = await supabaseClient.from(NAMA_TABEL_TOKEN_ANDA).delete().eq('id', id);
    if (error) {
        alert("Gagal menghapus: " + error.message);
    } else {
        loadTokens();
    }
}
// ================= UTILITY: GENERATE RANDOM TOKEN WITH DASH =================
function generateRandomToken() {
    const karakter = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let hasilToken = 'BTM-';
    
    // Generate 15 karakter acak dengan pemisah strip setiap 5 karakter
    for (let i = 0; i < 10; i++) {
        // Jika sudah mencapai 5 karakter pertama atau kedua (indeks ke-5 dan ke-10), tambahkan strip
        if (i > 0 && i % 5 === 0) {
            hasilToken += '-';
        }
        
        const indexAcak = Math.floor(Math.random() * karakter.length);
        hasilToken += karakter.charAt(indexAcak);
    }
    
    // Masukkan hasil ke dalam input field token
    document.getElementById('new-token').value = hasilToken;
}
