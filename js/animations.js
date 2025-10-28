// Animações e efeitos visuais
class UIManager {
    static showNotification(message, type = 'success') {
        // Remove notificações existentes
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notif => notif.remove());

        // Cria nova notificação
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remove após 5 segundos
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    static startLoading(button) {
        const originalText = button.innerHTML;
        button.innerHTML = '<div class="loading"></div> Processando...';
        button.disabled = true;
        
        return () => {
            button.innerHTML = originalText;
            button.disabled = false;
        };
    }

    static formatCPF(cpf) {
        return cpf.replace(/\D/g, '')
                 .replace(/(\d{3})(\d)/, '$1.$2')
                 .replace(/(\d{3})(\d)/, '$1.$2')
                 .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }

    static formatPlaca(placa) {
        return placa.toUpperCase().replace(/[^A-Z0-9]/g, '')
                   .replace(/([A-Z0-9]{3})([A-Z0-9])/, '$1-$2')
                   .substring(0, 7);
    }
}

// Efeitos de digitação para campos de formulário
document.addEventListener('DOMContentLoaded', function() {
    // Formatação automática de CPF
    const cpfInput = document.getElementById('cpf');
    if (cpfInput) {
        cpfInput.addEventListener('input', function(e) {
            e.target.value = UIManager.formatCPF(e.target.value);
        });
    }

    // Formatação automática de placa
    const placaInput = document.getElementById('placa_veiculo');
    if (placaInput) {
        placaInput.addEventListener('input', function(e) {
            e.target.value = UIManager.formatPlaca(e.target.value);
        });
    }

    // Efeito de foco nos formulários
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
    });
});