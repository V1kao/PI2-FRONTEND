/**
 * Sistema de Relatórios SAGE
 * Integrado com API Real
 */

// Estado da aplicação
const appState = {
    setores: [],
    salas: [],
    dispositivos: [],
    deviceTypes: [],
    deviceRoomLinks: [],
    currentUser: null,
    currentCompany: null,
    billData: {
        valor: 0,
        mes: '',
        ano: ''
    }
};

let chartInstances = {};

// ==================== VERIFICAÇÃO DE AUTENTICAÇÃO ====================
async function checkAuthentication() {
    try {
        const token = CookieManager.get('auth_token');
        if (!token) {
            window.location.href = 'cadastro.html';
            return false;
        }

        appState.currentCompany = await apiService.getCompany();
        return true;
    } catch (error) {
        console.error('Erro ao validar autenticação:', error);
        apiService.clearToken();
        window.location.href = 'cadastro.html';
        return false;
    }
}

// ==================== CARREGAMENTO DE DADOS ====================
async function loadData() {
    try {
        showLoading(true);

        const [departmentsResponse, roomsResponse, deviceTypesResponse, devicesResponse, linksResponse] =
            await Promise.allSettled([
                apiService.listDepartments({ size: 100 }),
                apiService.listRooms({ size: 100 }),
                apiService.listDeviceTypes({ size: 100 }),
                apiService.listDevices({ size: 100 }),
                apiService.listDeviceRoomAssociations({ size: 100 })
            ]);

        if (departmentsResponse.status === 'fulfilled' && departmentsResponse.value?.content) {
            appState.setores = departmentsResponse.value.content;
        }

        if (roomsResponse.status === 'fulfilled' && roomsResponse.value?.content) {
            appState.salas = roomsResponse.value.content;
        }

        if (deviceTypesResponse.status === 'fulfilled' && deviceTypesResponse.value?.content) {
            appState.deviceTypes = deviceTypesResponse.value.content;
        }

        if (devicesResponse.status === 'fulfilled' && devicesResponse.value?.content) {
            appState.dispositivos = devicesResponse.value.content;
        }

        if (linksResponse.status === 'fulfilled' && linksResponse.value?.content) {
            appState.deviceRoomLinks = linksResponse.value.content;
        }

        console.log('Dados carregados:', {
            setores: appState.setores.length,
            salas: appState.salas.length,
            dispositivos: appState.dispositivos.length,
            vinculos: appState.deviceRoomLinks.length
        });

        showLoading(false);
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showLoading(false);
        showNotification('Erro ao carregar dados', 'error');
    }
}

// ==================== GERAÇÃO DE RELATÓRIOS ====================
function validateBillData() {
    const billValue = document.getElementById('billValue');
    const billMonth = document.getElementById('billMonth');
    const billYear = document.getElementById('billYear');

    let isValid = true;

    if (!billValue.value || parseFloat(billValue.value) <= 0) {
        showError('billValue', 'Valor da conta é obrigatório');
        isValid = false;
    } else {
        hideError('billValue');
    }

    if (!billMonth.value) {
        showError('billMonth', 'Mês é obrigatório');
        isValid = false;
    } else {
        hideError('billMonth');
    }

    if (!billYear.value) {
        showError('billYear', 'Ano é obrigatório');
        isValid = false;
    } else {
        hideError('billYear');
    }

    if (isValid) {
        appState.billData = {
            valor: parseFloat(billValue.value),
            mes: billMonth.value,
            ano: billYear.value
        };
    }

    return isValid;
}

function showError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const error = document.getElementById(`${fieldId}-error`);
    field.classList.add('invalid');
    error.textContent = message;
    error.classList.add('show');
}

function hideError(fieldId) {
    const field = document.getElementById(fieldId);
    const error = document.getElementById(`${fieldId}-error`);
    field.classList.remove('invalid');
    error.classList.remove('show');
}

