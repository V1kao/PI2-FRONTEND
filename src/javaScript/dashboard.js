// Application State com dados pré-cadastrados
const appState = {
    setores: [
        {
            id: 1,
            nome: 'Administrativo',
            responsavel: 'João Silva',
            descricao: 'Setor responsável pela gestão administrativa da empresa'
        },
        {
            id: 2,
            nome: 'Produção',
            responsavel: 'Maria Santos',
            descricao: 'Setor de produção e manufatura'
        },
        {
            id: 3,
            nome: 'TI',
            responsavel: 'Carlos Oliveira',
            descricao: 'Tecnologia da Informação e suporte técnico'
        }
    ],
    salas: [
        {
            id: 1,
            nome: 'Sala de Reuniões A',
            setor: '1',
            observacoes: 'Sala principal para reuniões executivas'
        },
        {
            id: 2,
            nome: 'Escritório Administrativo',
            setor: '1',
            observacoes: 'Espaço de trabalho administrativo'
        },
        {
            id: 3,
            nome: 'Linha de Produção 1',
            setor: '2',
            observacoes: 'Primeira linha de montagem'
        },
        {
            id: 4,
            nome: 'Sala de Servidores',
            setor: '3',
            observacoes: 'Data center principal'
        },
        {
            id: 5,
            nome: 'Laboratório de Desenvolvimento',
            setor: '3',
            observacoes: 'Espaço para desenvolvimento de software'
        }
    ],
    dispositivos: [
        {
            id: 1,
            nome: 'AC Central Admin',
            tipo: 'Ar Condicionado',
            sala: '2',
            consumo: 450,
            descricao: 'Ar condicionado central 24000 BTUs'
        },
        {
            id: 2,
            nome: 'Iluminação LED Reunião',
            tipo: 'Iluminação LED',
            sala: '1',
            consumo: 120,
            descricao: 'Sistema de iluminação LED 100W'
        },
        {
            id: 3,
            nome: 'Computadores Admin',
            tipo: 'Computadores',
            sala: '2',
            consumo: 550,
            descricao: '10 computadores desktop'
        },
        {
            id: 4,
            nome: 'Servidor Principal',
            tipo: 'Servidores',
            sala: '4',
            consumo: 800,
            descricao: 'Servidor Dell PowerEdge'
        },
        {
            id: 5,
            nome: 'Impressora Multifuncional',
            tipo: 'Impressoras',
            sala: '2',
            consumo: 80,
            descricao: 'Impressora HP LaserJet'
        },
        {
            id: 6,
            nome: 'Sistema Refrigeração Produção',
            tipo: 'Refrigeração',
            sala: '3',
            consumo: 950,
            descricao: 'Sistema de refrigeração industrial'
        },
        {
            id: 7,
            nome: 'Workstations Desenvolvimento',
            tipo: 'Computadores',
            sala: '5',
            consumo: 600,
            descricao: '8 estações de trabalho high-end'
        }
    ]
};

// Mapeamento de tipos de gráficos disponíveis para cada relatório
const chartTypesConfig = {
    'consumo-setor': {
        name: 'Consumo Mensal por Setor',
        types: [
            { id: 'bar', icon: 'fa-chart-bar', label: 'Gráfico de Barras' },
            { id: 'line', icon: 'fa-chart-line', label: 'Gráfico de Linhas' },
            { id: 'mixed', icon: 'fa-chart-area', label: 'Gráfico Misto' }
        ]
    },
    'economia': {
        name: 'Economia Alcançada (%)',
        types: [
            { id: 'line', icon: 'fa-chart-line', label: 'Gráfico de Linhas' },
            { id: 'area', icon: 'fa-chart-area', label: 'Gráfico de Área' },
            { id: 'bar', icon: 'fa-chart-bar', label: 'Gráfico de Barras' }
        ]
    },
    'custos': {
        name: 'Custos por Dispositivo',
        types: [
            { id: 'doughnut', icon: 'fa-chart-pie', label: 'Gráfico de Rosca' },
            { id: 'bar', icon: 'fa-chart-bar', label: 'Gráfico de Barras' },
            { id: 'bubble', icon: 'fa-circle', label: 'Gráfico de Bolhas' }
        ]
    },
    'evolucao': {
        name: 'Evolução do Consumo Anual',
        types: [
            { id: 'line', icon: 'fa-chart-line', label: 'Gráfico de Linhas' },
            { id: 'area', icon: 'fa-chart-area', label: 'Gráfico de Área' },
            { id: 'mixed', icon: 'fa-chart-area', label: 'Gráfico Misto' }
        ]
    }
};

// Armazenar instâncias dos gráficos
let chartInstances = {};
let currentReportType = null;

// DOM Elements
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const mobileOverlay = document.getElementById('mobileOverlay');
const navLinks = document.querySelectorAll('.nav-link');
const contentSections = document.querySelectorAll('.content-section');
const notification = document.getElementById('notification');
const editModal = document.getElementById('editModal');
const modalClose = document.getElementById('modalClose');

