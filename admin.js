const SUPABASE_URL = 'https://pwqkpeykjyujhnreleax.supabase.co'; 
const SUPABASE_ANON_KEY = 'GANTI_DENGAN_KEY_ANDA'; // Gunakan Service Role Key jika butuh akses penuh (tapi simpan baik-baik!)

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener("DOMContentLoaded", loadData);

async function loadData() {
    // Sesuaikan 'access_tokens' dengan nama tabel Anda
    const { data, error } = await supabase.from('access_tokens').select('*');
    
    const tbody = document.getElementById('admin-table-body');
    tbody.innerHTML = "";

    if (error) return console.error(error);

    data.forEach(row => {
        tbody.innerHTML += `
            <tr>
                <td>${row.token_key}</td>
                <td>${row.technician_ip}</td>
                <td>${row.port_number}</td>
                <td><button class="btn btn-disconnect" onclick="hapusData('${row.id}')">[X]</button></td>
            </tr>
        `;
    });
}

async function tambahData() {
    const token = document.getElementById('new-token').value;
    const ip = document.getElementById('new-ip').value;
    const port = document.getElementById('new-port').value;

    const { error } = await supabase
        .from('access_tokens')
        .insert([{ token_key: token, technician_ip: ip, port_number: port }]);

    if (error) alert("Gagal menambah data!");
    else {
        alert("Data tersimpan!");
        loadData();
    }
}

async function hapusData(id) {
    if (!confirm("Yakin ingin menghapus node ini?")) return;
    
    const { error } = await supabase.from('access_tokens').delete().eq('id', id);
    if (error) alert("Gagal hapus!");
    else loadData();
}
