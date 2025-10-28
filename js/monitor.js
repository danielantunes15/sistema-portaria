// js/monitor.js - Lógica do Mapa de Monitoramento

let mapInstance = null;
let vehicleLayer = null; // Camada para os veículos
let sectorLayer = null; // Camada para os setores

// Coordenada Central da Usina (ponto médio entre portaria e estacionamento)
const usinaCoords = [-17.644579, -40.181540];

// 1. Mapeamento de Setores para Coordenadas
const SETOR_LOCATIONS = {
    // Coordenadas Reais
    'Portaria': [-17.645425, -40.181674],
    'Estacionamento': [-17.643734, -40.181406],
    
    // Coordenadas Simuladas (ajuste conforme o mapa real)
    'Administrativo': [-17.6435, -40.1818], 
    'Indústria': [-17.6440, -40.1825],
    'Agrícola': [-17.6450, -40.1808], 
    'Manutenção': [-17.6430, -40.1810], 

    // Local padrão para setores não mapeados
    'default': [-17.6448, -40.1820] 
};

// 2. Ícones customizados (usando Iconify API)
const iconPortaria = L.icon({
    iconUrl: 'https://api.iconify.design/mdi/gate.svg?color=%23f9a826&width=32&height=32',
    iconSize: [32, 32],
    iconAnchor: [16, 32], 
    popupAnchor: [0, -32] 
});

const iconSetor = L.icon({
    iconUrl: 'https://api.iconify.design/mdi/office-building.svg?color=%233b82f6&width=28&height=28',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
});

const iconEstacionamento = L.icon({
    iconUrl: 'https://api.iconify.design/mdi/parking.svg?color=%233b82f6&width=28&height=28',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
});


// Função que retorna um ícone de veículo
const iconVeiculo = (tipo) => {
    let iconName = 'car';
    if (tipo === 'caminhao') iconName = 'truck';
    if (tipo === 'onibus') iconName = 'bus';
    if (tipo === 'moto') iconName = 'motorcycle';
    if (tipo === 'van') iconName = 'van-utility';

    return L.icon({
        iconUrl: `https://api.iconify.design/mdi/${iconName}.svg?color=%23ffffff&width=24&height=24`,
        iconSize: [24, 24],
        className: 'vehicle-icon'
    });
};


// 3. Inicialização do Mapa (Roda só uma vez)
function initMap() {
    if (mapInstance) {
        mapInstance.invalidateSize();
        return; // Mapa já foi inicializado
    }
    
    try {
        const mapContainer = document.getElementById('map-container');
        if (!mapContainer) return; 

        // =============================================
        // (ALTERAÇÃO) DEFINIÇÃO DAS CAMADAS DE MAPA
        // =============================================
        
        // (NOVA CAMADA) Google Satélite (Híbrido - com ruas)
        const camadaGoogleSatelite = L.tileLayer('http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
            maxZoom: 20,
            subdomains:['mt0','mt1','mt2','mt3'],
            attribution: 'Dados do Mapa &copy; Google'
        });

        // Camada 2: Satélite (Esri) - Alternativa
        const camadaSateliteEsri = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; GlobalPort System'
        });

        // Camada 3: Ruas (OpenStreetMap)
        const camadaRuas = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        });

        // (ALTERADO) Objeto de camadas base para o controlo
        const baseLayers = {
            "Google Satélite": camadaGoogleSatelite,
            "Esri Satélite": camadaSateliteEsri,
            "Ruas (OSM)": camadaRuas
        };

        // =============================================
        // (ALTERAÇÃO) INICIALIZAÇÃO DO MAPA
        // =============================================
        mapInstance = L.map('map-container', {
            center: usinaCoords,
            zoom: 18,
            layers: [camadaGoogleSatelite] // (PADRÃO ALTERADO) Define Google como a camada padrão
        });

        // Adiciona o controlo de camadas ao mapa
        L.control.layers(baseLayers).addTo(mapInstance);

        // Camada para os setores e veículos
        sectorLayer = L.layerGroup().addTo(mapInstance);
        vehicleLayer = L.layerGroup().addTo(mapInstance);

        // 4. Adicionar Marcadores Fixos (Portaria e Setores)
        L.marker(SETOR_LOCATIONS['Portaria'], { icon: iconPortaria, zIndexOffset: 1000 })
            .addTo(mapInstance)
            .bindPopup('<b>Portaria Principal</b>');
            
        setores.forEach(setor => {
            const loc = SETOR_LOCATIONS[setor.nome] || SETOR_LOCATIONS['default'];
            const icon = (setor.nome === 'Estacionamento') ? iconEstacionamento : iconSetor;
            
            if (!SETOR_LOCATIONS[setor.nome]) {
                 loc[0] += (Math.random() - 0.5) * 0.0001;
                 loc[1] += (Math.random() - 0.5) * 0.0001;
            }
            
            L.marker(loc, { icon: icon })
                .addTo(sectorLayer)
                .bindPopup(`<b>Setor: ${setor.nome}</b>`);
        });
        
    } catch (e) {
        console.error("Erro ao inicializar o mapa:", e);
        document.getElementById('map-container').innerHTML = "Erro ao carregar mapa. Verifique a conexão.";
    }
}