// Reports Elements
const reportsToggleBtn = document.getElementById('reportsToggleBtn');
const reportsContainer = document.getElementById('reportsContainer');
const closeReportsBtn = document.getElementById('closeReportsBtn');
const reportBtns = document.querySelectorAll('.report-btn');

// View tabs
const viewTabs = document.querySelectorAll('.view-tab');
const viewContents = document.querySelectorAll('.view-content');

// Menu Toggle Functionality
if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('expanded');

        if (window.innerWidth <= 768) {
            mobileOverlay.classList.toggle('active');
        }
    });
}

// Close mobile menu when clicking overlay
if (mobileOverlay) {
    mobileOverlay.addEventListener('click', () => {
        sidebar.classList.remove('expanded');
        mobileOverlay.classList.remove('active');
    });
}

// Navigation
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();

        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        contentSections.forEach(section => section.classList.remove('active'));

        const targetSection = link.getAttribute('data-section');
        const targetElement = document.getElementById(targetSection);
        if (targetElement) {
            targetElement.classList.add('active');

            // Se for a seção de visualizar, renderizar listas
            if (targetSection === 'visualizar') {
                renderAllLists();
            }
        }

        if (window.innerWidth <= 768) {
            sidebar.classList.remove('expanded');
            mobileOverlay.classList.remove('active');
        }
    });
});

// View Tabs
viewTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        viewTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        viewContents.forEach(content => content.classList.remove('active'));

        const targetView = tab.getAttribute('data-tab');
        const targetElement = document.getElementById(targetView);
        if (targetElement) {
            targetElement.classList.add('active');
        }
    });
});

// Reports Functionality
if (reportsToggleBtn) {
    reportsToggleBtn.addEventListener('click', () => {
        reportsContainer.classList.toggle('active');
    });
}

if (closeReportsBtn) {
    closeReportsBtn.addEventListener('click', () => {
        reportsContainer.classList.remove('active');
        hideChartOptions();
        hideGeneratedCharts();
    });
}

// Report Buttons
reportBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const reportType = btn.getAttribute('data-report');

        // Se clicar no mesmo botão, toggle
        if (currentReportType === reportType) {
            hideChartOptions();
            currentReportType = null;
        } else {
            generateReportOptions(reportType);
            currentReportType = reportType;
        }
    });
});

function generateReportOptions(type) {
    const config = chartTypesConfig[type];

    if (!config) {
        showNotification('Tipo de relatório não encontrado!', 'error');
        return;
    }

    // Remover opções anteriores
    hideChartOptions();
    hideGeneratedCharts();

    // Criar container de opções
    const optionsContainer = document.createElement('div');
    optionsContainer.id = 'chartOptionsContainer';
    optionsContainer.className = 'chart-options-container';

    const chartOptionsHTML = config.types.map(chartType => `
        <label class="chart-checkbox-item">
            <input type="checkbox" name="chartTypes" value="${chartType.id}" data-label="${chartType.label}">
            <div class="checkbox-content">
                <i class="fas ${chartType.icon}"></i>
                <span>${chartType.label}</span>
            </div>
        </label>
    `).join('');

    optionsContainer.innerHTML = `
        <div class="chart-options-header">
            <h4>Selecione os tipos de gráficos para: ${config.name}</h4>
        </div>
        <div class="chart-selection-grid">
            ${chartOptionsHTML}
        </div>
        <div class="chart-options-actions">
            <button class="btn-secondary" onclick="hideChartOptions()">
                <i class="fas fa-times"></i> Cancelar
            </button>
            <button class="btn-primary" onclick="generateCharts('${type}')">
                <i class="fas fa-chart-line"></i> Gerar Gráficos
            </button>
        </div>
    `;

    // Inserir depois da grid de botões
    const reportsGrid = document.querySelector('.reports-grid');
    reportsGrid.insertAdjacentElement('afterend', optionsContainer);

    // Animar entrada
    setTimeout(() => {
        optionsContainer.classList.add('active');
    }, 10);
}

function hideChartOptions() {
    const optionsContainer = document.getElementById('chartOptionsContainer');
    if (optionsContainer) {
        optionsContainer.classList.remove('active');
        setTimeout(() => {
            optionsContainer.remove();
        }, 300);
    }
}

function hideGeneratedCharts() {
    const chartsContainer = document.getElementById('generatedChartsContainer');
    if (chartsContainer) {
        // Destruir instâncias dos gráficos
        Object.values(chartInstances).forEach(chart => {
            if (chart) chart.destroy();
        });
        chartInstances = {};

        chartsContainer.classList.remove('active');
        setTimeout(() => {
            chartsContainer.remove();
        }, 300);
    }
}

