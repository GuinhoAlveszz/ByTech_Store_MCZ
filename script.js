document.addEventListener("DOMContentLoaded", () => {
    const loader = document.getElementById('loading');
    if(loader) loader.classList.add('hidden');
});

const CONFIG = {
    whatsappNumber: "5582994165240", 
    storeLocation: { lat: -9.5534, lng: -35.7585 }, // Maceió
    locationLink: "https://maps.google.com/?q=-9.5534,-35.7585", // Link direto
    prices: { baseFee: 10.00, midFee: 20.00, perKm: 4.00 }
};

// ==========================================
// 📱 NAVEGAÇÃO ENTRE TELAS
// ==========================================

function goToDiagnosis() {
    document.getElementById('home-screen').classList.remove('active');
    document.getElementById('home-screen').classList.add('hidden');
    
    const diagScreen = document.getElementById('diagnosis-screen');
    diagScreen.classList.remove('hidden');
    diagScreen.classList.add('active');
    
    // Reinicia o diagnóstico sempre que entra
    renderStep('start');
}

function exitDiagnosis() {
    document.getElementById('diagnosis-screen').classList.remove('active');
    document.getElementById('diagnosis-screen').classList.add('hidden');
    
    const homeScreen = document.getElementById('home-screen');
    homeScreen.classList.remove('hidden');
    homeScreen.classList.add('active');
}

function openWhatsApp() {
    window.open(`https://wa.me/${CONFIG.whatsappNumber}`, '_blank');
}

function openMap() {
    // Abre direto no Google Maps com o CEP ou Coordenadas
    window.open(`https://www.google.com/maps/search/?api=1&query=57071-202`, '_blank');
}

// ==========================================
// 🌳 ÁRVORE DE DECISÃO (Mesma lógica anterior)
// ==========================================
const decisionTree = {
    start: {
        question: "O que está havendo?",
        options: [
            { text: "Não Liga", icon: "fa-power-off", next: "power" },
            { text: "Lentidão", icon: "fa-gauge-high", next: "slow" },
            { text: "Tela Azul", icon: "fa-triangle-exclamation", next: "blue" },
            { text: "Barulhos", icon: "fa-volume-high", next: "noise" },
            { text: "Internet", icon: "fa-wifi", next: "net" }
        ]
    },
    power: {
        question: "Sintoma principal:",
        options: [
            { text: "Nada acontece", result: "Fonte ou Placa-mãe queimada." },
            { text: "Luz acende, sem imagem", result: "Erro de Memória ou Vídeo." },
            { text: "Liga e desliga", result: "Curto ou Superaquecimento." }
        ]
    },
    slow: {
        question: "Quando trava?",
        options: [
            { text: "Ao iniciar Windows", result: "HD Lento. Recomendado SSD." },
            { text: "Ao abrir programas", result: "Falta de Memória RAM." },
            { text: "Aleatoriamente", result: "Sistema corrompido ou Vírus." }
        ]
    },
    blue: {
        question: "Frequência do erro:",
        options: [
            { text: "Em jogos/pesado", result: "Superaquecimento/Fonte." },
            { text: "Qualquer momento", result: "Memória RAM ou Drivers." }
        ]
    },
    noise: {
        question: "Tipo de barulho:",
        options: [
            { text: "Vento forte", result: "Cooler sujo/esforçado." },
            { text: "Estalos (tec-tec)", result: "HD Falhando (Risco de Dados)." }
        ]
    },
    net: {
        question: "Detalhe:",
        options: [
            { text: "Não acha redes", result: "Placa Wi-Fi ou Driver." },
            { text: "Cai toda hora", result: "Interferência ou Configuração." }
        ]
    }
};

let historyStack = [];
let currentDiagnosis = "";
let deliveryInfo = { address: "", fee: 0, type: "" };

const contentDiv = document.getElementById('dynamic-content');
const backBtn = document.getElementById('btn-back');
const loader = document.getElementById('loading');