// ==================== PROCESSAMENTO DE DADOS ====================
function calcularConsumoTotal() {
    return appState.deviceRoomLinks.reduce((total, link) => {
        const device = appState.dispositivos.find(d => d.id === link.deviceId);
        if (device) {
            // Consumo em kWh = Potência (W) * Horas/dia * 30 dias / 1000
            const consumoMensal = (device.power * link.averageTimeHour * 30) / 1000;
            return total + consumoMensal;
        }
        return total;
    }, 0);
}

function getConsumoPorSetor() {
    const consumoPorSetor = {};

    appState.setores.forEach(setor => {
        consumoPorSetor[setor.id] = {
            nome: setor.name,
            consumo: 0
        };
    });

    appState.deviceRoomLinks.forEach(link => {
        const sala = appState.salas.find(s => s.id === link.roomId);
        const device = appState.dispositivos.find(d => d.id === link.deviceId);

        if (sala && device) {
            const consumoMensal = (device.power * link.averageTimeHour * 30) / 1000;
            if (consumoPorSetor[sala.departmentId]) {
                consumoPorSetor[sala.departmentId].consumo += consumoMensal;
            }
        }
    });

    return Object.values(consumoPorSetor).filter(s => s.consumo > 0);
}

function getConsumoPorSala() {
    const consumoPorSala = {};

    appState.salas.forEach(sala => {
        consumoPorSala[sala.id] = {
            nome: sala.name,
            consumo: 0
        };
    });

    appState.deviceRoomLinks.forEach(link => {
        const device = appState.dispositivos.find(d => d.id === link.deviceId);

        if (device && consumoPorSala[link.roomId]) {
            const consumoMensal = (device.power * link.averageTimeHour * 30) / 1000;
            consumoPorSala[link.roomId].consumo += consumoMensal;
        }
    });

    return Object.values(consumoPorSala).filter(s => s.consumo > 0);
}

function getCustosPorDispositivo() {
    if (!appState.billData.valor || appState.billData.valor <= 0) {
        return [];
    }

    const consumoTotal = calcularConsumoTotal();
    const custoPorKwh = consumoTotal > 0 ? appState.billData.valor / consumoTotal : 0;

    const custos = appState.deviceRoomLinks.map(link => {
        const device = appState.dispositivos.find(d => d.id === link.deviceId);
        if (device) {
            const consumoMensal = (device.power * link.averageTimeHour * 30) / 1000;
            const custo = consumoMensal * custoPorKwh;
            return {
                nome: link.alias || device.name,
                consumo: consumoMensal,
                custo: custo,
                percentual: consumoTotal > 0 ? (consumoMensal / consumoTotal * 100) : 0
            };
        }
        return null;
    }).filter(item => item !== null);

    return custos.sort((a, b) => b.custo - a.custo);
}

