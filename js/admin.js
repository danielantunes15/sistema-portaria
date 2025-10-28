// js/admin.js - Lógica da Página de Administração

// ==========================
// NAVEGAÇÃO POR ABAS
// ==========================
function showAdminTab(tabId, event) {
    // Esconde todos os conteúdos
    document.querySelectorAll('.admin-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove classe active de todos os links
    document.querySelectorAll('.tab-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Mostra o conteúdo selecionado
    document.getElementById(`admin-tab-${tabId}`).classList.add('active');
    
    // Ativa o link clicado
    if (event) {
        event.target.classList.add('active');
    }
}

// Função principal de carregamento da página
function carregarAdmin() {
    // Garante que a primeira aba esteja visível
    showAdminTab('frota', { target: document.querySelector('.tab-link[onclick*="frota"]') });
    
    // Carrega os dados em todas as tabelas
    carregarListaFrota();
    carregarListaSetores();
    carregarListaEmpresas();
}

// ==========================
// CADASTRO DE FROTA
// ==========================
const formFrota = document.getElementById('form-frota');
const listaFrota = document.getElementById('lista-frota');

formFrota.addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const placa = UIManager.formatPlaca(formData.get('placa'));
    
    if (placa.length < 7) {
        showNotification('Placa inválida', 'error');
        return;
    }
    
    // Verifica se a placa já existe
    if (frota.some(f => f.placa === placa)) {
        showNotification('Placa já cadastrada na frota', 'warning');
        return;
    }
    
    const novoVeiculo = {
        id: Date.now(),
        placa: placa,
        responsavel: formData.get('responsavel'),
        tipo: formData.get('tipo'),
        descricao: formData.get('descricao')
    };
    
    frota.push(novoVeiculo);
    salvarDados();
    carregarListaFrota();
    this.reset();
    showNotification('Veículo da frota salvo!', 'success');
});

function carregarListaFrota() {
    if (!listaFrota) return;
    listaFrota.innerHTML = '';
    frota.forEach(veiculo => {
        listaFrota.innerHTML += `
            <tr>
                <td><strong>${veiculo.placa}</strong></td>
                <td>${veiculo.responsavel}</td>
                <td>${veiculo.tipo}</td>
                <td>
                    <button class="btn-remover" onclick="removerItemFrota(${veiculo.id})">
                        <span class="icon">❌</span>
                    </button>
                </td>
            </tr>
        `;
    });
}

function removerItemFrota(id) {
    if (confirm('Tem certeza que deseja remover este veículo da frota?')) {
        frota = frota.filter(f => f.id !== id);
        salvarDados();
        carregarListaFrota();
        showNotification('Veículo removido', 'success');
    }
}


// ==========================
// CADASTRO DE SETORES
// ==========================
const formSetor = document.getElementById('form-setor');
const listaSetores = document.getElementById('lista-setores');

formSetor.addEventListener('submit', function(e) {
    e.preventDefault();
    const nome = document.getElementById('setor-nome').value;
    
    if (!nome) {
        showNotification('Nome do setor não pode ser vazio', 'error');
        return;
    }
    
    if (setores.some(s => s.nome.toLowerCase() === nome.toLowerCase())) {
        showNotification('Setor já cadastrado', 'warning');
        return;
    }
    
    const novoSetor = {
        id: Date.now(),
        nome: nome
    };
    
    setores.push(novoSetor);
    salvarDados();
    carregarListaSetores();
    this.reset();
    showNotification('Setor salvo!', 'success');
});

function carregarListaSetores() {
    if (!listaSetores) return;
    listaSetores.innerHTML = '';
    setores.sort((a, b) => a.nome.localeCompare(b.nome)); // Ordena
    
    setores.forEach(setor => {
        listaSetores.innerHTML += `
            <tr>
                <td><strong>${setor.nome}</strong></td>
                <td>
                    <button class="btn-remover" onclick="removerItemSetor(${setor.id})">
                        <span class="icon">❌</span>
                    </button>
                </td>
            </tr>
        `;
    });
}

function removerItemSetor(id) {
    if (confirm('Tem certeza que deseja remover este setor?')) {
        setores = setores.filter(s => s.id !== id);
        salvarDados();
        carregarListaSetores();
        showNotification('Setor removido', 'success');
    }
}


// ==========================
// CADASTRO DE EMPRESAS
// ==========================
const formEmpresa = document.getElementById('form-empresa');
const listaEmpresas = document.getElementById('lista-empresas');

formEmpresa.addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const nome = formData.get('nome');
    
    if (!nome) {
        showNotification('Nome da empresa não pode ser vazio', 'error');
        return;
    }
    
    if (empresas.some(em => em.nome.toLowerCase() === nome.toLowerCase())) {
        showNotification('Empresa já cadastrada', 'warning');
        return;
    }
    
    const novaEmpresa = {
        id: Date.now(),
        nome: nome,
        cnpj: formData.get('cnpj'),
        contato: formData.get('contato')
    };
    
    empresas.push(novaEmpresa);
    salvarDados();
    carregarListaEmpresas();
    atualizarDatalistEmpresas(); // Atualiza o auto-complete
    this.reset();
    showNotification('Empresa salva!', 'success');
});

function carregarListaEmpresas() {
    if (!listaEmpresas) return;
    listaEmpresas.innerHTML = '';
    empresas.sort((a, b) => a.nome.localeCompare(b.nome)); // Ordena
    
    empresas.forEach(empresa => {
        listaEmpresas.innerHTML += `
            <tr>
                <td><strong>${empresa.nome}</strong></td>
                <td>${empresa.cnpj || 'N/A'}</td>
                <td>${empresa.contato || 'N/A'}</td>
                <td>
                    <button class="btn-remover" onclick="removerItemEmpresa(${empresa.id})">
                        <span class="icon">❌</span>
                    </button>
                </td>
            </tr>
        `;
    });
}

function removerItemEmpresa(id) {
    if (confirm('Tem certeza que deseja remover esta empresa?')) {
        empresas = empresas.filter(em => em.id !== id);
        salvarDados();
        carregarListaEmpresas();
        atualizarDatalistEmpresas(); // Atualiza o auto-complete
        showNotification('Empresa removida', 'success');
    }
}

// Inicializa a formatação de CNPJ (simples)
const cnpjInput = document.getElementById('empresa-cnpj');
if (cnpjInput) {
    cnpjInput.addEventListener('input', function(e) {
        let v = e.target.value.replace(/\D/g,"");
        v = v.replace(/^(\d{2})(\d)/,"$1.$2");
        v = v.replace(/^(\d{2})\.(\d{3})(\d)/,"$1.$2.$3");
        v = v.replace(/\.(\d{3})(\d)/,".$1/$2");
        v = v.replace(/(\d{4})(\d)/,"$1-$2");
        e.target.value = v.substring(0, 18);
    });
}