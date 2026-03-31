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

// Tu email de administrador
const ADMIN_EMAIL = "tu_correo@gmail.com"; 

// Variables de Estado
let profesionalesCache = [];
let favoritos = JSON.parse(localStorage.getItem('fav_salud_mental')) || [];
let currentRole = 'visitante'; 
let loginIntent = ''; 

// Datos locales del paciente
let datosPaciente = { nombre: '', motivo: '' };

// Ícono SVG de WhatsApp para botones
const svgWhatsApp = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/></svg>`;

// DOM
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

document.getElementById('current-year').textContent = new Date().getFullYear();

// ==========================================
// AUTENTICACIÓN Y ROLES
// ==========================================
btnLoginPaciente.addEventListener('click', async () => { loginIntent = 'paciente'; signInWithPopup(auth, provider); });
btnLoginProf.addEventListener('click', async () => { loginIntent = 'profesional'; signInWithPopup(auth, provider); });
btnLogout.addEventListener('click', () => signOut(auth));

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
            btnOpenModalProf.classList.remove('hidden');
            btnOpenModalPac.classList.add('hidden');
        } else if (currentRole === 'profesional') {
            roleBadge.textContent = '👨‍⚕️ Profesional'; roleBadge.classList.add('prof');
            btnOpenModalProf.classList.remove('hidden');
            btnOpenModalPac.classList.add('hidden');
        } else {
            roleBadge.textContent = '👤 Paciente'; roleBadge.classList.add('pac');
            btnOpenModalProf.classList.add('hidden');
            btnOpenModalPac.classList.remove('hidden'); 
        }
    } else {
        currentRole = 'visitante';
        datosPaciente = { nombre: '', motivo: '' };
        btnLoginPaciente.classList.remove('hidden');
        btnLoginProf.classList.remove('hidden');
        btnLogout.classList.add('hidden');
        btnOpenModalProf.classList.add('hidden');
        btnOpenModalPac.classList.add('hidden');
        roleBadge.classList.add('hidden');
    }
    cargarProfesionales();
});

// ==========================================
// LÓGICA DEL LOADER (Animación inicial)
// ==========================================
function handleIntroLoader() {
    const loader = document.getElementById('intro-loader');
    if (!loader) return;
    const duration = 2500; 
    setTimeout(() => { loader.classList.add('hidden'); }, duration);
}
window.addEventListener('load', handleIntroLoader);

// ==========================================
// CERRAR MODALES Y ABRIR
// ==========================================
document.getElementById('btn-close-modal').addEventListener('click', () => modalRegistro.classList.add('hidden'));
document.getElementById('btn-close-paciente').addEventListener('click', () => modalPaciente.classList.add('hidden'));
document.getElementById('btn-close-ficha').addEventListener('click', () => modalFicha.classList.add('hidden'));

btnOpenModalProf.addEventListener('click', () => {
    formProfesional.reset(); document.getElementById('anuncio-id').value = ''; 
    modalTitle.textContent = "Crear Nuevo Anuncio"; modalRegistro.classList.remove('hidden');
});

btnOpenModalPac.addEventListener('click', () => {
    renderFavoritosPaciente();
    modalPaciente.classList.remove('hidden');
});

// ==========================================
// FICHA PACIENTE Y FAVORITOS
// ==========================================
formPaciente.addEventListener('submit', async (e) => {
    e.preventDefault();
    if(!auth.currentUser) return;
    
    const nombre = document.getElementById('paciente-nombre').value;
    const motivo = document.getElementById('paciente-motivo').value;

    try {
        await setDoc(doc(db, "users", auth.currentUser.uid), { nombrePaciente: nombre, motivoPaciente: motivo }, { merge: true });
        datosPaciente.nombre = nombre; datosPaciente.motivo = motivo;
        alert("¡Tus datos privados han sido guardados!");
        modalPaciente.classList.add('hidden');
        renderCards(profesionalesCache); 
    } catch (e) { console.error(e); alert("Error al guardar la ficha."); }
});

function renderFavoritosPaciente() {
    const contenedor = document.getElementById('lista-favoritos-paciente');
    if (favoritos.length === 0) {
        contenedor.innerHTML = '<p style="color: var(--text-muted); font-size: 0.95rem;">Todavía no has guardado a ningún profesional.</p>';
        return;
    }

    const profsFavoritos = profesionalesCache.filter(prof => favoritos.includes(prof.id));
    if (profsFavoritos.length === 0) {
        contenedor.innerHTML = '<p style="color: var(--text-muted); font-size: 0.95rem;">Los profesionales que guardaste ya no están disponibles.</p>';
        return;
    }

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
                    <a href="${waLink}" target="_blank" class="btn-whatsapp" style="padding: 0.4rem 0.6rem; border-radius: 6px; display: inline-flex; align-items: center;" title="Contactar">${svgWhatsApp}</a>
                    <button class="btn-small del btn-quitar-fav" data-id="${prof.id}" title="Eliminar de favoritos">🗑️</button>
                </div>
            </div>
        `;
    });
    contenedor.innerHTML = html;

    document.querySelectorAll('.btn-quitar-fav').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            favoritos = favoritos.filter(fav => fav !== id);
            localStorage.setItem('fav_salud_mental', JSON.stringify(favoritos));
            renderFavoritosPaciente(); 
            renderCards(profesionalesCache); 
        });
    });
}

