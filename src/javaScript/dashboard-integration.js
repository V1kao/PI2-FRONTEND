// Estado da aplicação
const appState = {
    setores: [],
    salas: [],
    dispositivos: [],
    deviceTypes: [],
    deviceRoomLinks: [],
    currentUser: null,
    currentCompany: null,
    isLoading: false
};

// ==================== VERIFICAÇÃO DE AUTENTICAÇÃO ====================
async function checkAuthentication() {
    try {
        const token = CookieManager.get('auth_token');

        if (!token) {
            console.warn('Token não encontrado. Redirecionando para login...');
            window.location.href = 'cadastro.html';
            return false;
        }

        try {
            appState.currentCompany = await apiService.getCompany();
            console.log('Autenticação válida:', appState.currentCompany);
            return true;
        } catch (error) {
            console.error('Erro ao validar autenticação:', error);
            apiService.clearToken();
            window.location.href = 'cadastro.html';
            return false;
        }
    } catch (error) {
        console.error('Erro na verificação de autenticação:', error);
        return false;
    }
}

// ==================== INICIALIZAÇÃO ====================
async function initDashboard() {
    try {
        console.log('Iniciando dashboard...');

        const isAuthenticated = await checkAuthentication();
        if (!isAuthenticated) {
            return;
        }

        showLoading(true);
        await loadInitialData();

        updateStats();
        updateSelectOptions();
        renderAllLists();

        showLoading(false);
        showNotification('Dashboard carregado com sucesso!', 'success', 2000);
        console.log('Dashboard inicializado com sucesso');

    } catch (error) {
        console.error('Erro ao inicializar dashboard:', error);
        showLoading(false);
        showNotification('Erro ao carregar dados. Verifique sua conexão.', 'error');
    }
}

// ==================== CARREGAMENTO DE DADOS ====================
async function loadInitialData() {
    try {
        console.log('Carregando dados iniciais...');

        // Carregar todos os dados em paralelo
        const [departmentsResponse, roomsResponse, deviceTypesResponse, devicesResponse, linksResponse] = await Promise.allSettled([
            apiService.listDepartments({ size: 100 }),
            apiService.listRooms({ size: 100 }),
            apiService.listDeviceTypes({ size: 100 }),
            apiService.listDevices({ size: 100 }),
            apiService.listDeviceRoomAssociations({ size: 100 })
        ]);

        // Processar setores
        if (departmentsResponse.status === 'fulfilled' && departmentsResponse.value?.content) {
            appState.setores = departmentsResponse.value.content;
            console.log(`Setores: ${appState.setores.length}`);
        } else {
            console.warn('Erro ao carregar setores:', departmentsResponse.reason);
            appState.setores = [];
        }

        // Processar salas
        if (roomsResponse.status === 'fulfilled' && roomsResponse.value?.content) {
            appState.salas = roomsResponse.value.content;
            console.log(`Salas: ${appState.salas.length}`);
        } else {
            console.warn('Erro ao carregar salas:', roomsResponse.reason);
            appState.salas = [];
        }

        // Processar tipos de dispositivo
        if (deviceTypesResponse.status === 'fulfilled' && deviceTypesResponse.value?.content) {
            appState.deviceTypes = deviceTypesResponse.value.content;
            console.log(`Tipos: ${appState.deviceTypes.length}`);
        } else {
            console.warn('Erro ao carregar tipos:', deviceTypesResponse.reason);
            appState.deviceTypes = [];
        }

        // Processar dispositivos
        if (devicesResponse.status === 'fulfilled' && devicesResponse.value?.content) {
            appState.dispositivos = devicesResponse.value.content;
            console.log(`Dispositivos: ${appState.dispositivos.length}`);
        } else {
            console.warn('Erro ao carregar dispositivos:', devicesResponse.reason);
            appState.dispositivos = [];
        }

        // Processar vínculos
        if (linksResponse.status === 'fulfilled' && linksResponse.value?.content) {
            appState.deviceRoomLinks = linksResponse.value.content;
            console.log(`Vínculos: ${appState.deviceRoomLinks.length}`);
        } else {
            console.warn('Erro ao carregar vínculos:', linksResponse.reason);
            appState.deviceRoomLinks = [];
        }

        console.log('Dados iniciais carregados');

    } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
        throw error;
    }
}

