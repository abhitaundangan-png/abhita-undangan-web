import { auth, db, secondaryAuth, onAuthStateChanged, signOut, createUserWithEmailAndPassword, doc, setDoc, getDoc, collection, getDocs, updateDoc } from './fb.js';

const ADMIN_EMAIL = 'abhitaundangan@gmail.com';

// ===============================================================
// EXPOSE TO WINDOW FOR HTML ONCLICK
// ===============================================================
window.switchTab = switchTab;
window.saveAllData = saveAllData;
window.handlePhotoUpload = handlePhotoUpload;
window.clearPhoto = clearPhoto;
window.triggerGalleryUpload = triggerGalleryUpload;
window.handleGalleryUpload = handleGalleryUpload;
window.removeGalleryItem = removeGalleryItem;
window.generateLink = generateLink;
window.copyShareLink = copyShareLink;
window.sendWhatsApp = sendWhatsApp;
window.testLink = testLink;
window.logoutAdmin = logoutAdmin;

// ===============================================================
// KONFIGURASI TEMA
// ===============================================================
const TEMA_CONFIG = {
    'green': {
        label: 'Green (Sage & Gold)',
        dataKey: 'undangan_green',
        tamuKey: 'tamu_green',
        hasKado: true,
        path: 'Tema/Green/index.html',
        defaults: {
            mempelai_pria: { nama_lengkap:'Alvin Yudha Pratama', nama_panggilan:'Alvin', orang_tua:'Bpk. Muhammad Syaifudin & Ibu Stianingsih', ket:'Putra dari', instagram:'@alvin', link_instagram:'#', alamat:'Kudu Baru RT 07 RW 07, Genuk, Semarang', foto:null },
            mempelai_wanita: { nama_lengkap:'Dian Khoirun Nisa', nama_panggilan:'Dian', orang_tua:'Bpk. Mahmudi (Alm) & Ibu Mufadlun', ket:'Putri dari', instagram:'@dian', link_instagram:'#', alamat:'Tlogoboyo RT 04 RW 04, Boyolangu, Bonang, Demak', foto:null },
            waktu: { tanggal_tampil:'Minggu, 20 September 2026', countdown_target:'2026-09-20T08:00:00' },
            akad: { tanggal:'Minggu, 20 September 2026', waktu:'08.00 WIB - Selesai', tempat:'Kediaman Mempelai Wanita', alamat:'Tlogoboyo RT 04 RW 04, Boyolangu, Bonang, Demak', maps_url:'' },
            resepsi: { tanggal:'Minggu, 20 September 2026', waktu:'08.00 WIB - Selesai', tempat:'Lokasi Resepsi', alamat:'Tlogoboyo RT 04 RW 04, Boyolangu, Bonang, Demak', maps_url:'' },
            kado: { rek1:{ bank:'BCA', nomor:'1234567890', atas_nama:'Dian Khoirun Nisa' }, rek2:{ bank:'DANA', nomor:'081234567890', atas_nama:'Alvin Yudha Pratama' } },
            galeri: ['assets/gallery/Galeri (1).jpg','assets/gallery/Galeri (2).jpg','assets/gallery/Galeri (3).jpg','assets/gallery/Galeri (4).jpg','assets/gallery/Galeri (5).jpg','assets/gallery/Galeri (6).jpg']
        }
    },
    'flora-pink': {
        label: 'Flora Pink',
        dataKey: 'undangan_flora-pink',
        tamuKey: 'tamu_flora-pink',
        hasKado: true,
        path: 'Tema/Flora Pink/index.html',
        defaults: {
            mempelai_pria: { nama_lengkap:'Raditya Pratama, S.T.', nama_panggilan:'Raditya', orang_tua:'Bapak Ahmad Pratama & Ibu Siti Aminah', ket:'Putra Pertama dari', instagram:'@radityaprtm', link_instagram:'https://instagram.com/radityaprtm', alamat:'', foto:null },
            mempelai_wanita: { nama_lengkap:'Kirana Larasati, S.E.', nama_panggilan:'Kirana', orang_tua:'Bapak Budi Santoso & Ibu Ratna Sari', ket:'Putri Kedua dari', instagram:'@kiranalaras', link_instagram:'https://instagram.com/kiranalaras', alamat:'', foto:null },
            waktu: { tanggal_tampil:'Sabtu, 25 Juli 2026', countdown_target:'2026-07-25T08:00:00' },
            akad: { tanggal:'Sabtu, 25 Juli 2026', waktu:'08.00 WIB - Selesai', tempat:'Masjid Agung Al-Falah', alamat:'Jl. Bunga Mawar No. 12, Kebayoran Baru, Jakarta Selatan', maps_url:'https://maps.google.com' },
            resepsi: { tanggal:'Sabtu, 25 Juli 2026', waktu:'11.00 - 14.00 WIB', tempat:'Grand Ballroom Serbaguna', alamat:'Jl. Bunga Mawar No. 15, Kebayoran Baru, Jakarta Selatan', maps_url:'https://maps.google.com' },
            kado: { rek1:{ bank:'BCA', nomor:'1234567890', atas_nama:'Kirana Larasati' }, rek2:{ bank:'DANA', nomor:'081234567890', atas_nama:'Raditya Pratama' } },
            galeri: ['assets/gallery/1.jpg','assets/gallery/2.jpg','assets/gallery/3.jpg','assets/gallery/4.jpg','assets/gallery/5.jpg']
        }
    }
};

