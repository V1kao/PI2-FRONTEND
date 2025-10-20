// Application State - ARMAZENADO EM MEMÓRIA (não usa localStorage)
const appState = {
    setores: [
        {
            id: 1,
            nome: 'Administrativo',
            descricao: 'Setor responsável pela gestão administrativa da empresa'
        },
        {
            id: 2,
            nome: 'Produção',
            descricao: 'Setor de produção e manufatura'
        },
        {
            id: 3,
            nome: 'TI',
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
    ],
    contaLuz: {
        valor: 0,
        mes: '',
        ano: ''
    }
};

// No início do arquivo, após a definição do appState, adicione:
function loadBillData() {
    // Carregar dados salvos da conta de luz nos campos
    document.getElementById('billValue').value = appState.contaLuz.valor || '';
    document.getElementById('billMonth').value = appState.contaLuz.mes || '';
    document.getElementById('billYear').value = appState.contaLuz.ano || '';
}

function saveBillData() {
    // Salvar dados da conta de luz
    const billValue = document.getElementById('billValue');
    const billMonth = document.getElementById('billMonth');
    const billYear = document.getElementById('billYear');

    appState.contaLuz.valor = billValue.value ? parseFloat(billValue.value) : 0;
    appState.contaLuz.mes = billMonth.value;
    appState.contaLuz.ano = billYear.value;
}

// Modificar a função generateReportOptions para ser mais simples:
function generateReportOptions(type) {
    const config = chartTypesConfig[type];
    if (!config) {
        showNotification('Tipo de relatório não encontrado!', 'error');
        return;
    }

    hideChartOptions();
    hideGeneratedCharts();
    drilldownStack = [];

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
            <button class="btn-primary" onclick="validateAndGenerateCharts('${type}')">
                <i class="fas fa-chart-line"></i> Gerar Gráficos
            </button>
        </div>
    `;

    const reportsGrid = document.querySelector('.reports-grid');
    reportsGrid.insertAdjacentElement('afterend', optionsContainer);

    setTimeout(() => {
        optionsContainer.classList.add('active');
    }, 10);
}

// Nova função para validar e gerar gráficos
function validateAndGenerateCharts(reportType) {
    const config = chartTypesConfig[reportType];
    const selectedInputs = document.querySelectorAll('input[name="chartTypes"]:checked');

    if (selectedInputs.length === 0) {
        showNotification('Selecione pelo menos um tipo de gráfico!', 'warning');
        return;
    }

    // Validar dados da conta se necessário
    if (config.needsBillValue) {
        if (!validateBillData()) {
            showNotification('Por favor, preencha todos os campos da conta de luz!', 'error');
            return;
        }
        saveBillData();
    }

    const selectedCharts = Array.from(selectedInputs).map(input => ({
        type: input.value,
        label: input.getAttribute('data-label')
    }));

    currentChartsConfig = {
        reportType,
        selectedCharts,
        config
    };

    hideChartOptions();
    hideGeneratedCharts();
    drilldownStack = [];

    _renderCharts();
}

// Função para validar dados da conta
function validateBillData() {
    const billValue = document.getElementById('billValue');
    const billMonth = document.getElementById('billMonth');
    const billYear = document.getElementById('billYear');

    let isValid = true;

    // Validar valor
    if (!billValue.value || parseFloat(billValue.value) <= 0) {
        billValue.classList.add('invalid');
        document.getElementById('billValue-error').textContent = 'Valor da conta é obrigatório';
        document.getElementById('billValue-error').classList.add('show');
        isValid = false;
    } else {
        billValue.classList.remove('invalid');
        document.getElementById('billValue-error').classList.remove('show');
    }

    // Validar mês
    if (!billMonth.value) {
        billMonth.classList.add('invalid');
        document.getElementById('billMonth-error').textContent = 'Mês é obrigatório';
        document.getElementById('billMonth-error').classList.add('show');
        isValid = false;
    } else {
        billMonth.classList.remove('invalid');
        document.getElementById('billMonth-error').classList.remove('show');
    }

    // Validar ano
    if (!billYear.value) {
        billYear.classList.add('invalid');
        document.getElementById('billYear-error').textContent = 'Ano é obrigatório';
        document.getElementById('billYear-error').classList.add('show');
        isValid = false;
    } else {
        billYear.classList.remove('invalid');
        document.getElementById('billYear-error').classList.remove('show');
    }

    return isValid;
}

// Adicionar event listeners para validação em tempo real
document.addEventListener('DOMContentLoaded', function () {
    // Carregar dados salvos
    loadBillData();

    // Adicionar validação em tempo real para os campos da conta
    const billInputs = ['billValue', 'billMonth', 'billYear'];
    billInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('blur', function () {
                validateBillData();
            });
        }
    });

    // Resto do código de inicialização...
    updateStats();
    updateSelectOptions();
    renderAllLists();
});

// Remover a função generateCharts antiga e manter apenas _renderCharts
// A função generateCharts foi substituída por validateAndGenerateCharts

// No final do DOMContentLoaded, adicione a chamada para loadBillData:
document.addEventListener('DOMContentLoaded', () => {
    updateStats();
    updateSelectOptions();
    renderAllLists();
    loadBillData(); // ← Adicionar esta linha
});

// Funções para calcular dados dinâmicos baseados no appState
function getConsumoBySetor() {
    const consumoMap = {};

    appState.setores.forEach(setor => {
        consumoMap[setor.id] = 0;
    });

    appState.dispositivos.forEach(disp => {
        const sala = appState.salas.find(s => s.id == disp.sala);
        if (sala) {
            if (!consumoMap[sala.setor]) {
                consumoMap[sala.setor] = 0;
            }
            consumoMap[sala.setor] += disp.consumo;
        }
    });

    return consumoMap;
}

function getDispositivosBySetor(setorId) {
    const salasDosetor = appState.salas.filter(s => s.setor == setorId);
    const dispositivosDosetor = appState.dispositivos.filter(d =>
        salasDosetor.some(s => s.id == d.sala)
    );
    return dispositivosDosetor.sort((a, b) => b.consumo - a.consumo);
}

function getConsumoByDispositivo() {
    const totalConsumo = appState.dispositivos.reduce((sum, dev) => sum + dev.consumo, 0);
    return appState.dispositivos.map(d => ({
        ...d,
        percentual: (d.consumo / totalConsumo * 100).toFixed(1)
    }));
}

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

const chartTypesConfig = {
    'consumo-setor': {
        name: 'Consumo Mensal por Setor',
        needsBillValue: false,
        types: [
            { id: 'bar', icon: 'fa-chart-bar', label: 'Gráfico de Barras' },
            { id: 'line', icon: 'fa-chart-line', label: 'Gráfico de Linhas' },
            { id: 'mixed', icon: 'fa-chart-area', label: 'Gráfico Misto' }
        ]
    },
    'economia': {
        name: 'Economia Alcançada (%)',
        needsBillValue: true,
        types: [
            { id: 'line', icon: 'fa-chart-line', label: 'Gráfico de Linhas' },
            { id: 'area', icon: 'fa-chart-area', label: 'Gráfico de Área' },
            { id: 'bar', icon: 'fa-chart-bar', label: 'Gráfico de Barras' }
        ]
    },
    'custos': {
        name: 'Custos por Dispositivo',
        needsBillValue: true,
        types: [
            { id: 'doughnut', icon: 'fa-chart-pie', label: 'Gráfico de Rosca' },
            { id: 'bar', icon: 'fa-chart-bar', label: 'Gráfico de Barras' },
            { id: 'bubble', icon: 'fa-circle', label: 'Gráfico de Bolhas' }
        ]
    },
    'evolucao': {
        name: 'Evolução do Consumo Anual',
        needsBillValue: false,
        types: [
            { id: 'line', icon: 'fa-chart-line', label: 'Gráfico de Linhas' },
            { id: 'area', icon: 'fa-chart-area', label: 'Gráfico de Área' },
            { id: 'mixed', icon: 'fa-chart-area', label: 'Gráfico Misto' }
        ]
    }
};

let chartInstances = {};
let currentReportType = null;
let drilldownStack = [];

// DOM Elements
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const mobileOverlay = document.getElementById('mobileOverlay');
const navLinks = document.querySelectorAll('.nav-link');
const contentSections = document.querySelectorAll('.content-section');
const notification = document.getElementById('notification');
const editModal = document.getElementById('editModal');
const modalClose = document.getElementById('modalClose');

const reportsToggleBtn = document.getElementById('reportsToggleBtn');
const reportsContainer = document.getElementById('reportsContainer');
const closeReportsBtn = document.getElementById('closeReportsBtn');
const reportBtns = document.querySelectorAll('.report-btn');

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

if (mobileOverlay) {
    mobileOverlay.addEventListener('click', () => {
        sidebar.classList.remove('expanded');
        mobileOverlay.classList.remove('active');
    });
}

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
        drilldownStack = [];
    });
}

reportBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const reportType = btn.getAttribute('data-report');
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

    hideChartOptions();
    hideGeneratedCharts();
    drilldownStack = [];

    const optionsContainer = document.createElement('div');
    optionsContainer.id = 'chartOptionsContainer';
    optionsContainer.className = 'chart-options-container';

    // Campo de valor da conta (apenas se necessário)
    let billValueHTML = '';
    if (config.needsBillValue) {
        billValueHTML = `
            <div class="bill-value-inputs">
                <div class="bill-value-header">
                    <i class="fas fa-file-invoice-dollar"></i>
                    <h5>Informações da Conta de Luz</h5>
                </div>
                <div class="bill-inputs-grid">
                    <div class="bill-input-group">
                        <label for="billValue">Valor da Conta (R$)</label>
                        <input type="number" id="billValue" placeholder="Ex: 1500.00" 
                               step="0.01" min="0" value="${appState.contaLuz.valor || ''}">
                    </div>
                    <div class="bill-input-group">
                        <label for="billMonth">Mês</label>
                        <select id="billMonth">
                            <option value="">Selecione</option>
                            <option value="01" ${appState.contaLuz.mes === '01' ? 'selected' : ''}>Janeiro</option>
                            <option value="02" ${appState.contaLuz.mes === '02' ? 'selected' : ''}>Fevereiro</option>
                            <option value="03" ${appState.contaLuz.mes === '03' ? 'selected' : ''}>Março</option>
                            <option value="04" ${appState.contaLuz.mes === '04' ? 'selected' : ''}>Abril</option>
                            <option value="05" ${appState.contaLuz.mes === '05' ? 'selected' : ''}>Maio</option>
                            <option value="06" ${appState.contaLuz.mes === '06' ? 'selected' : ''}>Junho</option>
                            <option value="07" ${appState.contaLuz.mes === '07' ? 'selected' : ''}>Julho</option>
                            <option value="08" ${appState.contaLuz.mes === '08' ? 'selected' : ''}>Agosto</option>
                            <option value="09" ${appState.contaLuz.mes === '09' ? 'selected' : ''}>Setembro</option>
                            <option value="10" ${appState.contaLuz.mes === '10' ? 'selected' : ''}>Outubro</option>
                            <option value="11" ${appState.contaLuz.mes === '11' ? 'selected' : ''}>Novembro</option>
                            <option value="12" ${appState.contaLuz.mes === '12' ? 'selected' : ''}>Dezembro</option>
                        </select>
                    </div>
                    <div class="bill-input-group">
                        <label for="billYear">Ano</label>
                        <input type="number" id="billYear" placeholder="Ex: 2025" 
                               min="2020" max="2030" value="${appState.contaLuz.ano || ''}">
                    </div>
                </div>
            </div>
        `;
    }

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
        ${billValueHTML}
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

    const reportsGrid = document.querySelector('.reports-grid');
    reportsGrid.insertAdjacentElement('afterend', optionsContainer);

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

let currentChartsConfig = null;

function generateCharts(reportType) {
    const selectedInputs = document.querySelectorAll('input[name="chartTypes"]:checked');

    if (selectedInputs.length === 0) {
        showNotification('Selecione pelo menos um tipo de gráfico!', 'warning');
        return;
    }

    const config = chartTypesConfig[reportType];

    // Validar e salvar valor da conta se necessário
    if (config.needsBillValue) {
        const billValue = document.getElementById('billValue');
        const billMonth = document.getElementById('billMonth');
        const billYear = document.getElementById('billYear');

        if (!billValue.value || !billMonth.value || !billYear.value) {
            showNotification('Preencha todos os campos da conta de luz!', 'error');
            return;
        }

        appState.contaLuz.valor = parseFloat(billValue.value);
        appState.contaLuz.mes = billMonth.value;
        appState.contaLuz.ano = billYear.value;

        showNotification('Dados da conta salvos com sucesso!', 'success', 2000);
    }

    const selectedCharts = Array.from(selectedInputs).map(input => ({
        type: input.value,
        label: input.getAttribute('data-label')
    }));

    currentChartsConfig = {
        reportType,
        selectedCharts,
        config
    };

    hideChartOptions();
    hideGeneratedCharts();
    drilldownStack = [];

    _renderCharts();
}

function _renderCharts() {
    if (!currentChartsConfig) return;

    const { reportType, selectedCharts, config } = currentChartsConfig;

    const chartsContainer = document.createElement('div');
    chartsContainer.id = 'generatedChartsContainer';
    chartsContainer.className = 'generated-charts-container';

    let chartsHTML = `
        <div class="generated-charts-header">
            <h3><i class="fas fa-chart-bar"></i> ${config.name}</h3>
            <button class="close-charts-btn" onclick="closeCharts()">
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

    const reportsGrid = document.querySelector('.reports-grid');
    reportsGrid.insertAdjacentElement('afterend', chartsContainer);

    setTimeout(() => {
        chartsContainer.classList.add('active');

        selectedCharts.forEach((chart, index) => {
            const chartId = `generatedChart_${reportType}_${chart.type}_${index}`;
            createChart(chartId, reportType, chart.type);
        });
    }, 10);

    showNotification(`${selectedCharts.length} gráfico(s) gerado(s) com sucesso!`, 'success');
}

function closeCharts() {
    hideGeneratedCharts();
    currentChartsConfig = null;
    drilldownStack = [];
}

function createChart(canvasId, reportType, chartType) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let chartData = getChartData(reportType, chartType);

    const chartInstance = new Chart(ctx, chartData);
    chartInstances[canvasId] = chartInstance;

    canvas.style.cursor = 'pointer';

    const clickHandler = (e) => {
        const canvasPosition = Chart.helpers.getRelativePosition(e, chartInstance);
        const dataX = chartInstance.scales.x.getValueForPixel(canvasPosition.x);
        const dataIndex = Math.round(dataX);

        if (reportType === 'consumo-setor') {
            if (dataIndex >= 0 && dataIndex < appState.setores.length) {
                const setorId = appState.setores[dataIndex]?.id;
                if (setorId) {
                    showDrilldownDispositivos(setorId);
                }
            }
        }
        else if (reportType === 'custos') {
            if (dataIndex >= 0 && dataIndex < appState.dispositivos.length) {
                const dispositivo = appState.dispositivos[dataIndex];
                if (dispositivo) {
                    showDrilldownCustosDetalhes(dispositivo);
                }
            }
        }
        else if (reportType === 'economia') {
            const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            if (dataIndex >= 0 && dataIndex < meses.length) {
                showDrilldownEconomiaDetalhes(dataIndex, meses[dataIndex]);
            }
        }
        else if (reportType === 'evolucao') {
            const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            if (dataIndex >= 0 && dataIndex < meses.length) {
                showDrilldownEvolucaoDetalhes(dataIndex, meses[dataIndex]);
            }
        }
    };

    canvas.addEventListener('click', clickHandler);
}

