import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, setDoc, getDoc, updateDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// ==========================================
// 1. CONFIGURACIÓN DE FIREBASE
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyCseHHQbDaBcn9rjlZ_GuwvC4fPQgXe9UU",
    authDomain: "salud-mental-b6c3d.firebaseapp.com",
    projectId: "salud-mental-b6c3d",
    storageBucket: "salud-mental-b6c3d.firebasestorage.app",
    messagingSenderId: "904568929609",
    appId: "1:904568929609:web:dee38a40f81f4ad4dd2e98"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
const ADMIN_EMAIL = "tu_correo@gmail.com"; 

// ==========================================
// 2. VARIABLES GLOBALES DE ESTADO E ÍCONOS
// ==========================================
let profesionalesCache = [];
let favoritos = []; 
let currentRole = 'visitante'; 
let loginIntent = ''; 
let datosPaciente = { nombre: '', motivo: '' };

let mapInstance = null;
let markerLayerGroup = null;
let userLocationMarker = null;

let formMapInstance = null;
let formMarker = null;

// Íconos SVG
const svgWhatsApp = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/></svg>`;
const svgShare = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M13.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.499 2.499 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5zm-8.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm11 5.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/></svg>`;

// Nuevos Íconos para Redes Sociales
const svgInsta = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16"><path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.917 3.917 0 0 0-1.417.923A3.927 3.927 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.916 3.916 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.926 3.926 0 0 0-.923-1.417A3.911 3.911 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0h.003zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.036 1.204.166 1.486.275.373.145.64.319.92.599.28.28.453.546.598.92.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.47 2.47 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.478 2.478 0 0 1-.92-.598 2.48 2.48 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233 0-2.136.008-2.388.046-3.231.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92.28-.28.546-.453.92-.598.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045v.002zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92zm-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217zm0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334z"/></svg>`;
const svgFb = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16"><path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z"/></svg>`;
const svgLinked = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16"><path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 0 1 .016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z"/></svg>`;
const svgWeb = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm7.5-6.923c-.67.204-1.335.82-1.887 1.855A7.97 7.97 0 0 0 5.145 4H7.5V1.077zM4.09 4a9.267 9.267 0 0 1 .64-1.539 6.7 6.7 0 0 1 .597-.933A7.025 7.025 0 0 0 2.255 4H4.09zm-.582 3.5c.03-.877.138-1.718.312-2.5H1.674a6.958 6.958 0 0 0-.656 2.5h2.49zM4.847 5a12.5 12.5 0 0 0-.338 2.5H7.5V5H4.847zM8.5 5v2.5h2.99a12.495 12.495 0 0 0-.337-2.5H8.5zM4.51 8.5a12.5 12.5 0 0 0 .337 2.5H7.5V8.5H4.51zm3.99 0V11h2.653c.187-.765.306-1.608.338-2.5H8.5zM5.145 12c.138.386.295.744.468 1.068.552 1.035 1.218 1.65 1.887 1.855V12H5.145zm.182 2.472a6.696 6.696 0 0 1-.597-.933A9.268 9.268 0 0 1 4.09 12H2.255a7.024 7.024 0 0 0 3.072 2.472zM3.82 11a13.652 13.652 0 0 1-.312-2.5h-2.49c.062.89.291 1.733.656 2.5H3.82zm6.853 3.472A7.024 7.024 0 0 0 13.745 12H11.91a9.27 9.27 0 0 1-.64 1.539 6.688 6.688 0 0 1-.597.933zM8.5 12v2.923c.67-.204 1.335-.82 1.887-1.855.173-.324.33-.682.468-1.068H8.5zm3.68-1h2.146c.365-.767.594-1.61.656-2.5h-2.49a13.65 13.65 0 0 1-.312 2.5zm2.802-3.5a6.959 6.959 0 0 0-.656-2.5H11.84c.174.782.282 1.623.312 2.5h2.49zM11.91 4a9.27 9.27 0 0 0-.64-1.539 6.7 6.7 0 0 0-.597-.933A7.025 7.025 0 0 1 13.745 4h-1.835z"/></svg>`;

// ==========================================
// 3. ELEMENTOS DEL DOM Y TRAMPA DE URLS
// ==========================================
const btnLoginPaciente = document.getElementById('btn-login-paciente');
const btnLoginProf = document.getElementById('btn-login-prof');
const btnLogout = document.getElementById('btn-logout');
const roleBadge = document.getElementById('user-role-badge');
const grid = document.getElementById('profesionales-grid');

const btnOpenModalProf = document.getElementById('btn-open-modal');
const modalRegistro = document.getElementById('modal-registro');
const formProfesional = document.getElementById('form-profesional');
const modalTitle = document.getElementById('modal-title');

const btnOpenModalPac = document.getElementById('btn-open-modal-paciente');
const modalPaciente = document.getElementById('modal-paciente');
const formPaciente = document.getElementById('form-paciente');

