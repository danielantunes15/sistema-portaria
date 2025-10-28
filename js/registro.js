// registro.js - Controle de Registros de Acesso

const formRegistro = document.getElementById('form-registro');
const formTitulo = document.getElementById('form-registro-titulo');
const buscaPlacaInput = document.getElementById('busca-placa-agendamento');
const btnBuscarPlaca = document.getElementById('btn-buscar-placa');

// Inputs do formulário
const tipoEntradaInput = document.getElementById('tipo_entrada');
const tipoVeiculoInput = document.getElementById('tipo_veiculo');
const placaInput = document.getElementById('placa_veiculo');
const qtdPessoasInput = document.getElementById('quantidade_pessoas');
const nomeInput = document.getElementById('nome');
const cpfInput = document.getElementById('cpf');
const empresaInput = document.getElementById('empresa');
const obsInput = document.getElementById('observacoes');

// Botão de submit
const submitButton = formRegistro.querySelector('button[type="submit"]');

// ==========================
// LÓGICA DE BUSCA (SAÍDA E AGENDAMENTO)
// ==========================

btnBuscarPlaca.addEventListener('click', function() {
    const placa = UIManager.formatPlaca(buscaPlacaInput.value);
    if (placa.length < 7) {
        showNotification('Placa inválida para busca', 'warning');
        return;
    }

    // 1. Prioridade: Buscar veículo DENTRO para registrar SAÍDA
    const veiculoNoPatio = registros.find(r => 
        r.placa_veiculo === placa && r.status === 'dentro'
    );

    if (veiculoNoPatio) {
        preencherFormularioParaSaida(veiculoNoPatio);
        showNotification('Veículo encontrado. Pronto para registrar SAÍDA.', 'success');
    } else {
        // 2. Se não está no pátio, buscar AGENDAMENTO
        const agendamento = agendamentos.find(a => 
            a.placa_veiculo === placa && a.status === 'agendado'
        );
        
        if (agendamento) {
            preencherFormularioComAgendamento(agendamento);
            showNotification('Agendamento encontrado. Pronto para registrar ENTRADA.', 'success');
        } else {
            // 3. Se não achou em nenhum, apenas preenche a placa para ENTRADA
            resetarFormulario();
            placaInput.value = placa;
            tipoEntradaInput.value = 'entrada';
            showNotification('Placa não encontrada. Preencha para nova ENTRADA.', 'warning');
        }
    }
    buscaPlacaInput.value = '';
});

function preencherFormularioParaSaida(registro) {
    resetarFormulario();
    formTitulo.textContent = '📋 Registrar Saída';
    submitButton.innerHTML = '<span class="icon">🔴</span> Confirmar Saída';

    tipoEntradaInput.value = 'saida';
    placaInput.value = registro.placa_veiculo;
    nomeInput.value = registro.nome;
    cpfInput.value = registro.cpf;
    empresaInput.value = registro.empresa;
    tipoVeiculoInput.value = registro.tipo_veiculo;
    qtdPessoasInput.value = registro.quantidade_pessoas;
    obsInput.value = registro.observacoes;

    // Desabilita campos que não podem ser alterados na saída
    placaInput.disabled = true;
    nomeInput.disabled = true;
    cpfInput.disabled = true;
    empresaInput.disabled = true;
    tipoVeiculoInput.disabled = true;
    qtdPessoasInput.disabled = true;
}

function preencherFormularioComAgendamento(agendamento) {
    resetarFormulario();
    formTitulo.textContent = '📋 Confirmar Entrada (Agendada)';
    submitButton.innerHTML = '<span class="icon">🟢</span> Confirmar Entrada';
    
    tipoEntradaInput.value = 'entrada';
    placaInput.value = agendamento.placa_veiculo;
    nomeInput.value = agendamento.nome;
    cpfInput.value = agendamento.cpf;
    empresaInput.value = agendamento.empresa;
    obsInput.value = agendamento.observacoes;
    
    // Sugere o tipo de veículo (se tivermos essa info no futuro)
    // tipoVeiculoInput.value = agendamento.tipo_veiculo || 'carro';
    
    // Foca no campo de pessoas
    qtdPessoasInput.value = 1;
    qtdPessoasInput.focus();

    // Armazena o ID do agendamento no formulário (oculto)
    formRegistro.dataset.agendamentoId = agendamento.id;
}


// ==========================
// LÓGICA DE SUBMISSÃO (ENTRADA / SAÍDA)
// ==========================

formRegistro.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const stopLoading = UIManager.startLoading(submitButton);
    const tipoMovimentacao = tipoEntradaInput.value;

    try {
        await new Promise(resolve => setTimeout(resolve, 500)); // Simula processamento
        
        if (tipoMovimentacao === 'entrada') {
            await registrarEntrada();
        } else if (tipoMovimentacao === 'saida') {
            await registrarSaida();
        }

    } catch (error) {
        console.error('Erro ao processar registro:', error);
        showNotification(`❌ ${error.message}`, 'error');
    } finally {
        stopLoading();
        resetarFormulario();
    }
});