function generateCharts(reportType) {
    const selectedInputs = document.querySelectorAll('input[name="chartTypes"]:checked');

    if (selectedInputs.length === 0) {
        showNotification('Selecione pelo menos um tipo de gráfico!', 'warning');
        return;
    }

    const config = chartTypesConfig[reportType];
    const selectedCharts = Array.from(selectedInputs).map(input => ({
        type: input.value,
        label: input.getAttribute('data-label')
    }));

    hideChartOptions();
    hideGeneratedCharts();

    // Criar container de gráficos
    const chartsContainer = document.createElement('div');
    chartsContainer.id = 'generatedChartsContainer';
    chartsContainer.className = 'generated-charts-container';

    let chartsHTML = `
        <div class="generated-charts-header">
            <h3><i class="fas fa-chart-bar"></i> ${config.name}</h3>
            <button class="close-charts-btn" onclick="hideGeneratedCharts()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="generated-charts-grid">
    `;

    selectedCharts.forEach((chart, index) => {
        const chartId = `generatedChart_${reportType}_${chart.type}_${index}`;
        chartsHTML += `
            <div class="generated-chart-card">
                <div class="chart-card-header">
                    <h4>${chart.label}</h4>
                </div>
                <div class="chart-canvas-wrapper">
                    <canvas id="${chartId}"></canvas>
                </div>
                <div class="chart-card-footer">
                    <button class="btn-download" onclick="downloadChart('${chartId}', '${config.name} - ${chart.label}')">
                        <i class="fas fa-download"></i> Baixar Gráfico
                    </button>
                </div>
            </div>
        `;
    });

    chartsHTML += `</div>`;
    chartsContainer.innerHTML = chartsHTML;

    // Inserir no DOM
    const reportsGrid = document.querySelector('.reports-grid');
    reportsGrid.insertAdjacentElement('afterend', chartsContainer);

    // Animar entrada
    setTimeout(() => {
        chartsContainer.classList.add('active');

        // Criar os gráficos
        selectedCharts.forEach((chart, index) => {
            const chartId = `generatedChart_${reportType}_${chart.type}_${index}`;
            createChart(chartId, reportType, chart.type);
        });
    }, 10);

    showNotification(`${selectedCharts.length} gráfico(s) gerado(s) com sucesso!`, 'success');
}

function createChart(canvasId, reportType, chartType) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Dados de exemplo baseados no tipo de relatório
    let chartData = getChartData(reportType, chartType);

    const chartInstance = new Chart(ctx, chartData);
    chartInstances[canvasId] = chartInstance;
}