let currentData = {};
let galleryData = [];
let currentUser = null;
let currentConfig = null;

// ===============================================================
// AUTHENTICATION & INIT
// ===============================================================
function showPage() {
    document.body.style.visibility = 'visible';
    const guard = document.getElementById('auth-guard');
    if (guard) guard.style.display = 'none';
}

function redirectToLogin() {
    sessionStorage.setItem('auth_redirect', window.location.href);
    window.location.replace('login.html');
}

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        redirectToLogin();
        return;
    }
    
    currentUser = user;
    
    // Cek di Firestore untuk info user (jika bukan master admin yang baru dibuat)
    let userDocData = null;
    try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            userDocData = userDoc.data();
            if (userDocData.isActive === false) {
                await signOut(auth);
                alert("Akses Anda telah dicabut.");
                redirectToLogin();
                return;
            }
        }
    } catch(e) {}

    const isAdmin = (user.email === ADMIN_EMAIL);
    
    if (isAdmin) {
        document.getElementById('tab-btn-klien').classList.remove('hidden');
        loadClientList();
    }

    // Determine Theme
    const params = new URLSearchParams(window.location.search);
    let temaId = params.get('tema') || (userDocData ? userDocData.tema : 'green');
    currentConfig = TEMA_CONFIG[temaId] || TEMA_CONFIG['green'];

    document.getElementById('page-title').textContent = 'Editor: ' + currentConfig.label;
    document.getElementById('page-subtitle').textContent = 'Klien: ' + user.email;
    document.title = 'Editor ' + currentConfig.label + ' | Abhita Undangan';
    document.getElementById('preview-btn').href = currentConfig.path + '?client=' + user.uid;
    document.getElementById('link-preview-direct').href = currentConfig.path + '?client=' + user.uid;

    if (!currentConfig.hasKado) {
        document.getElementById('kado-unavailable').classList.remove('hidden');
        document.getElementById('kado-available').classList.add('hidden');
    }

    await loadData();
    renderGalleryGrid();

    // Tampilkan halaman HANYA setelah semua data siap
    showPage();
});

// ===============================================================
// DATA MANAGEMENT
// ===============================================================
async function loadData() {
    try {
        const docSnap = await getDoc(doc(db, "invitations", currentUser.uid));
        if (docSnap.exists()) {
            currentData = deepMerge(JSON.parse(JSON.stringify(currentConfig.defaults)), docSnap.data());
        } else {
            currentData = JSON.parse(JSON.stringify(currentConfig.defaults));
        }
    } catch (e) {
        console.error(e);
        currentData = JSON.parse(JSON.stringify(currentConfig.defaults));
    }

    // Gallery (Untuk sementara disimpan di document Firestore sebagai base64 string, batasi ukurannya via resize)
    galleryData = currentData.galeri || [];
    
    fillFormFields();
    loadPhotoPreview('pria', currentData.mempelai_pria.foto);
    loadPhotoPreview('wanita', currentData.mempelai_wanita.foto);
}

function deepMerge(target, source) {
    for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            if (!target[key]) target[key] = {};
            deepMerge(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    }
    return target;
}