// ==================== INDICADOR DE CARREGAMENTO ====================
function showLoading(show) {
    let loadingEl = document.getElementById('loadingIndicator');

    if (!loadingEl) {
        loadingEl = document.createElement('div');
        loadingEl.id = 'loadingIndicator';
        loadingEl.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                        background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; 
                        justify-content: center; z-index: 9999; backdrop-filter: blur(5px);">
                <div style="text-align: center; color: #ffb703;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 3rem; margin-bottom: 20px;"></i>
                    <p style="font-size: 1.2rem;">Carregando dados...</p>
                </div>
            </div>
        `;
        document.body.appendChild(loadingEl);
    }

    loadingEl.style.display = show ? 'block' : 'none';
}

// ==================== TIPO DE DISPOSITIVO ====================
const deviceTypeForm = document.getElementById('deviceTypeForm');
if (deviceTypeForm) {
    deviceTypeForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!validateForm(deviceTypeForm)) {
            showNotification('Por favor, corrija os erros no formulário', 'error');
            return;
        }

        try {
            const submitBtn = deviceTypeForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Cadastrando...';
            }

            const formData = {
                name: document.getElementById('deviceTypeName').value.trim()
            };

            console.log('Enviando tipo:', formData);

            const response = await apiService.createDeviceType(formData);

            console.log('Resposta:', response);

            // Adicionar ao estado
            if (response && response.id) {
                appState.deviceTypes.push(response);
                updateStats();
                updateSelectOptions();
                renderDeviceTypesList();
                showNotification(`Tipo "${formData.name}" cadastrado com sucesso!`, 'success');
                deviceTypeForm.reset();
            } else {
                throw new Error('Resposta inválida da API');
            }

        } catch (error) {
            console.error('Erro ao cadastrar tipo:', error);
            showNotification(error.message || 'Erro ao cadastrar tipo de dispositivo', 'error');
        } finally {
            const submitBtn = deviceTypeForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Cadastrar Tipo';
            }
        }
    });
}

// ==================== SETOR ====================
const setorForm = document.getElementById('setorForm');
if (setorForm) {
    setorForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!validateForm(setorForm)) {
            showNotification('Por favor, corrija os erros no formulário', 'error');
            return;
        }

        try {
            const submitBtn = setorForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Cadastrando...';
            }

            const formData = {
                name: document.getElementById('setorNome').value.trim(),
                description: document.getElementById('setorDescricao').value.trim()
            };

            console.log('Enviando setor:', formData);

            const response = await apiService.createDepartment(formData);

            console.log('Resposta:', response);

            if (response && response.id) {
                appState.setores.push(response);
                updateStats();
                updateSelectOptions();
                renderAllLists();
                showNotification(`Setor "${formData.name}" cadastrado com sucesso!`, 'success');
                setorForm.reset();
            } else {
                throw new Error('Resposta inválida da API');
            }

        } catch (error) {
            console.error('Erro ao cadastrar setor:', error);
            showNotification(error.message || 'Erro ao cadastrar setor', 'error');
        } finally {
            const submitBtn = setorForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Cadastrar Setor';
            }
        }
    });
}

// ==================== SALA ====================
const salaForm = document.getElementById('salaForm');
if (salaForm) {
    salaForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!validateForm(salaForm)) {
            showNotification('Por favor, corrija os erros no formulário', 'error');
            return;
        }

        try {
            const submitBtn = salaForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Cadastrando...';
            }

            const formData = {
                name: document.getElementById('salaNome').value.trim(),
                description: document.getElementById('salaObservacoes').value.trim(),
                departmentId: document.getElementById('salaSetor').value
            };

            console.log('Enviando sala:', formData);

            const response = await apiService.createRoom(formData);

            console.log('✅ Resposta:', response);

            if (response && response.id) {
                appState.salas.push(response);
                updateStats();
                updateSelectOptions();
                renderAllLists();
                showNotification(`Sala "${formData.name}" cadastrada com sucesso!`, 'success');
                salaForm.reset();
            } else {
                throw new Error('Resposta inválida da API');
            }

        } catch (error) {
            console.error('Erro ao cadastrar sala:', error);
            showNotification(error.message || 'Erro ao cadastrar sala', 'error');
        } finally {
            const submitBtn = salaForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Cadastrar Sala';
            }
        }
    });
}

// ==================== DISPOSITIVO ====================
const dispositivoForm = document.getElementById('dispositivoForm');
if (dispositivoForm) {
    dispositivoForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!validateForm(dispositivoForm)) {
            showNotification('Por favor, corrija os erros no formulário', 'error');
            return;
        }

        try {
            const submitBtn = dispositivoForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Cadastrando...';
            }

            const deviceData = {
                name: document.getElementById('dispositivoNome').value.trim(),
                power: parseFloat(document.getElementById('dispositivoConsumo').value),
                deviceTypeId: document.getElementById('dispositivoTipo').value
            };

            console.log('Enviando dispositivo:', deviceData);

            const response = await apiService.createDevice(deviceData);

            console.log('Resposta:', response);

            if (response && response.id) {
                appState.dispositivos.push(response);
                updateStats();
                renderAllLists();
                updateSelectOptions();
                showNotification(`Dispositivo "${deviceData.name}" cadastrado com sucesso!`, 'success');
                dispositivoForm.reset();
            } else {
                throw new Error('Resposta inválida da API');
            }

        } catch (error) {
            console.error('Erro ao cadastrar dispositivo:', error);
            showNotification(error.message || 'Erro ao cadastrar dispositivo', 'error');
        } finally {
            const submitBtn = dispositivoForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Cadastrar Dispositivo';
            }
        }
    });
}

// ==================== VÍNCULOS ====================
const deviceRoomLinkForm = document.getElementById('deviceRoomLinkForm');
if (deviceRoomLinkForm) {
    deviceRoomLinkForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!validateForm(deviceRoomLinkForm)) {
            showNotification('Por favor, corrija os erros no formulário', 'error');
            return;
        }

        try {
            const submitBtn = deviceRoomLinkForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Criando...';
            }

            const formData = {
                alias: document.getElementById('linkAlias').value.trim(),
                averageTimeHour: parseFloat(document.getElementById('linkAverageTime').value),
                roomId: document.getElementById('linkRoom').value,
                deviceId: document.getElementById('linkDevice').value
            };

            console.log('Enviando vínculo:', formData);

            const response = await apiService.associateDeviceToRoom(formData);

            console.log('Resposta:', response);

            if (response && response.id) {
                appState.deviceRoomLinks.push(response);
                renderDeviceRoomLinksList();
                updateStats();
                showNotification(`Vínculo "${formData.alias}" criado com sucesso!`, 'success');
                deviceRoomLinkForm.reset();
            } else {
                throw new Error('Resposta inválida da API');
            }

        } catch (error) {
            console.error('Erro ao criar vínculo:', error);
            showNotification(error.message || 'Erro ao criar vínculo', 'error');
        } finally {
            const submitBtn = deviceRoomLinkForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Criar Vínculo';
            }
        }
    });
}

// ==================== FUNÇÕES DE EDIÇÃO ====================
async function editSetor(id) {
    const setor = appState.setores.find(s => s.id === id);
    if (!setor) return;

    const formHTML = `
        <form id="editSetorForm">
            <div class="form-group">
                <label>Nome do Setor *</label>
                <input type="text" id="editSetorNome" class="form-input" value="${setor.name || ''}" required>
            </div>
            <div class="form-group">
                <label>Descrição</label>
                <textarea id="editSetorDescricao" class="form-textarea">${setor.description || ''}</textarea>
            </div>
            <button type="submit" class="btn-primary">Salvar Alterações</button>
        </form>
    `;

    openModal('Editar Setor', formHTML);

    document.getElementById('editSetorForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        try {
            const data = {
                name: document.getElementById('editSetorNome').value.trim(),
                description: document.getElementById('editSetorDescricao').value.trim()
            };

            await apiService.updateDepartment(id, data);

            const index = appState.setores.findIndex(s => s.id === id);
            if (index !== -1) {
                appState.setores[index] = { ...appState.setores[index], ...data };
            }

            renderAllLists();
            updateStats();
            updateSelectOptions();
            closeModal();
            showNotification('Setor atualizado com sucesso!', 'success');

        } catch (error) {
            console.error('Erro ao atualizar setor:', error);
            showNotification(error.message || 'Erro ao atualizar setor', 'error');
        }
    });
}

async function editSala(id) {
    const sala = appState.salas.find(s => s.id === id);
    if (!sala) return;

    const setoresOptions = appState.setores.map(s =>
        `<option value="${s.id}" ${s.id === sala.departmentId ? 'selected' : ''}>${s.name || ''}</option>`
    ).join('');

    const formHTML = `
        <form id="editSalaForm">
            <div class="form-group">
                <label>Nome da Sala *</label>
                <input type="text" id="editSalaNome" class="form-input" value="${sala.name || ''}" required>
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
                <textarea id="editSalaObservacoes" class="form-textarea">${sala.description || ''}</textarea>
            </div>
            <button type="submit" class="btn-primary">Salvar Alterações</button>
        </form>
    `;

    openModal('Editar Sala', formHTML);

    document.getElementById('editSalaForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        try {
            const data = {
                name: document.getElementById('editSalaNome').value.trim(),
                description: document.getElementById('editSalaObservacoes').value.trim(),
                departmentId: document.getElementById('editSalaSetor').value
            };

            await apiService.updateRoom(id, data);

            const index = appState.salas.findIndex(s => s.id === id);
            if (index !== -1) {
                appState.salas[index] = { ...appState.salas[index], ...data };
            }

            renderAllLists();
            updateStats();
            closeModal();
            showNotification('Sala atualizada com sucesso!', 'success');

        } catch (error) {
            console.error('Erro ao atualizar sala:', error);
            showNotification(error.message || 'Erro ao atualizar sala', 'error');
        }
    });
}

async function editDispositivo(id) {
    const dispositivo = appState.dispositivos.find(d => d.id === id);
    if (!dispositivo) return;

    const tiposOptions = appState.deviceTypes.map(t =>
        `<option value="${t.id}" ${t.id === dispositivo.deviceTypeId ? 'selected' : ''}>${t.name}</option>`
    ).join('');

    const formHTML = `
        <form id="editDispositivoForm">
            <div class="form-group">
                <label>Nome do Dispositivo *</label>
                <input type="text" id="editDispositivoNome" class="form-input" value="${dispositivo.name || ''}" required>
            </div>
            <div class="form-group">
                <label>Tipo *</label>
                <select id="editDispositivoTipo" class="form-select" required>
                    <option value="">Selecione o tipo</option>
                    ${tiposOptions}
                </select>
            </div>
            <div class="form-group">
                <label>Potência (W) *</label>
                <input type="number" id="editDispositivoConsumo" class="form-input" value="${dispositivo.power || 0}" min="0" step="0.01" required>
            </div>
            <button type="submit" class="btn-primary">Salvar Alterações</button>
        </form>
    `;

    openModal('Editar Dispositivo', formHTML);

    document.getElementById('editDispositivoForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        try {
            const data = {
                name: document.getElementById('editDispositivoNome').value.trim(),
                power: parseFloat(document.getElementById('editDispositivoConsumo').value),
                deviceTypeId: document.getElementById('editDispositivoTipo').value
            };

            await apiService.updateDevice(id, data);

            const index = appState.dispositivos.findIndex(d => d.id === id);
            if (index !== -1) {
                appState.dispositivos[index] = { ...appState.dispositivos[index], ...data };
            }

            renderAllLists();
            updateStats();
            closeModal();
            showNotification('Dispositivo atualizado com sucesso!', 'success');

        } catch (error) {
            console.error('Erro ao atualizar dispositivo:', error);
            showNotification(error.message || 'Erro ao atualizar dispositivo', 'error');
        }
    });
}

async function editDeviceType(id) {
    const deviceType = appState.deviceTypes.find(dt => dt.id === id);
    if (!deviceType) return;

    const formHTML = `
        <form id="editDeviceTypeForm">
            <div class="form-group">
                <label>Nome do Tipo *</label>
                <input type="text" id="editDeviceTypeName" class="form-input" value="${deviceType.name}" required>
            </div>
            <button type="submit" class="btn-primary">Salvar Alterações</button>
        </form>
    `;

    openModal('Editar Tipo de Dispositivo', formHTML);

    document.getElementById('editDeviceTypeForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        try {
            const data = {
                name: document.getElementById('editDeviceTypeName').value.trim()
            };

            await apiService.updateDeviceType(id, data);

            const index = appState.deviceTypes.findIndex(dt => dt.id === id);
            if (index !== -1) {
                appState.deviceTypes[index] = { ...appState.deviceTypes[index], ...data };
            }

            renderDeviceTypesList();
            updateSelectOptions();
            closeModal();
            showNotification('Tipo atualizado com sucesso!', 'success');

        } catch (error) {
            console.error('Erro ao atualizar tipo:', error);
            showNotification(error.message || 'Erro ao atualizar tipo', 'error');
        }
    });
}

async function editDeviceRoomLink(id) {
    const link = appState.deviceRoomLinks.find(l => l.id === id);
    if (!link) return;

    const roomsOptions = appState.salas.map(s =>
        `<option value="${s.id}" ${s.id === link.roomId ? 'selected' : ''}>${s.name || ''}</option>`
    ).join('');

    const devicesOptions = appState.dispositivos.map(d =>
        `<option value="${d.id}" ${d.id === link.deviceId ? 'selected' : ''}>${d.name || ''}</option>`
    ).join('');

    const formHTML = `
        <form id="editDeviceRoomLinkForm">
            <div class="form-group">
                <label>Apelido *</label>
                <input type="text" id="editLinkAlias" class="form-input" value="${link.alias}" required>
            </div>
            <div class="form-group">
                <label>Sala *</label>
                <select id="editLinkRoom" class="form-select" required>
                    <option value="">Selecione a sala</option>
                    ${roomsOptions}
                </select>
            </div>
            <div class="form-group">
                <label>Dispositivo *</label>
                <select id="editLinkDevice" class="form-select" required>
                    <option value="">Selecione o dispositivo</option>
                    ${devicesOptions}
                </select>
            </div>
            <div class="form-group">
                <label>Tempo Médio de Uso (horas/dia) *</label>
                <input type="number" id="editLinkAverageTime" class="form-input" value="${link.averageTimeHour || 8}" min="0" max="24" step="0.1" required>
            </div>
            <button type="submit" class="btn-primary">Salvar Alterações</button>
        </form>
    `;

    openModal('Editar Vínculo', formHTML);

    document.getElementById('editDeviceRoomLinkForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        try {
            const data = {
                alias: document.getElementById('editLinkAlias').value.trim(),
                averageTimeHour: parseFloat(document.getElementById('editLinkAverageTime').value),
                roomId: document.getElementById('editLinkRoom').value,
                deviceId: document.getElementById('editLinkDevice').value
            };

            await apiService.updateDeviceRoomAssociation(id, data);

            const index = appState.deviceRoomLinks.findIndex(l => l.id === id);
            if (index !== -1) {
                appState.deviceRoomLinks[index] = { ...appState.deviceRoomLinks[index], ...data };
            }

            renderDeviceRoomLinksList();
            closeModal();
            showNotification('Vínculo atualizado com sucesso!', 'success');

        } catch (error) {
            console.error('Erro ao atualizar vínculo:', error);
            showNotification(error.message || 'Erro ao atualizar vínculo', 'error');
        }
    });
}

// ==================== FUNÇÕES DE DELEÇÃO ====================
async function deleteSetor(id) {
    if (!confirm('Tem certeza que deseja excluir este setor?')) return;

    try {
        await apiService.deleteDepartment(id);

        const index = appState.setores.findIndex(s => s.id === id);
        if (index !== -1) {
            appState.setores.splice(index, 1);
        }

        renderAllLists();
        updateStats();
        updateSelectOptions();
        showNotification('Setor excluído com sucesso!', 'success');

    } catch (error) {
        console.error('Erro ao excluir setor:', error);
        showNotification(error.message || 'Erro ao excluir setor', 'error');
    }
}

async function deleteSala(id) {
    if (!confirm('Tem certeza que deseja excluir esta sala?')) return;

    try {
        await apiService.deleteRoom(id);

        const index = appState.salas.findIndex(s => s.id === id);
        if (index !== -1) {
            appState.salas.splice(index, 1);
        }

        renderAllLists();
        updateStats();
        updateSelectOptions();
        showNotification('Sala excluída com sucesso!', 'success');

    } catch (error) {
        console.error('Erro ao excluir sala:', error);
        showNotification(error.message || 'Erro ao excluir sala', 'error');
    }
}

async function deleteDispositivo(id) {
    if (!confirm('Tem certeza que deseja excluir este dispositivo?')) return;

    try {
        await apiService.deleteDevice(id);

        const index = appState.dispositivos.findIndex(d => d.id === id);
        if (index !== -1) {
            appState.dispositivos.splice(index, 1);
        }

        renderAllLists();
        updateStats();
        showNotification('Dispositivo excluído com sucesso!', 'success');

    } catch (error) {
        console.error('Erro ao excluir dispositivo:', error);
        showNotification(error.message || 'Erro ao excluir dispositivo', 'error');
    }
}

async function deleteDeviceType(id) {
    if (!confirm('Tem certeza que deseja excluir este tipo?')) return;

    try {
        await apiService.deleteDeviceType(id);

        const index = appState.deviceTypes.findIndex(dt => dt.id === id);
        if (index !== -1) {
            appState.deviceTypes.splice(index, 1);
        }

        renderDeviceTypesList();
        updateSelectOptions();
        showNotification('Tipo excluído com sucesso!', 'success');

    } catch (error) {
        console.error('Erro ao excluir tipo:', error);
        showNotification(error.message || 'Erro ao excluir tipo', 'error');
    }
}

async function deleteDeviceRoomLink(id) {
    if (!confirm('Tem certeza que deseja excluir este vínculo?')) return;

    try {
        await apiService.deleteDeviceRoomAssociation(id);

        const index = appState.deviceRoomLinks.findIndex(l => l.id === id);
        if (index !== -1) {
            appState.deviceRoomLinks.splice(index, 1);
        }

        renderDeviceRoomLinksList();
        updateStats();
        showNotification('Vínculo excluído com sucesso!', 'success');

    } catch (error) {
        console.error('Erro ao excluir vínculo:', error);
        showNotification(error.message || 'Erro ao excluir vínculo', 'error');
    }
}

// ==================== RENDERIZAÇÃO DE LISTAS ====================
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
                    <h4>${setor.name || 'Sem nome'}</h4>
                    <p>ID: ${setor.id || 'N/A'}</p>
                </div>
                <div class="list-item-actions">
                    <button class="btn-edit" onclick="editSetor('${setor.id}')">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn-delete" onclick="deleteSetor('${setor.id}')">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </div>
            </div>
            <div class="list-item-info">
                <div class="info-group">
                    <span class="info-label">Descrição</span>
                    <span class="info-value">${setor.description || 'Não informada'}</span>
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
        const setor = appState.setores.find(s => s.id === sala.departmentId);
        return `
            <div class="list-item">
                <div class="list-item-header">
                    <div class="list-item-title">
                        <h4>${sala.name || 'Sem nome'}</h4>
                        <p>ID: ${sala.id || 'N/A'}</p>
                    </div>
                    <div class="list-item-actions">
                        <button class="btn-edit" onclick="editSala('${sala.id}')">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn-delete" onclick="deleteSala('${sala.id}')">
                            <i class="fas fa-trash"></i> Excluir
                        </button>
                    </div>
                </div>
                <div class="list-item-info">
                    <div class="info-group">
                        <span class="info-label">Setor</span>
                        <span class="info-value">${setor ? setor.name : 'Não encontrado'}</span>
                    </div>
                    <div class="info-group">
                        <span class="info-label">Observações</span>
                        <span class="info-value">${sala.description || 'Não informadas'}</span>
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
        const deviceType = appState.deviceTypes.find(dt => dt.id === dispositivo.deviceTypeId);
        return `
            <div class="list-item">
                <div class="list-item-header">
                    <div class="list-item-title">
                        <h4>${dispositivo.name || 'Sem nome'}</h4>
                        <p>ID: ${dispositivo.id || 'N/A'}</p>
                    </div>
                    <div class="list-item-actions">
                        <button class="btn-edit" onclick="editDispositivo('${dispositivo.id}')">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn-delete" onclick="deleteDispositivo('${dispositivo.id}')">
                            <i class="fas fa-trash"></i> Excluir
                        </button>
                    </div>
                </div>
                <div class="list-item-info">
                    <div class="info-group">
                        <span class="info-label">Tipo</span>
                        <span class="info-value">${deviceType ? deviceType.name : 'Não encontrado'}</span>
                    </div>
                    <div class="info-group">
                        <span class="info-label">Potência</span>
                        <span class="info-value">${dispositivo.power || 0} W</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderDeviceTypesList() {
    const container = document.getElementById('deviceTypesList');
    const countEl = document.getElementById('deviceTypesCount');

    if (!container) return;

    countEl.textContent = `${appState.deviceTypes.length} ${appState.deviceTypes.length === 1 ? 'item' : 'itens'}`;

    if (appState.deviceTypes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tags"></i>
                <p>Nenhum tipo cadastrado</p>
            </div>
        `;
        return;
    }

    container.innerHTML = appState.deviceTypes.map(deviceType => `
        <div class="list-item">
            <div class="list-item-header">
                <div class="list-item-title">
                    <h4>${deviceType.name || 'Sem nome'}</h4>
                    <p>ID: ${deviceType.id || 'N/A'}</p>
                </div>
                <div class="list-item-actions">
                    <button class="btn-edit" onclick="editDeviceType('${deviceType.id}')">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn-delete" onclick="deleteDeviceType('${deviceType.id}')">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function renderDeviceRoomLinksList() {
    const container = document.getElementById('deviceRoomLinksList');
    const countEl = document.getElementById('deviceRoomLinksCount');

    if (!container) return;

    countEl.textContent = `${appState.deviceRoomLinks.length} ${appState.deviceRoomLinks.length === 1 ? 'item' : 'itens'}`;

    if (appState.deviceRoomLinks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-link"></i>
                <p>Nenhum vínculo cadastrado</p>
            </div>
        `;
        return;
    }

    container.innerHTML = appState.deviceRoomLinks.map(link => {
        const room = appState.salas.find(s => s.id === link.roomId);
        const device = appState.dispositivos.find(d => d.id === link.deviceId);
        return `
            <div class="list-item">
                <div class="list-item-header">
                    <div class="list-item-title">
                        <h4>${link.alias || 'Sem nome'}</h4>
                        <p>ID: ${link.id || 'N/A'}</p>
                    </div>
                    <div class="list-item-actions">
                        <button class="btn-edit" onclick="editDeviceRoomLink('${link.id}')">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn-delete" onclick="deleteDeviceRoomLink('${link.id}')">
                            <i class="fas fa-trash"></i> Excluir
                        </button>
                    </div>
                </div>
                <div class="list-item-info">
                    <div class="info-group">
                        <span class="info-label">Sala</span>
                        <span class="info-value">${room ? room.name : 'Não encontrada'}</span>
                    </div>
                    <div class="info-group">
                        <span class="info-label">Dispositivo</span>
                        <span class="info-value">${device ? device.name : 'Não encontrado'}</span>
                    </div>
                    <div class="info-group">
                        <span class="info-label">Tempo Médio (h/dia)</span>
                        <span class="info-value">${link.averageTimeHour || 0} horas</span>
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
    renderDeviceTypesList();
    renderDeviceRoomLinksList();
}

// ==================== ATUALIZAÇÃO DE ESTATÍSTICAS ====================
function updateStats() {
    const totalSetoresEl = document.getElementById('totalSetores');
    const totalSalasEl = document.getElementById('totalSalas');
    const totalDispositivosEl = document.getElementById('totalDispositivos');
    const totalLinksEl = document.getElementById('totalVinculos');

    if (totalSetoresEl) totalSetoresEl.textContent = appState.setores.length;
    if (totalSalasEl) totalSalasEl.textContent = appState.salas.length;
    if (totalDispositivosEl) totalDispositivosEl.textContent = appState.dispositivos.length;
    if (totalLinksEl) totalLinksEl.textContent = appState.deviceRoomLinks.length;
}

// ==================== ATUALIZAÇÃO DE SELECTS ====================
function updateSelectOptions() {
    // Select de setor nas salas
    const salaSetorSelect = document.getElementById('salaSetor');
    if (salaSetorSelect) {
        salaSetorSelect.innerHTML = '<option value="">Selecione o setor</option>';
        appState.setores.forEach(setor => {
            const option = document.createElement('option');
            option.value = setor.id;
            option.textContent = setor.name || 'Sem nome';
            salaSetorSelect.appendChild(option);
        });
    }

    // Select de tipo nos dispositivos
    const dispositivoTipoSelect = document.getElementById('dispositivoTipo');
    if (dispositivoTipoSelect) {
        dispositivoTipoSelect.innerHTML = '<option value="">Selecione o tipo</option>';
        appState.deviceTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type.id;
            option.textContent = type.name || 'Sem nome';
            dispositivoTipoSelect.appendChild(option);
        });
    }

    // Select de sala nos vínculos
    const linkRoomSelect = document.getElementById('linkRoom');
    if (linkRoomSelect) {
        linkRoomSelect.innerHTML = '<option value="">Selecione a sala</option>';
        appState.salas.forEach(sala => {
            const option = document.createElement('option');
            option.value = sala.id;
            option.textContent = sala.name || 'Sem nome';
            linkRoomSelect.appendChild(option);
        });
    }

    // Select de dispositivo nos vínculos
    const linkDeviceSelect = document.getElementById('linkDevice');
    if (linkDeviceSelect) {
        linkDeviceSelect.innerHTML = '<option value="">Selecione o dispositivo</option>';
        appState.dispositivos.forEach(device => {
            const option = document.createElement('option');
            option.value = device.id;
            option.textContent = device.name || 'Sem nome';
            linkDeviceSelect.appendChild(option);
        });
    }
}

// ==================== VALIDAÇÃO ====================
function validateForm(form) {
    const fields = form.querySelectorAll('input[required], select[required], textarea[required]');
    let isFormValid = true;

    fields.forEach(field => {
        if (!field.value.trim()) {
            field.classList.add('invalid');
            isFormValid = false;
        } else {
            field.classList.remove('invalid');
        }
    });

    return isFormValid;
}

// ==================== MODAL ====================
function openModal(title, content) {
    const modal = document.getElementById('editModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    if (modal && modalTitle && modalBody) {
        modalTitle.textContent = title;
        modalBody.innerHTML = content;
        modal.classList.add('active');
    }
}

function closeModal() {
    const modal = document.getElementById('editModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// ==================== NOTIFICAÇÕES ====================
let notificationTimeout = null;

function showNotification(message, type = 'success', duration = 3000) {
    const notification = document.getElementById('notification');
    if (!notification) return;

    if (notificationTimeout) {
        clearTimeout(notificationTimeout);
    }

    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');

    notificationTimeout = setTimeout(() => {
        notification.classList.remove('show');
    }, duration);
}

// ==================== NAVEGAÇÃO ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM carregado, iniciando dashboard...');

    // Inicializar dashboard
    initDashboard();

    // Setup modal
    const modalClose = document.getElementById('modalClose');
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }

    const editModal = document.getElementById('editModal');
    if (editModal) {
        editModal.addEventListener('click', (e) => {
            if (e.target === editModal) {
                closeModal();
            }
        });
    }

    // Setup navegação
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

    // Navegação entre seções
    const navLinks = document.querySelectorAll('.nav-link');
    const contentSections = document.querySelectorAll('.content-section');

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

    // Navegação entre abas de visualização
    const viewTabs = document.querySelectorAll('.view-tab');
    const viewContents = document.querySelectorAll('.view-content');

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
});

// Tornar funções disponíveis globalmente
window.editSetor = editSetor;
window.deleteSetor = deleteSetor;
window.editSala = editSala;
window.deleteSala = deleteSala;
window.editDispositivo = editDispositivo;
window.deleteDispositivo = deleteDispositivo;
window.editDeviceType = editDeviceType;
window.deleteDeviceType = deleteDeviceType;
window.editDeviceRoomLink = editDeviceRoomLink;
window.deleteDeviceRoomLink = deleteDeviceRoomLink;

console.log('Dashboard integration script carregado');