function getChartData(reportType, chartType) {
    const themeColors = {
        primary: '#ffb703',
        primaryBg: '#ffd966',
        secondary: '#001824',
        success: '#10b981',
        info: '#3b82f6'
    };

    const chartColors = [
        themeColors.primary,
        themeColors.primaryBg,
        themeColors.secondary,
        themeColors.success,
        themeColors.info,
        '#e6a400',
        '#ff8500',
        '#0077be'
    ];

    let config = {};

    // Dados baseados no tipo de relatório
    switch (reportType) {
        case 'consumo-setor':
            if (chartType === 'bar') {
                config = {
                    type: 'bar',
                    data: {
                        labels: ['Administrativo', 'Produção', 'TI', 'Vendas', 'RH', 'Financeiro'],
                        datasets: [{
                            label: 'Consumo (kWh)',
                            data: [1250, 3800, 950, 750, 400, 650],
                            backgroundColor: chartColors,
                            borderRadius: 8
                        }]
                    },
                    options: getChartOptions('bar')
                };
            } else if (chartType === 'line') {
                config = {
                    type: 'line',
                    data: {
                        labels: ['Administrativo', 'Produção', 'TI', 'Vendas', 'RH', 'Financeiro'],
                        datasets: [{
                            label: 'Consumo (kWh)',
                            data: [1250, 3800, 950, 750, 400, 650],
                            borderColor: themeColors.primary,
                            backgroundColor: 'rgba(255, 183, 3, 0.1)',
                            tension: 0.4,
                            fill: true
                        }]
                    },
                    options: getChartOptions('line')
                };
            } else if (chartType === 'mixed') {
                config = {
                    type: 'bar',
                    data: {
                        labels: ['Administrativo', 'Produção', 'TI', 'Vendas', 'RH', 'Financeiro'],
                        datasets: [{
                            label: 'Consumo (kWh)',
                            data: [1250, 3800, 950, 750, 400, 650],
                            backgroundColor: 'rgba(255, 183, 3, 0.5)',
                            type: 'bar'
                        }, {
                            label: 'Média',
                            data: [1300, 3700, 1000, 800, 450, 700],
                            borderColor: themeColors.success,
                            type: 'line',
                            tension: 0.4
                        }]
                    },
                    options: getChartOptions('bar')
                };
            }
            break;

        case 'economia':
            if (chartType === 'line') {
                config = {
                    type: 'line',
                    data: {
                        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
                        datasets: [{
                            label: 'Economia (%)',
                            data: [10, 12, 15, 18, 20, 22, 25, 28, 30, 32, 35, 38],
                            borderColor: themeColors.success,
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            tension: 0.4,
                            fill: true
                        }]
                    },
                    options: getChartOptions('line')
                };
            } else if (chartType === 'area') {
                config = {
                    type: 'line',
                    data: {
                        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
                        datasets: [{
                            label: 'Economia (%)',
                            data: [10, 12, 15, 18, 20, 22, 25, 28, 30, 32, 35, 38],
                            borderColor: themeColors.success,
                            backgroundColor: 'rgba(16, 185, 129, 0.3)',
                            tension: 0.4,
                            fill: true
                        }]
                    },
                    options: getChartOptions('line')
                };
            } else if (chartType === 'bar') {
                config = {
                    type: 'bar',
                    data: {
                        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
                        datasets: [{
                            label: 'Economia (%)',
                            data: [10, 12, 15, 18, 20, 22, 25, 28, 30, 32, 35, 38],
                            backgroundColor: themeColors.success,
                            borderRadius: 8
                        }]
                    },
                    options: getChartOptions('bar')
                };
            }
            break;

        case 'custos':
            if (chartType === 'doughnut') {
                config = {
                    type: 'doughnut',
                    data: {
                        labels: ['Ar Condicionado', 'Computadores', 'Iluminação', 'Servidores', 'Impressoras', 'Outros'],
                        datasets: [{
                            data: [40, 25, 15, 12, 5, 3],
                            backgroundColor: chartColors,
                            borderWidth: 2,
                            borderColor: '#fff'
                        }]
                    },
                    options: getChartOptions('doughnut')
                };
            } else if (chartType === 'bar') {
                config = {
                    type: 'bar',
                    data: {
                        labels: ['Ar Condicionado', 'Computadores', 'Iluminação', 'Servidores', 'Impressoras', 'Outros'],
                        datasets: [{
                            label: 'Custo (%)',
                            data: [40, 25, 15, 12, 5, 3],
                            backgroundColor: chartColors,
                            borderRadius: 8
                        }]
                    },
                    options: getChartOptions('bar')
                };
            } else if (chartType === 'bubble') {
                config = {
                    type: 'bubble',
                    data: {
                        datasets: [{
                            label: 'Ar Condicionado',
                            data: [{ x: 40, y: 25, r: 15 }],
                            backgroundColor: chartColors[0]
                        }, {
                            label: 'Computadores',
                            data: [{ x: 25, y: 20, r: 12 }],
                            backgroundColor: chartColors[1]
                        }, {
                            label: 'Iluminação',
                            data: [{ x: 15, y: 15, r: 10 }],
                            backgroundColor: chartColors[2]
                        }, {
                            label: 'Servidores',
                            data: [{ x: 12, y: 30, r: 8 }],
                            backgroundColor: chartColors[3]
                        }]
                    },
                    options: getChartOptions('bubble')
                };
            }
            break;

        case 'evolucao':
            if (chartType === 'line') {
                config = {
                    type: 'line',
                    data: {
                        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
                        datasets: [{
                            label: '2024',
                            data: [8500, 7800, 8200, 7500, 8000, 9200, 9800, 10200, 9500, 8800, 8300, 7900],
                            borderColor: themeColors.primary,
                            backgroundColor: 'rgba(255, 183, 3, 0.1)',
                            tension: 0.4,
                            fill: true
                        }, {
                            label: '2025',
                            data: [7800, 7200, 7600, 6900, 7300, 8400, 8800, 9100, 8600, 7900, 7500, 7100],
                            borderColor: themeColors.success,
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            tension: 0.4,
                            fill: true
                        }]
                    },
                    options: getChartOptions('line')
                };
            } else if (chartType === 'area') {
                config = {
                    type: 'line',
                    data: {
                        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
                        datasets: [{
                            label: '2024',
                            data: [8500, 7800, 8200, 7500, 8000, 9200, 9800, 10200, 9500, 8800, 8300, 7900],
                            borderColor: themeColors.primary,
                            backgroundColor: 'rgba(255, 183, 3, 0.3)',
                            tension: 0.4,
                            fill: true
                        }]
                    },
                    options: getChartOptions('line')
                };
            } else if (chartType === 'mixed') {
                config = {
                    type: 'bar',
                    data: {
                        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
                        datasets: [{
                            label: 'Consumo 2024',
                            data: [8500, 7800, 8200, 7500, 8000, 9200, 9800, 10200, 9500, 8800, 8300, 7900],
                            backgroundColor: 'rgba(255, 183, 3, 0.5)',
                            type: 'bar'
                        }, {
                            label: 'Tendência',
                            data: [8500, 8200, 8000, 7800, 7600, 7400, 7200, 7000, 6800, 6600, 6400, 6200],
                            borderColor: themeColors.success,
                            type: 'line',
                            tension: 0.4
                        }]
                    },
                    options: getChartOptions('bar')
                };
            }
            break;
    }

    return config;
}