// ==================== GERAÇÃO DE GRÁFICOS ====================
function generateReport(reportType) {
    if (!validateBillData()) {
        showNotification('Preencha todos os campos da conta de luz!', 'error');
        return;
    }

    // Limpar gráficos anteriores
    Object.values(chartInstances).forEach(chart => chart.destroy());
    chartInstances = {};

    const container = document.getElementById('chartsContainer');

    switch (reportType) {
        case 'consumo-setor':
            generateConsumoSetorChart(container);
            break;
        case 'consumo-sala':
            generateConsumoSalaChart(container);
            break;
        case 'custos':
            generateCustosChart(container);
            break;
        case 'dispositivos':
            generateDispositivosChart(container);
            break;
    }

    // Scroll suave para os gráficos
    setTimeout(() => {
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

function generateConsumoSetorChart(container) {
    const dados = getConsumoPorSetor();

    if (dados.length === 0) {
        showNotification('Nenhum dado disponível para gerar o relatório', 'warning');
        return;
    }

    const html = `
        <div class="charts-header">
            <h3><i class="fas fa-chart-bar"></i> Consumo por Setor</h3>
            <button class="close-charts-btn" onclick="clearCharts()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="charts-grid">
            <div class="chart-card">
                <div class="chart-card-header">
                    <h4>Consumo Mensal por Setor (kWh)</h4>
                </div>
                <div class="chart-canvas-wrapper">
                    <canvas id="chartConsumoSetor"></canvas>
                </div>
                <div class="chart-actions">
                    <button class="btn-download" onclick="downloadChart('chartConsumoSetor', 'Consumo por Setor')">
                        <i class="fas fa-download"></i> Baixar Gráfico
                    </button>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = html;

    const ctx = document.getElementById('chartConsumoSetor').getContext('2d');
    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dados.map(d => d.nome),
            datasets: [{
                label: 'Consumo (kWh)',
                data: dados.map(d => d.consumo.toFixed(2)),
                backgroundColor: ['#ffb703', '#e6a400', '#ff8500', '#0077be', '#10b981'],
                borderRadius: 10,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: getChartOptions('Consumo (kWh)')
    });

    chartInstances['chartConsumoSetor'] = chart;
    showNotification('Relatório gerado com sucesso!', 'success');
}

function generateConsumoSalaChart(container) {
    const dados = getConsumoPorSala();

    if (dados.length === 0) {
        showNotification('Nenhum dado disponível para gerar o relatório', 'warning');
        return;
    }

    const html = `
        <div class="charts-header">
            <h3><i class="fas fa-door-open"></i> Consumo por Sala</h3>
            <button class="close-charts-btn" onclick="clearCharts()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="charts-grid">
            <div class="chart-card">
                <div class="chart-card-header">
                    <h4>Consumo Mensal por Sala (kWh)</h4>
                </div>
                <div class="chart-canvas-wrapper">
                    <canvas id="chartConsumoSala"></canvas>
                </div>
                <div class="chart-actions">
                    <button class="btn-download" onclick="downloadChart('chartConsumoSala', 'Consumo por Sala')">
                        <i class="fas fa-download"></i> Baixar Gráfico
                    </button>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = html;

    const ctx = document.getElementById('chartConsumoSala').getContext('2d');
    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dados.map(d => d.nome),
            datasets: [{
                label: 'Consumo (kWh)',
                data: dados.map(d => d.consumo.toFixed(2)),
                backgroundColor: '#3b82f6',
                borderRadius: 10
            }]
        },
        options: getChartOptions('Consumo (kWh)')
    });

    chartInstances['chartConsumoSala'] = chart;
    showNotification('Relatório gerado com sucesso!', 'success');
}

function generateCustosChart(container) {
    const dados = getCustosPorDispositivo();

    if (dados.length === 0) {
        showNotification('Nenhum dado disponível para gerar o relatório', 'warning');
        return;
    }

    const html = `
        <div class="charts-header">
            <h3><i class="fas fa-chart-pie"></i> Custos por Dispositivo</h3>
            <button class="close-charts-btn" onclick="clearCharts()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="charts-grid">
            <div class="chart-card">
                <div class="chart-card-header">
                    <h4>Distribuição de Custos Mensais (R$)</h4>
                </div>
                <div class="chart-canvas-wrapper">
                    <canvas id="chartCustos"></canvas>
                </div>
                <div class="chart-actions">
                    <button class="btn-download" onclick="downloadChart('chartCustos', 'Custos por Dispositivo')">
                        <i class="fas fa-download"></i> Baixar Gráfico
                    </button>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = html;

    const ctx = document.getElementById('chartCustos').getContext('2d');
    const chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: dados.map(d => d.nome),
            datasets: [{
                data: dados.map(d => d.custo.toFixed(2)),
                backgroundColor: ['#ffb703', '#e6a400', '#ff8500', '#0077be', '#10b981', '#3b82f6', '#6c757d'],
                borderWidth: 3,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right' },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const label = context.label || '';
                            const value = parseFloat(context.parsed);
                            return `${label}: R$ ${value.toFixed(2)}`;
                        }
                    }
                }
            }
        }
    });

    chartInstances['chartCustos'] = chart;
    showNotification('Relatório gerado com sucesso!', 'success');
}

function generateDispositivosChart(container) {
    const dados = getCustosPorDispositivo();

    if (dados.length === 0) {
        showNotification('Nenhum dado disponível para gerar o relatório', 'warning');
        return;
    }

    const html = `
        <div class="charts-header">
            <h3><i class="fas fa-microchip"></i> Análise de Dispositivos</h3>
            <button class="close-charts-btn" onclick="clearCharts()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="charts-grid">
            <div class="chart-card">
                <div class="chart-card-header">
                    <h4>Consumo por Dispositivo (kWh)</h4>
                </div>
                <div class="chart-canvas-wrapper">
                    <canvas id="chartDispositivos"></canvas>
                </div>
                <div class="chart-actions">
                    <button class="btn-download" onclick="downloadChart('chartDispositivos', 'Analise de Dispositivos')">
                        <i class="fas fa-download"></i> Baixar Gráfico
                    </button>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = html;

    const ctx = document.getElementById('chartDispositivos').getContext('2d');
    const chart = new Chart(ctx, {
        type: 'horizontalBar',
        data: {
            labels: dados.map(d => d.nome),
            datasets: [{
                label: 'Consumo (kWh)',
                data: dados.map(d => d.consumo.toFixed(2)),
                backgroundColor: '#10b981'
            }]
        },
        options: getChartOptions('Consumo (kWh)')
    });

    chartInstances['chartDispositivos'] = chart;
    showNotification('Relatório gerado com sucesso!', 'success');
}

