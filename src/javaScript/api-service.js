/**
 * SAGE API Service
 * Serviço para comunicação com o backend Java Spring Boot
 */

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
        DEVICE_TYPE_DEVICES: (id) => `/api/device-type/${id}/device`,
        
        // Device (Dispositivo)
        DEVICE: '/api/device',
        DEVICE_BY_ID: (id) => `/api/device/${id}`,
        DEVICE_ROOMS: (id) => `/api/device/${id}/room`,
        DEVICE_DEPARTMENTS: (id) => `/api/device/${id}/department`,
        
        // Device-Room Association
        DEVICE_ROOM: '/api/device-room',
        DEVICE_ROOM_BY_ID: (id) => `/api/device-room/${id}`
    }
};

class ApiService {
    constructor() {
        this.token = localStorage.getItem('auth_token') || '';
        this.baseUrl = API_CONFIG.BASE_URL;
    }

    /**
     * Configura o token de autenticação
     */
    setToken(token) {
        this.token = token;
        localStorage.setItem('auth_token', token);
    }

    /**
     * Remove o token de autenticação
     */
    clearToken() {
        this.token = '';
        localStorage.removeItem('auth_token');
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
     * Método genérico para fazer requisições
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            ...options,
            headers: this.getHeaders(options.requireAuth !== false)
        };

