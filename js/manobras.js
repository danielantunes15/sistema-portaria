// Formulário de agendamento de manobras
document.getElementById('form-manobra').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const horarioPrevisto = new Date(formData.get('horario_previsto'));
    
    const manobra = {
        id: Date.now(),
        placa_veiculo: formData.get('placa_veiculo').toUpperCase(),
        motorista: formData.get('motorista'),
        local_manobra: formData.get('local_manobra'),
        horario_previsto: horarioPrevisto.toLocaleString('pt-BR'),
        horario_timestamp: horarioPrevisto.getTime(),
        observacoes: formData.get('observacoes'),
        status: 'agendado',
        data_criacao: new Date().toLocaleString('pt-BR'),
        data_criacao_timestamp: new Date().getTime() // Adicionado para dashboard
    };
    
    // Adiciona às manobras
    manobras.push(manobra);
    salvarDados();
    
    // Feedback e reset
    showNotification('✅ Manobra agendada com sucesso!', 'success');
    this.reset();
    
    // Atualiza lista
    carregarManobras();
});

// Carrega e exibe manobras na tabela
function carregarManobras() {
    const tbody = document.getElementById('lista-manobras');
    
    // Filtra apenas manobras não concluídas e ordena
    const manobrasAtivas = manobras
        .filter(m => m.status !== 'concluido')
        .sort((a, b) => a.horario_timestamp - b.horario_timestamp);
    
    if (manobrasAtivas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">Nenhuma manobra ativa</td></tr>';
        return;
    }
    
    tbody.innerHTML = manobrasAtivas.map(manobra => `
        <tr>
            <td><strong>${manobra.placa_veiculo}</strong></td>
            <td>${manobra.motorista}</td>
            <td>${manobra.local_manobra}</td>
            <td>${manobra.horario_previsto}</td>
            <td>
                <span class="status-badge status-${manobra.status}">
                    ${getStatusText(manobra.status)}
                </span>
            </td>
            <td>
                <button class="btn btn-primary" onclick="iniciarManobra(${manobra.id})" 
                    ${manobra.status !== 'agendado' ? 'disabled' : ''}>
                    Iniciar
                </button>
                <button class="btn btn-secondary" onclick="concluirManobra(${manobra.id})"
                    ${manobra.status !== 'andamento' ? 'disabled' : ''}>
                    Concluir
                </button>
            </td>
        </tr>
    `).join('');
}

// Texto do status
function getStatusText(status) {
    const statusMap = {
        'agendado': 'Agendado',
        'andamento': 'Em Andamento',
        'concluido': 'Concluído'
    };
    return statusMap[status] || 'Agendado';
}

// Iniciar manobra
function iniciarManobra(id) {
    const manobra = manobras.find(m => m.id === id);
    if (manobra) {
        manobra.status = 'andamento';
        manobra.horario_inicio = new Date().toLocaleString('pt-BR');
        salvarDados();
        carregarManobras();
    }
}

// Concluir manobra
function concluirManobra(id) {
    const manobra = manobras.find(m => m.id === id);
    if (manobra) {
        manobra.status = 'concluido';
        manobra.horario_conclusao = new Date().toLocaleString('pt-BR');
        salvarDados();
        carregarManobras();
    }
}

// Inicialização da página de manobras
document.addEventListener('DOMContentLoaded', function() {
    // Configura o datetime-local para o horário atual + 1 hora
    const agora = new Date();
    agora.setHours(agora.getHours() + 1);
    
    const manobraHorarioInput = document.getElementById('manobra-horario');
    if (manobraHorarioInput) {
        try {
            manobraHorarioInput.value = agora.toISOString().slice(0, 16);
        } catch (e) {
            // Fallback para caso o input não esteja visível
            console.log('Input de horário de manobra não encontrado na inicialização');
        }
    }
});