function fillFormFields() {
    const d = currentData;
    setValue('f-pria-nama', d.mempelai_pria?.nama_lengkap);
    setValue('f-pria-panggilan', d.mempelai_pria?.nama_panggilan);
    setValue('f-pria-ortu', d.mempelai_pria?.orang_tua);
    setValue('f-pria-ket', d.mempelai_pria?.ket);
    setValue('f-pria-ig', d.mempelai_pria?.instagram);
    setValue('f-pria-ig-url', d.mempelai_pria?.link_instagram);
    setValue('f-pria-alamat', d.mempelai_pria?.alamat);
    setValue('f-wanita-nama', d.mempelai_wanita?.nama_lengkap);
    setValue('f-wanita-panggilan', d.mempelai_wanita?.nama_panggilan);
    setValue('f-wanita-ortu', d.mempelai_wanita?.orang_tua);
    setValue('f-wanita-ket', d.mempelai_wanita?.ket);
    setValue('f-wanita-ig', d.mempelai_wanita?.instagram);
    setValue('f-wanita-ig-url', d.mempelai_wanita?.link_instagram);
    setValue('f-wanita-alamat', d.mempelai_wanita?.alamat);
    setValue('f-tanggal-tampil', d.waktu?.tanggal_tampil);
    const ct = d.waktu?.countdown_target;
    if (ct) setValue('f-countdown-target', ct.substring(0,16));
    setValue('f-akad-tanggal', d.akad?.tanggal);
    setValue('f-akad-waktu', d.akad?.waktu);
    setValue('f-akad-tempat', d.akad?.tempat);
    setValue('f-akad-alamat', d.akad?.alamat);
    setValue('f-akad-maps', d.akad?.maps_url);
    setValue('f-resepsi-tanggal', d.resepsi?.tanggal);
    setValue('f-resepsi-waktu', d.resepsi?.waktu);
    setValue('f-resepsi-tempat', d.resepsi?.tempat);
    setValue('f-resepsi-alamat', d.resepsi?.alamat);
    setValue('f-resepsi-maps', d.resepsi?.maps_url);
    if (d.kado) {
        setValue('f-rek1-bank', d.kado?.rek1?.bank);
        setValue('f-rek1-nomor', d.kado?.rek1?.nomor);
        setValue('f-rek1-nama', d.kado?.rek1?.atas_nama);
        setValue('f-rek2-bank', d.kado?.rek2?.bank);
        setValue('f-rek2-nomor', d.kado?.rek2?.nomor);
        setValue('f-rek2-nama', d.kado?.rek2?.atas_nama);
    }
}

function setValue(id, val) {
    const el = document.getElementById(id);
    if (el && val !== null && val !== undefined) el.value = val;
}

function collectFormData() {
    return {
        mempelai_pria: {
            nama_lengkap: getVal('f-pria-nama'),
            nama_panggilan: getVal('f-pria-panggilan'),
            orang_tua: getVal('f-pria-ortu'),
            ket: getVal('f-pria-ket'),
            instagram: getVal('f-pria-ig'),
            link_instagram: getVal('f-pria-ig-url'),
            alamat: getVal('f-pria-alamat'),
            foto: currentData.mempelai_pria?.foto || null
        },
        mempelai_wanita: {
            nama_lengkap: getVal('f-wanita-nama'),
            nama_panggilan: getVal('f-wanita-panggilan'),
            orang_tua: getVal('f-wanita-ortu'),
            ket: getVal('f-wanita-ket'),
            instagram: getVal('f-wanita-ig'),
            link_instagram: getVal('f-wanita-ig-url'),
            alamat: getVal('f-wanita-alamat'),
            foto: currentData.mempelai_wanita?.foto || null
        },
        waktu: {
            tanggal_tampil: getVal('f-tanggal-tampil'),
            countdown_target: (() => {
                const v = getVal('f-countdown-target');
                return v ? v + ':00' : (currentData.waktu?.countdown_target || '');
            })()
        },
        akad: {
            tanggal: getVal('f-akad-tanggal'),
            waktu: getVal('f-akad-waktu'),
            tempat: getVal('f-akad-tempat'),
            alamat: getVal('f-akad-alamat'),
            maps_url: getVal('f-akad-maps')
        },
        resepsi: {
            tanggal: getVal('f-resepsi-tanggal'),
            waktu: getVal('f-resepsi-waktu'),
            tempat: getVal('f-resepsi-tempat'),
            alamat: getVal('f-resepsi-alamat'),
            maps_url: getVal('f-resepsi-maps')
        },
        kado: currentConfig.hasKado ? {
            rek1: { bank: getVal('f-rek1-bank'), nomor: getVal('f-rek1-nomor'), atas_nama: getVal('f-rek1-nama') },
            rek2: { bank: getVal('f-rek2-bank'), nomor: getVal('f-rek2-nomor'), atas_nama: getVal('f-rek2-nama') }
        } : null,
        galeri: galleryData
    };
}

