/**
 * Integração da página de cadastro com a API
 * ATUALIZADO para corresponder EXATAMENTE ao backend Spring Boot
 */

// ==================== LOGIN ====================
const registrationForm = document.getElementById('registrationForm');
if (registrationForm) {
    registrationForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        if (!email || !password) {
            showNotification('Preencha todos os campos!', 'error');
            return;
        }

        try {
            const submitBtn = registrationForm.querySelector('.submit-btn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Entrando...';
            submitBtn.disabled = true;

            const response = await apiService.login(email, password);

            showNotification('Login realizado com sucesso!', 'success');

            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);

        } catch (error) {
            console.error('Erro no login:', error);
            showNotification(error.message || 'Email ou senha incorretos!', 'error');

            const submitBtn = registrationForm.querySelector('.submit-btn');
            submitBtn.textContent = 'Entrar no Dashboard';
            submitBtn.disabled = false;
        }
    });
}

// ==================== CADASTRO DE EMPRESA + ADMIN ====================
const companyForm = document.getElementById('companyForm');
if (companyForm) {
    companyForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validação de senhas
        const password = document.getElementById('adminPassword').value;
        const confirmPassword = document.getElementById('adminConfirmPassword').value;

        if (password !== confirmPassword) {
            showNotification('As senhas não coincidem!', 'error');
            return;
        }

        if (password.length < 6) {
            showNotification('A senha deve ter no mínimo 6 caracteres!', 'error');
            return;
        }

        // Validação de campos obrigatórios
        if (!validateCompanyForm()) {
            showNotification('Por favor, preencha todos os campos obrigatórios!', 'error');
            return;
        }

        try {
            const submitBtn = document.getElementById('companySubmitBtn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Cadastrando...';
            submitBtn.disabled = true;

            // Prepara dados EXATAMENTE como o backend espera
            const formData = {
                // Empresa
                cnpj: document.getElementById('companyCnpj').value.replace(/\D/g, ''),
                razaoSocial: document.getElementById('razaoSocial').value.trim(),
                nomeFantasia: document.getElementById('companyName').value.trim(),
                telefone: document.getElementById('phone').value.replace(/\D/g, ''),

                // Endereço
                logradouro: document.getElementById('logradouro').value.trim(),
                number: parseInt(document.getElementById('numero').value),
                bairro: document.getElementById('bairro').value.trim(),
                zipCode: document.getElementById('cep').value.replace(/\D/g, ''),
                city: document.getElementById('city').value.trim(),
                uf: document.getElementById('state').value,
                complemento: document.getElementById('complemento').value.trim() || null,

                // Administrador
                adminName: document.getElementById('adminName').value.trim(),
                adminEmail: document.getElementById('adminEmail').value.trim(),
                adminPassword: password
            };

            console.log('📤 Enviando dados para API:', formData);

            // Chama API de cadastro
            const response = await apiService.registerCompany(formData);

            console.log('✅ Resposta da API:', response);

            showNotification('Empresa cadastrada com sucesso! Faça login para continuar.', 'success');

            companyForm.reset();

            // Volta para tela de login após 2s
            setTimeout(() => {
                document.getElementById('companyFormContainer').classList.remove('active');
                setTimeout(() => {
                    document.getElementById('formContainer').classList.add('active');
                }, 300);
            }, 2000);

        } catch (error) {
            console.error('❌ Erro no cadastro da empresa:', error);
            showNotification(error.message || 'Erro ao cadastrar empresa. Verifique os dados e tente novamente.', 'error');

            const submitBtn = document.getElementById('companySubmitBtn');
            submitBtn.textContent = 'Cadastrar Empresa e Administrador';
            submitBtn.disabled = false;
        }
    });
}

// ==================== VALIDAÇÃO ====================
function validateCompanyForm() {
    const requiredFields = [
        { id: 'companyName', name: 'Nome Fantasia' },
        { id: 'razaoSocial', name: 'Razão Social' },
        { id: 'companyCnpj', name: 'CNPJ' },
        { id: 'phone', name: 'Telefone' },
        { id: 'cep', name: 'CEP' },
        { id: 'logradouro', name: 'Logradouro' },
        { id: 'numero', name: 'Número' },
        { id: 'bairro', name: 'Bairro' },
        { id: 'city', name: 'Cidade' },
        { id: 'state', name: 'Estado' },
        { id: 'adminName', name: 'Nome do Administrador' },
        { id: 'adminEmail', name: 'Email do Administrador' },
        { id: 'adminPassword', name: 'Senha' }
    ];

    let isValid = true;
    let firstInvalidField = null;

    requiredFields.forEach(field => {
        const element = document.getElementById(field.id);
        if (!element || !element.value.trim()) {
            console.warn(`Campo obrigatório vazio: ${field.name}`);
            if (element) {
                element.style.borderColor = '#f44336';
            }
            if (!firstInvalidField && element) {
                firstInvalidField = element;
            }
            isValid = false;
        } else if (element) {
            element.style.borderColor = '#c5c1c0';
        }
    });

    // Foca no primeiro campo inválido
    if (firstInvalidField) {
        firstInvalidField.focus();
        firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return isValid;
}

// ==================== NOTIFICAÇÕES ====================
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    if (!notification) return;

    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 4000);
}

// ==================== VERIFICAÇÃO DE AUTENTICAÇÃO ====================
function checkAuth() {
    const token = localStorage.getItem('auth_token');
    const currentPage = window.location.pathname;

    // Se já está logado e na página de cadastro, redireciona para dashboard
    if (token && currentPage.includes('cadastro.html')) {
        // Verifica se o token ainda é válido
        apiService.getCompany()
            .then(() => {
                window.location.href = 'dashboard.html';
            })
            .catch(() => {
                // Token inválido, limpa e continua na página de cadastro
                apiService.clearToken();
            });
    }
}

// ==================== LOGOUT ====================
function logout() {
    apiService.clearToken();
    window.location.href = 'cadastro.html';
}

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();

    // Remove estilos de erro ao começar a digitar
    const allInputs = document.querySelectorAll('input, select, textarea');
    allInputs.forEach(input => {
        input.addEventListener('input', () => {
            input.style.borderColor = '#c5c1c0';
        });
    });
});

// Exporta funções globalmente
if (typeof window !== 'undefined') {
    window.logout = logout;
    window.showNotification = showNotification;
}