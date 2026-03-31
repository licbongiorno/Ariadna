import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, setDoc, getDoc, updateDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Tu configuración de Firebase
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

// Variables
let profesionalesCache = [];
let favoritos = JSON.parse(localStorage.getItem('fav_salud_mental')) || [];
let currentRole = 'visitante'; 
let loginIntent = ''; 
let datosPaciente = { nombre: '', motivo: '' };

const svgWhatsApp = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/></svg>`;

const btnLoginPaciente = document.getElementById('btn-login-paciente');
const btnLoginProf = document.getElementById('btn-login-prof');
const btnLogout = document.getElementById('btn-logout');
const roleBadge = document.getElementById('user-role-badge');
const grid = document.getElementById('profesionales-grid');
const modalRegistro = document.getElementById('modal-registro');
const formProfesional = document.getElementById('form-profesional');
const modalPaciente = document.getElementById('modal-paciente');
const formPaciente = document.getElementById('form-paciente');
const modalFicha = document.getElementById('modal-ficha');

document.getElementById('current-year').textContent = new Date().getFullYear();

// ==========================================
// UTILIDADES PREMIUM (Toasts y Avatares)
// ==========================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✅' : '⚠️';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function getAvatarData(name) {
    const words = name.trim().split(' ');
    let initials = '';
    if (words.length > 1) {
        initials = (words[0][0] + words[1][0]).toUpperCase();
    } else if (words.length === 1 && words[0] !== '') {
        initials = words[0].substring(0, 2).toUpperCase();
    }
    
    // Paleta de colores cálidos de nuestra web
    const colors = ['#3b7d69', '#2a6052', '#c07d5e', '#a36345', '#1a2e2b'];
    // Asignamos color según la longitud del nombre para que sea constante
    const colorIndex = name.length % colors.length; 
    
    return { initials, color: colors[colorIndex] };
}

// ==========================================
// AUTENTICACIÓN
// ==========================================
btnLoginPaciente.addEventListener('click', async () => { loginIntent = 'paciente'; signInWithPopup(auth, provider); });
btnLoginProf.addEventListener('click', async () => { loginIntent = 'profesional'; signInWithPopup(auth, provider); });
btnLogout.addEventListener('click', () => { signOut(auth); showToast('Sesión cerrada correctamente'); });

onAuthStateChanged(auth, async (user) => {
    if (user) {
        if (loginIntent) {
            await setDoc(doc(db, "users", user.uid), { role: loginIntent, email: user.email }, { merge: true });
            loginIntent = ''; 
        }

        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            currentRole = userDoc.data().role;
            if(currentRole === 'paciente') {
                datosPaciente.nombre = userDoc.data().nombrePaciente || '';
                datosPaciente.motivo = userDoc.data().motivoPaciente || '';
                document.getElementById('paciente-nombre').value = datosPaciente.nombre;
                document.getElementById('paciente-motivo').value = datosPaciente.motivo;
            }
        } else { currentRole = 'paciente'; }

        if (user.email === ADMIN_EMAIL) currentRole = 'admin';

        btnLoginPaciente.classList.add('hidden');
        btnLoginProf.classList.add('hidden');
        btnLogout.classList.remove('hidden');
        roleBadge.classList.remove('hidden', 'prof', 'admin', 'pac');
        
        if (currentRole === 'admin') {
            roleBadge.textContent = '👑 Admin'; roleBadge.classList.add('admin');
            document.getElementById('btn-open-modal').classList.remove('hidden');
            document.getElementById('btn-open-modal-paciente').classList.add('hidden');
        } else if (currentRole === 'profesional') {
            roleBadge.textContent = '👨‍⚕️ Profesional'; roleBadge.classList.add('prof');
            document.getElementById('btn-open-modal').classList.remove('hidden');
            document.getElementById('btn-open-modal-paciente').classList.add('hidden');
        } else {
            roleBadge.textContent = '👤 Paciente'; roleBadge.classList.add('pac');
            document.getElementById('btn-open-modal').classList.add('hidden');
            document.getElementById('btn-open-modal-paciente').classList.remove('hidden'); 
        }
    } else {
        currentRole = 'visitante';
        datosPaciente = { nombre: '', motivo: '' };
        btnLoginPaciente.classList.remove('hidden');
        btnLoginProf.classList.remove('hidden');
        btnLogout.classList.add('hidden');
        document.getElementById('btn-open-modal').classList.add('hidden');
        document.getElementById('btn-open-modal-paciente').classList.add('hidden');
        roleBadge.classList.add('hidden');
    }
    cargarProfesionales();
});

// Modales
document.getElementById('btn-close-modal').addEventListener('click', () => modalRegistro.classList.add('hidden'));
document.getElementById('btn-close-paciente').addEventListener('click', () => modalPaciente.classList.add('hidden'));
document.getElementById('btn-close-ficha').addEventListener('click', () => modalFicha.classList.add('hidden'));

document.getElementById('btn-open-modal').addEventListener('click', () => {
    formProfesional.reset(); document.getElementById('anuncio-id').value = ''; 
    document.getElementById('modal-title').textContent = "Crear Nuevo Anuncio"; 
    modalRegistro.classList.remove('hidden');
});

document.getElementById('btn-open-modal-paciente').addEventListener('click', () => {
    renderFavoritosPaciente();
    modalPaciente.classList.remove('hidden');
});


function abrirFichaProfesional(id) {
    const prof = profesionalesCache.find(p => p.id === id);
    if(!prof) return;

    let dirList = prof.direcciones_array || (prof.direcciones ? prof.direcciones.split('\n') : []);
    let obrasList = prof.obras_array || (prof.obras ? prof.obras.split(',') : []);

    let redesHtml = '';
    if(prof.instagram) redesHtml += `<a href="${prof.instagram}" target="_blank">📷 Instagram</a>`;
    if(prof.linkedin) redesHtml += `<a href="${prof.linkedin}" target="_blank">💼 LinkedIn</a>`;

    const waLink = getWhatsAppLink(prof.whatsapp);

    document.getElementById('ficha-body').innerHTML = `
        <div class="ficha-perfil">
            <div>
                <span class="prof-category">${prof.categoria}</span>
                <h3>${prof.nombre}</h3>
                <p><strong>Matrícula:</strong> ${prof.matricula}</p>
            </div>
            
            <h4>Detalles de Atención</h4>
            <p><strong>Modalidad:</strong> ${prof.modalidad}</p>
            <p><strong>Enfoque:</strong> ${prof.terapia}</p>
            <p><strong>Atiende:</strong> ${prof.sintomas}</p>
            
            <h4>Direcciones</h4>
            ${dirList.map(d => `<p>📍 ${d}</p>`).join('')}

            <h4>Obras Sociales</h4>
            <div class="tags-container" style="margin-top:0">${obrasList.map(o => `<span class="tag">${o}</span>`).join('')}</div>
            
            ${redesHtml ? `<h4>Redes Sociales</h4><div class="social-links">${redesHtml}</div>` : ''}

            <a href="${waLink}" target="_blank" class="btn btn-whatsapp full-width" style="margin-top:2rem; text-decoration:none; display:flex; justify-content:center; border-radius:8px;">
                ${svgWhatsApp} Enviar mensaje por WhatsApp
            </a>
        </div>
    `;
    modalFicha.classList.remove('hidden');
}

// ==========================================
// FORMULARIOS
// ==========================================
formPaciente.addEventListener('submit', async (e) => {
    e.preventDefault();
    if(!auth.currentUser) return;
    
    const nombre = document.getElementById('paciente-nombre').value;
    const motivo = document.getElementById('paciente-motivo').value;

    try {
        await setDoc(doc(db, "users", auth.currentUser.uid), { nombrePaciente: nombre, motivoPaciente: motivo }, { merge: true });
        datosPaciente.nombre = nombre; datosPaciente.motivo = motivo;
        showToast("Tus datos privados han sido guardados");
        modalPaciente.classList.add('hidden');
        renderCards(profesionalesCache); 
    } catch (e) { showToast("Error al guardar la ficha", "error"); }
});

formProfesional.addEventListener('submit', async (e) => {
    e.preventDefault();
    if(!auth.currentUser) return;

    const anuncioId = document.getElementById('anuncio-id').value;
    const arrayObras = document.getElementById('obras').value.split(',').map(i => i.trim()).filter(i => i !== "");
    const arrayDirecciones = document.getElementById('direcciones').value.split('\n').map(i => i.trim()).filter(i => i !== "");

    const datosAnuncio = {
        uid: auth.currentUser.uid,
        nombre: document.getElementById('nombre').value,
        matricula: document.getElementById('matricula').value,
        whatsapp: document.getElementById('whatsapp').value.replace(/\D/g, ''),
        categoria: document.getElementById('categoria').value,
        modalidad: document.getElementById('modalidad').value,
        terapia: document.getElementById('terapia').value,
        sintomas: document.getElementById('sintomas').value,
        obras_array: arrayObras,
        direcciones_array: arrayDirecciones,
        instagram: document.getElementById('instagram').value || null,
        linkedin: document.getElementById('linkedin').value || null,
        updatedAt: serverTimestamp()
    };

    try {
        if (anuncioId) {
            await updateDoc(doc(db, "profesionales", anuncioId), datosAnuncio);
            showToast("Anuncio actualizado correctamente");
        } else {
            datosAnuncio.createdAt = serverTimestamp();
            await addDoc(collection(db, "profesionales"), datosAnuncio);
            showToast("¡Anuncio publicado en la red!");
        }
        formProfesional.reset(); modalRegistro.classList.add('hidden');
        cargarProfesionales(); 
    } catch (error) { showToast("Error al guardar el anuncio", "error"); }
});

// ==========================================
// RENDERIZADO PRINCIPAL
// ==========================================
function renderFavoritosPaciente() {
    const contenedor = document.getElementById('lista-favoritos-paciente');
    if (favoritos.length === 0) {
        contenedor.innerHTML = '<p style="color: var(--text-muted); font-size: 0.95rem;">Todavía no guardaste a nadie en tu hilo.</p>';
        return;
    }
    const profsFavoritos = profesionalesCache.filter(prof => favoritos.includes(prof.id));
    
    let html = '';
    profsFavoritos.forEach(prof => {
        const waLink = getWhatsAppLink(prof.whatsapp);
        html += `
            <div class="fav-item">
                <div class="fav-item-info">
                    <strong>${prof.nombre}</strong>
                    <span>${prof.categoria}</span>
                </div>
                <div class="fav-item-actions">
                    <button class="btn-small btn-ver-perfil-fav" data-id="${prof.id}" title="Ver Ficha Completa" style="background: var(--primary-light); color: var(--primary-dark); border-color: var(--primary-light);">👁️</button>
                    <a href="${waLink}" target="_blank" class="btn-whatsapp" style="padding: 0.4rem 0.6rem; border-radius: 6px; display: inline-flex; align-items: center;" title="Contactar">${svgWhatsApp}</a>
                    <button class="btn-small del btn-quitar-fav" data-id="${prof.id}" title="Eliminar de favoritos">🗑️</button>
                </div>
            </div>
        `;
    });
    contenedor.innerHTML = html;

    document.querySelectorAll('.btn-ver-perfil-fav').forEach(btn => btn.addEventListener('click', (e) => { modalPaciente.classList.add('hidden'); abrirFichaProfesional(e.currentTarget.dataset.id); }));
    document.querySelectorAll('.btn-quitar-fav').forEach(btn => btn.addEventListener('click', (e) => {
        favoritos = favoritos.filter(fav => fav !== e.currentTarget.dataset.id);
        localStorage.setItem('fav_salud_mental', JSON.stringify(favoritos));
        renderFavoritosPaciente(); renderCards(profesionalesCache); showToast("Profesional removido de tu hilo");
    }));
}

function actualizarEstadisticas(data) {
    const statsCont = document.getElementById('stats-banner');
    if(data.length === 0) { statsCont.classList.add('hidden'); return; }

    const conteo = { 'Psicólogo/a': 0, 'Psiquiatra': 0, 'Acompañante Terapéutico': 0, 'Otros': 0 };
    data.forEach(p => { if(conteo[p.categoria] !== undefined) conteo[p.categoria]++; else conteo['Otros']++; });

    statsCont.innerHTML = `
        <div class="stat-item"><span>${data.length}</span> Profesionales en la Red</div>
        ${conteo['Psicólogo/a'] > 0 ? `<div class="stat-item"><span>${conteo['Psicólogo/a']}</span> Psicólogos</div>` : ''}
        ${conteo['Psiquiatra'] > 0 ? `<div class="stat-item"><span>${conteo['Psiquiatra']}</span> Psiquiatras</div>` : ''}
    `;
    statsCont.classList.remove('hidden');
}

async function cargarProfesionales() {
    try {
        const querySnapshot = await getDocs(collection(db, "profesionales"));
        profesionalesCache = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        profesionalesCache.sort((a, b) => a.nombre.localeCompare(b.nombre));
        actualizarEstadisticas(profesionalesCache);
        renderCards(profesionalesCache);
    } catch (error) { showToast("Error de conexión", "error"); }
}

function getWhatsAppLink(numeroProf) {
    let mensaje = "Hola, te contacto desde Ariadna (Red Paravachasca).";
    if (datosPaciente.nombre) mensaje = `Hola, mi nombre es ${datosPaciente.nombre}. Te contacto desde Ariadna (Red Paravachasca).`;
    return `https://wa.me/${numeroProf}?text=${encodeURIComponent(mensaje)}`;
}