function getChartOptions(type) {
    const baseOptions = {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 2,
        plugins: {
            legend: {
                display: true,
                position: 'top',
                labels: {
                    usePointStyle: true,
                    padding: 15,
                    font: {
                        size: 11
                    }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 24, 36, 0.9)',
                titleColor: '#ffb703',
                bodyColor: '#ffffff',
                borderColor: '#ffb703',
                borderWidth: 1,
                cornerRadius: 8
            }
        }
    };

    if (type === 'bar' || type === 'line') {
        baseOptions.scales = {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 24, 36, 0.1)'
                }
            },
            x: {
                grid: {
                    display: false
                }
            }
        };
    }

    return baseOptions;
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

// Modal Functions
function openModal(title, content) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = content;
    editModal.classList.add('active');
}

function closeModal() {
    editModal.classList.remove('active');
}

if (modalClose) {
    modalClose.addEventListener('click', closeModal);
}

if (editModal) {
    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) {
            closeModal();
        }
    });
}

// Render Functions
function renderSetoresList() {
    const container = document.getElementById('setoresList');
    const countEl = document.getElementById('setoresCount');

    if (!container) return;

    countEl.textContent = `${appState.setores.length} ${appState.setores.length === 1 ? 'item' : 'itens'}`;

    if (appState.setores.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-building"></i>
                <p>Nenhum setor cadastrado</p>
            </div>
        `;
        return;
    }

    container.innerHTML = appState.setores.map(setor => `
        <div class="list-item">
            <div class="list-item-header">
                <div class="list-item-title">
                    <h4>${setor.nome}</h4>
                    <p>ID: ${setor.id}</p>
                </div>
                <div class="list-item-actions">
                    <button class="btn-edit" onclick="editSetor(${setor.id})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn-delete" onclick="deleteSetor(${setor.id})">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </div>
            </div>
            <div class="list-item-info">
                <div class="info-group">
                    <span class="info-label">Responsável</span>
                    <span class="info-value">${setor.responsavel}</span>
                </div>
                <div class="info-group">
                    <span class="info-label">Descrição</span>
                    <span class="info-value">${setor.descricao || 'Não informada'}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function renderSalasList() {
    const container = document.getElementById('salasList');
    const countEl = document.getElementById('salasCount');

    if (!container) return;

    countEl.textContent = `${appState.salas.length} ${appState.salas.length === 1 ? 'item' : 'itens'}`;

    if (appState.salas.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-door-open"></i>
                <p>Nenhuma sala cadastrada</p>
            </div>
        `;
        return;
    }

    container.innerHTML = appState.salas.map(sala => {
        const setor = appState.setores.find(s => s.id == sala.setor);
        return `
            <div class="list-item">
                <div class="list-item-header">
                    <div class="list-item-title">
                        <h4>${sala.nome}</h4>
                        <p>ID: ${sala.id}</p>
                    </div>
                    <div class="list-item-actions">
                        <button class="btn-edit" onclick="editSala(${sala.id})">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn-delete" onclick="deleteSala(${sala.id})">
                            <i class="fas fa-trash"></i> Excluir
                        </button>
                    </div>
                </div>
                <div class="list-item-info">
                    <div class="info-group">
                        <span class="info-label">Setor</span>
                        <span class="info-value">${setor ? setor.nome : 'Não encontrado'}</span>
                    </div>
                    <div class="info-group">
                        <span class="info-label">Observações</span>
                        <span class="info-value">${sala.observacoes || 'Não informadas'}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderDispositivosList() {
    const container = document.getElementById('dispositivosList');
    const countEl = document.getElementById('dispositivosCount');

    if (!container) return;

    countEl.textContent = `${appState.dispositivos.length} ${appState.dispositivos.length === 1 ? 'item' : 'itens'}`;

    if (appState.dispositivos.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-microchip"></i>
                <p>Nenhum dispositivo cadastrado</p>
            </div>
        `;
        return;
    }

    container.innerHTML = appState.dispositivos.map(dispositivo => {
        const sala = appState.salas.find(s => s.id == dispositivo.sala);
        return `
            <div class="list-item">
                <div class="list-item-header">
                    <div class="list-item-title">
                        <h4>${dispositivo.nome}</h4>
                        <p>ID: ${dispositivo.id}</p>
                    </div>
                    <div class="list-item-actions">
                        <button class="btn-edit" onclick="editDispositivo(${dispositivo.id})">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn-delete" onclick="deleteDispositivo(${dispositivo.id})">
                            <i class="fas fa-trash"></i> Excluir
                        </button>
                    </div>
                </div>
                <div class="list-item-info">
                    <div class="info-group">
                        <span class="info-label">Tipo</span>
                        <span class="info-value">${dispositivo.tipo}</span>
                    </div>
                    <div class="info-group">
                        <span class="info-label">Sala</span>
                        <span class="info-value">${sala ? sala.nome : 'Não encontrada'}</span>
                    </div>
                    <div class="info-group">
                        <span class="info-label">Consumo</span>
                        <span class="info-value">${dispositivo.consumo} kWh</span>
                    </div>
                    <div class="info-group">
                        <span class="info-label">Descrição</span>
                        <span class="info-value">${dispositivo.descricao || 'Não informada'}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderAllLists() {
    renderSetoresList();
    renderSalasList();
    renderDispositivosList();
}

// Edit Functions
function editSetor(id) {
    const setor = appState.setores.find(s => s.id === id);
    if (!setor) return;

    const formHTML = `
        <form id="editSetorForm" class="form-group">
            <div class="form-group">
                <label>Nome do Setor *</label>
                <input type="text" id="editSetorNome" class="form-input" value="${setor.nome}" required>
            </div>
            <div class="form-group">
                <label>Responsável *</label>
                <input type="text" id="editSetorResponsavel" class="form-input" value="${setor.responsavel}" required>
            </div>
            <div class="form-group">
                <label>Descrição</label>
                <textarea id="editSetorDescricao" class="form-textarea">${setor.descricao || ''}</textarea>
            </div>
            <button type="submit" class="btn-primary">Salvar Alterações</button>
        </form>
    `;

    openModal('Editar Setor', formHTML);

    document.getElementById('editSetorForm').addEventListener('submit', (e) => {
        e.preventDefault();

        setor.nome = document.getElementById('editSetorNome').value.trim();
        setor.responsavel = document.getElementById('editSetorResponsavel').value.trim();
        setor.descricao = document.getElementById('editSetorDescricao').value.trim();

        saveToLocalStorage();
        renderAllLists();
        updateStats();
        updateSelectOptions();
        closeModal();
        showNotification('Setor atualizado com sucesso!', 'success');
    });
}

function editSala(id) {
    const sala = appState.salas.find(s => s.id === id);
    if (!sala) return;

    const setoresOptions = appState.setores.map(s =>
        `<option value="${s.id}" ${s.id == sala.setor ? 'selected' : ''}>${s.nome}</option>`
    ).join('');

    const formHTML = `
        <form id="editSalaForm">
            <div class="form-group">
                <label>Nome da Sala *</label>
                <input type="text" id="editSalaNome" class="form-input" value="${sala.nome}" required>
            </div>
            <div class="form-group">
                <label>Setor *</label>
                <select id="editSalaSetor" class="form-select" required>
                    <option value="">Selecione o setor</option>
                    ${setoresOptions}
                </select>
            </div>
            <div class="form-group">
                <label>Observações</label>
                <textarea id="editSalaObservacoes" class="form-textarea">${sala.observacoes || ''}</textarea>
            </div>
            <button type="submit" class="btn-primary">Salvar Alterações</button>
        </form>
    `;

    openModal('Editar Sala', formHTML);

    document.getElementById('editSalaForm').addEventListener('submit', (e) => {
        e.preventDefault();

        sala.nome = document.getElementById('editSalaNome').value.trim();
        sala.setor = document.getElementById('editSalaSetor').value;
        sala.observacoes = document.getElementById('editSalaObservacoes').value.trim();

        saveToLocalStorage();
        renderAllLists();
        updateStats();
        closeModal();
        showNotification('Sala atualizada com sucesso!', 'success');
    });
}

function editDispositivo(id) {
    const dispositivo = appState.dispositivos.find(d => d.id === id);
    if (!dispositivo) return;

    const salasOptions = appState.salas.map(s =>
        `<option value="${s.id}" ${s.id == dispositivo.sala ? 'selected' : ''}>${s.nome}</option>`
    ).join('');

    const tipos = ['Ar Condicionado', 'Iluminação LED', 'Computadores', 'Servidores', 'Impressoras', 'Refrigeração'];
    const tiposOptions = tipos.map(t =>
        `<option value="${t}" ${t === dispositivo.tipo ? 'selected' : ''}>${t}</option>`
    ).join('');

    const formHTML = `
        <form id="editDispositivoForm">
            <div class="form-group">
                <label>Nome do Dispositivo *</label>
                <input type="text" id="editDispositivoNome" class="form-input" value="${dispositivo.nome}" required>
            </div>
            <div class="form-group">
                <label>Tipo *</label>
                <select id="editDispositivoTipo" class="form-select" required>
                    <option value="">Selecione o tipo</option>
                    ${tiposOptions}
                </select>
            </div>
            <div class="form-group">
                <label>Sala *</label>
                <select id="editDispositivoSala" class="form-select" required>
                    <option value="">Selecione a sala</option>
                    ${salasOptions}
                </select>
            </div>
            <div class="form-group">
                <label>Consumo (kWh) *</label>
                <input type="number" id="editDispositivoConsumo" class="form-input" value="${dispositivo.consumo}" min="0" step="0.01" required>
            </div>
            <div class="form-group">
                <label>Descrição</label>
                <textarea id="editDispositivoDescricao" class="form-textarea">${dispositivo.descricao || ''}</textarea>
            </div>
            <button type="submit" class="btn-primary">Salvar Alterações</button>
        </form>
    `;

    openModal('Editar Dispositivo', formHTML);

    document.getElementById('editDispositivoForm').addEventListener('submit', (e) => {
        e.preventDefault();

        dispositivo.nome = document.getElementById('editDispositivoNome').value.trim();
        dispositivo.tipo = document.getElementById('editDispositivoTipo').value;
        dispositivo.sala = document.getElementById('editDispositivoSala').value;
        dispositivo.consumo = parseFloat(document.getElementById('editDispositivoConsumo').value);
        dispositivo.descricao = document.getElementById('editDispositivoDescricao').value.trim();

        saveToLocalStorage();
        renderAllLists();
        updateStats();
        closeModal();
        showNotification('Dispositivo atualizado com sucesso!', 'success');
    });
}

// Delete Functions
function deleteSetor(id) {
    if (!confirm('Tem certeza que deseja excluir este setor?')) return;

    const salasVinculadas = appState.salas.filter(s => s.setor == id);
    if (salasVinculadas.length > 0) {
        showNotification('Não é possível excluir. Existem salas vinculadas a este setor!', 'error');
        return;
    }

    const index = appState.setores.findIndex(s => s.id === id);
    if (index !== -1) {
        appState.setores.splice(index, 1);
        saveToLocalStorage();
        renderAllLists();
        updateStats();
        updateSelectOptions();
        showNotification('Setor excluído com sucesso!', 'success');
    }
}

function deleteSala(id) {
    if (!confirm('Tem certeza que deseja excluir esta sala?')) return;

    const dispositivosVinculados = appState.dispositivos.filter(d => d.sala == id);
    if (dispositivosVinculados.length > 0) {
        showNotification('Não é possível excluir. Existem dispositivos vinculados a esta sala!', 'error');
        return;
    }

    const index = appState.salas.findIndex(s => s.id === id);
    if (index !== -1) {
        appState.salas.splice(index, 1);
        saveToLocalStorage();
        renderAllLists();
        updateStats();
        updateSelectOptions();
        showNotification('Sala excluída com sucesso!', 'success');
    }
}

function deleteDispositivo(id) {
    if (!confirm('Tem certeza que deseja excluir este dispositivo?')) return;

    const index = appState.dispositivos.findIndex(d => d.id === id);
    if (index !== -1) {
        appState.dispositivos.splice(index, 1);
        saveToLocalStorage();
        renderAllLists();
        updateStats();
        showNotification('Dispositivo excluído com sucesso!', 'success');
    }
}

// Utility Functions
let notificationTimeout = null;

function showNotification(message, type = 'success', duration = 3000) {
    if (!notification) return;

    if (notificationTimeout) {
        clearTimeout(notificationTimeout);
        notificationTimeout = null;
    }

    notification.classList.remove('show');
    notification.style.display = 'none';

    setTimeout(() => {
        notification.style.display = 'block';
        notification.textContent = message;
        notification.className = `notification ${type}`;

        void notification.offsetWidth;

        notification.classList.add('show');

        notificationTimeout = setTimeout(() => {
            notification.classList.remove('show');

            setTimeout(() => {
                notification.style.display = 'none';
                notificationTimeout = null;
            }, 300);
        }, duration);
    }, 100);
}

function validateField(field, errorElement) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';

    if (field.hasAttribute('required') && !value) {
        isValid = false;
        errorMessage = 'Este campo é obrigatório';
    } else if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        isValid = false;
        errorMessage = 'Email inválido';
    } else if (field.type === 'number' && value) {
        const numValue = parseFloat(value);
        const min = field.hasAttribute('min') ? parseFloat(field.min) : -Infinity;
        const max = field.hasAttribute('max') ? parseFloat(field.max) : Infinity;

        if (isNaN(numValue) || numValue < min || numValue > max) {
            isValid = false;
            errorMessage = 'Valor inválido';
        }
    }

    field.classList.toggle('invalid', !isValid);

    if (errorElement) {
        errorElement.textContent = errorMessage;
        errorElement.classList.toggle('show', !isValid);
    }

    return isValid;
}

function validateForm(form) {
    const fields = form.querySelectorAll('input[required], select[required], textarea[required]');
    let isFormValid = true;

    fields.forEach(field => {
        const errorElement = document.getElementById(`${field.id}-error`);
        const isValid = validateField(field, errorElement);
        if (!isValid) isFormValid = false;
    });

    return isFormValid;
}

function updateStats() {
    const totalSetoresEl = document.getElementById('totalSetores');
    const totalSalasEl = document.getElementById('totalSalas');
    const totalDispositivosEl = document.getElementById('totalDispositivos');

    if (totalSetoresEl) totalSetoresEl.textContent = appState.setores.length;
    if (totalSalasEl) totalSalasEl.textContent = appState.salas.length;
    if (totalDispositivosEl) totalDispositivosEl.textContent = appState.dispositivos.length;
}

function updateSelectOptions() {
    const salaSetorSelect = document.getElementById('salaSetor');
    if (salaSetorSelect) {
        salaSetorSelect.innerHTML = '<option value="">Selecione o setor</option>';

        appState.setores.forEach(setor => {
            const option = document.createElement('option');
            option.value = setor.id;
            option.textContent = setor.nome;
            salaSetorSelect.appendChild(option);
        });
    }

    const dispositivoSalaSelect = document.getElementById('dispositivoSala');
    if (dispositivoSalaSelect) {
        dispositivoSalaSelect.innerHTML = '<option value="">Selecione a sala</option>';

        appState.salas.forEach(sala => {
            const option = document.createElement('option');
            option.value = sala.id;
            option.textContent = sala.nome;
            dispositivoSalaSelect.appendChild(option);
        });
    }
}

function saveToLocalStorage() {
    try {
        localStorage.setItem('sage_dashboard_data', JSON.stringify(appState));
    } catch (error) {
        console.warn('Não foi possível salvar no localStorage:', error);
    }
}

function loadFromLocalStorage() {
    try {
        const savedData = localStorage.getItem('sage_dashboard_data');
        if (savedData) {
            const data = JSON.parse(savedData);
            appState.setores = data.setores || appState.setores;
            appState.salas = data.salas || appState.salas;
            appState.dispositivos = data.dispositivos || appState.dispositivos;
            updateStats();
            updateSelectOptions();
        }
    } catch (error) {
        console.warn('Não foi possível carregar do localStorage:', error);
    }
}

// Form Submission Handlers
const setorForm = document.getElementById('setorForm');
if (setorForm) {
    setorForm.addEventListener('submit', (e) => {
        e.preventDefault();

        if (!validateForm(setorForm)) {
            showNotification('Por favor, corrija os erros no formulário', 'error');
            return;
        }

        const formData = {
            id: appState.setores.length > 0 ? Math.max(...appState.setores.map(s => s.id)) + 1 : 1,
            nome: document.getElementById('setorNome').value.trim(),
            responsavel: document.getElementById('setorResponsavel').value.trim(),
            descricao: document.getElementById('setorDescricao').value.trim()
        };

        appState.setores.push(formData);
        updateStats();
        updateSelectOptions();
        saveToLocalStorage();
        renderAllLists();

        showNotification(`Setor "${formData.nome}" cadastrado com sucesso!`, 'success');
        setorForm.reset();
    });
}

const salaForm = document.getElementById('salaForm');
if (salaForm) {
    salaForm.addEventListener('submit', (e) => {
        e.preventDefault();

        if (!validateForm(salaForm)) {
            showNotification('Por favor, corrija os erros no formulário', 'error');
            return;
        }

        const formData = {
            id: appState.salas.length > 0 ? Math.max(...appState.salas.map(s => s.id)) + 1 : 1,
            nome: document.getElementById('salaNome').value.trim(),
            setor: document.getElementById('salaSetor').value,
            observacoes: document.getElementById('salaObservacoes').value.trim()
        };

        appState.salas.push(formData);
        updateStats();
        updateSelectOptions();
        saveToLocalStorage();
        renderAllLists();

        showNotification(`Sala "${formData.nome}" cadastrada com sucesso!`, 'success');
        salaForm.reset();
    });
}

const dispositivoForm = document.getElementById('dispositivoForm');
if (dispositivoForm) {
    dispositivoForm.addEventListener('submit', (e) => {
        e.preventDefault();

        if (!validateForm(dispositivoForm)) {
            showNotification('Por favor, corrija os erros no formulário', 'error');
            return;
        }

        const formData = {
            id: appState.dispositivos.length > 0 ? Math.max(...appState.dispositivos.map(d => d.id)) + 1 : 1,
            nome: document.getElementById('dispositivoNome').value.trim(),
            tipo: document.getElementById('dispositivoTipo').value,
            sala: document.getElementById('dispositivoSala').value,
            consumo: parseFloat(document.getElementById('dispositivoConsumo').value),
            descricao: document.getElementById('dispositivoDescricao').value.trim()
        };

        appState.dispositivos.push(formData);
        updateStats();
        saveToLocalStorage();
        renderAllLists();

        showNotification(`Dispositivo "${formData.nome}" cadastrado com sucesso!`, 'success');
        dispositivoForm.reset();
    });
}

// Form validation on input
const forms = document.querySelectorAll('form');
forms.forEach(form => {
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('blur', () => {
            const errorElement = document.getElementById(`${input.id}-error`);
            if (errorElement) {
                validateField(input, errorElement);
            }
        });
    });
});

// Responsive handling
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        mobileOverlay.classList.remove('active');
    }
});

// Auto-collapse sidebar on mobile
if (window.innerWidth <= 768) {
    sidebar.classList.remove('expanded');
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    updateStats();
    updateSelectOptions();
    renderAllLists();

    if (!localStorage.getItem('sage_dashboard_data')) {
        saveToLocalStorage();
    }
});