async function registrarEntrada() {
    const formData = new FormData(formRegistro);
    const placa = UIManager.formatPlaca(formData.get('placa_veiculo'));

    // Validação 1: Placa válida?
    if (!validarPlaca(placa)) {
        throw new Error('Formato de placa inválido');
    }

    // Validação 2: Veículo já está no pátio?
    const veiculoNoPatio = registros.find(r => 
        r.placa_veiculo === placa && r.status === 'dentro'
    );
    if (veiculoNoPatio) {
        throw new Error('Veículo já consta DENTRO do pátio');
    }

    // Validação 3: CPF (se preenchido)
    const cpf = UIManager.formatCPF(formData.get('cpf'));
    if (cpf && cpf.length > 0 && !validarCPF(cpf)) {
         throw new Error('CPF inválido');
    }
    
    const agora = new Date();
    const novoRegistro = {
        id: Date.now(),
        status: 'dentro', // Novo campo de status
        tipo_veiculo: formData.get('tipo_veiculo'),
        placa_veiculo: placa,
        quantidade_pessoas: parseInt(formData.get('quantidade_pessoas')),
        nome: formData.get('nome'),
        cpf: cpf,
        empresa: formData.get('empresa'),
        observacoes: formData.get('observacoes'),
        
        data_hora_entrada: agora.toLocaleString('pt-BR'),
        timestamp_entrada: agora.getTime(),
        
        data_hora_saida: null, // Novo campo
        timestamp_saida: null  // Novo campo
    };

    // Adiciona o novo registro
    registros.unshift(novoRegistro);
    
    // Se veio de um agendamento, marca o agendamento como 'concluido'
    const agendamentoId = formRegistro.dataset.agendamentoId;
    if (agendamentoId) {
        const agendamento = agendamentos.find(a => a.id == agendamentoId);
        if (agendamento) {
            agendamento.status = 'concluido';
        }
    }
    
    salvarDados();
    showNotification('✅ Entrada registrada com sucesso!', 'success');
    
    // Atualiza lista de empresas para auto-complete
    atualizarDatalistEmpresas();

    // Volta para o dashboard após 1.5 segundos
    setTimeout(() => {
        // Clica no link do dashboard
        document.querySelector('.nav-link[onclick*="dashboard"]').click();
    }, 1500);
}

async function registrarSaida() {
    const placa = UIManager.formatPlaca(placaInput.value);

    // Encontra o registro de ENTRADA correspondente
    const registroParaSair = registros.find(r => 
        r.placa_veiculo === placa && r.status === 'dentro'
    );

    if (!registroParaSair) {
        throw new Error('Veículo não encontrado no pátio para registrar saída');
    }

    // Atualiza o registro original
    const agora = new Date();
    registroParaSair.status = 'fora';
    registroParaSair.data_hora_saida = agora.toLocaleString('pt-BR');
    registroParaSair.timestamp_saida = agora.getTime();

    salvarDados();
    showNotification('🔴 Saída registrada com sucesso!', 'success');

    // Volta para o dashboard após 1.5 segundos
    setTimeout(() => {
        // Clica no link do dashboard
        document.querySelector('.nav-link[onclick*="dashboard"]').click();
    }, 1500);
}

// ==========================
// FUNÇÕES AUXILIARES
// ==========================

function resetarFormulario() {
    formRegistro.reset();
    formTitulo.textContent = '📋 Novo Registro de Entrada';
    submitButton.innerHTML = '<span class="icon">💾</span> Salvar Registro';
    
    // Habilita todos os campos
    placaInput.disabled = false;
    nomeInput.disabled = false;
    cpfInput.disabled = false;
    empresaInput.disabled = false;
    tipoVeiculoInput.disabled = false;
    qtdPessoasInput.disabled = false;
    
    // Remove o ID do agendamento
    delete formRegistro.dataset.agendamentoId;
}

function validarPlaca(placa) {
    const placaLimpa = placa.replace(/[^A-Z0-9]/g, '');
    // Regex simples (aceita Mercosul e antiga)
    const placaRegex = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/;
    return placaRegex.test(placaLimpa);
}

function validarCPF(cpf) {
    const cpfLimpo = cpf.replace(/\D/g, '');
    // Apenas validação de tamanho, não de dígitos verificadores
    return cpfLimpo.length === 11;
}


// Atualiza o valor padrão de pessoas baseado no tipo de veículo
tipoVeiculoInput.addEventListener('change', function(e) {
    const valoresPadrao = {
        'carro': 1, 'moto': 1, 'onibus': 20, 'caminhao': 2, 'van': 8
    };
    qtdPessoasInput.value = valoresPadrao[e.target.value] || 1;
});

// Carrega o datalist ao iniciar
document.addEventListener('DOMContentLoaded', atualizarDatalistEmpresas);