function renderCards(data) {
    grid.innerHTML = '';
    
    // EMPTY STATE CÁLIDO
    if(data.length === 0) { 
        grid.innerHTML = `
            <div class="empty-state">
                <h3>No encontramos lo que buscás</h3>
                <p>Intentá usar otras palabras, o ampliá tu búsqueda a "Todas las especialidades".</p>
            </div>
        `; 
        return; 
    }

    data.forEach((prof, index) => {
        const isFav = favoritos.includes(prof.id);
        const avatar = getAvatarData(prof.nombre); // Generamos el avatar
        let obrasList = prof.obras_array || (prof.obras ? prof.obras.split(',').map(o => o.trim()) : []);
        const tagsHTML = obrasList.slice(0, 3).map(obra => `<span class="tag">${obra}</span>`).join('') + (obrasList.length > 3 ? '<span class="tag">...</span>' : '');

        let adminHtml = '';
        if (auth.currentUser && (auth.currentUser.uid === prof.uid || currentRole === 'admin')) {
            adminHtml = `
                <div style="position:absolute; top:1rem; right:1rem; display:flex; gap:0.5rem;">
                    <button class="btn btn-outline btn-edit" data-id="${prof.id}" style="padding:0.2rem 0.5rem; font-size:0.8rem; background: var(--card-bg);">Editar</button>
                    <button class="btn btn-outline btn-delete" data-id="${prof.id}" style="padding:0.2rem 0.5rem; font-size:0.8rem; border-color:#ef4444; color:#ef4444; background: var(--card-bg);">Borrar</button>
                </div>
            `;
        }

        let btnFavHtml = '';
        if(currentRole === 'paciente' || currentRole === 'visitante') {
            btnFavHtml = `
                <button class="btn-icon btn-fav ${isFav ? 'fav-active' : ''}" data-id="${prof.id}" title="Guardar en Mi Hilo">
                    ${isFav ? '❤️' : '🤍'}
                </button>
            `;
        }

        const waLink = getWhatsAppLink(prof.whatsapp);
        const card = document.createElement('div');
        card.className = 'card';
        card.style.animationDelay = `${index * 0.05}s`;

        card.innerHTML = `
            ${adminHtml}
            <div class="card-header" style="margin-top: ${adminHtml ? '1rem' : '0'}">
                <div class="avatar" style="background-color: ${avatar.color}">${avatar.initials}</div>
                <div class="prof-info">
                    <h3 class="prof-name">${prof.nombre}</h3>
                    <span class="prof-category">${prof.categoria}</span>
                </div>
            </div>
            <div class="prof-details">
                <p><strong>Modalidad:</strong> ${prof.modalidad}</p>
                <p><strong>Enfoque:</strong> ${prof.terapia}</p>
            </div>
            <div class="tags-container">
                ${tagsHTML}
            </div>
            <div class="card-actions">
                <button class="btn btn-outline btn-perfil" data-id="${prof.id}" style="flex:1;">Ver Perfil</button>
                <a href="${waLink}" target="_blank" class="btn btn-whatsapp" style="flex:1; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; gap: 0.4rem; text-decoration: none;">
                    ${svgWhatsApp} Contactar
                </a>
                ${btnFavHtml}
            </div>
        `;
        grid.appendChild(card);
    });
    asignarEventosDinamicos();
}

