const SUPABASE_URL = 'https://pwqkpeykjyujhnreleax.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3cWtwZXlranl1amhucmVsZWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyMzgxNDgsImV4cCI6MjA5ODgxNDE0OH0.6u2CKOPHcMtVeA2ph0QWTqgtvs-4BQJpsz6v2kCyOEY'; 

const NAMA_TABEL_TOKEN_ANDA = 'tokens'; 
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener("DOMContentLoaded", () => {
    // Cek apakah admin sudah login sebelumnya di sesi ini
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

    // Memeriksa langsung ke tabel admin_config apakah ada password yang cocok
    const { data, error } = await supabaseClient
        .from('admin_config')
        .select('id')
        .eq('password', passwordInput);

    if (error) {
        alert("Gagal memverifikasi keamanan: " + error.message);
        return;
    }

    if (data && data.length > 0) {
        // Simpan status login di session browser
        sessionStorage.setItem("admin_logged_in", "true");
        bukaAksesAdmin();
    } else {
        alert("[!] ACCESS DENIED: PASSWORD SALAH ATAU KUNCI DEKRIPSI INVALID.");
    }
}

function bukaAksesAdmin() {
    document.getElementById('login-panel').style.display = 'none';
    document.getElementById('main-content').style.display = 'grid';
    loadTokens();
    loadPort();
}

// ================= LOGIKA TABEL TOKEN =================
async function loadTokens() {
    const tbody = document.getElementById('token-table-body');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:var(--info-neon);">CONNECTING TO NODE...</td></tr>`;

    const { data, error } = await supabaseClient.from(NAMA_TABEL_TOKEN_ANDA).select('*');
    
    if (error) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" style="text-align:center; color:var(--danger-neon); padding:20px;">
                    [!] DATABASE ERROR: ${error.message.toUpperCase()}
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = "";

    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#435c4b; padding:20px;">Tidak ada token aktif di database.</td></tr>`;
        return;
    }

    data.forEach(row => {
        tbody.innerHTML += `
            <tr>
                <td><code>${row.token_key || '-'}</code></td>
                <td><code>${row.technician_ip || '-'}</code></td>
                <td><button class="btn btn-disconnect" onclick="hapusToken('${row.id}')">[X]</button></td>
            </tr>
        `;
    });
}

async function tambahToken() {
    const token = document.getElementById('new-token').value.trim();
    const ip = document.getElementById('new-ip').value.trim();

    if (!token || !ip) {
        alert("Token dan IP tidak boleh kosong!");
        return;
    }

    const { error } = await supabaseClient
        .from(NAMA_TABEL_TOKEN_ANDA)
        .insert([{ token_key: token, technician_ip: ip }]);

    if (error) {
        alert("Gagal menambahkan token: " + error.message);
    } else {
        alert("Token baru berhasil di-inject!");
        document.getElementById('new-token').value = "";
        document.getElementById('new-ip').value = "";
        loadTokens();
    }
}

async function hapusToken(id) {
    if (!confirm("Hapus token ini dari database?")) return;
    
    const { error } = await supabaseClient.from(NAMA_TABEL_TOKEN_ANDA).delete().eq('id', id);
    if (error) {
        alert("Gagal menghapus: " + error.message);
    } else {
        loadTokens();
    }
}

// ================= LOGIKA TABEL PORT =================
async function loadPort() {
    const { data, error } = await supabaseClient
        .from('ports')
        .select('port_number')
        .eq('port_name', 'usb_remote')
        .single();

    if (error) {
        console.error("Gagal load port:", error.message);
        document.getElementById('current-port-value').placeholder = "Gagal memuat port";
        return;
    }

    if (data) {
        document.getElementById('current-port-value').value = data.port_number;
    }
}

async function updatePort() {
    const portBaru = document.getElementById('current-port-value').value.trim();

    if (!portBaru) {
        alert("Nomor port tidak boleh kosong!");
        return;
    }

    const { error } = await supabaseClient
        .from('ports')
        .update({ port_number: parseInt(portBaru) })
        .eq('port_name', 'usb_remote');

    if (error) {
        alert("Gagal mengupdate port: " + error.message);
    } else {
        alert("Port eksternal 'usb_remote' berhasil diperbarui!");
        loadPort();
    }
}