function renderStep(stepKey) {
    const step = decisionTree[stepKey];
    
    if (stepKey === 'start') {
        historyStack = [];
        backBtn.classList.add('hidden');
    } else {
        backBtn.classList.remove('hidden');
    }

    let html = `<h2 class="question-title">${step.question}</h2><div class="options-grid">`;

    step.options.forEach(opt => {
        if (opt.next) {
            html += createCard(opt.text, opt.icon, `nextStep('${stepKey}', '${opt.next}')`);
        } else {
            const safeResult = opt.result.replace(/'/g, "\\'");
            const safeText = opt.text.replace(/'/g, "\\'");
            html += createCard(opt.text, opt.icon, `showResult('${stepKey}', '${safeResult}', '${safeText}')`);
        }
    });

    html += `</div>`;
    contentDiv.innerHTML = html;
}

function createCard(text, icon, action) {
    return `
        <div class="option-card" onclick="${action}">
            ${icon ? `<i class="fas ${icon} option-icon"></i>` : ''}
            <span>${text}</span>
            <i class="fas fa-chevron-right" style="margin-left:auto; opacity:0.3;"></i>
        </div>
    `;
}

function nextStep(currentKey, nextKey) {
    historyStack.push({ type: 'question', key: currentKey });
    renderStep(nextKey);
}

function showResult(prevKey, diagnosis, symptom) {
    historyStack.push({ type: 'question', key: prevKey });
    currentDiagnosis = `${symptom} -> ${diagnosis}`;

    const html = `
        <div class="result-card">
            <i class="fas fa-check-circle fa-3x" style="color: var(--neon-green); margin-bottom:15px;"></i>
            <h3>Pré-Diagnóstico</h3>
            <div class="diagnosis-box">
                <strong>Detectado:</strong><br> ${diagnosis}
            </div>
            
            <button class="btn btn-outline" onclick="selectDelivery('store')">
                🏢 Levar na Loja (Grátis)
            </button>
            <button class="btn btn-primary" onclick="showLocationForm()">
                🛵 Pedir Busca (Taxa)
            </button>
        </div>
    `;
    contentDiv.innerHTML = html;
}

function showLocationForm() {
    historyStack.push({ type: 'result_screen', diagnosis: currentDiagnosis });
    const html = `
        <div class="result-card">
            <h3>Calcular Taxa</h3>
            <button class="btn btn-primary" onclick="getLocationGPS()">📍 Usar GPS</button>
            <div style="margin:10px 0; opacity:0.5; font-size:0.8rem">OU</div>
            <input type="text" id="cepInput" placeholder="CEP" maxlength="9" onkeyup="mascaraCep(this)">
            <button class="btn btn-outline" onclick="getLocationCEP()">Calcular CEP</button>
            <div id="fee-result" class="diagnosis-box hidden"></div>
            <button id="btn-final" class="btn btn-success hidden" onclick="finalizeWhatsApp()">✅ Enviar no WhatsApp</button>
        </div>
    `;
    contentDiv.innerHTML = html;
}

function goBack() {
    if (historyStack.length === 0) return exitDiagnosis(); // Volta pra home se não tiver histórico
    
    const lastState = historyStack.pop();
    if (lastState.type === 'question') {
        renderStep(lastState.key);
    } else if (lastState.type === 'result_screen') {
        const questionBeforeResult = historyStack.pop();
        if(questionBeforeResult) renderStep(questionBeforeResult.key);
        else renderStep('start');
    }
}

// Funções de GPS e CEP (Mantidas iguais, apenas abreviadas aqui para caber)
function getLocationGPS() {
    if (!navigator.geolocation) return alert("GPS desligado.");
    loader.classList.remove('hidden');
    navigator.geolocation.getCurrentPosition(pos => {
        const dist = calculateDistance(CONFIG.storeLocation.lat, CONFIG.storeLocation.lng, pos.coords.latitude, pos.coords.longitude);
        const fee = calculateFeeValue(dist);
        deliveryInfo = { type: 'Busca (GPS)', fee: fee, address: 'Localização GPS' };
        showFeeResult(dist, fee, "Via Satélite");
        loader.classList.add('hidden');
    }, () => { loader.classList.add('hidden'); alert("Erro GPS"); });
}

async function getLocationCEP() {
    const cep = document.getElementById('cepInput').value.replace(/\D/g, '');
    if (cep.length !== 8) return alert("CEP inválido");
    loader.classList.remove('hidden');
    try {
        const req = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await req.json();
        if(data.erro) throw new Error();
        deliveryInfo = { type: 'Busca (CEP)', fee: 'A Combinar', address: `${data.logradouro}` };
        document.getElementById('fee-result').innerHTML = `<strong>End:</strong> ${data.logradouro}<br><strong>Taxa:</strong> No WhatsApp`;
        document.getElementById('fee-result').classList.remove('hidden');
        document.getElementById('btn-final').classList.remove('hidden');
    } catch(e) { alert("Erro CEP"); } finally { loader.classList.add('hidden'); }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

function calculateFeeValue(km) {
    if (km <= 3) return CONFIG.prices.baseFee;
    if (km <= 7) return CONFIG.prices.midFee;
    return CONFIG.prices.midFee + ((km - 7) * CONFIG.prices.perKm);
}

function showFeeResult(km, fee, text) {
    const div = document.getElementById('fee-result');
    div.innerHTML = `<strong>${text}</strong><br>${km.toFixed(1)}km - <strong style="color:#0f0">R$ ${fee.toFixed(2)}</strong>`;
    div.classList.remove('hidden');
    document.getElementById('btn-final').classList.remove('hidden');
}

function selectDelivery(type) {
    deliveryInfo = { type: 'Levar na Loja', fee: 0, address: 'Cliente entrega' };
    finalizeWhatsApp();
}

function finalizeWhatsApp() {
    let msg = `*ByTech App*\nDiagnóstico: ${currentDiagnosis}\nModo: ${deliveryInfo.type}`;
    if(deliveryInfo.type !== 'Levar na Loja') msg += `\nEnd: ${deliveryInfo.address}\nTaxa: ${deliveryInfo.fee}`;
    window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
}


function mascaraCep(t) { t.value = t.value.replace(/\D/g,"").replace(/^(\d{5})(\d)/,"$1-$2"); }