function showDrilldownDispositivos(setorId) {
    const setor = appState.setores.find(s => s.id === setorId);
    if (!setor) return;

    drilldownStack.push(setorId);

    const dispositivos = getDispositivosBySetor(setorId);
    if (dispositivos.length === 0) {
        showNotification(`Nenhum dispositivo encontrado no setor ${setor.nome}`, 'warning');
        drilldownStack.pop();
        return;
    }

    const chartsContainer = document.getElementById('generatedChartsContainer');
    if (!chartsContainer) return;

    let drilldownHTML = `
        <div class="drilldown-container" id="drilldown_${setorId}">
            <div class="drilldown-header">
                <button class="btn-back" onclick="goBackDrilldown()">
                    <i class="fas fa-arrow-left"></i> Voltar
                </button>
                <h3>Dispositivos - ${setor.nome}</h3>
            </div>
            <div class="generated-chart-card">
                <div class="chart-card-header">
                    <h4>Consumo por Dispositivo</h4>
                </div>
                <div class="chart-canvas-wrapper">
                    <canvas id="drilldownChart_${setorId}"></canvas>
                </div>
            </div>
        </div>
    `;

    chartsContainer.insertAdjacentHTML('beforeend', drilldownHTML);

    setTimeout(() => {
        const drilldownCanvas = document.getElementById(`drilldownChart_${setorId}`);
        if (drilldownCanvas) {
            const ctx = drilldownCanvas.getContext('2d');

            const drilldownChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: dispositivos.map(d => d.nome),
                    datasets: [{
                        label: 'Consumo (kWh)',
                        data: dispositivos.map(d => d.consumo),
                        backgroundColor: chartColors,
                        borderRadius: 8
                    }]
                },
                options: getChartOptions('bar')
            });

            chartInstances[`drilldownChart_${setorId}`] = drilldownChart;
            showNotification(`Clique em um dispositivo para mais detalhes`, 'info', 2000);
        }
    }, 100);
}