function getChartOptions(yAxisLabel) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(0, 24, 36, 0.9)',
                titleColor: '#ffb703',
                bodyColor: '#ffffff',
                borderColor: '#ffb703',
                borderWidth: 1,
                cornerRadius: 8,
                padding: 12
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: { display: true, text: yAxisLabel, color: '#f7f7f7' },
                ticks: { color: '#f7f7f7' },
                grid: { color: 'rgba(247, 247, 247, 0.1)' }
            },
            x: {
                ticks: { color: '#f7f7f7' },
                grid: { display: false }
            }
        }
    };
}

// ==================== FUNÇÕES AUXILIARES ====================
function clearCharts() {
    Object.values(chartInstances).forEach(chart => chart.destroy());
    chartInstances = {};
    document.getElementById('chartsContainer').innerHTML = '';
}

function downloadChart(chartId, fileName) {
    const chart = chartInstances[chartId];
    if (!chart) {
        showNotification('Gráfico não encontrado!', 'error');
        return;
    }

    const url = chart.toBase64Image();
    const link = document.createElement('a');
    link.download = `${fileName}.png`;
    link.href = url;
    link.click();

    showNotification('Gráfico baixado com sucesso!', 'success');
}

function showLoading(show) {
    let loadingEl = document.getElementById('loadingOverlay');

    if (show && !loadingEl) {
        loadingEl = document.createElement('div');
        loadingEl.id = 'loadingOverlay';
        loadingEl.className = 'loading-overlay';
        loadingEl.innerHTML = `
            <div class="loading-content">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Carregando dados...</p>
            </div>
        `;
        document.body.appendChild(loadingEl);
    } else if (!show && loadingEl) {
        loadingEl.remove();
    }
}

function showNotification(message, type = 'success', duration = 3000) {
    const notification = document.getElementById('notification');
    if (!notification) return;

    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, duration);
}

function logout() {
    apiService.clearToken();
    window.location.href = 'cadastro.html';
}

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', async () => {
    const isAuthenticated = await checkAuthentication();
    if (!isAuthenticated) return;

    await loadData();

    // Menu toggle
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const mobileOverlay = document.getElementById('mobileOverlay');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('expanded');
            if (window.innerWidth <= 768) {
                mobileOverlay.classList.toggle('active');
            }
        });
    }

    if (mobileOverlay) {
        mobileOverlay.addEventListener('click', () => {
            sidebar.classList.remove('expanded');
            mobileOverlay.classList.remove('active');
        });
    }

    // Botões de relatório
    const reportBtns = document.querySelectorAll('.report-btn');
    reportBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const reportType = btn.getAttribute('data-report');
            generateReport(reportType);
        });
    });

    // Validação em tempo real
    ['billValue', 'billMonth', 'billYear'].forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('blur', () => {
                if (field.value) hideError(fieldId);
            });
        }
    });

    console.log('Sistema de relatórios inicializado');
});

// Exportar funções globalmente
window.logout = logout;
window.clearCharts = clearCharts;
window.downloadChart = downloadChart;