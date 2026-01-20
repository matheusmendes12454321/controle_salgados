// Funções do Dashboard
async function loadDashboardData() {
    try {
        // Obter data atual
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        
        // Calcular datas para filtros
        const startOfMonth = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
        const startOfLastMonth = currentMonth === 1 
            ? `${currentYear - 1}-12-01`
            : `${currentYear}-${(currentMonth - 1).toString().padStart(2, '0')}-01`;
        
        // Obter transações do mês atual
        const { data: transacoesMes, error: error1 } = await supabase
            .from('transacoes')
            .select('*')
            .gte('data', startOfMonth)
            .order('data', { ascending: false });
        
        if (error1) throw error1;
        
        // Obter transações do mês anterior
        const { data: transacoesMesAnterior, error: error2 } = await supabase
            .from('transacoes')
            .select('*')
            .gte('data', startOfLastMonth)
            .lt('data', startOfMonth)
            .order('data', { ascending: false });
        
        if (error2) throw error2;
        
        // Calcular totais
        let totalVendasMes = 0;
        let totalCustosMes = 0;
        let totalVendasMesAnterior = 0;
        let totalCustosMesAnterior = 0;
        
        transacoesMes.forEach(t => {
            if (t.tipo === 'entrada') {
                totalVendasMes += parseFloat(t.valor);
            } else if (t.tipo === 'saida') {
                totalCustosMes += parseFloat(t.valor);
            }
        });
        
        transacoesMesAnterior.forEach(t => {
            if (t.tipo === 'entrada') {
                totalVendasMesAnterior += parseFloat(t.valor);
            } else if (t.tipo === 'saida') {
                totalCustosMesAnterior += parseFloat(t.valor);
            }
        });
        
        const lucroMes = totalVendasMes - totalCustosMes;
        const lucroMesAnterior = totalVendasMesAnterior - totalCustosMesAnterior;
        
        // Calcular variações percentuais
        const variacaoVendas = totalVendasMesAnterior > 0 
            ? ((totalVendasMes - totalVendasMesAnterior) / totalVendasMesAnterior * 100).toFixed(1)
            : 0;
        
        const variacaoCustos = totalCustosMesAnterior > 0
            ? ((totalCustosMes - totalCustosMesAnterior) / totalCustosMesAnterior * 100).toFixed(1)
            : 0;
        
        const variacaoLucro = lucroMesAnterior > 0
            ? ((lucroMes - lucroMesAnterior) / lucroMesAnterior * 100).toFixed(1)
            : 0;
        
        // Atualizar interface
        document.getElementById('vendas-mes').textContent = formatCurrency(totalVendasMes);
        document.getElementById('custos-mes').textContent = formatCurrency(totalCustosMes);
        document.getElementById('lucro-mes').textContent = formatCurrency(lucroMes);
        document.getElementById('total-profit').textContent = formatCurrency(lucroMes);
        
        document.getElementById('vendas-variacao').textContent = 
            `${variacaoVendas >= 0 ? '+' : ''}${variacaoVendas}% em relação ao mês anterior`;
        
        document.getElementById('custos-variacao').textContent = 
            `${variacaoCustos >= 0 ? '+' : ''}${variacaoCustos}% em relação ao mês anterior`;
        
        document.getElementById('lucro-variacao').textContent = 
            `${variacaoLucro >= 0 ? '+' : ''}${variacaoLucro}% em relação ao mês anterior`;
        
        // Carregar produto mais vendido (simulação)
        document.getElementById('produto-top').textContent = 'Coxinha';
        document.getElementById('produto-quantidade').textContent = '150 unidades';
        
        // Carregar transações recentes
        loadRecentTransactions();
        
        // Carregar gráficos
        loadCharts(transacoesMes);
        
    } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
    }
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

async function loadRecentTransactions() {
    const { data, error } = await supabase
        .from('transacoes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
    
    if (error) {
        console.error('Erro ao carregar transações recentes:', error);
        return;
    }
    
    const tbody = document.querySelector('#recent-transactions tbody');
    tbody.innerHTML = '';
    
    data.forEach(transacao => {
        const row = document.createElement('tr');
        const date = new Date(transacao.data);
        const formattedDate = date.toLocaleDateString('pt-BR');
        
        const tipoBadge = transacao.tipo === 'entrada' 
            ? `<span class="badge badge-entrada">Entrada</span>`
            : `<span class="badge badge-saida">Saída</span>`;
        
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${tipoBadge}</td>
            <td>${transacao.descricao}</td>
            <td class="${transacao.tipo === 'entrada' ? 'text-entrada' : 'text-saida'}">
                ${transacao.tipo === 'entrada' ? '+' : '-'} ${formatCurrency(transacao.valor)}
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

function loadCharts(transacoesMes) {
    // Gráfico de distribuição de custos
    const custosPorCategoria = {};
    transacoesMes
        .filter(t => t.tipo === 'saida')
        .forEach(t => {
            custosPorCategoria[t.categoria] = (custosPorCategoria[t.categoria] || 0) + parseFloat(t.valor);
        });
    
    const custosCtx = document.getElementById('custosChart').getContext('2d');
    new Chart(custosCtx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(custosPorCategoria),
            datasets: [{
                data: Object.values(custosPorCategoria),
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                    '#9966FF', '#FF9F40', '#8AC926', '#1982C4'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
    
    // Gráfico de vendas dos últimos 7 dias
    const ultimos7Dias = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
    }).reverse();
    
    const vendasPorDia = {};
    ultimos7Dias.forEach(date => {
        vendasPorDia[date] = 0;
    });
    
    transacoesMes
        .filter(t => t.tipo === 'entrada' && ultimos7Dias.includes(t.data))
        .forEach(t => {
            vendasPorDia[t.data] = (vendasPorDia[t.data] || 0) + parseFloat(t.valor);
        });
    
    const vendasCtx = document.getElementById('vendasChart').getContext('2d');
    new Chart(vendasCtx, {
        type: 'line',
        data: {
            labels: ultimos7Dias.map(date => {
                const d = new Date(date);
                return d.toLocaleDateString('pt-BR', { weekday: 'short' });
            }),
            datasets: [{
                label: 'Vendas (R$)',
                data: ultimos7Dias.map(date => vendasPorDia[date]),
                borderColor: '#36A2EB',
                backgroundColor: 'rgba(54, 162, 235, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + value;
                        }
                    }
                }
            }
        }
    });
}