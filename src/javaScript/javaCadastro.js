// Application State
const appState = {
    setores: [],
    salas: [],
    dispositivos: [],
    empresas: [],
    admins: [],
    currentCompanyCode: null
};

// DOM Elements
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const mobileOverlay = document.getElementById('mobileOverlay');
const navLinks = document.querySelectorAll('.nav-link');
const contentSections = document.querySelectorAll('.content-section');
const notification = document.getElementById('notification');

// Initialize with test data
function initializeTestData() {
    const savedData = localStorage.getItem('lumenlabs_data');

    // Only create test data if there's no saved data
    if (!savedData || savedData === '{}') {
        // Test Company: Lumen Labs
        const testCompany = {
            id: 'test-company-001',
            nome: 'Lumen Labs',
            cnpj: '12.345.678/0001-90',
            codigo: 'LUMEN2025',
            segmento: 'tecnologia',
            email: 'contato@lumenlabs.com.br',
            telefone: '(11) 98765-4321',
            cep: '13500-000',
            cidade: 'Rio Claro',
            estado: 'SP',
            endereco: 'Av. da Tecnologia, 1000, Centro',
            descricao: 'Empresa de tecnologia e inovação em gestão energética',
            dataCriacao: new Date().toISOString()
        };

        // Test Admin for Lumen Labs
        const testAdmin = {
            id: 'test-admin-001',
            nomeCompleto: 'Carlos Silva',
            email: 'admin@lumenlabs.com.br',
            cpf: '123.456.789-00',
            senha: 'admin123',
            codigoEmpresa: 'LUMEN2025',
            dataCriacao: new Date().toISOString()
        };

        appState.empresas = [testCompany];
        appState.admins = [testAdmin];

        saveToLocalStorage();
        console.log('Dados de teste criados: Empresa Lumen Labs e Admin Carlos Silva');
    }
}

//Abrir cadastros

function showForm(role) {
    if (!role) {
        console.error('Tipo de usuário não especificado');
        return;
    }

    currentRole = role;
    const buttonContainer = document.getElementById('buttonContainer');
    const formContainer = document.getElementById('formContainer');
    const signupContainer = document.getElementById('signupContainer');
    const formTitle = document.getElementById('formTitle');
    const formSubtitle = document.getElementById('formSubtitle');
    const companyCodeGroup = document.getElementById('companyCodeGroup');
    const companyCodeInput = document.getElementById('companyCode');

    // Verificar se todos os elementos existem
    if (!buttonContainer || !formContainer || !signupContainer ||
        !formTitle || !formSubtitle || !companyCodeGroup || !companyCodeInput) {
        console.error('Alguns elementos HTML necessários não foram encontrados');
        return;
    }

    hideAllContainers();
    signupContainer.classList.remove('active');

    if (role === 'admin') {
        formTitle.textContent = 'Login Administrador';
        formSubtitle.textContent = 'Acesso completo ao sistema';
        companyCodeGroup.style.display = 'block';
        companyCodeInput.required = true;
        setTimeout(() => {
            companyCodeGroup.classList.add('show');
        }, 400);
    } else {
        formTitle.textContent = 'Login Funcionário';
        formSubtitle.textContent = 'Acesso às ferramentas operacionais';
        companyCodeGroup.classList.remove('show');
        companyCodeInput.required = false;
        setTimeout(() => {
            companyCodeGroup.style.display = 'none';
        }, 400);
    }

    formContainer.classList.add('active');
}

function hideForm() {
    hideAllContainers();
    showMainButtons();

    const registrationForm = document.getElementById('registrationForm');
    if (registrationForm) {
        registrationForm.reset();
    }

    const companyCodeGroup = document.getElementById('companyCodeGroup');
    if (companyCodeGroup) {
        companyCodeGroup.classList.remove('show');
        companyCodeGroup.style.display = 'none';
    }
}

function showSignupForm() {
    const formContainer = document.getElementById('formContainer');
    const signupContainer = document.getElementById('signupContainer');

    if (!formContainer || !signupContainer) {
        console.error('Elementos de formulário não encontrados');
        return;
    }

    formContainer.classList.remove('active');
    setTimeout(() => {
        signupContainer.classList.add('active');
    }, 300);
}

