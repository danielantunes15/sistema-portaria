// Dados em memória (simulando banco de dados)
let registros = JSON.parse(localStorage.getItem('registros_portaria')) || [];
let manobras = JSON.parse(localStorage.getItem('manobras_portaria')) || [];

// Controle de navegação entre páginas
function showPage(pageId) {
    // Esconde todas as páginas
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Remove classe active de todos os links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Mostra a página selecionada
    document.getElementById(`${pageId}-page`).classList.add('active');
    
    // Ativa o link correspondente
    event.target.classList.add('active');
    
    // Atualiza dados específicos da página
    if (pageId === 'dashboard') {
        atualizarDashboard();
        atualizarTurno();
    } else if (pageId === 'manobras') {
        carregarManobras();
    }
}

// Atualizar informação do turno atual
function atualizarTurno() {
    const hora = new Date().getHours();
    const turnoA = document.getElementById('turno-a');
    const turnoB = document.getElementById('turno-b');
    const turnoC = document.getElementById('turno-c');
    
    // Remove classe active de todos os turnos
    [turnoA, turnoB, turnoC].forEach(turno => {
        turno.classList.remove('active');
        turno.querySelector('.turno-status').textContent = '';
    });
    
    // Define turno atual
    let turnoAtual;
    if (hora >= 7 && hora < 15) {
        turnoAtual = turnoA;
    } else if (hora >= 15 && hora < 23.4) {
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
}

// Gerar relatório simples
function gerarRelatorio() {
    const hoje = new Date().toLocaleDateString('pt-BR');
    const entradasHoje = registros.filter(r => 
        r.tipo_entrada === 'entrada' && 
        r.data.includes(hoje)
    );
    
    const totalPessoas = entradasHoje.reduce((acc, curr) => acc + parseInt(curr.quantidade_pessoas), 0);
    const onibusAtivos = entradasHoje.filter(r => r.tipo_veiculo === 'onibus').length;
    
    const relatorio = `
RELATÓRIO DIÁRIO - ${hoje}

📊 ESTATÍSTICAS:
• Entradas registradas: ${entradasHoje.length}
• Total de pessoas: ${totalPessoas}
• Ônibus na usina: ${onibusAtivos}
• Manobras agendadas: ${manobras.length}

🚗 ÚLTIMAS ENTRADAS:
${entradasHoje.slice(-5).map(reg => 
    `• ${reg.placa_veiculo} - ${reg.quantidade_pessoas} pessoa(s) - ${reg.data_hora}`
).join('\n')}
    `.trim();
    
    alert(relatorio);
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    atualizarTurno();
    atualizarDashboard();
    
    // Atualizar turno a cada minuto
    setInterval(atualizarTurno, 60000);
});