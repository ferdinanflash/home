document.addEventListener("DOMContentLoaded", function () {
    
    // ==========================================
    // 1. ROTASI OTOMATIS CAROUSEL BRAND BRAND (2 DETIK)
    // ==========================================
    const groups = document.querySelectorAll('.brand-group');
    let currentGroupIndex = 0;

    if (groups.length > 0) {
        setInterval(() => {
            groups[currentGroupIndex].classList.remove('active');
            currentGroupIndex = (currentGroupIndex + 1) % groups.length;
            groups[currentGroupIndex].classList.add('active');
        }, 2000);
    }

    // ==========================================
    // 2. OTOMATISASI STATUS LED & HARGA LAYANAN
    // ==========================================
    const statusRows = document.querySelectorAll('.status-row');

    statusRows.forEach(row => {
        const ledSpan = row.querySelector('.led');
        const textSpan = row.querySelector('.status-text');
        const priceDiv = row.closest('.card').querySelector('.price');
        
        if (ledSpan && textSpan) {
            const statusValue = textSpan.textContent.trim().toUpperCase();

            ledSpan.className = 'led';
            textSpan.className = 'status-text';

            if (statusValue === "ONLINE") {
                ledSpan.classList.add('online');
                textSpan.classList.add('online');
                if (priceDiv) priceDiv.style.display = 'block'; 
            } else if (statusValue === "OFFLINE") {
                ledSpan.classList.add('offline');
                textSpan.classList.add('offline');
                if (priceDiv) priceDiv.style.display = 'none'; 
            }
        }
    });

    // ==========================================
    // 3. EFEK BUTIRAN SALJU JATUH
    // ==========================================
    function createSnowflake() {
        const snowContainer = document.getElementById('snow');
        if (!snowContainer) return;

        const snowflake = document.createElement('div');
        snowflake.innerHTML = '❄'; 
        snowflake.classList.add('snowflake');
        
        snowflake.style.left = Math.random() * 100 + 'vw';
        snowflake.style.fontSize = Math.random() * 15 + 10 + 'px';
        
        const duration = Math.random() * 5 + 5;
        snowflake.style.animationDuration = duration + 's';
        snowflake.style.opacity = Math.random() * 0.7 + 0.3;
        
        snowContainer.appendChild(snowflake);
        
        setTimeout(() => {
            snowflake.remove();
        }, duration * 500);
    }

    setInterval(createSnowflake, 600);

    // ==========================================
    // 4. SECURITY: MATIKAN KLIK KANAN & INSPECT ELEMENT
    // ==========================================
    document.addEventListener('contextmenu', event => event.preventDefault());

    document.onkeydown = function(e) {
        if (e.keyCode == 123) { return false; } 
        if (e.ctrlKey && e.shiftKey && e.keyCode == 'I'.charCodeAt(0)) { return false; }
        if (e.ctrlKey && e.shiftKey && e.keyCode == 'C'.charCodeAt(0)) { return false; }
        if (e.ctrlKey && e.keyCode == 'U'.charCodeAt(0)) { return false; } 
    };
});

// ==========================================
// 5. GOOGLE YOUTUBE IFRAME PLAYER (KODE ASLI)
// ==========================================
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var player;
function onYouTubeIframeAPIReady() {
    player = new YT.Player('yt-background-player', {
        height: '0',
        width: '0',
        videoId: 'bv42PtcwA3Y', 
        playerVars: {
            'autoplay': 1,
            'controls': 0,
            'disablekb': 1,
            'hl': 'id',
            'loop': 1,
            'playlist': 'bv42PtcwA3Y' 
        },
        events: {
            'onReady': onPlayerReady
        }
    });
}

function onPlayerReady(event) {
    player.setVolume(20);
    
    // Fungsi pemicu putar musik asli
    function triggerMusic() {
        if (player && typeof player.playVideo === 'function') {
            player.playVideo();
        }
        window.removeEventListener('click', triggerMusic);
        window.removeEventListener('touchstart', triggerMusic);
    }

    // Jalankan musik begitu ada klik (PC) atau sentuhan pertama (HP)
    window.addEventListener('click', triggerMusic, { once: true });
    window.addEventListener('touchstart', triggerMusic, { once: true });
}
