// DOM Elements
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const mobileOverlay = document.getElementById('mobileOverlay');
const navLinks = document.querySelectorAll('.nav-link');
const contentSections = document.querySelectorAll('.content-section');

// Menu Toggle Functionality
menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('expanded');
    
    // Mobile overlay
    if (window.innerWidth <= 768) {
        mobileOverlay.classList.toggle('active');
    }
});

// Close mobile menu when clicking overlay
mobileOverlay.addEventListener('click', () => {
    sidebar.classList.remove('expanded');
    mobileOverlay.classList.remove('active');
});

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
        document.getElementById(targetSection).classList.add('active');
        
        // Close mobile menu
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('expanded');
            mobileOverlay.classList.remove('active');
        }
    });
});

// Form Submissions
document.getElementById('setorForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = {
        nome: document.getElementById('setorNome').value,
        codigo: document.getElementById('setorCodigo').value,
        andar: document.getElementById('setorAndar').value,
        responsavel: document.getElementById('setorResponsavel').value,
        descricao: document.getElementById('setorDescricao').value
    };
    
    alert(`Setor cadastrado com sucesso!\nNome: ${formData.nome}\nCódigo: ${formData.codigo}`);
    e.target.reset();
});

document.getElementById('salaForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = {
        nome: document.getElementById('salaNome').value,
        codigo: document.getElementById('salaCodigo').value,
        setor: document.getElementById('salaSetor').value,
        area: document.getElementById('salaArea').value,
        observacoes: document.getElementById('salaObservacoes').value
    };
    
    alert(`Sala cadastrada com sucesso!\nNome: ${formData.nome}\nCódigo: ${formData.codigo}\nÁrea: ${formData.area}m²`);
    e.target.reset();
});

document.getElementById('dispositivoForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = {
        nome: document.getElementById('dispositivoNome').value,
        codigo: document.getElementById('dispositivoCodigo').value,
        tipo: document.getElementById('dispositivoTipo').value,
        sala: document.getElementById('dispositivoSala').value,
        quantidade: document.getElementById('dispositivoQuantidade').value,
        status: document.getElementById('dispositivoStatus').value,
        descricao: document.getElementById('dispositivoDescricao').value
    };
    
    alert(`Dispositivo cadastrado com sucesso!\nNome: ${formData.nome}\nCódigo: ${formData.codigo}\nQuantidade: ${formData.quantidade}`);
    e.target.reset();
});

// Responsive handling
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        mobileOverlay.classList.remove('active');
    }
    
    // Resize charts on window resize
    if (energyChart) {
        setTimeout(() => {
            energyChart.resize();
            efficiencyChart.resize();
            deviceChart.resize();
            savingsChart.resize();
        }, 300);
    }
});

// Auto-collapse sidebar on mobile
if (window.innerWidth <= 768) {
    sidebar.classList.remove('expanded');
}