// NOVA FUNÇÃO: Drilldown para custos por dispositivo
function showDrilldownCustosDetalhes(dispositivo) {
    const sala = appState.salas.find(s => s.id == dispositivo.sala);
    const setor = sala ? appState.setores.find(st => st.id == sala.setor) : null;

    drilldownStack.push(`custo_${dispositivo.id}`);

    const chartsContainer = document.getElementById('generatedChartsContainer');
    if (!chartsContainer) return;

    const totalConsumo = appState.dispositivos.reduce((sum, d) => sum + d.consumo, 0);
    const consumoPercentual = ((dispositivo.consumo / totalConsumo) * 100).toFixed(2);

    // Calcular custo se tiver valor da conta
    let custoEstimado = 'N/A';
    if (appState.contaLuz.valor > 0) {
        const custoPorKwh = appState.contaLuz.valor / totalConsumo;
        custoEstimado = `R$ ${(custoPorKwh * dispositivo.consumo).toFixed(2)}`;
    }

    let drilldownHTML = `
        <div class="drilldown-container" id="drilldown_custo_${dispositivo.id}">
            <div class="drilldown-header">
                <button class="btn-back" onclick="goBackDrilldown()">
                    <i class="fas fa-arrow-left"></i> Voltar
                </button>
                <h3>Análise de Custo - ${dispositivo.nome}</h3>
            </div>
            <div class="generated-chart-card">
                <div class="chart-card-header">
                    <h4>Informações Detalhadas</h4>
                </div>
                <div class="chart-card-footer" style="display: flex; flex-direction: column; gap: 15px; border: none; padding: 20px;">
                    <div class="info-group" style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,183,3,0.2);">
                        <span style="color: #ffb703; font-weight: 600;">Tipo:</span>
                        <span style="color: #f7f7f7;">${dispositivo.tipo}</span>
                    </div>
                    <div class="info-group" style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,183,3,0.2);">
                        <span style="color: #ffb703; font-weight: 600;">Sala:</span>
                        <span style="color: #f7f7f7;">${sala ? sala.nome : 'N/A'}</span>
                    </div>
                    <div class="info-group" style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,183,3,0.2);">
                        <span style="color: #ffb703; font-weight: 600;">Setor:</span>
                        <span style="color: #f7f7f7;">${setor ? setor.nome : 'N/A'}</span>
                    </div>
                    <div class="info-group" style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,183,3,0.2);">
                        <span style="color: #ffb703; font-weight: 600;">Consumo:</span>
                        <span style="color: #10b981; font-weight: 600;">${dispositivo.consumo} kWh</span>
                    </div>
                    <div class="info-group" style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,183,3,0.2);">
                        <span style="color: #ffb703; font-weight: 600;">% do Total:</span>
                        <span style="color: #10b981; font-weight: 600;">${consumoPercentual}%</span>
                    </div>
                    <div class="info-group" style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,183,3,0.2);">
                        <span style="color: #ffb703; font-weight: 600;">Custo Estimado:</span>
                        <span style="color: #10b981; font-weight: 600;">${custoEstimado}</span>
                    </div>
                    ${appState.contaLuz.mes && appState.contaLuz.ano ? `
                    <div class="info-group" style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,183,3,0.2);">
                        <span style="color: #ffb703; font-weight: 600;">Referência:</span>
                        <span style="color: #f7f7f7;">${appState.contaLuz.mes}/${appState.contaLuz.ano}</span>
                    </div>
                    ` : ''}
                    <div class="info-group" style="display: flex; justify-content: space-between; padding: 10px 0; margin-top: 10px; border-top: 1px solid rgba(255,183,3,0.2); padding-top: 15px;">
                        <span style="color: #f7f7f7;">Descrição:</span>
                    </div>
                    <span style="color: #f7f7f7; font-size: 0.95rem;">${dispositivo.descricao || 'Sem descrição'}</span>
                </div>
            </div>
        </div>
    `;

    chartsContainer.insertAdjacentHTML('beforeend', drilldownHTML);
    showNotification(`Análise de custo: ${dispositivo.nome}`, 'info', 2000);
}

