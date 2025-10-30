const API_CONFIG = {
    BASE_URL: 'http://localhost:8080',
    ENDPOINTS: {
        // Auth
        LOGIN: '/api/login',

        // Company
        COMPANY: '/api/company',

        // Department (Setor)
        DEPARTMENT: '/api/department',
        DEPARTMENT_BY_ID: (id) => `/api/department/${id}`,
        DEPARTMENT_ROOMS: (id) => `/api/department/${id}/room`,
        DEPARTMENT_DEVICES: (id) => `/api/department/${id}/device`,

        // Room (Sala)
        ROOM: '/api/room',
        ROOM_BY_ID: (id) => `/api/room/${id}`,
        ROOM_DEVICES: (id) => `/api/room/${id}/device`,

        // Device Type (Tipo de Dispositivo)
        DEVICE_TYPE: '/api/device-type',
        DEVICE_TYPE_BY_ID: (id) => `/api/device-type/${id}`,

        // Device (Dispositivo)
        DEVICE: '/api/device',
        DEVICE_BY_ID: (id) => `/api/device/${id}`,

        // Device-Room Association
        DEVICE_ROOM: '/api/device-room',
        DEVICE_ROOM_BY_ID: (id) => `/api/device-room/${id}`
    }
};

// ==================== FUNÇÕES DE COOKIES ====================
const CookieManager = {
    // Definir cookie
    set(name, value, days = 7) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = `expires=${date.toUTCString()}`;
        document.cookie = `${name}=${value};${expires};path=/;SameSite=Strict`;
    },

    // Obter cookie
    get(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    },

    // Remover cookie
    delete(name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
    }
};

class ApiService {
    constructor() {
        this.token = CookieManager.get('auth_token') || '';
        this.baseUrl = API_CONFIG.BASE_URL;
    }

    /**
     * Configura o token de autenticação
     */
    setToken(token) {
        this.token = token;
        CookieManager.set('auth_token', token, 7);
    }

    /**
     * Remove o token de autenticação
     */
    clearToken() {
        this.token = '';
        CookieManager.delete('auth_token');
    }

