// js/consultas.js

const btnFiltrar = document.getElementById('btn-filtrar');
const btnExportar = document.getElementById('btn-exportar-csv');
const listaConsultas = document.getElementById('lista-consultas');

// Inputs de filtro
const filtroDataInicio = document.getElementById('filtro-data-inicio');
const filtroDataFim = document.getElementById('filtro-data-fim');
const filtroPlaca = document.getElementById('filtro-placa');
const filtroEmpresa = document.getElementById('filtro-empresa');

let resultadosFiltrados = []; // Armazena os resultados atuais para exportação

// Botão de filtrar
btnFiltrar.addEventListener('click', function() {
    // Pega valores dos filtros
    const dataInicio = filtroDataInicio.value ? new Date(filtroDataInicio.value + 'T00:00:00').getTime() : null;
    const dataFim = filtroDataFim.value ? new Date(filtroDataFim.value + 'T23:59:59').getTime() : null;
    const placa = filtroPlaca.value.toUpperCase();
    const empresa = filtroEmpresa.value.toLowerCase();
    
    // Aplica filtros
    resultadosFiltrados = registros.filter(reg => {
        let passou = true;
        
        // Filtro de Data Início
        if (dataInicio && reg.timestamp_entrada < dataInicio) {
            passou = false;
        }
        
        // Filtro de Data Fim
        if (dataFim && reg.timestamp_entrada > dataFim) {
            passou = false;
        }
        
        // Filtro de Placa
        if (placa && !reg.placa_veiculo.includes(placa)) {
            passou = false;
        }
        
        // Filtro de Empresa
        if (empresa && (!reg.empresa || !reg.empresa.toLowerCase().includes(empresa))) {
            passou = false;
        }
        
        return passou;
    });

    // Ordena por mais recente
    resultadosFiltrados.sort((a, b) => b.timestamp_entrada - a.timestamp_entrada);
    
    // Renderiza resultados
    renderResultadosConsulta(resultadosFiltrados);
});

// Botão de exportar
btnExportar.addEventListener('click', function() {
    if (resultadosFiltrados.length === 0) {
        showNotification('Filtre alguns dados antes de exportar', 'warning');
        return;
    }
    
    // Prepara dados para CSV
    const dadosParaExportar = resultadosFiltrados.map(reg => ({
        Placa: reg.placa_veiculo,
        Status: reg.status,
        Responsavel: reg.nome,
        CPF: reg.cpf,
        Empresa: reg.empresa,
        Veiculo: reg.tipo_veiculo,
        Pessoas: reg.quantidade_pessoas,
        Entrada: reg.data_hora_entrada,
        Saida: reg.data_hora_saida || 'N/A',
        Observacoes: reg.observacoes
    }));
    
    exportDataToCSV(dadosParaExportar, 'relatorio_portaria.csv');
});


// Renderiza a tabela de resultados
function renderResultadosConsulta(resultados) {
    if (!listaConsultas) return;

    if (resultados.length === 0) {
        listaConsultas.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-light);">
                    Nenhum registro encontrado para este filtro
                </td>
            </tr>
        `;
        return;
    }
    
    listaConsultas.innerHTML = resultados.map(reg => `
        <tr>
            <td><strong>${reg.placa_veiculo}</strong></td>
            <td>${reg.nome || 'N/A'}</td>
            <td>${reg.empresa || 'N/A'}</td>
            <td>${reg.quantidade_pessoas}</td>
            <td>${reg.data_hora_entrada}</td>
            <td>${reg.data_hora_saida || '---'}</td>
            <td>
                <span class="status-badge status-${reg.status}">
                    ${reg.status === 'dentro' ? 'No Pátio' : 'Fora'}
                </span>
            </td>
        </tr>
    `).join('');
}