function backToLogin() {
    const formContainer = document.getElementById('formContainer');
    const signupContainer = document.getElementById('signupContainer');

    if (!formContainer || !signupContainer) {
        console.error('Elementos de formulário não encontrados');
        return;
    }

    signupContainer.classList.remove('active');
    setTimeout(() => {
        formContainer.classList.add('active');
    }, 300);

    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.reset();
    }
}

// Funções de Gestão de Empresas
function showCompanyForm() {
    hideAllContainers();
    const companyFormContainer = document.getElementById('companyFormContainer');
    if (companyFormContainer) {
        companyFormContainer.classList.add('active');
    }
    resetCompanyForm();
}

function hideCompanyForm() {
    hideAllContainers();
    showMainButtons();
    resetCompanyForm();
}

function hideAllContainers() {
    const buttonContainer = document.getElementById('buttonContainer');
    const formContainer = document.getElementById('formContainer');
    const signupContainer = document.getElementById('signupContainer');
    const companyFormContainer = document.getElementById('companyFormContainer');
    const companyLoginContainer = document.getElementById('companyLoginContainer');
    const adminSignupContainer = document.getElementById('adminSignupContainer');

    if (buttonContainer) buttonContainer.style.display = 'none';
    if (formContainer) formContainer.classList.remove('active');
    if (signupContainer) signupContainer.classList.remove('active');
    if (companyFormContainer) companyFormContainer.classList.remove('active');
    if (companyLoginContainer) companyLoginContainer.classList.remove('active');
    if (adminSignupContainer) adminSignupContainer.classList.remove('active');
}

function showMainButtons() {
    const buttonContainer = document.getElementById('buttonContainer');
    if (buttonContainer) {
        buttonContainer.style.display = 'flex';
        buttonContainer.style.transform = 'translateY(0)';
        buttonContainer.style.opacity = '1';
    }
}

function resetCompanyForm() {
    const companyForm = document.getElementById('companyForm');
    const companyFormTitle = document.getElementById('companyFormTitle');
    const companyFormSubtitle = document.getElementById('companyFormSubtitle');
    const companySubmitBtn = document.getElementById('companySubmitBtn');

    if (companyForm) companyForm.reset();

    editingCompanyId = null;

    if (companyFormTitle) companyFormTitle.textContent = 'Cadastrar Nova Empresa';
    if (companyFormSubtitle) companyFormSubtitle.textContent = 'Preencha os dados da empresa';
    if (companySubmitBtn) companySubmitBtn.textContent = 'Cadastrar Empresa';
}

// Company Login Functions
function showCompanyRegistration() {
    hideAllContainers();
    const companyFormContainer = document.getElementById('companyFormContainer');
    const companyLoginContainer = document.getElementById('companyLoginContainer');

    if (companyFormContainer) {
        companyLoginContainer.classList.remove('active');
        setTimeout(() => {
            companyFormContainer.classList.add('active');
        }, 300);
    }
}

function backToCompanyLogin() {
    hideAllContainers();
    const companyLoginContainer = document.getElementById('companyLoginContainer');

    if (companyLoginContainer) {
        setTimeout(() => {
            companyLoginContainer.classList.add('active');
        }, 300);
    }

    resetCompanyForm();
}

function showAdminSignup() {
    const formContainer = document.getElementById('formContainer');
    const adminSignupContainer = document.getElementById('adminSignupContainer');

    if (formContainer && adminSignupContainer) {
        formContainer.classList.remove('active');
        setTimeout(() => {
            adminSignupContainer.classList.add('active');
        }, 300);
    }
}

function backToAdminLogin() {
    const formContainer = document.getElementById('formContainer');
    const adminSignupContainer = document.getElementById('adminSignupContainer');

    if (formContainer && adminSignupContainer) {
        adminSignupContainer.classList.remove('active');
        setTimeout(() => {
            formContainer.classList.add('active');
        }, 300);
    }

    const adminSignupForm = document.getElementById('adminSignupForm');
    if (adminSignupForm) {
        adminSignupForm.reset();
    }
}