function getVal(id) {
    return document.getElementById(id)?.value?.trim() || '';
}

async function saveAllData() {
    currentData = collectFormData();
    try {
        await setDoc(doc(db, "invitations", currentUser.uid), currentData);
        showToast();
    } catch(e) {
        console.error(e);
        alert('Gagal menyimpan ke database Firebase. Pesan error: ' + e.message);
    }
}

function showToast() {
    const t = document.getElementById('saved-toast');
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('panel-' + tabId).classList.add('active');
    document.getElementById('tab-btn-' + tabId).classList.add('active');
}

// ===============================================================
// PHOTO UPLOAD (Compressed)
// ===============================================================
function handlePhotoUpload(input, gender) {
    const file = input.files[0];
    if (!file) return;
    compressImage(file, 800, (base64) => {
        if (gender === 'pria') currentData.mempelai_pria.foto = base64;
        else currentData.mempelai_wanita.foto = base64;
        loadPhotoPreview(gender, base64);
    });
}

function loadPhotoPreview(gender, src) {
    const preview = document.getElementById(gender + '-photo-preview');
    const placeholder = document.getElementById(gender + '-photo-placeholder');
    const clearBtn = document.getElementById(gender + '-clear-btn');
    if (src) {
        preview.src = src;
        preview.classList.remove('hidden');
        placeholder.classList.add('hidden');
        clearBtn?.classList.remove('hidden');
    } else {
        preview.src = '';
        preview.classList.add('hidden');
        placeholder.classList.remove('hidden');
        clearBtn?.classList.add('hidden');
    }
}

function clearPhoto(gender) {
    if (gender === 'pria') currentData.mempelai_pria.foto = null;
    else currentData.mempelai_wanita.foto = null;
    loadPhotoPreview(gender, null);
    document.getElementById('f-' + gender + '-foto').value = '';
}

let galleryUploadIndex = -1;
function triggerGalleryUpload(index) {
    galleryUploadIndex = index;
    document.getElementById('f-gallery-input').click();
}

function handleGalleryUpload(input) {
    const file = input.files[0];
    if (!file) return;
    compressImage(file, 800, (base64) => {
        if (galleryUploadIndex >= 0) {
            galleryData[galleryUploadIndex] = base64;
        } else {
            galleryData.push(base64);
        }
        galleryUploadIndex = -1;
        input.value = '';
        renderGalleryGrid();
    });
}

function removeGalleryItem(index) {
    galleryData.splice(index, 1);
    renderGalleryGrid();
}

function renderGalleryGrid() {
    const grid = document.getElementById('gallery-grid');
    if (!grid) return;
    grid.innerHTML = '';
    for (let i = 0; i < 6; i++) {
        const slot = document.createElement('div');
        slot.className = 'gallery-slot';
        if (galleryData[i]) {
            slot.innerHTML = `
                <img src="${galleryData[i]}" class="gallery-preview" alt="Galeri ${i+1}">
                <button class="remove-btn" onclick="removeGalleryItem(${i})"><i class="fa-solid fa-xmark"></i></button>
            `;
        } else {
            slot.innerHTML = `
                <div class="gallery-placeholder" onclick="triggerGalleryUpload(${i})">
                    <i class="fa-solid fa-plus"></i>
                </div>
            `;
        }
        grid.appendChild(slot);
    }
}

// Simple image compressor to avoid Firestore 1MB limits
function compressImage(file, maxWidth, callback) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function (event) {
        const img = new Image();
        img.src = event.target.result;
        img.onload = function () {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            callback(canvas.toDataURL('image/jpeg', 0.6));
        }
    }
}

// ===============================================================
// SHARE / GENERATOR
// ===============================================================
function generateLink() {
    const guestName = document.getElementById('share-guest-name').value.trim();
    if (!guestName) { alert('Masukkan nama tamu terlebih dahulu!'); return; }

    let base = window.location.href.split('admin.html')[0];
    if (!base.endsWith('/')) base += '/';
    // Append client UID so the theme knows whose data to load
    const url = base + currentConfig.path + '?client=' + currentUser.uid + '&to=' + encodeURIComponent(guestName);
    document.getElementById('share-generated-url').value = url;
    document.getElementById('share-result').classList.remove('hidden');
    document.getElementById('copy-share-text').textContent = 'Salin';
}