function asignarEventosDinamicos() {
    document.querySelectorAll('.btn-perfil').forEach(btn => btn.addEventListener('click', (e) => abrirFichaProfesional(e.currentTarget.dataset.id)));
    document.querySelectorAll('.btn-fav').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if(!auth.currentUser || currentRole !== 'paciente') { showToast("Iniciá sesión como paciente para guardar tu hilo.", "error"); return; }
            const id = e.currentTarget.dataset.id;
            if(favoritos.includes(id)) { favoritos = favoritos.filter(fav => fav !== id); showToast("Profesional removido de tu hilo"); } 
            else { favoritos.push(id); showToast("Guardado en tu hilo personal");}
            localStorage.setItem('fav_salud_mental', JSON.stringify(favoritos));
            renderCards(profesionalesCache);
        });
    });

    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const prof = profesionalesCache.find(p => p.id === e.currentTarget.dataset.id);
            document.getElementById('anuncio-id').value = prof.id;
            document.getElementById('nombre').value = prof.nombre;
            document.getElementById('matricula').value = prof.matricula;
            document.getElementById('whatsapp').value = prof.whatsapp;
            document.getElementById('categoria').value = prof.categoria;
            document.getElementById('modalidad').value = prof.modalidad;
            document.getElementById('terapia').value = prof.terapia;
            document.getElementById('sintomas').value = prof.sintomas;
            document.getElementById('obras').value = prof.obras_array ? prof.obras_array.join(', ') : prof.obras;
            document.getElementById('direcciones').value = prof.direcciones_array ? prof.direcciones_array.join('\n') : prof.direcciones;
            document.getElementById('instagram').value = prof.instagram || '';
            document.getElementById('linkedin').value = prof.linkedin || '';
            document.getElementById('modal-title').textContent = "Editar Anuncio";
            modalRegistro.classList.remove('hidden');
        });
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if(confirm("¿Estás seguro de que deseas eliminar este anuncio?")) {
                await deleteDoc(doc(db, "profesionales", e.currentTarget.dataset.id));
                showToast("Anuncio eliminado exitosamente");
                cargarProfesionales();
            }
        });
    });
}

function aplicarFiltros() {
    const texto = document.getElementById('input-search').value.toLowerCase().trim();
    const categoria = document.getElementById('select-category').value;
    const filtrados = profesionalesCache.filter(prof => {
        const matchCategoria = categoria === 'Todas' || prof.categoria === categoria;
        const matchTexto = texto === '' || 
            (prof.nombre && prof.nombre.toLowerCase().includes(texto)) || 
            (prof.sintomas && prof.sintomas.toLowerCase().includes(texto)) ||
            (prof.terapia && prof.terapia.toLowerCase().includes(texto));
        return matchCategoria && matchTexto;
    });
    renderCards(filtrados);
}

document.getElementById('input-search').addEventListener('input', aplicarFiltros);
document.getElementById('select-category').addEventListener('change', aplicarFiltros);

cargarProfesionales();