const modalFicha = document.getElementById('modal-ficha');
const fichaBody = document.getElementById('ficha-body');

const modalMapa = document.getElementById('modal-mapa');
const btnOpenMap = document.getElementById('btn-open-map');
const btnCloseMap = document.getElementById('btn-close-mapa');
const btnMiUbicacion = document.getElementById('btn-mi-ubicacion');

document.getElementById('current-year').textContent = new Date().getFullYear();

// TRAMPA PARA EVITAR QUE HTML5 BLOQUEE EL GUARDADO SI FALTA "HTTPS://"
['instagram', 'linkedin', 'facebook', 'web'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.type = 'text'; 
});

// ==========================================
// 4. SISTEMA DE TOASTS (NOTIFICACIONES)
// ==========================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = type === 'success' ? `✅ ${message}` : `⚠️ ${message}`;
    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3500);
}

// ==========================================
// 5. AUTENTICACIÓN Y ROLES
// ==========================================
btnLoginPaciente.addEventListener('click', async () => { loginIntent = 'paciente'; signInWithPopup(auth, provider); });
btnLoginProf.addEventListener('click', async () => { loginIntent = 'profesional'; signInWithPopup(auth, provider); });
btnLogout.addEventListener('click', () => { signOut(auth); showToast("Sesión cerrada"); });

onAuthStateChanged(auth, async (user) => {
    if (user) {
        if (loginIntent) {
            await setDoc(doc(db, "users", user.uid), { role: loginIntent, email: user.email }, { merge: true });
            loginIntent = ''; 
        }

        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            const data = userDoc.data(); 
            currentRole = data.role;
            if(currentRole === 'paciente') {
                datosPaciente.nombre = data.nombrePaciente || ''; 
                datosPaciente.motivo = data.motivoPaciente || '';
                favoritos = data.favoritos || []; 
            }
        } else { currentRole = 'paciente'; favoritos = []; }

        if (user.email === ADMIN_EMAIL) currentRole = 'admin';

        btnLoginPaciente.classList.add('hidden'); btnLoginProf.classList.add('hidden'); btnLogout.classList.remove('hidden'); roleBadge.classList.remove('hidden', 'prof', 'admin', 'pac');

        if (currentRole === 'admin') { roleBadge.textContent = '👑 Admin'; roleBadge.classList.add('admin'); btnOpenModalProf.classList.remove('hidden'); btnOpenModalPac.classList.add('hidden'); } 
        else if (currentRole === 'profesional') { roleBadge.textContent = '👨‍⚕️ Profesional'; roleBadge.classList.add('prof'); btnOpenModalProf.classList.remove('hidden'); btnOpenModalPac.classList.add('hidden'); } 
        else { roleBadge.textContent = '👤 Paciente'; roleBadge.classList.add('pac'); btnOpenModalProf.classList.add('hidden'); btnOpenModalPac.classList.remove('hidden'); }
    } else {
        currentRole = 'visitante'; datosPaciente = { nombre: '', motivo: '' }; favoritos = []; 
        btnLoginPaciente.classList.remove('hidden'); btnLoginProf.classList.remove('hidden'); btnLogout.classList.add('hidden'); btnOpenModalProf.classList.add('hidden'); btnOpenModalPac.classList.add('hidden'); roleBadge.classList.add('hidden');
    }
    if (profesionalesCache.length > 0) aplicarFiltros(); 
});

// ==========================================
// 6. MAPA 1: MAPA GENERAL (UBICACIONES)
// ==========================================
function renderizarMarcadores() {
    if(!markerLayerGroup) return;
    markerLayerGroup.clearLayers(); 

    const filtrados = getFilteredProfesionales();
    
    filtrados.forEach(prof => {
        if (prof.coordenadas && prof.coordenadas.lat && prof.coordenadas.lng) {
            const marker = L.marker([prof.coordenadas.lat, prof.coordenadas.lng]);
            const popupContent = `
                <div style="text-align:center; min-width: 150px;">
                    <strong style="color:var(--primary-dark); font-size:1.1rem;">${prof.nombre}</strong><br>
                    <span style="font-size:0.85rem; color:var(--text-muted);">${prof.categoria}</span><br>
                    <button class="btn btn-outline" style="margin-top:10px; padding: 5px 10px; font-size:0.8rem;" onclick="abrirFichaDesdeMapa('${prof.id}')">Ver Perfil</button>
                </div>
            `;
            marker.bindPopup(popupContent);
            markerLayerGroup.addLayer(marker);
        }
    });
}

btnOpenMap.addEventListener('click', () => {
    modalMapa.classList.remove('hidden');
    setTimeout(() => {
        if (!mapInstance) {
            mapInstance = L.map('map-container').setView([-31.6529, -64.4283], 12); 
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(mapInstance);
            markerLayerGroup = L.layerGroup().addTo(mapInstance);
        }
        mapInstance.invalidateSize();
        renderizarMarcadores();
    }, 250);
});