function showDrilldownEconomiaDetalhes(mesIndex, mesNome) {
    drilldownStack.push(`econ_${mesIndex}`);

    const chartsContainer = document.getElementById('generatedChartsContainer');
    if (!chartsContainer) return;

    const economiaData = [10, 12, 15, 18, 20, 22, 25, 28, 30, 32, 35, 38];
    const economiaAtingida = economiaData[mesIndex];
    const setores = appState.setores.map(s => ({
        nome: s.nome,
        economia: (economiaAtingida * Math.random()).toFixed(1)
    }));

    let drilldownHTML = `
        <div class="drilldown-container" id="drilldown_econ_${mesIndex}">
            <div class="drilldown-header">
                <button class="btn-back" onclick="goBackDrilldown()">
                    <i class="fas fa-arrow-left"></i> Voltar
                </button>
                <h3>Economia em ${mesNome}</h3>
            </div>
            <div class="generated-chart-card">
                <div class="chart-card-header">
                    <h4>Economia por Setor - ${mesNome}</h4>
                </div>
                <div class="chart-canvas-wrapper">
                    <canvas id="drilldownChart_econ_${mesIndex}"></canvas>
                </div>
            </div>
        </div>
    `;

    chartsContainer.insertAdjacentHTML('beforeend', drilldownHTML);

    setTimeout(() => {
        const drilldownCanvas = document.getElementById(`drilldownChart_econ_${mesIndex}`);
        if (drilldownCanvas) {
            const ctx = drilldownCanvas.getContext('2d');

            const drilldownChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: setores.map(s => s.nome),
                    datasets: [{
                        label: 'Economia (%)',
                        data: setores.map(s => parseFloat(s.economia)),
                        backgroundColor: chartColors,
                        borderRadius: 8
                    }]
                },
                options: getChartOptions('bar')
            });

            chartInstances[`drilldownChart_econ_${mesIndex}`] = drilldownChart;
            showNotification(`Economia em ${mesNome}`, 'info', 2000);
        }
    }, 100);
}

