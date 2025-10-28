// registro.js - Controle de Registros de Acesso

// Formulário de registro de acesso
document.getElementById('form-registro').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitButton = this.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    
    // Efeito de loading
    submitButton.innerHTML = '<div class="loading"></div> Processando...';
    submitButton.disabled = true;
    
    try {
        // Simula um processamento (remova este timeout em produção)
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Coleta dados do formulário
        const formData = new FormData(this);
        const registro = {
            id: Date.now(),
            tipo_entrada: formData.get('tipo_entrada'),
            tipo_veiculo: formData.get('tipo_veiculo'),
            placa_veiculo: formData.get('placa_veiculo').toUpperCase(),
            quantidade_pessoas: parseInt(formData.get('quantidade_pessoas')),
            nome: formData.get('nome'),
            cpf: formData.get('cpf'),
            empresa: formData.get('empresa'),
            observacoes: formData.get('observacoes'),
            data: new Date().toLocaleDateString('pt-BR'),
            data_hora: new Date().toLocaleString('pt-BR'),
            timestamp: new Date().getTime()
        };
        
        // Validações adicionais
        if (!validarRegistro(registro)) {
            throw new Error('Dados inválidos');
        }
        
        // Adiciona aos registros
        registros.unshift(registro); // Adiciona no início do array
        salvarDados();
        
        // Mostra notificação de sucesso
        showNotification('✅ Registro salvo com sucesso!', 'success');
        
        // Reset do formulário
        this.reset();
        
        // Atualiza a lista de registros recentes
        carregarRegistrosRecentes();
        
        // Volta para o dashboard após 1.5 segundos
        setTimeout(() => {
            showPage('dashboard');
        }, 1500);
        
    } catch (error) {
        console.error('Erro ao salvar registro:', error);
        showNotification('❌ Erro ao salvar registro. Verifique os dados.', 'error');
    } finally {
        // Restaura o botão
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    }
});

// Validação dos dados do registro
function validarRegistro(registro) {
    // Valida placa (formato brasileiro ou mercosul)
    const placaRegex = /^[A-Z]{3}[-]?[0-9][A-Z0-9][0-9]{2}$/;
    if (!placaRegex.test(registro.placa_veiculo)) {
        showNotification('❌ Formato de placa inválido', 'error');
        return false;
    }
    
    // Valida CPF se fornecido
    if (registro.cpf && registro.cpf.length > 0) {
        const cpfLimpo = registro.cpf.replace(/\D/g, '');
        if (cpfLimpo.length !== 11) {
            showNotification('❌ CPF inválido', 'error');
            return false;
        }
    }
    
    // Valida quantidade de pessoas
    if (registro.quantidade_pessoas < 1 || registro.quantidade_pessoas > 100) {
        showNotification('❌ Quantidade de pessoas inválida', 'error');
        return false;
    }
    
    return true;
}

// Carrega registros recentes na página de registro
function carregarRegistrosRecentes() {
    const tbody = document.getElementById('registros-recentes');
    
    // Ordena por data mais recente
    const registrosRecentes = registros
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10); // Últimos 10 registros
    
    if (registrosRecentes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-light);">
                    Nenhum registro encontrado
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = registrosRecentes.map(registro => `
        <tr>
            <td>
                <div style="font-weight: 600;">${registro.data}</div>
                <div style="font-size: 0.8rem; color: var(--text-light);">${registro.data_hora.split(' ')[1]}</div>
            </td>
            <td>
                <span style="font-size: 1.2rem;">
                    ${getVeiculoIcon(registro.tipo_veiculo)}
                </span>
                <div style="font-size: 0.8rem; text-transform: capitalize;">${registro.tipo_veiculo}</div>
            </td>
            <td>
                <strong>${registro.placa_veiculo}</strong>
            </td>
            <td>
                <span class="status-badge ${registro.quantidade_pessoas > 1 ? 'status-andamento' : 'status-agendado'}">
                    ${registro.quantidade_pessoas} ${registro.quantidade_pessoas === 1 ? 'pessoa' : 'pessoas'}
                </span>
            </td>
            <td>
                <span class="status-badge ${registro.tipo_entrada === 'entrada' ? 'status-concluido' : 'status-agendado'}">
                    ${registro.tipo_entrada === 'entrada' ? '🟢 Entrada' : '🔴 Saída'}
                </span>
            </td>
            <td>
                <div style="font-weight: 500;">${registro.nome || 'Não informado'}</div>
                <div style="font-size: 0.8rem; color: var(--text-light);">${registro.empresa || 'N/A'}</div>
            </td>
        </tr>
    `).join('');
}

// Ícone do tipo de veículo
function getVeiculoIcon(tipo) {
    const icons = {
        'carro': '🚗',
        'onibus': '🚌',
        'caminhao': '🚚',
        'moto': '🏍️',
        'van': '🚐'
    };
    return icons[tipo] || '🚗';
}

// Formatação automática de CPF
document.getElementById('cpf').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length <= 11) {
        value = value.replace(/(\d{3})(\d)/, '$1.$2')
                    .replace(/(\d{3})(\d)/, '$1.$2')
                    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
        value = value.substring(0, 14);
    }
    
    e.target.value = value;
});

// Formatação automática de placa
document.getElementById('placa_veiculo').addEventListener('input', function(e) {
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    if (value.length > 7) {
        value = value.substring(0, 7);
    }
    
    if (value.length > 3) {
        value = value.substring(0, 3) + '-' + value.substring(3);
    }
    
    e.target.value = value;
});

// Auto-complete para empresa baseada em registros anteriores
document.getElementById('empresa').addEventListener('input', function(e) {
    const input = e.target;
    const datalist = document.getElementById('empresas-list') || criarDatalistEmpresas();
    
    // Atualiza a lista de sugestões
    const empresasUnicas = [...new Set(registros.map(r => r.empresa).filter(Boolean))];
    datalist.innerHTML = empresasUnicas.map(empresa => 
        `<option value="${empresa}">`
    ).join('');
});

function criarDatalistEmpresas() {
    const datalist = document.createElement('datalist');
    datalist.id = 'empresas-list';
    document.body.appendChild(datalist);
    
    const empresaInput = document.getElementById('empresa');
    empresaInput.setAttribute('list', 'empresas-list');
    
    return datalist;
}

// Mostra/oculta campos baseados no tipo de veículo
document.getElementById('tipo_veiculo').addEventListener('change', function(e) {
    const quantidadeInput = document.getElementById('quantidade_pessoas');
    
    // Define valores padrão baseados no tipo de veículo
    const valoresPadrao = {
        'carro': 1,
        'moto': 1,
        'onibus': 20,
        'caminhao': 2,
        'van': 8
    };
    
    quantidadeInput.value = valoresPadrao[e.target.value] || 1;
});

// Função de notificação
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
            notification.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
        }
    }, 4000);
}

// Carrega registros recentes quando a página é aberta
document.addEventListener('DOMContentLoaded', function() {
    // Aguarda um pouco para garantir que os dados foram carregados
    setTimeout(() => {
        carregarRegistrosRecentes();
    }, 100);
    
    // Configura data/hora atual para o campo de observações como placeholder
    const agora = new Date();
    document.getElementById('observacoes').placeholder = 
        `Registro criado em ${agora.toLocaleString('pt-BR')}. Motivo da visita...`;
});

// Exporta funções para uso em outros arquivos
if (typeof window !== 'undefined') {
    window.carregarRegistrosRecentes = carregarRegistrosRecentes;
    window.validarRegistro = validarRegistro;
}