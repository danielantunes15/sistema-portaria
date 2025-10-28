// Atualizar dashboard com estatísticas
function atualizarDashboard() {
    const hoje = new Date().toLocaleDateString('pt-BR');
    
    // Registros de hoje
    const registrosHoje = registros.filter(reg => reg.data_hora_entrada.includes(hoje));
    
    // Registros que estão ATUALMENTE no pátio
    const registrosNoPatio = registros.filter(reg => reg.status === 'dentro');
    
    // Calcula estatísticas
    const totalEntradasHoje = registrosHoje.length;
    
    const totalPessoasAgora = registrosNoPatio.reduce((acc, reg) => acc + parseInt(reg.quantidade_pessoas), 0);
    
    const totalVeiculosNoPatio = registrosNoPatio.length;
    
    const manobrasHoje = manobras.filter(manobra => 
        new Date(manobra.data_criacao_timestamp).toLocaleDateString('pt-BR') === hoje
    ).length;
    
    // Atualiza interface
    document.getElementById('total-entradas').textContent = totalEntradasHoje;
    document.getElementById('total-pessoas-agora').textContent = totalPessoasAgora;
    document.getElementById('veiculos-no-patio').textContent = totalVeiculosNoPatio;
    document.getElementById('manobras-hoje').textContent = manobrasHoje;

    // Renderiza a lista de veículos no pátio
    renderVeiculosNoPatio(registrosNoPatio);

    // Renderiza o gráfico de fluxo
    renderFluxoChart(registrosHoje);
}

// Renderiza a lista de veículos atualmente no pátio
function renderVeiculosNoPatio(registrosNoPatio) {
    const tbody = document.getElementById('lista-veiculos-no-patio');
    if (!tbody) return;

    // Ordena por entrada mais recente
    const registrosOrdenados = registrosNoPatio.sort((a, b) => b.timestamp_entrada - a.timestamp_entrada);
    
    if (registrosOrdenados.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 2rem; color: var(--text-light);">
                    Pátio vazio
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = registrosOrdenados.map(reg => `
        <tr>
            <td><strong>${reg.placa_veiculo}</strong></td>
            <td>${reg.empresa || 'N/A'}</td>
            <td>${reg.quantidade_pessoas}</td>
            <td>${reg.data_hora_entrada.split(' ')[1]}</td>
        </tr>
    `).join('');
}

// Renderiza o gráfico de fluxo de entradas
function renderFluxoChart(registrosHoje) {
    const container = document.getElementById('fluxo-chart');
    if (!container) return;

    // Agrupa entradas por hora (das 0h às 23h)
    const fluxoPorHora = new Array(24).fill(0);
    
    registrosHoje.forEach(reg => {
        const hora = new Date(reg.timestamp_entrada).getHours();
        fluxoPorHora[hora]++;
    });

    // Encontra o valor máximo para normalizar a altura (escala)
    const maxValor = Math.max(...fluxoPorHora);
    const alturaMaxima = 200; // Altura máxima do gráfico em pixels

    // Define quais horas mostrar (ex: 6h às 22h)
    const horaInicio = 6;
    const horaFim = 22;

    container.innerHTML = ''; // Limpa o gráfico anterior

    for (let hora = horaInicio; hora <= horaFim; hora++) {
        const valor = fluxoPorHora[hora];
        // Calcula a altura da barra
        const alturaBarra = (maxValor === 0) ? 0 : (valor / maxValor) * alturaMaxima;
        
        const barWrapper = document.createElement('div');
        barWrapper.className = 'chart-bar-wrapper';
        
        barWrapper.innerHTML = `
            ${valor > 0 ? `<div class="chart-bar-value">${valor}</div>` : ''}
            <div class="chart-bar" style="height: ${alturaBarra}px;"></div>
            <div class="chart-bar-label">${hora.toString().padStart(2, '0')}h</div>
        `;
        
        container.appendChild(barWrapper);
    }
}