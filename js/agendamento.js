// js/agendamentos.js

const formAgendamento = document.getElementById('form-agendamento');
const listaAgendamentos = document.getElementById('lista-agendamentos');

// Submissão do formulário de novo agendamento
formAgendamento.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const horarioPrevisto = new Date(formData.get('horario_previsto'));
    
    const novoAgendamento = {
        id: Date.now(),
        placa_veiculo: UIManager.formatPlaca(formData.get('placa_veiculo')),
        nome: formData.get('nome'),
        cpf: UIManager.formatCPF(formData.get('cpf')),
        empresa: formData.get('empresa'),
        horario_previsto: horarioPrevisto.toLocaleString('pt-BR'),
        horario_timestamp: horarioPrevisto.getTime(),
        observacoes: formData.get('observacoes'),
        status: 'agendado' // 'agendado', 'concluido', 'cancelado'
    };
    
    // Validação
    if (novoAgendamento.placa_veiculo.length < 7) {
        showNotification('Placa inválida', 'error');
        return;
    }
    
    agendamentos.push(novoAgendamento);
    salvarDados();
    
    showNotification('✅ Agendamento salvo com sucesso!', 'success');
    this.reset();
    
    // Atualiza a lista na tela
    carregarAgendamentos();
    
    // Atualiza o datalist de empresas
    atualizarDatalistEmpresas();
});

// Carrega a lista de agendamentos na tabela
function carregarAgendamentos() {
    if (!listaAgendamentos) return;
    
    // Filtra agendamentos futuros (ou de hoje) que não foram concluídos
    const agora = new Date().getTime();
    const agendamentosPendentes = agendamentos
        .filter(a => a.status === 'agendado' && a.horario_timestamp >= (agora - 3600000)) // 1 hora de tolerância
        .sort((a, b) => a.horario_timestamp - b.horario_timestamp); // Ordena pelos mais próximos

    if (agendamentosPendentes.length === 0) {
        listaAgendamentos.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-light);">
                    Nenhum agendamento futuro
                </td>
            </tr>
        `;
        return;
    }
    
    listaAgendamentos.innerHTML = agendamentosPendentes.map(ag => `
        <tr>
            <td><strong>${ag.placa_veiculo}</strong></td>
            <td>${ag.nome}</td>
            <td>${ag.empresa || 'N/A'}</td>
            <td>${ag.horario_previsto}</td>
            <td>
                <span class="status-badge status-${ag.status}">
                    ${ag.status}
                </span>
            </td>
        </tr>
    `).join('');
}