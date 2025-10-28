// Animações e efeitos visuais
class UIManager {
    static showNotification(message, type = 'success') {
       // Delega para a função global em app.js
       showNotification(message, type);
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
        if (!cpf) return '';
        return cpf.replace(/\D/g, '')
                 .replace(/(\d{3})(\d)/, '$1.$2')
                 .replace(/(\d{3})(\d)/, '$1.$2')
                 .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
                 .substring(0, 14);
    }

    static formatPlaca(placa) {
        if (!placa) return '';
        // Converte para maiúsculas e remove caracteres não-alfanuméricos
        let valor = placa.toUpperCase().replace(/[^A-Z0-9]/g, '');
        
        // Formato Mercosul (ABC1D23)
        if (/^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(valor)) {
            // Não precisa de hífen, mas mantemos o padrão
            return valor;
        }
        
        // Formato Antigo (ABC1234)
        if (/^[A-Z]{3}[0-9]{4}$/.test(valor)) {
             return valor.replace(/([A-Z]{3})([0-9]{4})/, '$1-$2');
        }
        
        // Retorna o valor parcialmente formatado durante a digitação
        return valor.substring(0, 7);
    }
}

// Efeitos de digitação para campos de formulário
document.addEventListener('DOMContentLoaded', function() {
    // Formatação automática de CPF
    const cpfInputs = document.querySelectorAll('input[name*="cpf"], input[id*="cpf"]');
    cpfInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            e.target.value = UIManager.formatCPF(e.target.value);
        });
    });


    // Formatação automática de placa
    const placaInputs = document.querySelectorAll('input[name*="placa"], input[id*="placa"]');
    placaInputs.forEach(input => {
         input.addEventListener('input', function(e) {
            // Formatação em tempo real é complexa; vamos apenas limitar
            let value = e.target.value.toUpperCase();
            if (value.length > 8) {
                 e.target.value = value.substring(0, 8);
            }
        });
        // Formata ao perder o foco
        input.addEventListener('blur', function(e) {
            e.target.value = UIManager.formatPlaca(e.target.value);
        });
    });

    // Efeito de foco nos formulários
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            if (this.parentElement.classList.contains('form-group')) {
                this.parentElement.classList.add('focused');
            }
        });
        
        input.addEventListener('blur', function() {
            if (this.parentElement.classList.contains('form-group')) {
                this.parentElement.classList.remove('focused');
            }
        });
    });
});