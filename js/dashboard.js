// Atualizar dashboard com estatísticas
function atualizarDashboard() {
    const hoje = new Date().toLocaleDateString('pt-BR');
    
    // Filtra registros de hoje
    const registrosHoje = registros.filter(reg => reg.data.includes(hoje));
    const entradasHoje = registrosHoje.filter(reg => reg.tipo_entrada === 'entrada');
    
    // Calcula estatísticas
    const totalEntradas = entradasHoje.length;
    const totalPessoas = entradasHoje.reduce((acc, reg) => acc + parseInt(reg.quantidade_pessoas), 0);
    const onibusAtivos = entradasHoje.filter(reg => reg.tipo_veiculo === 'onibus').length;
    const manobrasHoje = manobras.filter(manobra => 
        new Date(manobra.data_criacao).toLocaleDateString('pt-BR') === hoje
    ).length;
    
    // Atualiza interface
    document.getElementById('total-entradas').textContent = totalEntradas;
    document.getElementById('total-pessoas').textContent = totalPessoas;
    document.getElementById('onibus-ativos').textContent = onibusAtivos;
    document.getElementById('manobras-hoje').textContent = manobrasHoje;
}