// ==========================================
// GUARDAR ANUNCIO PROFESIONAL
// ==========================================
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
        
        // Especialidades ahora es opcional
        sintomas: document.getElementById('specialties').value || null, 
        
        obras_array: arrayObras,
        direcciones_array: arrayDirecciones,
        
        // Redes y Contacto Adicional
        instagram: document.getElementById('instagram').value || null,
        linkedin: document.getElementById('linkedin').value || null,
        facebook: document.getElementById('facebook').value || null,
        web: document.getElementById('web').value || null,
        
        precio: document.getElementById('precio').value || null,
        sobreMi: document.getElementById('aboutMe').value || null,
        
        atencion: {
            ninos: document.getElementById('atencion-ninos').checked,
            adolescentes: document.getElementById('atencion-adolescentes').checked,
            adultos: document.getElementById('atencion-adultos').checked,
            terceraEdad: document.getElementById('atencion-terceraEdad').checked
        },
        terapias: {
            individual: document.getElementById('terapia-individual').checked,
            pareja: document.getElementById('terapia-pareja').checked,
            familia: document.getElementById('terapia-familia').checked
        },
        updatedAt: serverTimestamp()
    };

    try {
        if (anuncioId) {
            await updateDoc(doc(db, "profesionales", anuncioId), datosAnuncio);
            alert("¡Anuncio actualizado!");
        } else {
            datosAnuncio.createdAt = serverTimestamp();
            await addDoc(collection(db, "profesionales"), datosAnuncio);
            alert("¡Anuncio publicado!");
        }
        formProfesional.reset(); modalRegistro.classList.add('hidden');
        cargarProfesionales(); 
    } catch (error) { console.error(error); alert("Error al guardar."); }
});

// ==========================================
// RENDERIZAR TARJETAS Y FICHA
// ==========================================
async function cargarProfesionales() {
    try {
        const querySnapshot = await getDocs(collection(db, "profesionales"));
        profesionalesCache = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        profesionalesCache.sort((a, b) => a.nombre.localeCompare(b.nombre));
        renderCards(profesionalesCache);
    } catch (error) { console.error(error); }
}

function getWhatsAppLink(numeroProf) {
    let mensaje = "Hola, te contacto desde Ariadna (Red Paravachasca).";
    if (datosPaciente.nombre) mensaje = `Hola, mi nombre es ${datosPaciente.nombre}. Te contacto desde Ariadna.`;
    return `https://wa.me/${numeroProf}?text=${encodeURIComponent(mensaje)}`;
}