// Utility Functions
function showNotification(message, type = 'success') {
    if (notification) {
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.add('show');

        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}

function validateField(field, errorElement) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';

    // Required field validation
    if (field.hasAttribute('required') && !value) {
        isValid = false;
        errorMessage = 'Este campo é obrigatório';
    }
    // Email validation
    else if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        isValid = false;
        errorMessage = 'Email inválido';
    }
    // Pattern validation
    else if (field.hasAttribute('pattern') && value && !new RegExp(field.pattern).test(value)) {
        isValid = false;
        errorMessage = 'Formato inválido';
    }
    // Number validation
    else if (field.type === 'number' && value) {
        const numValue = parseFloat(value);
        const min = field.hasAttribute('min') ? parseFloat(field.min) : -Infinity;
        const max = field.hasAttribute('max') ? parseFloat(field.max) : Infinity;

        if (isNaN(numValue) || numValue < min || numValue > max) {
            isValid = false;
            errorMessage = 'Valor inválido ou fora do intervalo permitido';
        }
    }

    // Update field appearance
    field.classList.toggle('invalid', !isValid);

    // Update error message
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
    if (totalDispositivosEl) {
        const totalDevices = appState.dispositivos.reduce((total, device) => {
            return total + parseInt(device.quantidade || 0);
        }, 0);
        totalDispositivosEl.textContent = totalDevices;
    }
}

function updateSelectOptions() {
    // Update sala setor options
    const salaSetorSelect = document.getElementById('salaSetor');
    if (salaSetorSelect) {
        // Keep first option
        salaSetorSelect.innerHTML = '<option value="">Selecione o setor</option>';

        appState.setores.forEach(setor => {
            const option = document.createElement('option');
            option.value = setor.codigo;
            option.textContent = setor.nome;
            salaSetorSelect.appendChild(option);
        });
    }

    // Update dispositivo sala options
    const dispositivoSalaSelect = document.getElementById('dispositivoSala');
    if (dispositivoSalaSelect) {
        dispositivoSalaSelect.innerHTML = '<option value="">Selecione a sala</option>';

        appState.salas.forEach(sala => {
            const option = document.createElement('option');
            option.value = sala.codigo;
            option.textContent = sala.nome;
            dispositivoSalaSelect.appendChild(option);
        });
    }
}

function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function saveToLocalStorage() {
    try {
        localStorage.setItem('lumenlabs_data', JSON.stringify(appState));
    } catch (error) {
        console.warn('Não foi possível salvar no localStorage:', error);
    }
}

function loadFromLocalStorage() {
    try {
        const savedData = localStorage.getItem('lumenlabs_data');
        if (savedData) {
            const data = JSON.parse(savedData);
            appState.setores = data.setores || [];
            appState.salas = data.salas || [];
            appState.dispositivos = data.dispositivos || [];
            appState.empresas = data.empresas || [];
            appState.admins = data.admins || [];
            appState.currentCompanyCode = data.currentCompanyCode || null;
            updateStats();
            updateSelectOptions();
        }
    } catch (error) {
        console.warn('Não foi possível carregar do localStorage:', error);
    }
}

// Event Listeners Setup
function setupEventListeners() {
    // Menu Toggle Functionality
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('expanded');

            // Mobile overlay
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

            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));

            // Add active class to clicked link
            link.classList.add('active');

            // Hide all sections
            contentSections.forEach(section => section.classList.remove('active'));

            // Show target section
            const targetSection = link.getAttribute('data-section');
            const targetElement = document.getElementById(targetSection);
            if (targetElement) {
                targetElement.classList.add('active');
            }

            // Close mobile menu
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('expanded');
                mobileOverlay.classList.remove('active');
            }
        });
    });

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
}

