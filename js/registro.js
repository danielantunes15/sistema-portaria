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
const setorInput = document.getElementById('setor_destino'); // NOVO
const obsInput = document.getElementById('observacoes');

// Botão de submit
const submitButton = formRegistro.querySelector('button[type="submit"]');

// ==========================
// LÓGICA DE BUSCA
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
        buscaPlacaInput.value = '';
        return;
    } 
    
    // 2. Se não está no pátio, buscar na FROTA PRÓPRIA
    const veiculoFrota = frota.find(f => f.placa === placa);
    if (veiculoFrota) {
        preencherFormularioComFrota(veiculoFrota);
        showNotification('Veículo da Frota Própria encontrado.', 'success');
        buscaPlacaInput.value = '';
        return;
    }

    // 3. Se não é da frota, buscar AGENDAMENTO
    const agendamento = agendamentos.find(a => 
        a.placa_veiculo === placa && a.status === 'agendado'
    );
    if (agendamento) {
        preencherFormularioComAgendamento(agendamento);
        showNotification('Agendamento encontrado. Pronto para registrar ENTRADA.', 'success');
        buscaPlacaInput.value = '';
        return;
    }
    
    // 4. Se não achou em nenhum, apenas preenche a placa para ENTRADA
    resetarFormulario();
    placaInput.value = placa;
    tipoEntradaInput.value = 'entrada';
    showNotification('Placa não encontrada. Preencha para nova ENTRADA.', 'warning');
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
    setorInput.value = registro.setor_destino || ''; // Carrega o setor
    obsInput.value = registro.observacoes;

    // Desabilita campos que não podem ser alterados na saída
    placaInput.disabled = true;
    nomeInput.disabled = true;
    cpfInput.disabled = true;
    empresaInput.disabled = true;
    tipoVeiculoInput.disabled = true;
    qtdPessoasInput.disabled = true;
    setorInput.disabled = true;
}

function preencherFormularioComFrota(veiculo) {
    resetarFormulario();
    formTitulo.textContent = '📋 Registrar Entrada (Frota Própria)';
    submitButton.innerHTML = '<span class="icon">🟢</span> Confirmar Entrada';

    tipoEntradaInput.value = 'entrada';
    placaInput.value = veiculo.placa;
    nomeInput.value = veiculo.responsavel; // Puxa o responsável
    empresaInput.value = 'Frota Própria'; // Padrão
    tipoVeiculoInput.value = veiculo.tipo; // Puxa o tipo
    obsInput.value = veiculo.descricao; // Puxa a descrição
    
    // Desabilita campos da frota
    placaInput.disabled = true;
    empresaInput.disabled = true;
    
    // Foca no campo de pessoas
    qtdPessoasInput.value = 1;
    qtdPessoasInput.focus();
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
    const placa = UIManager.formatPlaca(placaInput.disabled ? placaInput.value : formData.get('placa_veiculo'));

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

    // Validação 4: Setor de destino
    if (!formData.get('setor_destino')) {
        throw new Error('Setor de destino é obrigatório');
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
        setor_destino: formData.get('setor_destino'), // NOVO CAMPO
        observacoes: formData.get('observacoes'),
        
        data_hora_entrada: agora.toLocaleString('pt-BR'),
        timestamp_entrada: agora.getTime(),
        
        data_hora_saida: null,
        timestamp_saida: null
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
        document.querySelector('.nav-link[onclick*="dashboard"]').click();
    }, 1500);
}

// ==========================
// FUNÇÕES AUXILIARES
// ==========================

// NOVO: Carrega os setores cadastrados no <select>
function carregarOpcoesSetores() {
    if (!setorInput) return;
    
    // Limpa opções antigas (exceto a primeira "Selecione...")
    setorInput.innerHTML = '<option value="">Selecione o destino...</option>';
    
    setores.sort((a, b) => a.nome.localeCompare(b.nome)); // Ordena alfabeticamente
    
    setores.forEach(setor => {
        const option = document.createElement('option');
        option.value = setor.nome;
        option.textContent = setor.nome;
        setorInput.appendChild(option);
    });
}


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
    setorInput.disabled = false;
    
    // Remove o ID do agendamento
    delete formRegistro.dataset.agendamentoId;
}

function validarPlaca(placa) {
    const placaLimpa = placa.replace(/[^A-Z0-9]/g, '');
    const placaRegex = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/;
    return placaRegex.test(placaLimpa);
}

function validarCPF(cpf) {
    const cpfLimpo = cpf.replace(/\D/g, '');
    return cpfLimpo.length === 11;
}


// Atualiza o valor padrão de pessoas baseado no tipo de veículo
tipoVeiculoInput.addEventListener('change', function(e) {
    const valoresPadrao = {
        'carro': 1, 'moto': 1, 'onibus': 20, 'caminhao': 2, 'van': 8
    };
    qtdPessoasInput.value = valoresPadrao[e.target.value] || 1;
});