        try {
            const response = await fetch(url, config);
            
            // Se não autorizado, redireciona para login
            if (response.status === 401) {
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
                const error = await response.json();
                throw new Error(error.message || 'Dados inválidos');
            }

            // Se erro do servidor
            if (response.status >= 500) {
                throw new Error('Erro no servidor. Tente novamente mais tarde.');
            }

            // Para DELETE sem conteúdo
            if (response.status === 204) {
                return null;
            }

            // Retorna JSON
            return await response.json();
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
            body: JSON.stringify({ email, password })
        });

        if (response.token) {
            this.setToken(response.token);
        }

        return response;
    }

    // ==================== COMPANY ====================
    
    /**
     * Cadastra empresa e administrador
     */
    async registerCompany(data) {
        return await this.request(API_CONFIG.ENDPOINTS.COMPANY, {
            method: 'POST',
            requireAuth: false,
            body: JSON.stringify(data)
        });
    }

    /**
     * Obtém informações da empresa
     */
    async getCompany() {
        return await this.request(API_CONFIG.ENDPOINTS.COMPANY, {
            method: 'GET'
        });
    }

    /**
     * Atualiza dados da empresa
     */
    async updateCompany(data) {
        return await this.request(API_CONFIG.ENDPOINTS.COMPANY, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * Deleta empresa
     */
    async deleteCompany() {
        return await this.request(API_CONFIG.ENDPOINTS.COMPANY, {
            method: 'DELETE'
        });
    }

    // ==================== DEPARTMENT (SETOR) ====================
    
    /**
     * Lista setores com paginação e filtros
     */
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

    /**
     * Cadastra novo setor
     */
    async createDepartment(data) {
        return await this.request(API_CONFIG.ENDPOINTS.DEPARTMENT, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * Obtém setor por ID
     */
    async getDepartment(id) {
        return await this.request(API_CONFIG.ENDPOINTS.DEPARTMENT_BY_ID(id), {
            method: 'GET'
        });
    }

    /**
     * Atualiza setor
     */
    async updateDepartment(id, data) {
        return await this.request(API_CONFIG.ENDPOINTS.DEPARTMENT_BY_ID(id), {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * Remove setor
     */
    async deleteDepartment(id) {
        return await this.request(API_CONFIG.ENDPOINTS.DEPARTMENT_BY_ID(id), {
            method: 'DELETE'
        });
    }

    /**
     * Lista salas do setor
     */
    async listDepartmentRooms(id, params = {}) {
        const queryParams = new URLSearchParams({
            name: params.name || '',
            page: params.page || 0,
            size: params.size || 10,
            sort: params.sort || 'name,ASC'
        });

        return await this.request(`${API_CONFIG.ENDPOINTS.DEPARTMENT_ROOMS(id)}?${queryParams}`, {
            method: 'GET'
        });
    }

    /**
     * Lista dispositivos do setor
     */
    async listDepartmentDevices(id, params = {}) {
        const queryParams = new URLSearchParams({
            alias: params.alias || '',
            page: params.page || 0,
            size: params.size || 10,
            sort: params.sort || 'alias,ASC'
        });

        return await this.request(`${API_CONFIG.ENDPOINTS.DEPARTMENT_DEVICES(id)}?${queryParams}`, {
            method: 'GET'
        });
    }

    // ==================== ROOM (SALA) ====================
    
    /**
     * Lista salas
     */
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

    /**
     * Cadastra nova sala
     */
    async createRoom(data) {
        return await this.request(API_CONFIG.ENDPOINTS.ROOM, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * Obtém sala por ID
     */
    async getRoom(id) {
        return await this.request(API_CONFIG.ENDPOINTS.ROOM_BY_ID(id), {
            method: 'GET'
        });
    }

    /**
     * Atualiza sala
     */
    async updateRoom(id, data) {
        return await this.request(API_CONFIG.ENDPOINTS.ROOM_BY_ID(id), {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * Remove sala
     */
    async deleteRoom(id) {
        return await this.request(API_CONFIG.ENDPOINTS.ROOM_BY_ID(id), {
            method: 'DELETE'
        });
    }

    /**
     * Lista dispositivos da sala
     */
    async listRoomDevices(id, params = {}) {
        const queryParams = new URLSearchParams({
            alias: params.alias || '',
            page: params.page || 0,
            size: params.size || 10,
            sort: params.sort || 'alias,ASC'
        });

        return await this.request(`${API_CONFIG.ENDPOINTS.ROOM_DEVICES(id)}?${queryParams}`, {
            method: 'GET'
        });
    }

    // ==================== DEVICE TYPE ====================
    
    /**
     * Lista tipos de dispositivo
     */
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

    /**
     * Cadastra tipo de dispositivo
     */
    async createDeviceType(data) {
        return await this.request(API_CONFIG.ENDPOINTS.DEVICE_TYPE, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * Obtém tipo de dispositivo por ID
     */
    async getDeviceType(id) {
        return await this.request(API_CONFIG.ENDPOINTS.DEVICE_TYPE_BY_ID(id), {
            method: 'GET'
        });
    }

    /**
     * Atualiza tipo de dispositivo
     */
    async updateDeviceType(id, data) {
        return await this.request(API_CONFIG.ENDPOINTS.DEVICE_TYPE_BY_ID(id), {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * Remove tipo de dispositivo
     */
    async deleteDeviceType(id) {
        return await this.request(API_CONFIG.ENDPOINTS.DEVICE_TYPE_BY_ID(id), {
            method: 'DELETE'
        });
    }

    // ==================== DEVICE ====================
    
    /**
     * Lista dispositivos
     */
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

    /**
     * Cadastra dispositivo
     */
    async createDevice(data) {
        return await this.request(API_CONFIG.ENDPOINTS.DEVICE, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * Obtém dispositivo por ID
     */
    async getDevice(id) {
        return await this.request(API_CONFIG.ENDPOINTS.DEVICE_BY_ID(id), {
            method: 'GET'
        });
    }

    /**
     * Atualiza dispositivo
     */
    async updateDevice(id, data) {
        return await this.request(API_CONFIG.ENDPOINTS.DEVICE_BY_ID(id), {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * Remove dispositivo
     */
    async deleteDevice(id) {
        return await this.request(API_CONFIG.ENDPOINTS.DEVICE_BY_ID(id), {
            method: 'DELETE'
        });
    }

    // ==================== DEVICE-ROOM ASSOCIATION ====================
    
    /**
     * Lista associações
     */
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

    /**
     * Associa dispositivo a sala
     */
    async associateDeviceToRoom(data) {
        return await this.request(API_CONFIG.ENDPOINTS.DEVICE_ROOM, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * Obtém associação por ID
     */
    async getDeviceRoomAssociation(id) {
        return await this.request(API_CONFIG.ENDPOINTS.DEVICE_ROOM_BY_ID(id), {
            method: 'GET'
        });
    }

    /**
     * Atualiza vínculo
     */
    async updateDeviceRoomAssociation(id, data) {
        return await this.request(API_CONFIG.ENDPOINTS.DEVICE_ROOM_BY_ID(id), {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * Desassocia dispositivo de sala
     */
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
}