btnMiUbicacion.addEventListener('click', () => {
    if (!navigator.geolocation) { showToast("Tu navegador no soporta geolocalización", "error"); return; }
    btnMiUbicacion.textContent = "Buscando ubicación...";
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const userLat = position.coords.latitude; const userLng = position.coords.longitude;
            mapInstance.setView([userLat, userLng], 14);
            if(userLocationMarker) mapInstance.removeLayer(userLocationMarker);
            userLocationMarker = L.circleMarker([userLat, userLng], { color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.5, radius: 10 }).addTo(mapInstance).bindPopup("<b>Estás aquí</b>").openPopup();
            btnMiUbicacion.innerHTML = "📍 Ubicación encontrada";
            setTimeout(() => { btnMiUbicacion.innerHTML = "📍 Mostrar mi ubicación actual"; }, 3000);
        },
        (error) => { showToast("No pudimos acceder a tu ubicación", "error"); btnMiUbicacion.innerHTML = "📍 Mostrar mi ubicación actual"; }
    );
});

btnCloseMap.addEventListener('click', () => modalMapa.classList.add('hidden'));
window.abrirFichaDesdeMapa = function(id) { modalMapa.classList.add('hidden'); abrirFichaProfesional(id); }

// ==========================================
// 7. MAPA 2: FORMULARIO Y GEOCODIFICACIÓN
// ==========================================
function initFormMap(lat = -31.6529, lng = -64.4283) {
    setTimeout(() => {
        if (formMapInstance) { 
            formMapInstance.remove(); 
            formMapInstance = null; 
        }
        
        formMapInstance = L.map('form-map-container').setView([lat, lng], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(formMapInstance);
        
        formMapInstance.on('click', function(e) { colocarMarcadorArrastrable(e.latlng.lat, e.latlng.lng); });
        
        if(lat !== -31.6529 && lng !== -64.4283) { 
            colocarMarcadorArrastrable(lat, lng); 
        } else { 
            formMarker = null;
            document.getElementById('form-lat').value = ''; 
            document.getElementById('form-lng').value = ''; 
        }
        
        formMapInstance.invalidateSize();
    }, 250);
}

function colocarMarcadorArrastrable(lat, lng) {
    if(formMarker) formMapInstance.removeLayer(formMarker);
    formMarker = L.marker([lat, lng], { draggable: true }).addTo(formMapInstance);
    document.getElementById('form-lat').value = lat; 
    document.getElementById('form-lng').value = lng;
    
    formMarker.on('dragend', function(e) { 
        const position = formMarker.getLatLng(); 
        document.getElementById('form-lat').value = position.lat; 
        document.getElementById('form-lng').value = position.lng; 
    });
}

document.getElementById('btn-reset-map').addEventListener('click', () => {
    if(formMarker && formMapInstance) formMapInstance.removeLayer(formMarker);
    document.getElementById('form-lat').value = ''; 
    document.getElementById('form-lng').value = '';
});

async function obtenerCoordenadas(direccion) {
    try {
        const query = encodeURIComponent(direccion + ", Córdoba, Argentina");
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`;
        const res = await fetch(url); 
        if(!res.ok) throw new Error("Fallo API Mapa");
        const data = await res.json();
        if (data && data.length > 0) {
            return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        }
    } catch (error) { console.warn("No se pudo autocompletar la dirección:", error); }
    return null;
}

const btnBuscarDir = document.getElementById('btn-buscar-direccion');
if(btnBuscarDir) {
    btnBuscarDir.addEventListener('click', async () => {
        const direcInput = document.getElementById('direcciones').value;
        if (!direcInput) return showToast("Por favor, escribe tu dirección primero", "error");
        
        btnBuscarDir.textContent = "Buscando..."; btnBuscarDir.disabled = true;
        const coords = await obtenerCoordenadas(direcInput.split('\n')[0].trim());
        
        if(coords) {
            formMapInstance.setView([coords.lat, coords.lng], 16);
            colocarMarcadorArrastrable(coords.lat, coords.lng);
            showToast("Ubicación encontrada. Puedes arrastrar el marcador azul para ajustarlo.");
        } else { showToast("No se encontró. Haz clic en el mapa para ubicarla manualmente.", "error"); }
        
        btnBuscarDir.textContent = "🔍 Buscar dirección en mapa"; btnBuscarDir.disabled = false;
    });
}

// ==========================================
// 8. GUARDAR ANUNCIO Y FORMATEO DE URLS
// ==========================================

// Función que arregla las URLs si se olvidaron el "https://"
function formatUrl(url) {
    if (!url) return null;
    let clean = url.trim();
    if (clean === "") return null;
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
        return 'https://' + clean;
    }
    return clean;
}

formProfesional.addEventListener('submit', async (e) => {
    e.preventDefault(); 
    if(!auth.currentUser) return;

    const anuncioId = document.getElementById('anuncio-id').value;
    const arrayObras = document.getElementById('obras').value.split(',').map(i => i.trim()).filter(i => i !== "");
    const arrayDirecciones = document.getElementById('direcciones').value.split('\n').map(i => i.trim()).filter(i => i !== "");
    const modalidadSeleccionada = document.getElementById('modalidad').value;

    const formLat = document.getElementById('form-lat').value;
    const formLng = document.getElementById('form-lng').value;
    let coordsGuardar = null;

    if (formLat && formLng) {
        coordsGuardar = { lat: parseFloat(formLat), lng: parseFloat(formLng) };
    } else if (arrayDirecciones.length > 0) {
        const btnSubmit = document.getElementById('btn-submit-profesional');
        const originalText = btnSubmit.textContent;
        btnSubmit.textContent = "Guardando y buscando coordenadas...";
        btnSubmit.disabled = true;
        
        const autoCoords = await obtenerCoordenadas(arrayDirecciones[0]);
        if(autoCoords) { coordsGuardar = autoCoords; } 
        else { showToast("Atención: El perfil se guardó pero sin pin en el mapa. Edítalo y ubícalo manualmente.", "error"); }
        
        btnSubmit.textContent = originalText;
        btnSubmit.disabled = false;
    }

    const datosAnuncio = {
        uid: auth.currentUser.uid,
        nombre: document.getElementById('nombre').value,
        matricula: document.getElementById('matricula').value,
        whatsapp: document.getElementById('whatsapp').value.replace(/\D/g, ''),
        categoria: document.getElementById('categoria').value,
        modalidad: modalidadSeleccionada,
        terapia: document.getElementById('terapia').value,
        sintomas: document.getElementById('specialties').value || null, 
        obras_array: arrayObras, 
        direcciones_array: arrayDirecciones,
        coordenadas: coordsGuardar, 
        // Aplicamos la función inteligente a las 4 redes:
        instagram: formatUrl(document.getElementById('instagram').value), 
        linkedin: formatUrl(document.getElementById('linkedin').value), 
        facebook: formatUrl(document.getElementById('facebook').value), 
        web: formatUrl(document.getElementById('web').value), 
        precio: document.getElementById('precio').value || null, 
        sobreMi: document.getElementById('aboutMe').value || null,
        atencion: { ninos: document.getElementById('atencion-ninos').checked, adolescentes: document.getElementById('atencion-adolescentes').checked, adultos: document.getElementById('atencion-adultos').checked, terceraEdad: document.getElementById('atencion-terceraEdad').checked },
        terapias: { individual: document.getElementById('terapia-individual').checked, pareja: document.getElementById('terapia-pareja').checked, familia: document.getElementById('terapia-familia').checked },
        updatedAt: serverTimestamp()
    };

    try {
        if (anuncioId) { await updateDoc(doc(db, "profesionales", anuncioId), datosAnuncio); showToast("¡Anuncio actualizado!"); } 
        else { datosAnuncio.createdAt = serverTimestamp(); await addDoc(collection(db, "profesionales"), datosAnuncio); showToast("¡Anuncio publicado!"); }
        formProfesional.reset(); modalRegistro.classList.add('hidden'); cargarProfesionales(); 
    } catch (error) { showToast("Error al guardar anuncio", "error"); }
});

// ==========================================
// 9. CERRAR MODALES Y FICHA PACIENTE
// ==========================================
document.getElementById('btn-close-modal').addEventListener('click', () => { modalRegistro.classList.add('hidden'); });
document.getElementById('btn-close-paciente').addEventListener('click', () => { modalPaciente.classList.add('hidden'); });
document.getElementById('btn-close-ficha').addEventListener('click', () => { modalFicha.classList.add('hidden'); window.history.replaceState({}, document.title, window.location.pathname); });

btnOpenModalProf.addEventListener('click', () => { 
    formProfesional.reset(); document.getElementById('anuncio-id').value = ''; modalTitle.textContent = "Crear Nuevo Anuncio"; modalRegistro.classList.remove('hidden'); initFormMap(); 
});

btnOpenModalPac.addEventListener('click', () => { renderFavoritosPaciente(); modalPaciente.classList.remove('hidden'); });

formPaciente.addEventListener('submit', async (e) => {
    e.preventDefault(); if(!auth.currentUser) return;
    const nombre = document.getElementById('paciente-nombre').value; const motivo = document.getElementById('paciente-motivo').value;
    try { await setDoc(doc(db, "users", auth.currentUser.uid), { nombrePaciente: nombre, motivoPaciente: motivo }, { merge: true }); datosPaciente.nombre = nombre; datosPaciente.motivo = motivo; showToast("Datos guardados"); modalPaciente.classList.add('hidden'); } catch (e) { showToast("Error al guardar", "error"); }
});

async function toggleFavorito(id) {
    if(!auth.currentUser || currentRole !== 'paciente') { alert("Inicia sesión como 'Paciente'."); return; }
    if(favoritos.includes(id)) { favoritos = favoritos.filter(fav => fav !== id); showToast("Eliminado de favoritos"); } else { favoritos.push(id); showToast("Agregado a favoritos"); }
    try { await setDoc(doc(db, "users", auth.currentUser.uid), { favoritos: favoritos }, { merge: true }); aplicarFiltros(); } catch (error) {}
}

function renderFavoritosPaciente() {
    const contenedor = document.getElementById('lista-favoritos-paciente');
    if (favoritos.length === 0) { contenedor.innerHTML = '<p>No hay profesionales guardados.</p>'; return; }
    const profsFavoritos = profesionalesCache.filter(prof => favoritos.includes(prof.id));
    let html = '';
    profsFavoritos.forEach(prof => {
        html += `<div class="fav-item"><div class="fav-item-info"><strong>${prof.nombre}</strong><span>${prof.categoria}</span></div><div class="fav-item-actions"><button class="btn-small btn-ver-perfil-fav" data-id="${prof.id}" style="background: var(--primary-light); color: var(--primary-dark); border-color: var(--primary-light);">👁️ Ficha</button><a href="${getWhatsAppLink(prof.whatsapp)}" target="_blank" class="btn-whatsapp" style="padding: 0.4rem 0.6rem; border-radius: 6px;">${svgWhatsApp}</a><button class="btn-small del btn-quitar-fav" data-id="${prof.id}">🗑️</button></div></div>`;
    });
    contenedor.innerHTML = html;
    document.querySelectorAll('.btn-quitar-fav').forEach(btn => { btn.addEventListener('click', async (e) => { await toggleFavorito(e.currentTarget.dataset.id); renderFavoritosPaciente(); }); });
    document.querySelectorAll('.btn-ver-perfil-fav').forEach(btn => { btn.addEventListener('click', (e) => { modalPaciente.classList.add('hidden'); abrirFichaProfesional(e.currentTarget.dataset.id); }); });
}

// ==========================================
// 10. RENDERIZADO DE PROFESIONALES
// ==========================================
async function cargarProfesionales() {
    try {
        const querySnapshot = await getDocs(collection(db, "profesionales"));
        profesionalesCache = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        profesionalesCache.sort((a, b) => a.nombre.localeCompare(b.nombre));
        aplicarFiltros(); 
        const sharedId = new URLSearchParams(window.location.search).get('id');
        if (sharedId) abrirFichaProfesional(sharedId);
    } catch (error) { grid.innerHTML = `<div class="empty-state"><h3>Problema de Conexión</h3></div>`; }
}

function getWhatsAppLink(numeroProf) { let mensaje = "Hola, te contacto desde Ariadna (Red Paravachasca)."; if (datosPaciente.nombre) { mensaje = `Hola, mi nombre es ${datosPaciente.nombre}. Te contacto desde Ariadna.`; } return `https://wa.me/${numeroProf}?text=${encodeURIComponent(mensaje)}`; }

function getAvatarData(name) { 
    const words = name.trim().split(' '); let initials = ''; 
    if (words.length > 1) { initials = (words[0][0] + words[1][0]).toUpperCase(); } else if (words.length === 1 && words[0] !== '') { initials = words[0].substring(0, 2).toUpperCase(); } 
    const colors = ['#2c5282', '#38b2ac', '#c07d5e', '#2c7a7b', '#1a2e2b']; return { initials, color: colors[name.length % colors.length] }; 
}

function renderCards(data) {
    grid.innerHTML = '';
    if(data.length === 0) { grid.innerHTML = `<div class="empty-state"><h3>No encontramos lo que buscás</h3></div>`; return; }

    data.forEach((prof, index) => {
        const isFav = favoritos.includes(prof.id); const avatar = getAvatarData(prof.nombre);
        let obrasList = prof.obras_array || (prof.obras ? prof.obras.split(',').map(o => o.trim()) : []);
        const tagsHTML = obrasList.slice(0, 3).map(obra => `<span class="tag">${obra}</span>`).join('') + (obrasList.length > 3 ? '<span class="tag">...</span>' : '');

        let adminHtml = '';
        if (auth.currentUser && (auth.currentUser.uid === prof.uid || currentRole === 'admin')) {
            adminHtml = `<div style="position:absolute; top:1rem; right:1rem; display:flex; gap:0.5rem;"><button class="btn btn-outline btn-edit" data-id="${prof.id}" style="padding:0.2rem 0.5rem; font-size:0.8rem; background: var(--card-bg);">Editar</button><button class="btn btn-outline btn-delete" data-id="${prof.id}" style="padding:0.2rem 0.5rem; font-size:0.8rem; border-color:#ef4444; color:#ef4444; background: var(--card-bg);">Borrar</button></div>`;
        }

        let btnFavHtml = ''; if(currentRole === 'paciente' || currentRole === 'visitante') { btnFavHtml = `<button class="btn-icon btn-fav ${isFav ? 'fav-active' : ''}" data-id="${prof.id}" title="Favoritos">${isFav ? '❤️' : '🤍'}</button>`; }
        let atiendeHTML = ''; if(prof.atencion) { let edades = []; if(prof.atencion.ninos) edades.push("Niños"); if(prof.atencion.adolescentes) edades.push("Adolescentes"); if(prof.atencion.adultos) edades.push("Adultos"); if(prof.atencion.terceraEdad) edades.push("Tercera Edad"); if(edades.length > 0) atiendeHTML = `<p><strong>Atiende:</strong> ${edades.join(', ')}</p>`; }

        const card = document.createElement('div'); card.className = 'card'; card.style.animationDelay = `${index * 0.05}s`;
        card.innerHTML = `${adminHtml}<div class="card-header" style="margin-top: ${adminHtml ? '1rem' : '0'}"><div class="avatar" style="background-color: ${avatar.color}">${avatar.initials}</div><div class="prof-info"><h3 class="prof-name">${prof.nombre}</h3><span class="prof-category">${prof.categoria}</span></div></div><div class="prof-details"><p><strong>Modalidad:</strong> ${prof.modalidad}</p><p><strong>Enfoque:</strong> ${prof.terapia}</p><div class="card-tags-list">${atiendeHTML}</div></div><div class="tags-container">${tagsHTML}</div><div class="card-actions"><button class="btn btn-outline btn-perfil" data-id="${prof.id}" style="flex:1;">Ver Perfil</button><a href="${getWhatsAppLink(prof.whatsapp)}" target="_blank" class="btn btn-whatsapp" style="flex:1; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; gap: 0.4rem; text-decoration: none;">${svgWhatsApp} Contactar</a><button class="btn-icon btn-share" data-nombre="${prof.nombre}" data-id="${prof.id}" title="Compartir Perfil">${svgShare}</button>${btnFavHtml}</div>`;
        grid.appendChild(card);
    });
    asignarEventosDinamicos();
}

// ==========================================
// 11. FICHA COMPLETA Y REDES CON ICONOS SVG
// ==========================================
function abrirFichaProfesional(id) {
    const prof = profesionalesCache.find(p => p.id === id); 
    if(!prof) return;
    
    let dirList = prof.direcciones_array || (prof.direcciones ? prof.direcciones.split('\n') : []);
    let obrasList = prof.obras_array || (prof.obras ? prof.obras.split(',') : []);
    
    // REDES SOCIALES (AHORA CON SVG Y COLORES ORIGINALES)
    let redesHtml = ''; 
    if(prof.instagram) redesHtml += `<a href="${prof.instagram}" target="_blank" style="color: #E1306C; display: inline-block; transition: transform 0.2s;" title="Instagram" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">${svgInsta}</a>`; 
    if(prof.facebook) redesHtml += `<a href="${prof.facebook}" target="_blank" style="color: #1877F2; display: inline-block; transition: transform 0.2s;" title="Facebook" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">${svgFb}</a>`; 
    if(prof.linkedin) redesHtml += `<a href="${prof.linkedin}" target="_blank" style="color: #0A66C2; display: inline-block; transition: transform 0.2s;" title="LinkedIn" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">${svgLinked}</a>`; 
    if(prof.web) redesHtml += `<a href="${prof.web}" target="_blank" style="color: var(--primary-dark); display: inline-block; transition: transform 0.2s;" title="Sitio Web" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">${svgWeb}</a>`;
    
    let sobreMiHTML = prof.sobreMi ? `<h4>Sobre mí</h4><p style="max-height: 150px; overflow-y: auto; padding-right: 5px;">${prof.sobreMi}</p>` : '';
    let precioFichaHTML = prof.precio ? `<p class="ficha-session-price" style="margin-top:1rem;"><strong>Valor sesión:</strong> ${prof.precio}</p>` : '';
    let especialidadesHTML = prof.sintomas ? `<p style="margin-top:1rem;"><strong>Especialidades / Áreas:</strong> ${prof.sintomas}</p>` : '';
    
    let atiendeHTML = ''; if(prof.atencion) { let edades = []; if(prof.atencion.ninos) edades.push("Niños"); if(prof.atencion.adolescentes) edades.push("Adolescentes"); if(prof.atencion.adultos) edades.push("Adultos"); if(prof.atencion.terceraEdad) edades.push("Tercera Edad"); if(edades.length > 0) atiendeHTML = `<p><strong>Edades:</strong> ${edades.join(', ')}</p>`; }
    let terapiasHTML = ''; if(prof.terapias) { let tipos = []; if(prof.terapias.individual) tipos.push("Individual"); if(prof.terapias.pareja) tipos.push("Pareja"); if(prof.terapias.familia) tipos.push("Familia"); if(tipos.length > 0) terapiasHTML = `<p><strong>Formatos:</strong> ${tipos.join(', ')}</p>`; }

    const tieneUbicacion = (prof.coordenadas && prof.coordenadas.lat) || (dirList.length > 0);
    let sectionMapaHTML = '';

    if (tieneUbicacion) {
        let destinoRuta = '';
        if (prof.coordenadas && prof.coordenadas.lat) {
            destinoRuta = `${prof.coordenadas.lat},${prof.coordenadas.lng}`;
        } else if (dirList.length > 0) {
            destinoRuta = encodeURIComponent(dirList[0] + ', Córdoba, Argentina');
        }

        if (destinoRuta !== '') {
            const urlGoogleMaps = `https://www.google.com/maps/dir/?api=1&destination=${destinoRuta}`;
            sectionMapaHTML = `
                <div style="margin-top: 0.5rem; display: flex; flex-direction: column; gap: 10px;">
                    <div>${dirList.map(d => `<p style="margin-bottom:0; font-size: 0.95rem;">📍 ${d}</p>`).join('')}</div>
                    
                    <a href="${urlGoogleMaps}" target="_blank" class="btn btn-outline full-width" style="display:flex; justify-content:center; align-items:center; gap:0.4rem; text-decoration: none; border-color: var(--primary); color: var(--primary); background-color: #eaf4f0; padding: 0.6rem; border-radius: 8px;">
                        🗺️ Cómo llegar
                    </a>
                </div>
            `;
        }
    }

    fichaBody.innerHTML = `
        <div class="ficha-perfil">
            <div><span class="prof-category">${prof.categoria}</span><h3>${prof.nombre}</h3><p><strong>Matrícula:</strong> ${prof.matricula}</p></div>
            ${sobreMiHTML}
            <h4>Enfoque y Atención</h4><p><strong>Modalidad:</strong> ${prof.modalidad}</p><p><strong>Marco Teórico:</strong> ${prof.terapia}</p>
            <div class="ficha-details-list">${atiendeHTML}${terapiasHTML}</div>
            ${especialidadesHTML}${precioFichaHTML}
            
            ${tieneUbicacion ? '<h4 style="margin-top: 1.5rem;">Dónde Atiende</h4>' : ''}
            ${sectionMapaHTML}
            
            <h4 style="margin-top: 1.5rem;">Obras Sociales / Prepagas</h4><div class="tags-container" style="margin-top:0">${obrasList.map(o => `<span class="tag">${o}</span>`).join('')}</div>
            
            ${redesHtml ? `<h4 style="margin-top: 1.5rem;">Contacto Adicional</h4><div class="social-links" style="display:flex; gap:1.2rem; margin-top:0.5rem; align-items:center;">${redesHtml}</div>` : ''}
            
            <div style="display: flex; gap: 10px; margin-top: 2rem;">
                <a href="${getWhatsAppLink(prof.whatsapp)}" target="_blank" class="btn btn-whatsapp" style="flex: 3; text-decoration:none; display:flex; justify-content:center; border-radius:8px;">${svgWhatsApp} Enviar mensaje</a>
                <button class="btn btn-outline btn-share-ficha" data-nombre="${prof.nombre}" data-id="${prof.id}" style="flex: 1; border-radius:8px; display:flex; align-items:center; justify-content:center; gap:0.4rem;">${svgShare} Compartir</button>
            </div>
        </div>
    `;
    
    document.querySelector('.btn-share-ficha').addEventListener('click', async (e) => { 
        const nombre = e.currentTarget.dataset.nombre; const id = e.currentTarget.dataset.id; const texto = `Mirá el perfil de ${nombre} en Ariadna.`; const url = `${window.location.origin}${window.location.pathname}?id=${id}`;
        if(navigator.share){ try { await navigator.share({title:'Ariadna',text:texto,url:url}) } catch(err){} } else { navigator.clipboard.writeText(`${texto} ${url}`); showToast("Enlace copiado"); }
    });
    
    modalFicha.classList.remove('hidden');
}

// ==========================================
// 12. EVENTOS EN LAS TARJETAS (EDITAR/BORRAR)
// ==========================================
function asignarEventosDinamicos() {
    document.querySelectorAll('.btn-perfil').forEach(btn => { btn.addEventListener('click', (e) => abrirFichaProfesional(e.currentTarget.dataset.id)); });
    document.querySelectorAll('.btn-fav').forEach(btn => { btn.addEventListener('click', async (e) => { await toggleFavorito(e.currentTarget.dataset.id); }); });
    document.querySelectorAll('.btn-share').forEach(btn => { 
        btn.addEventListener('click', async (e) => { 
            const nombre = e.currentTarget.dataset.nombre; const id = e.currentTarget.dataset.id; const texto = `Mirá el perfil de ${nombre} en Ariadna.`; const url = `${window.location.origin}${window.location.pathname}?id=${id}`;
            if(navigator.share){ try { await navigator.share({title:'Ariadna',text:texto,url:url}) } catch(err){} } else { navigator.clipboard.writeText(`${texto} ${url}`); showToast("Enlace copiado"); }
        }); 
    });

    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const prof = profesionalesCache.find(p => p.id === e.currentTarget.dataset.id);
            
            document.getElementById('anuncio-id').value = prof.id; document.getElementById('nombre').value = prof.nombre; document.getElementById('matricula').value = prof.matricula; document.getElementById('whatsapp').value = prof.whatsapp; document.getElementById('categoria').value = prof.categoria; document.getElementById('modalidad').value = prof.modalidad; document.getElementById('terapia').value = prof.terapia; document.getElementById('specialties').value = prof.sintomas || ''; document.getElementById('obras').value = prof.obras_array ? prof.obras_array.join(', ') : prof.obras; document.getElementById('direcciones').value = prof.direcciones_array ? prof.direcciones_array.join('\n') : prof.direcciones; document.getElementById('instagram').value = prof.instagram || ''; document.getElementById('linkedin').value = prof.linkedin || ''; document.getElementById('facebook').value = prof.facebook || ''; document.getElementById('web').value = prof.web || ''; document.getElementById('precio').value = prof.precio || ''; document.getElementById('aboutMe').value = prof.sobreMi || '';
            if(prof.atencion) { document.getElementById('atencion-ninos').checked = prof.atencion.ninos || false; document.getElementById('atencion-adolescentes').checked = prof.atencion.adolescentes || false; document.getElementById('atencion-adultos').checked = prof.atencion.adultos || false; document.getElementById('atencion-terceraEdad').checked = prof.atencion.terceraEdad || false; }
            if(prof.terapias) { document.getElementById('terapia-individual').checked = prof.terapias.individual || false; document.getElementById('terapia-pareja').checked = prof.terapias.pareja || false; document.getElementById('terapia-familia').checked = prof.terapias.familia || false; }
            
            document.getElementById('modal-title').textContent = "Editar Anuncio"; modalRegistro.classList.remove('hidden');
            
            if(prof.coordenadas && prof.coordenadas.lat) { initFormMap(prof.coordenadas.lat, prof.coordenadas.lng); } else { initFormMap(); }
        });
    });

    document.querySelectorAll('.btn-delete').forEach(btn => { btn.addEventListener('click', async (e) => { if(confirm("¿Estás seguro de que deseas eliminar este anuncio?")) { await deleteDoc(doc(db, "profesionales", e.currentTarget.dataset.id)); showToast("Anuncio eliminado exitosamente"); cargarProfesionales(); } }); });
}