function showDrilldownEvolucaoDetalhes(mesIndex, mesNome) {
    drilldownStack.push(`evol_${mesIndex}`);

    const chartsContainer = document.getElementById('generatedChartsContainer');
    if (!chartsContainer) return;

    const dados2024 = [8500, 7800, 8200, 7500, 8000, 9200, 9800, 10200, 9500, 8800, 8300, 7900];
    const dados2025 = [7800, 7200, 7600, 6900, 7300, 8400, 8800, 9100, 8600, 7900, 7500, 7100];

    let drilldownHTML = `
        <div class="drilldown-container" id="drilldown_evol_${mesIndex}">
            <div class="drilldown-header">
                <button class="btn-back" onclick="goBackDrilldown()">
                    <i class="fas fa-arrow-left"></i> Voltar
                </button>
                <h3>Evolução em ${mesNome}</h3>
            </div>
            <div class="generated-chart-card">
                <div class="chart-card-header">
                    <h4>Comparativo ${mesNome} - 2024 vs 2025</h4>
                </div>
                <div class="chart-canvas-wrapper">
                    <canvas id="drilldownChart_evol_${mesIndex}"></canvas>
                </div>
            </div>
            <div class="generated-chart-card" style="margin-top: 20px;">
                <div class="chart-card-header">
                    <h4>Detalhes</h4>
                </div>
                <div class="chart-card-footer" style="display: flex; flex-direction: column; gap: 15px; border: none; padding: 20px;">
                    <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,183,3,0.2);">
                        <span style="color: #ffb703; font-weight: 600;">Consumo 2024:</span>
                        <span style="color: #f7f7f7;">${dados2024[mesIndex]} kWh</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,183,3,0.2);">
                        <span style="color: #ffb703; font-weight: 600;">Consumo 2025:</span>
                        <span style="color: #f7f7f7;">${dados2025[mesIndex]} kWh</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,183,3,0.2);">
                        <span style="color: #ffb703; font-weight: 600;">Redução:</span>
                        <span style="color: #10b981; font-weight: 600;">${dados2024[mesIndex] - dados2025[mesIndex]} kWh</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 10px 0;">
                        <span style="color: #ffb703; font-weight: 600;">Percentual:</span>
                        <span style="color: #10b981; font-weight: 600;">${(((dados2024[mesIndex] - dados2025[mesIndex]) / dados2024[mesIndex]) * 100).toFixed(2)}%</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    chartsContainer.insertAdjacentHTML('beforeend', drilldownHTML);

    setTimeout(() => {
        const drilldownCanvas = document.getElementById(`drilldownChart_evol_${mesIndex}`);
        if (drilldownCanvas) {
            const ctx = drilldownCanvas.getContext('2d');

            const drilldownChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: [mesNome],
                    datasets: [{
                        label: '2024',
                        data: [dados2024[mesIndex]],
                        backgroundColor: themeColors.primary,
                        borderRadius: 8
                    }, {
                        label: '2025',
                        data: [dados2025[mesIndex]],
                        backgroundColor: themeColors.success,
                        borderRadius: 8
                    }]
                },
                options: getChartOptions('bar')
            });

            chartInstances[`drilldownChart_evol_${mesIndex}`] = drilldownChart;
            showNotification(`Evolução em ${mesNome}`, 'info', 2000);
        }
    }, 100);
}

function goBackDrilldown() {
    if (drilldownStack.length > 0) {
        const last = drilldownStack.pop();
        let elementId = last;

        if (typeof last === 'number') {
            elementId = `drilldown_${last}`;
        } else if (typeof last === 'string') {
            elementId = `drilldown_${last}`;
        }

        const drilldownContainer = document.getElementById(elementId);
        if (drilldownContainer) {
            drilldownContainer.remove();
        }
    }
}

function getChartData(reportType, chartType) {
    let config = {};

    switch (reportType) {
        case 'consumo-setor': {
            const consumoMap = getConsumoBySetor();
            const labels = appState.setores.map(s => s.nome);
            const data = appState.setores.map(s => consumoMap[s.id] || 0);

            if (chartType === 'bar') {
                config = {
                    type: 'bar',
                    data: {
                        labels,
                        datasets: [{
                            label: 'Consumo (kWh)',
                            data,
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
                        labels,
                        datasets: [{
                            label: 'Consumo (kWh)',
                            data,
                            borderColor: themeColors.primary,
                            backgroundColor: 'rgba(255, 183, 3, 0.1)',
                            tension: 0.4,
                            fill: true
                        }]
                    },
                    options: getChartOptions('line')
                };
            } else if (chartType === 'mixed') {
                const media = (data.reduce((a, b) => a + b, 0) / data.length).toFixed(0);
                config = {
                    type: 'bar',
                    data: {
                        labels,
                        datasets: [{
                            label: 'Consumo (kWh)',
                            data,
                            backgroundColor: 'rgba(255, 183, 3, 0.5)',
                            type: 'bar'
                        }, {
                            label: 'Média',
                            data: Array(data.length).fill(media),
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

        case 'custos': {
            const dispositivosData = getConsumoByDispositivo();
            if (chartType === 'doughnut') {
                config = {
                    type: 'doughnut',
                    data: {
                        labels: dispositivosData.map(d => d.nome),
                        datasets: [{
                            data: dispositivosData.map(d => parseFloat(d.percentual)),
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
                        labels: dispositivosData.map(d => d.nome),
                        datasets: [{
                            label: 'Consumo (%)',
                            data: dispositivosData.map(d => parseFloat(d.percentual)),
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
                        datasets: dispositivosData.slice(0, 4).map((d, i) => ({
                            label: d.nome,
                            data: [{ x: parseFloat(d.percentual), y: d.consumo, r: d.consumo / 100 }],
                            backgroundColor: chartColors[i]
                        }))
                    },
                    options: getChartOptions('bubble')
                };
            }
            break;
        }

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
                            data: [8300, 8100, 7900, 7700, 7500, 7300, 7100, 6900, 6700, 6500, 6300, 6100],
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
                    font: { size: 11 }
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
                grid: { color: 'rgba(0, 24, 36, 0.1)' }
            },
            x: {
                grid: { display: false }
            }
        };
    }

    return baseOptions;
}

window.addEventListener('beforeunload', () => {
    Object.values(chartInstances).forEach(chart => {
        if (chart) chart.destroy();
    });
});

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

function editSetor(id) {
    const setor = appState.setores.find(s => s.id === id);
    if (!setor) return;

    const formHTML = `
        <form id="editSetorForm">
            <div class="form-group">
                <label>Nome do Setor *</label>
                <input type="text" id="editSetorNome" class="form-input" value="${setor.nome}" required>
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
        setor.descricao = document.getElementById('editSetorDescricao').value.trim();

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

        renderAllLists();
        updateStats();
        closeModal();
        showNotification('Dispositivo atualizado com sucesso!', 'success');
    });
}

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
        renderAllLists();
        updateStats();
        showNotification('Dispositivo excluído com sucesso!', 'success');
    }
}

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
            descricao: document.getElementById('setorDescricao').value.trim()
        };

        appState.setores.push(formData);
        updateStats();
        updateSelectOptions();
        renderAllLists();

        if (currentChartsConfig) {
            hideGeneratedCharts();
            _renderCharts();
        }

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
        renderAllLists();

        if (currentChartsConfig) {
            hideGeneratedCharts();
            _renderCharts();
        }

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
        renderAllLists();

        if (currentChartsConfig) {
            hideGeneratedCharts();
            _renderCharts();
        }

        showNotification(`Dispositivo "${formData.nome}" cadastrado com sucesso!`, 'success');
        dispositivoForm.reset();
    });
}

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

