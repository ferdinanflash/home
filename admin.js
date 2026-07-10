const SUPABASE_URL = 'https://pwqkpeykjyujhnreleax.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3cWtwZXlranl1amhucmVsZWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyMzgxNDgsImV4cCI6MjA5ODgxNDE0OH0.6u2CKOPHcMtVeA2ph0QWTqgtvs-4BQJpsz6v2kCyOEY'; 

// Sudah disesuaikan langsung dengan tabel di Supabase Anda
const NAMA_TABEL_TOKEN_ANDA = 'tokens'; 

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener("DOMContentLoaded", () => {
    loadTokens();
    loadPort();
});

// ================= LOGIKA TABEL TOKEN =================
async function loadTokens() {
    const { data, error } = await supabase.from(NAMA_TABEL_TOKEN_ANDA).select('*');
    
    if (error) {
        alert("Gagal memuat token: " + error.message);
        return;
    }

    const tbody = document.getElementById('token-table-body');
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

    const { error } = await supabase
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
    
    const { error } = await supabase.from(NAMA_TABEL_TOKEN_ANDA).delete().eq('id', id);
    if (error) {
        alert("Gagal menghapus: " + error.message);
    } else {
        loadTokens();
    }
}

// ================= LOGIKA TABEL PORT =================
async function loadPort() {
    const { data, error } = await supabase
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

    const { error } = await supabase
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
