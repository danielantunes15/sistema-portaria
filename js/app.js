// Dados em memória (simulando banco de dados)
let registros = JSON.parse(localStorage.getItem('registros_portaria')) || [];
let manobras = JSON.parse(localStorage.getItem('manobras_portaria')) || [];
let agendamentos = JSON.parse(localStorage.getItem('agendamentos_portaria')) || [];

// Controle de navegação entre páginas
function showPage(pageId, event) {
    // Esconde todas as páginas
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Remove classe active de todos os links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Mostra a página selecionada
    const pageToShow = document.getElementById(`${pageId}-page`);
    if (pageToShow) {
        pageToShow.classList.add('active');
    }
    
    // Ativa o link correspondente (se o evento foi passado)
    if (event && event.target) {
         // Encontra o link pai (a) se o clique foi no ícone (span)
        const navLink = event.target.closest('.nav-link');
        if (navLink) {
            navLink.classList.add('active');
        }
    }
    
    // Atualiza dados específicos da página
    if (pageId === 'dashboard') {
        atualizarDashboard();
        atualizarTurno();
    } else if (pageId === 'manobras') {
        carregarManobras();
    } else if (pageId === 'registro') {
        // Carrega sugestões de auto-complete
        atualizarDatalistEmpresas();
        // Pode carregar registros recentes se necessário, embora essa tabela tenha sido removida da UI
    } else if (pageId === 'agendamentos') {
        carregarAgendamentos(); // Função de agendamentos.js
    } else if (pageId === 'consultas') {
        // A página de consultas é reativa aos filtros
    }
}

// Atualizar informação do turno atual
function atualizarTurno() {
    const hora = new Date().getHours();
    const turnoA = document.getElementById('turno-a');
    const turnoB = document.getElementById('turno-b');
    const turnoC = document.getElementById('turno-c');
    
    // Proteção caso os elementos não existam na página atual
    if (!turnoA || !turnoB || !turnoC) return;
    
    // Remove classe active de todos os turnos
    [turnoA, turnoB, turnoC].forEach(turno => {
        turno.classList.remove('active');
        const statusEl = turno.querySelector('.turno-status');
        if (statusEl) statusEl.textContent = '';
    });
    
    // Define turno atual
    let turnoAtual;
    if (hora >= 7 && hora < 15) {
        turnoAtual = turnoA;
    } else if (hora >= 15 && hora < 23.4) { // 23:24
        turnoAtual = turnoB;
    } else {
        turnoAtual = turnoC;
    }
    
    turnoAtual.classList.add('active');
    turnoAtual.querySelector('.turno-status').textContent = 'TURNO ATUAL';
}

// Salvar dados no localStorage
function salvarDados() {
    localStorage.setItem('registros_portaria', JSON.stringify(registros));
    localStorage.setItem('manobras_portaria', JSON.stringify(manobras));
    localStorage.setItem('agendamentos_portaria', JSON.stringify(agendamentos));
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Define o dashboard como página inicial e ativa o link
    document.querySelector('.nav-link.active').classList.remove('active');
    document.querySelector('.nav-link[onclick*="dashboard"]').classList.add('active');
    document.getElementById('dashboard-page').classList.add('active');
    
    atualizarTurno();
    atualizarDashboard();
    
    // Atualizar turno a cada minuto
    setInterval(atualizarTurno, 60000);
});

// Função de Notificação Global (movida de registro.js para app.js)
function showNotification(message, type = 'success') {
    // Remove notificações existentes
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notif => notif.remove());

    // Cria nova notificação
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove após 4 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.5s ease forwards';
            setTimeout(() => notification.remove(), 500);
        }
    }, 4000);
}

// Animação de saída para notificação
// Adicione ao seu style.css se não existir, ou defina aqui
if (!document.styleSheets[0].cssRules.length) {
    document.styleSheets[0].insertRule(`
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `, 0);
}

// ==========================
// FUNÇÕES GLOBAIS DE UTILIDADE
// ==========================

// Atualiza o datalist de empresas
function atualizarDatalistEmpresas() {
    const datalist = document.getElementById('empresas-list') || criarDatalistEmpresas();
    
    // Pega empresas dos registros E dos agendamentos
    const empresasRegistros = [...new Set(registros.map(r => r.empresa).filter(Boolean))];
    const empresasAgendamentos = [...new Set(agendamentos.map(a => a.empresa).filter(Boolean))];
    const empresasUnicas = [...new Set([...empresasRegistros, ...empresasAgendamentos])];

    datalist.innerHTML = empresasUnicas.map(empresa => 
        `<option value="${empresa}">`
    ).join('');
}

function criarDatalistEmpresas() {
    const datalist = document.createElement('datalist');
    datalist.id = 'empresas-list';
    document.body.appendChild(datalist);
    return datalist;
}

// Função para exportar dados para CSV
function exportDataToCSV(data, filename = 'relatorio.csv') {
    if (data.length === 0) {
        showNotification('Nenhum dado para exportar', 'warning');
        return;
    }

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')]; // Cabeçalho

    // Linhas
    for (const row of data) {
        const values = headers.map(header => {
            let val = row[header];
            if (val === null || val === undefined) {
                val = '';
            }
            // Trata valores que contêm vírgula ou aspas
            val = val.toString().replace(/"/g, '""');
            if (val.includes(',') || val.includes('\n') || val.includes('"')) {
                val = `"${val}"`;
            }
            return val;
        });
        csvRows.push(values.join(','));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    URL.revokeObjectURL(url);
    showNotification('Relatório CSV gerado!', 'success');
}