function copyShareLink() {
    const url = document.getElementById('share-generated-url').value;
    navigator.clipboard.writeText(url).then(() => {
        document.getElementById('copy-share-text').textContent = '✓ Tersalin';
        setTimeout(() => { document.getElementById('copy-share-text').textContent = 'Salin'; }, 3000);
    });
}

function sendWhatsApp() {
    const guestName = document.getElementById('share-guest-name').value.trim();
    let phone = document.getElementById('share-guest-phone').value.trim().replace(/\D/g,'');
    if (phone.startsWith('0')) phone = '62' + phone.substring(1);
    const url = document.getElementById('share-generated-url').value;
    const template = document.getElementById('share-message').value;
    const msg = template.replace(/\[Nama Tamu\]/g, guestName).replace(/\[Tautan Undangan\]/g, url);
    const waUrl = phone ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}` : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
}

function testLink() {
    const url = document.getElementById('share-generated-url').value;
    if (url) window.open(url, '_blank');
}

function logoutAdmin() {
    signOut(auth).then(() => {
        window.location.href = 'index.html';
    });
}

// ===============================================================
// KELOLA KLIEN (ADMIN DASHBOARD)
// ===============================================================
async function loadClientList() {
    const tbody = document.getElementById('client-table-body');
    try {
        const q = query(collection(db, "users"));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-gray-400">Belum ada klien.</td></tr>';
            return;
        }

        let html = '';
        snapshot.forEach((d) => {
            const data = d.data();
            const isActive = data.isActive !== false;
            
            html += `
                <tr class="border-b border-gray-100 hover:bg-gray-50">
                    <td class="px-4 py-3 font-medium text-brand-dark">${data.email}</td>
                    <td class="px-4 py-3">${data.tema === 'green' ? 'Green (Sage & Gold)' : 'Flora Pink'}</td>
                    <td class="px-4 py-3 text-center">
                        <span class="px-2 py-1 text-[10px] font-bold rounded-full ${isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                            ${isActive ? 'AKTIF' : 'DIBLOKIR'}
                        </span>
                    </td>
                    <td class="px-4 py-3 text-right">
                        <button onclick="toggleClientStatus('${d.id}', ${!isActive})" class="text-xs px-3 py-1.5 rounded-lg border font-bold transition ${isActive ? 'border-red-200 text-red-500 hover:bg-red-50' : 'border-green-200 text-green-500 hover:bg-green-50'}">
                            ${isActive ? 'Cabut Akses' : 'Pulihkan'}
                        </button>
                    </td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    } catch(e) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-red-500">Gagal memuat data (cek rules Firestore).</td></tr>';
    }
}

// Make toggleClientStatus available globally
window.toggleClientStatus = async function(uid, setStatusTo) {
    if (!confirm(setStatusTo ? 'Pulihkan akses klien ini?' : 'Cabut akses klien ini? Klien akan langsung tertendang keluar.')) return;
    try {
        await updateDoc(doc(db, "users", uid), { isActive: setStatusTo });
        loadClientList();
    } catch(e) {
        alert("Gagal memperbarui status: " + e.message);
    }
}

document.getElementById('btn-create-client').addEventListener('click', async () => {
    const email = document.getElementById('new-client-email').value.trim();
    const pass = document.getElementById('new-client-pass').value;
    const tema = document.getElementById('new-client-tema').value;
    
    if (!email || pass.length < 6) {
        alert("Email valid dan password minimal 6 karakter!");
        return;
    }

    const btn = document.getElementById('btn-create-client');
    btn.textContent = "Membuat...";
    btn.disabled = true;

    try {
        // Create user using secondary app so master admin doesn't log out
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, pass);
        const newUid = userCredential.user.uid;
        
        // Save to firestore users collection
        await setDoc(doc(db, "users", newUid), {
            email: email,
            role: 'client',
            tema: tema,
            isActive: true,
            createdAt: new Date().toISOString()
        });

        // Copy default data to invitations collection
        const defaults = TEMA_CONFIG[tema].defaults;
        await setDoc(doc(db, "invitations", newUid), defaults);

        alert("Akun klien berhasil dibuat!");
        document.getElementById('modal-tambah-klien').classList.add('hidden');
        loadClientList();
        
        // Clear secondary session so we can make another one later
        await signOut(secondaryAuth);
    } catch(e) {
        alert("Gagal membuat klien: " + e.message);
    } finally {
        btn.textContent = "Buat Akun";
        btn.disabled = false;
    }
});