// 5. Atualização do Monitor (Roda toda vez que a página é exibida)
function atualizarMonitor() {
    if (!mapInstance) {
        console.warn("Mapa não inicializado, pulando atualização.");
        return;
    }
    
    mapInstance.invalidateSize();
    
    vehicleLayer.clearLayers();
    const feedList = document.getElementById('live-feed-list');
    feedList.innerHTML = '';

    const veiculosNoPatio = registros.filter(reg => reg.status === 'dentro');

    if (veiculosNoPatio.length === 0) {
        feedList.innerHTML = '<p style="color: var(--text-light); text-align: center; padding: 1rem;">Nenhum veículo no pátio.</p>';
        return;
    }
    
    veiculosNoPatio.sort((a, b) => b.timestamp_entrada - a.timestamp_entrada); // Mais recentes primeiro

    veiculosNoPatio.forEach(reg => {
        // A. Adiciona ao Feed Lateral
        const icon = reg.tipo_veiculo === 'caminhao' ? '🚛' : (reg.tipo_veiculo === 'onibus' ? '🚌' : '🚗');
        const tempoNoPatio = ((new Date().getTime() - reg.timestamp_entrada) / 60000).toFixed(0); // Em minutos
        let tempoDisplay = `${tempoNoPatio} min`;
        if (tempoNoPatio > 60) {
            tempoDisplay = `${(tempoNoPatio / 60).toFixed(1)} h`;
        }

        feedList.innerHTML += `
            <div class="live-feed-item">
                <div class="live-feed-icon">${icon}</div>
                <div class="live-feed-info">
                    <strong>${reg.placa_veiculo}</strong>
                    <span>${reg.empresa} (${reg.nome || 'N/A'})</span>
                    <span>Destino: ${reg.setor_destino}</span>
                    <span class="tempo-patio">No pátio há ${tempoDisplay}</span>
                </div>
            </div>
        `;

        // B. Adiciona ao Mapa
        let localizacao = SETOR_LOCATIONS[reg.setor_destino] || SETOR_LOCATIONS['default'];
        
        const offsetLat = (Math.random() - 0.5) * 0.00008;
        const offsetLng = (Math.random() - 0.5) * 0.00008;
        
        const popupContent = `
            <b>Placa: ${reg.placa_veiculo}</b><br>
            Empresa: ${reg.empresa}<br>
            Responsável: ${reg.nome || 'N/A'}<br>
            Entrada: ${reg.data_hora_entrada.split(' ')[1]}
        `;

        L.marker([localizacao[0] + offsetLat, localizacao[1] + offsetLng], { 
            icon: iconVeiculo(reg.tipo_veiculo) 
        })
        .addTo(vehicleLayer)
        .bindPopup(popupContent);
    });
}