function getAvatarData(name) {
    const words = name.trim().split(' ');
    let initials = '';
    if (words.length > 1) { initials = (words[0][0] + words[1][0]).toUpperCase(); } 
    else if (words.length === 1 && words[0] !== '') { initials = words[0].substring(0, 2).toUpperCase(); }
    const colors = ['#2c5282', '#38b2ac', '#c07d5e', '#2c7a7b', '#1a2e2b'];
    return { initials, color: colors[name.length % colors.length] };
}

function renderCards(data) {
    grid.innerHTML = '';
    if(data.length === 0) { 
        grid.innerHTML = `<div class="empty-state"><h3>No encontramos lo que buscás</h3><p>Intentá usar otras palabras, o ampliá tu búsqueda.</p></div>`; 
        return; 
    }

    data.forEach((prof, index) => {
        const isFav = favoritos.includes(prof.id);
        const avatar = getAvatarData(prof.nombre);
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

        // Favoritos: Oculto si el usuario es Profesional o Admin
        let btnFavHtml = '';
        if(currentRole === 'paciente' || currentRole === 'visitante') {
            btnFavHtml = `<button class="btn-icon btn-fav ${isFav ? 'fav-active' : ''}" data-id="${prof.id}" title="Favoritos">${isFav ? '❤️' : '🤍'}</button>`;
        }

        const waLink = getWhatsAppLink(prof.whatsapp);

        let atiendeHTML = '';
        if(prof.atencion) {
            let edades = [];
            if(prof.atencion.ninos) edades.push("Niños");
            if(prof.atencion.adolescentes) edades.push("Adolescentes");
            if(prof.atencion.adultos) edades.push("Adultos");
            if(prof.atencion.terceraEdad) edades.push("Tercera Edad");
            if(edades.length > 0) atiendeHTML = `<p><strong>Atiende:</strong> ${edades.join(', ')}</p>`;
        }

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
                <div class="card-tags-list">
                    ${atiendeHTML}
                </div>
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
    // Ver Ficha Completa
    document.querySelectorAll('.btn-perfil').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            const prof = profesionalesCache.find(p => p.id === id);
            
            let dirList = prof.direcciones_array || (prof.direcciones ? prof.direcciones.split('\n') : []);
            let obrasList = prof.obras_array || (prof.obras ? prof.obras.split(',') : []);

            let redesHtml = '';
            if(prof.instagram) redesHtml += `<a href="${prof.instagram}" target="_blank">📷 Instagram</a>`;
            if(prof.facebook) redesHtml += `<a href="${prof.facebook}" target="_blank">📘 Facebook</a>`;
            if(prof.linkedin) redesHtml += `<a href="${prof.linkedin}" target="_blank">💼 LinkedIn</a>`;
            if(prof.web) redesHtml += `<a href="${prof.web}" target="_blank">🌐 Web</a>`;

            const waLink = getWhatsAppLink(prof.whatsapp);

            let sobreMiHTML = prof.sobreMi ? `<h4>Sobre mí</h4><p>${prof.sobreMi}</p>` : '';
            let precioFichaHTML = prof.precio ? `<p class="ficha-session-price" style="margin-top:1rem;"><strong>Valor sesión particular:</strong> ${prof.precio}</p>` : '';
            let especialidadesHTML = prof.sintomas ? `<p style="margin-top:1rem;"><strong>Especialidades / Áreas:</strong> ${prof.sintomas}</p>` : '';

            let atiendeHTML = '';
            if(prof.atencion) {
                let edades = [];
                if(prof.atencion.ninos) edades.push("Niños");
                if(prof.atencion.adolescentes) edades.push("Adolescentes");
                if(prof.atencion.adultos) edades.push("Adultos");
                if(prof.atencion.terceraEdad) edades.push("Tercera Edad");
                if(edades.length > 0) atiendeHTML = `<p><strong>Edades que atiende:</strong> ${edades.join(', ')}</p>`;
            }

            let terapiasHTML = '';
            if(prof.terapias) {
                let tipos = [];
                if(prof.terapias.individual) tipos.push("Individual");
                if(prof.terapias.pareja) tipos.push("Pareja");
                if(prof.terapias.familia) tipos.push("Familia");
                if(tipos.length > 0) terapiasHTML = `<p><strong>Formatos:</strong> ${tipos.join(', ')}</p>`;
            }

            fichaBody.innerHTML = `
                <div class="ficha-perfil">
                    <div>
                        <span class="prof-category">${prof.categoria}</span>
                        <h3>${prof.nombre}</h3>
                        <p><strong>Matrícula:</strong> ${prof.matricula}</p>
                    </div>
                    
                    ${sobreMiHTML}
                    
                    <h4>Enfoque y Atención</h4>
                    <p><strong>Modalidad:</strong> ${prof.modalidad}</p>
                    <p><strong>Marco Teórico:</strong> ${prof.terapia}</p>
                    
                    <div class="ficha-details-list">
                        ${atiendeHTML}
                        ${terapiasHTML}
                    </div>
                    
                    ${especialidadesHTML}
                    ${precioFichaHTML}
                    
                    <h4>Dónde Atiende</h4>
                    ${dirList.map(d => `<p>📍 ${d}</p>`).join('')}

                    <h4>Obras Sociales / Prepagas</h4>
                    <div class="tags-container" style="margin-top:0">${obrasList.map(o => `<span class="tag">${o}</span>`).join('')}</div>
                    
                    ${redesHtml ? `<h4>Contacto Adicional</h4><div class="social-links">${redesHtml}</div>` : ''}

                    <a href="${waLink}" target="_blank" class="btn btn-whatsapp full-width" style="margin-top:2rem; text-decoration:none; display:flex; justify-content:center; border-radius:8px;">
                        ${svgWhatsApp} Enviar mensaje por WhatsApp
                    </a>
                </div>
            `;
            modalFicha.classList.remove('hidden');
        });
    });

    document.querySelectorAll('.btn-fav').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if(!auth.currentUser || currentRole !== 'paciente') return alert("Inicia sesión como paciente para guardar favoritos.");
            const id = e.currentTarget.dataset.id;
            if(favoritos.includes(id)) { favoritos = favoritos.filter(fav => fav !== id); } else { favoritos.push(id); }
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
            document.getElementById('specialties').value = prof.sintomas || ''; 
            document.getElementById('obras').value = prof.obras_array ? prof.obras_array.join(', ') : prof.obras;
            document.getElementById('direcciones').value = prof.direcciones_array ? prof.direcciones_array.join('\n') : prof.direcciones;
            
            document.getElementById('instagram').value = prof.instagram || '';
            document.getElementById('linkedin').value = prof.linkedin || '';
            document.getElementById('facebook').value = prof.facebook || '';
            document.getElementById('web').value = prof.web || '';
            
            document.getElementById('precio').value = prof.precio || '';
            document.getElementById('aboutMe').value = prof.sobreMi || '';
            
            if(prof.atencion) {
                document.getElementById('atencion-ninos').checked = prof.atencion.ninos || false;
                document.getElementById('atencion-adolescentes').checked = prof.atencion.adolescentes || false;
                document.getElementById('atencion-adultos').checked = prof.atencion.adultos || false;
                document.getElementById('atencion-terceraEdad').checked = prof.atencion.terceraEdad || false;
            }
            if(prof.terapias) {
                document.getElementById('terapia-individual').checked = prof.terapias.individual || false;
                document.getElementById('terapia-pareja').checked = prof.terapias.pareja || false;
                document.getElementById('terapia-familia').checked = prof.terapias.familia || false;
            }

            document.getElementById('modal-title').textContent = "Editar Anuncio";
            document.getElementById('modal-registro').classList.remove('hidden');
        });
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if(confirm("¿Estás seguro de que deseas eliminar este anuncio?")) {
                await deleteDoc(doc(db, "profesionales", e.currentTarget.dataset.id));
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

// Init
cargarProfesionales();