    /**
     * Retorna os headers padrão para as requisições
     */
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (includeAuth && this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    /**
     * Método genérico para fazer requisições - COM TRATAMENTO MELHORADO
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            ...options,
            headers: this.getHeaders(options.requireAuth !== false)
        };

        try {
            console.log(`${config.method || 'GET'} ${url}`);

            const response = await fetch(url, config);

            console.log(`Response Status: ${response.status}`);

            // Se não autorizado, redireciona para login
            if (response.status === 401) {
                console.warn('Não autorizado - redirecionando para login');
                this.clearToken();
                window.location.href = 'cadastro.html';
                throw new Error('Não autorizado');
            }

            // Se não encontrado
            if (response.status === 404) {
                throw new Error('Recurso não encontrado');
            }

            // Se erro de validação
            if (response.status === 400) {
                try {
                    const error = await response.json();
                    throw new Error(error.message || 'Dados inválidos');
                } catch (jsonError) {
                    throw new Error('Dados inválidos');
                }
            }

            // Se erro do servidor
            if (response.status >= 500) {
                throw new Error('Erro no servidor. Tente novamente mais tarde.');
            }

            // Para DELETE sem conteúdo (204 No Content)
            if (response.status === 204) {
                console.log('Operação realizada com sucesso (sem conteúdo)');
                return null;
            }

            // Para POST/PUT que retornam 201 Created
            if (response.status === 201 || response.status === 200) {
                // Verificar se há conteúdo antes de tentar parsear
                const contentType = response.headers.get('content-type');

                if (contentType && contentType.includes('application/json')) {
                    const text = await response.text();

                    // Se não há texto, retornar null
                    if (!text || text.trim() === '') {
                        console.log('Operação realizada com sucesso (sem corpo JSON)');
                        return null;
                    }

                    try {
                        const data = JSON.parse(text);
                        console.log('Dados recebidos:', data);
                        return data;
                    } catch (parseError) {
                        console.error('Erro ao parsear JSON:', parseError);
                        console.error('Resposta recebida:', text);
                        throw new Error('Erro ao processar resposta do servidor');
                    }
                } else {
                    // Não é JSON, retornar texto simples
                    const text = await response.text();
                    console.log('Resposta (texto):', text);
                    return text;
                }
            }

            // Tentar parsear JSON para outros casos
            try {
                const text = await response.text();
                if (!text || text.trim() === '') {
                    return null;
                }
                return JSON.parse(text);
            } catch (parseError) {
                console.error('Erro ao parsear resposta:', parseError);
                throw new Error('Erro ao processar resposta do servidor');
            }

        } catch (error) {
            console.error('Erro na requisição:', error);
            throw error;
        }
    }

    // ==================== AUTH ====================

    /**
     * Realiza login
     */
    async login(email, password) {
        const response = await this.request(API_CONFIG.ENDPOINTS.LOGIN, {
            method: 'POST',
            requireAuth: false,
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        if (response && response.token) {
            this.setToken(response.token);
        }

        return response;
    }

    // ==================== COMPANY ====================

    async registerCompany(data) {
        return await this.request(API_CONFIG.ENDPOINTS.COMPANY, {
            method: 'POST',
            requireAuth: false,
            body: JSON.stringify({
                cnpj: data.cnpj,
                razaoSocial: data.razaoSocial,
                nomeFantasia: data.nomeFantasia,
                telefone: data.telefone,
                logradouro: data.logradouro,
                number: data.number,
                bairro: data.bairro,
                zipCode: data.zipCode,
                city: data.city,
                uf: data.uf,
                complemento: data.complemento || null,
                adminName: data.adminName,
                adminEmail: data.adminEmail,
                adminPassword: data.adminPassword
            })
        });
    }

    async getCompany() {
        return await this.request(API_CONFIG.ENDPOINTS.COMPANY, {
            method: 'GET'
        });
    }

    async updateCompany(data) {
        return await this.request(API_CONFIG.ENDPOINTS.COMPANY, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteCompany() {
        return await this.request(API_CONFIG.ENDPOINTS.COMPANY, {
            method: 'DELETE'
        });
    }

    // ==================== DEPARTMENT ====================

    async listDepartments(params = {}) {
        const queryParams = new URLSearchParams({
            name: params.name || '',
            page: params.page || 0,
            size: params.size || 10,
            sort: params.sort || 'name,ASC'
        });

        return await this.request(`${API_CONFIG.ENDPOINTS.DEPARTMENT}?${queryParams}`, {
            method: 'GET'
        });
    }

    async createDepartment(data) {
        return await this.request(API_CONFIG.ENDPOINTS.DEPARTMENT, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async getDepartment(id) {
        return await this.request(API_CONFIG.ENDPOINTS.DEPARTMENT_BY_ID(id), {
            method: 'GET'
        });
    }

    async updateDepartment(id, data) {
        return await this.request(API_CONFIG.ENDPOINTS.DEPARTMENT_BY_ID(id), {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteDepartment(id) {
        return await this.request(API_CONFIG.ENDPOINTS.DEPARTMENT_BY_ID(id), {
            method: 'DELETE'
        });
    }

    // ==================== ROOM ====================

    async listRooms(params = {}) {
        const queryParams = new URLSearchParams({
            name: params.name || '',
            page: params.page || 0,
            size: params.size || 10,
            sort: params.sort || 'name,ASC'
        });

        return await this.request(`${API_CONFIG.ENDPOINTS.ROOM}?${queryParams}`, {
            method: 'GET'
        });
    }

    async createRoom(data) {
        return await this.request(API_CONFIG.ENDPOINTS.ROOM, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async getRoom(id) {
        return await this.request(API_CONFIG.ENDPOINTS.ROOM_BY_ID(id), {
            method: 'GET'
        });
    }

    async updateRoom(id, data) {
        return await this.request(API_CONFIG.ENDPOINTS.ROOM_BY_ID(id), {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteRoom(id) {
        return await this.request(API_CONFIG.ENDPOINTS.ROOM_BY_ID(id), {
            method: 'DELETE'
        });
    }

    // ==================== DEVICE TYPE ====================

    async listDeviceTypes(params = {}) {
        const queryParams = new URLSearchParams({
            name: params.name || '',
            page: params.page || 0,
            size: params.size || 10,
            sort: params.sort || 'name,ASC'
        });

        return await this.request(`${API_CONFIG.ENDPOINTS.DEVICE_TYPE}?${queryParams}`, {
            method: 'GET'
        });
    }

    async createDeviceType(data) {
        return await this.request(API_CONFIG.ENDPOINTS.DEVICE_TYPE, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async getDeviceType(id) {
        return await this.request(API_CONFIG.ENDPOINTS.DEVICE_TYPE_BY_ID(id), {
            method: 'GET'
        });
    }

    async updateDeviceType(id, data) {
        return await this.request(API_CONFIG.ENDPOINTS.DEVICE_TYPE_BY_ID(id), {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteDeviceType(id) {
        return await this.request(API_CONFIG.ENDPOINTS.DEVICE_TYPE_BY_ID(id), {
            method: 'DELETE'
        });
    }

    // ==================== DEVICE ====================

    async listDevices(params = {}) {
        const queryParams = new URLSearchParams({
            name: params.name || '',
            page: params.page || 0,
            size: params.size || 10,
            sort: params.sort || 'name,ASC'
        });

        return await this.request(`${API_CONFIG.ENDPOINTS.DEVICE}?${queryParams}`, {
            method: 'GET'
        });
    }

    async createDevice(data) {
        return await this.request(API_CONFIG.ENDPOINTS.DEVICE, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async getDevice(id) {
        return await this.request(API_CONFIG.ENDPOINTS.DEVICE_BY_ID(id), {
            method: 'GET'
        });
    }

    async updateDevice(id, data) {
        return await this.request(API_CONFIG.ENDPOINTS.DEVICE_BY_ID(id), {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteDevice(id) {
        return await this.request(API_CONFIG.ENDPOINTS.DEVICE_BY_ID(id), {
            method: 'DELETE'
        });
    }

    // ==================== DEVICE-ROOM ASSOCIATION ====================

    async listDeviceRoomAssociations(params = {}) {
        const queryParams = new URLSearchParams({
            alias: params.alias || '',
            page: params.page || 0,
            size: params.size || 10,
            sort: params.sort || 'alias,ASC'
        });

        return await this.request(`${API_CONFIG.ENDPOINTS.DEVICE_ROOM}?${queryParams}`, {
            method: 'GET'
        });
    }

    async associateDeviceToRoom(data) {
        return await this.request(API_CONFIG.ENDPOINTS.DEVICE_ROOM, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async getDeviceRoomAssociation(id) {
        return await this.request(API_CONFIG.ENDPOINTS.DEVICE_ROOM_BY_ID(id), {
            method: 'GET'
        });
    }

    async updateDeviceRoomAssociation(id, data) {
        return await this.request(API_CONFIG.ENDPOINTS.DEVICE_ROOM_BY_ID(id), {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteDeviceRoomAssociation(id) {
        return await this.request(API_CONFIG.ENDPOINTS.DEVICE_ROOM_BY_ID(id), {
            method: 'DELETE'
        });
    }
}

// Exporta instância única do serviço
const apiService = new ApiService();

// Torna disponível globalmente
if (typeof window !== 'undefined') {
    window.apiService = apiService;
    window.CookieManager = CookieManager;
}

console.log('API Service carregado com sucesso');