window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        mobileOverlay.classList.remove('active');
    }
});

if (window.innerWidth <= 768) {
    sidebar.classList.remove('expanded');
}

document.addEventListener('DOMContentLoaded', () => {
    updateStats();
    updateSelectOptions();
    renderAllLists();
});

function generateReportOptions(type) {
    const config = chartTypesConfig[type];
    if (!config) {
        showNotification('Tipo de relatório não encontrado!', 'error');
        return;
    }

    hideChartOptions();
    hideGeneratedCharts();
    drilldownStack = [];

    const optionsContainer = document.createElement('div');
    optionsContainer.id = 'chartOptionsContainer';
    optionsContainer.className = 'chart-options-container';

    // Campo de valor da conta (apenas se necessário)
    let billValueHTML = '';
    if (config.needsBillValue) {
        billValueHTML = `
            <div class="bill-value-inputs">
                <div class="bill-value-header">
                    <i class="fas fa-file-invoice-dollar"></i>
                    <h5>Informações da Conta de Luz</h5>
                </div>
                <div class="bill-inputs-grid">
                    <div class="bill-input-group">
                        <label for="billValue">Valor da Conta (R$) *</label>
                        <input type="number" id="billValue" placeholder="Ex: 1500.00" 
                               step="0.01" min="0" value="${appState.contaLuz.valor || ''}" required>
                        <div class="error-message" id="billValue-error"></div>
                    </div>
                    <div class="bill-input-group">
                        <label for="billMonth">Mês *</label>
                        <select id="billMonth" required>
                            <option value="">Selecione o mês</option>
                            <option value="01" ${appState.contaLuz.mes === '01' ? 'selected' : ''}>Janeiro</option>
                            <option value="02" ${appState.contaLuz.mes === '02' ? 'selected' : ''}>Fevereiro</option>
                            <option value="03" ${appState.contaLuz.mes === '03' ? 'selected' : ''}>Março</option>
                            <option value="04" ${appState.contaLuz.mes === '04' ? 'selected' : ''}>Abril</option>
                            <option value="05" ${appState.contaLuz.mes === '05' ? 'selected' : ''}>Maio</option>
                            <option value="06" ${appState.contaLuz.mes === '06' ? 'selected' : ''}>Junho</option>
                            <option value="07" ${appState.contaLuz.mes === '07' ? 'selected' : ''}>Julho</option>
                            <option value="08" ${appState.contaLuz.mes === '08' ? 'selected' : ''}>Agosto</option>
                            <option value="09" ${appState.contaLuz.mes === '09' ? 'selected' : ''}>Setembro</option>
                            <option value="10" ${appState.contaLuz.mes === '10' ? 'selected' : ''}>Outubro</option>
                            <option value="11" ${appState.contaLuz.mes === '11' ? 'selected' : ''}>Novembro</option>
                            <option value="12" ${appState.contaLuz.mes === '12' ? 'selected' : ''}>Dezembro</option>
                        </select>
                        <div class="error-message" id="billMonth-error"></div>
                    </div>
                    <div class="bill-input-group">
                        <label for="billYear">Ano *</label>
                        <input type="number" id="billYear" placeholder="Ex: 2025" 
                               min="2020" max="2030" value="${appState.contaLuz.ano || ''}" required>
                        <div class="error-message" id="billYear-error"></div>
                    </div>
                </div>
            </div>
        `;
    }

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
        ${billValueHTML}
        <div class="chart-selection-grid">
            ${chartOptionsHTML}
        </div>
        <div class="chart-options-actions">
            <button class="btn-secondary" onclick="hideChartOptions()">
                <i class="fas fa-times"></i> Cancelar
            </button>
            <button class="btn-primary" onclick="validateBillData('${type}')">
                <i class="fas fa-chart-line"></i> Gerar Gráficos
            </button>
        </div>
    `;

    const reportsGrid = document.querySelector('.reports-grid');
    reportsGrid.insertAdjacentElement('afterend', optionsContainer);

    // Adicionar validação em tempo real para os campos da conta
    if (config.needsBillValue) {
        const billInputs = optionsContainer.querySelectorAll('#billValue, #billMonth, #billYear');
        billInputs.forEach(input => {
            input.addEventListener('blur', function () {
                const errorElement = document.getElementById(`${this.id}-error`);
                validateField(this, errorElement);
            });
        });
    }

    setTimeout(() => {
        optionsContainer.classList.add('active');
    }, 10);
}

// Nova função para validar dados da conta antes de gerar gráficos
function validateBillData(reportType) {
    const config = chartTypesConfig[reportType];
    let isValid = true;

    if (config.needsBillValue) {
        const billValue = document.getElementById('billValue');
        const billMonth = document.getElementById('billMonth');
        const billYear = document.getElementById('billYear');

        const billValueError = document.getElementById('billValue-error');
        const billMonthError = document.getElementById('billMonth-error');
        const billYearError = document.getElementById('billYear-error');

        // Validar cada campo
        if (!validateField(billValue, billValueError)) isValid = false;
        if (!validateField(billMonth, billMonthError)) isValid = false;
        if (!validateField(billYear, billYearError)) isValid = false;

        if (!isValid) {
            showNotification('Por favor, corrija os erros nos campos da conta de luz!', 'error');
            return;
        }
    }

    // Se tudo estiver válido, prosseguir com a geração dos gráficos
    generateCharts(reportType);
}

function generateCharts(reportType) {
    const selectedInputs = document.querySelectorAll('input[name="chartTypes"]:checked');

    if (selectedInputs.length === 0) {
        showNotification('Selecione pelo menos um tipo de gráfico!', 'warning');
        return;
    }

    const config = chartTypesConfig[reportType];

    // Salvar valor da conta se necessário (já foi validado na função anterior)
    if (config.needsBillValue) {
        const billValue = document.getElementById('billValue');
        const billMonth = document.getElementById('billMonth');
        const billYear = document.getElementById('billYear');

        appState.contaLuz.valor = parseFloat(billValue.value);
        appState.contaLuz.mes = billMonth.value;
        appState.contaLuz.ano = billYear.value;

        showNotification('Dados da conta salvos com sucesso!', 'success', 2000);
    }

    const selectedCharts = Array.from(selectedInputs).map(input => ({
        type: input.value,
        label: input.getAttribute('data-label')
    }));

    currentChartsConfig = {
        reportType,
        selectedCharts,
        config
    };

    hideChartOptions();
    hideGeneratedCharts();
    drilldownStack = [];

    _renderCharts();
}