// ==========================================
// 13. SISTEMA DE BÚSQUEDA Y FILTRADO
// ==========================================
function quitarTildes(str) { if (!str) return ""; return str.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
function getFilteredProfesionales() {
    const textoOriginal = document.getElementById('input-search').value.toLowerCase().trim();
    const textoLimpio = quitarTildes(textoOriginal); const categoria = document.getElementById('select-category').value;
    return profesionalesCache.filter(prof => {
        const matchCategoria = categoria === 'Todas' || prof.categoria === categoria; if (textoLimpio === '') return matchCategoria;
        let bolsaDePalabras = [ prof.nombre, prof.sintomas, prof.terapia, prof.modalidad, prof.precio, prof.sobreMi, prof.direcciones_array ? prof.direcciones_array.join(' ') : prof.direcciones, prof.obras_array ? prof.obras_array.join(' ') : prof.obras ];
        if (prof.atencion) { if (prof.atencion.ninos) bolsaDePalabras.push("niños", "infantil", "ninos"); if (prof.atencion.adolescentes) bolsaDePalabras.push("adolescentes"); if (prof.atencion.adultos) bolsaDePalabras.push("adultos"); if (prof.atencion.terceraEdad) bolsaDePalabras.push("tercera edad", "mayores", "ancianos"); }
        if (prof.terapias) { if (prof.terapias.individual) bolsaDePalabras.push("individual"); if (prof.terapias.pareja) bolsaDePalabras.push("pareja", "matrimonio", "matrimonial"); if (prof.terapias.familia) bolsaDePalabras.push("familia", "familiar"); }
        return matchCategoria && quitarTildes(bolsaDePalabras.join(' ').toLowerCase()).includes(textoLimpio);
    });
}
function aplicarFiltros() { const filtrados = getFilteredProfesionales(); renderCards(filtrados); if (!modalMapa.classList.contains('hidden')) { renderizarMarcadores(); } }
document.getElementById('input-search').addEventListener('input', aplicarFiltros); document.getElementById('select-category').addEventListener('change', aplicarFiltros);
cargarProfesionales();