// Form Submission Handlers
function setupFormHandlers() {
    // Company Login Form
    const companyLoginForm = document.getElementById('companyLoginForm');
    if (companyLoginForm) {
        companyLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const companyCode = document.getElementById('companyLoginCode').value.trim().toUpperCase();

            // Check if company exists
            const company = appState.empresas.find(emp => emp.codigo === companyCode);

            if (company) {
                appState.currentCompanyCode = companyCode;
                saveToLocalStorage();

                // Show admin login
                hideAllContainers();
                const formContainer = document.getElementById('formContainer');
                if (formContainer) {
                    setTimeout(() => {
                        formContainer.classList.add('active');
                    }, 300);
                }

                showNotification(`Bem-vindo à ${company.nome}!`, 'success');
            } else {
                showNotification('Código de empresa não encontrado!', 'error');
            }
        });
    }

    // Company Registration Form
    const companyForm = document.getElementById('companyForm');
    if (companyForm) {
        companyForm.addEventListener('submit', (e) => {
            e.preventDefault();

            if (!validateForm(companyForm)) {
                showNotification('Por favor, corrija os erros no formulário', 'error');
                return;
            }

            const companyCode = document.getElementById('companyCodeField').value.trim().toUpperCase();
            const cnpj = document.getElementById('companyCnpj').value.trim();

            // Check for duplicate codes
            const duplicateCode = appState.empresas.find(emp => emp.codigo === companyCode);
            if (duplicateCode) {
                showNotification('Código de empresa já existe! Use um código diferente.', 'error');
                return;
            }

            // Check for duplicate CNPJ
            const duplicateCnpj = appState.empresas.find(emp => emp.cnpj === cnpj);
            if (duplicateCnpj) {
                showNotification('CNPJ já cadastrado!', 'error');
                return;
            }

            const formData = {
                id: generateUniqueId(),
                nome: document.getElementById('companyName').value.trim(),
                cnpj: cnpj,
                codigo: companyCode,
                segmento: document.getElementById('segment').value,
                email: document.getElementById('companyEmail').value.trim(),
                telefone: document.getElementById('phone').value.trim(),
                cep: document.getElementById('cep').value.trim(),
                cidade: document.getElementById('city').value.trim(),
                estado: document.getElementById('state').value,
                endereco: document.getElementById('address').value.trim(),
                descricao: document.getElementById('description').value.trim(),
                dataCriacao: new Date().toISOString()
            };

            appState.empresas.push(formData);
            appState.currentCompanyCode = companyCode;
            saveToLocalStorage();

            showNotification(`Empresa "${formData.nome}" cadastrada com sucesso!`, 'success');

            // Redirect to admin login after 1.5s
            setTimeout(() => {
                hideAllContainers();
                const formContainer = document.getElementById('formContainer');
                if (formContainer) {
                    formContainer.classList.add('active');
                }
            }, 1500);
        });
    }

    // Admin Login Form
    const registrationForm = document.getElementById('registrationForm');
    if (registrationForm) {
        registrationForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            // Find admin with matching email and company code
            const admin = appState.admins.find(adm =>
                adm.email === email &&
                adm.codigoEmpresa === appState.currentCompanyCode &&
                adm.senha === password
            );

            if (admin) {
                showNotification('Login realizado com sucesso! Redirecionando...', 'success');

                // Redirect to dashboard after 1.5s
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                showNotification('Email ou senha incorretos!', 'error');
            }
        });
    }

    // Admin Signup Form
    const adminSignupForm = document.getElementById('adminSignupForm');
    if (adminSignupForm) {
        adminSignupForm.addEventListener('submit', (e) => {
            e.preventDefault();

            if (!validateForm(adminSignupForm)) {
                showNotification('Por favor, corrija os erros no formulário', 'error');
                return;
            }

            const password = document.getElementById('adminPassword').value;
            const confirmPassword = document.getElementById('adminConfirmPassword').value;

            if (password !== confirmPassword) {
                showNotification('As senhas não coincidem!', 'error');
                return;
            }

            const email = document.getElementById('adminEmail').value.trim();
            const cpf = document.getElementById('adminCpf').value.trim();

            // Check for duplicate email in same company
            const duplicateEmail = appState.admins.find(adm =>
                adm.email === email && adm.codigoEmpresa === appState.currentCompanyCode
            );
            if (duplicateEmail) {
                showNotification('Email já cadastrado nesta empresa!', 'error');
                return;
            }

            // Check for duplicate CPF
            const duplicateCpf = appState.admins.find(adm => adm.cpf === cpf);
            if (duplicateCpf) {
                showNotification('CPF já cadastrado!', 'error');
                return;
            }

            const formData = {
                id: generateUniqueId(),
                nomeCompleto: document.getElementById('adminFullName').value.trim(),
                email: email,
                cpf: cpf,
                senha: password,
                codigoEmpresa: appState.currentCompanyCode,
                dataCriacao: new Date().toISOString()
            };

            appState.admins.push(formData);
            saveToLocalStorage();

            showNotification(`Conta criada com sucesso! Redirecionando para o dashboard...`, 'success');

            // Redirect to dashboard after 1.5s
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        });
    }

    // Setor Form
    const setorForm = document.getElementById('setorForm');
    if (setorForm) {
        setorForm.addEventListener('submit', (e) => {
            e.preventDefault();

            if (!validateForm(setorForm)) {
                showNotification('Por favor, corrija os erros no formulário', 'error');
                return;
            }

            const formData = {
                id: generateUniqueId(),
                nome: document.getElementById('setorNome').value.trim(),
                codigo: document.getElementById('setorCodigo').value.trim().toUpperCase(),
                andar: document.getElementById('setorAndar').value,
                responsavel: document.getElementById('setorResponsavel').value.trim(),
                descricao: document.getElementById('setorDescricao').value.trim(),
                dataCriacao: new Date().toISOString()
            };

            // Check for duplicate codes
            const duplicateCode = appState.setores.find(setor => setor.codigo === formData.codigo);
            if (duplicateCode) {
                showNotification('Código do setor já existe! Use um código diferente.', 'error');
                return;
            }

            appState.setores.push(formData);
            updateStats();
            updateSelectOptions();
            saveToLocalStorage();

            showNotification(`Setor "${formData.nome}" cadastrado com sucesso!`, 'success');
            setorForm.reset();
        });
    }

    // Sala Form
    const salaForm = document.getElementById('salaForm');
    if (salaForm) {
        salaForm.addEventListener('submit', (e) => {
            e.preventDefault();

            if (!validateForm(salaForm)) {
                showNotification('Por favor, corrija os erros no formulário', 'error');
                return;
            }

            const formData = {
                id: generateUniqueId(),
                nome: document.getElementById('salaNome').value.trim(),
                codigo: document.getElementById('salaCodigo').value.trim().toUpperCase(),
                setor: document.getElementById('salaSetor').value,
                area: parseFloat(document.getElementById('salaArea').value),
                observacoes: document.getElementById('salaObservacoes').value.trim(),
                dataCriacao: new Date().toISOString()
            };

            // Check for duplicate codes
            const duplicateCode = appState.salas.find(sala => sala.codigo === formData.codigo);
            if (duplicateCode) {
                showNotification('Código da sala já existe! Use um código diferente.', 'error');
                return;
            }

            appState.salas.push(formData);
            updateStats();
            updateSelectOptions();
            saveToLocalStorage();

            showNotification(`Sala "${formData.nome}" cadastrada com sucesso!`, 'success');
            salaForm.reset();
        });
    }

    // Dispositivo Form
    const dispositivoForm = document.getElementById('dispositivoForm');
    if (dispositivoForm) {
        dispositivoForm.addEventListener('submit', (e) => {
            e.preventDefault();

            if (!validateForm(dispositivoForm)) {
                showNotification('Por favor, corrija os erros no formulário', 'error');
                return;
            }

            const formData = {
                id: generateUniqueId(),
                nome: document.getElementById('dispositivoNome').value.trim(),
                codigo: document.getElementById('dispositivoCodigo').value.trim().toUpperCase(),
                tipo: document.getElementById('dispositivoTipo').value,
                sala: document.getElementById('dispositivoSala').value,
                quantidade: parseInt(document.getElementById('dispositivoQuantidade').value),
                consumo: parseFloat(document.getElementById('dispositivoConsumo').value),
                status: document.getElementById('dispositivoStatus').value,
                descricao: document.getElementById('dispositivoDescricao').value.trim(),
                dataCriacao: new Date().toISOString()
            };

            // Check for duplicate codes
            const duplicateCode = appState.dispositivos.find(dispositivo => dispositivo.codigo === formData.codigo);
            if (duplicateCode) {
                showNotification('Código do dispositivo já existe! Use um código diferente.', 'error');
                return;
            }

            appState.dispositivos.push(formData);
            updateStats();
            saveToLocalStorage();

            showNotification(`Dispositivo "${formData.nome}" cadastrado com sucesso!`, 'success');
            dispositivoForm.reset();
        });
    }
}

// Responsive handling
function setupResponsiveHandlers() {
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            mobileOverlay.classList.remove('active');
        }
    });

    // Auto-collapse sidebar on mobile
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('expanded');
    }
}

// Initialize Application
function initApp() {
    loadFromLocalStorage();
    initializeTestData(); // Create test data if needed
    setupEventListeners();
    setupFormHandlers();
    setupResponsiveHandlers();
    updateStats();
    updateSelectOptions();
}

// Start application when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);