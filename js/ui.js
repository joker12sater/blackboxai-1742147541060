// Toast notification system
export class Toast {
    static show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 ${this.getBackgroundColor(type)}`;
        toast.innerHTML = `
            <div class="flex items-center">
                ${this.getIcon(type)}
                <span class="ml-2 text-white">${message}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('opacity-0', 'transition-opacity');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    static getBackgroundColor(type) {
        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        };
        return colors[type] || colors.info;
    }

    static getIcon(type) {
        const icons = {
            success: '<i class="fas fa-check-circle text-white"></i>',
            error: '<i class="fas fa-exclamation-circle text-white"></i>',
            warning: '<i class="fas fa-exclamation-triangle text-white"></i>',
            info: '<i class="fas fa-info-circle text-white"></i>'
        };
        return icons[type] || icons.info;
    }
}

// Loading spinner
export class LoadingSpinner {
    static show(message = 'Loading...') {
        const spinner = document.createElement('div');
        spinner.id = 'loadingSpinner';
        spinner.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        spinner.innerHTML = `
            <div class="bg-white p-6 rounded-lg shadow-xl">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p class="mt-4 text-gray-700">${message}</p>
            </div>
        `;
        
        document.body.appendChild(spinner);
    }

    static hide() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.remove();
        }
    }
}

// Pagination component
export class Pagination {
    constructor(container, options) {
        this.container = container;
        this.options = {
            totalPages: 1,
            currentPage: 1,
            onPageChange: () => {},
            ...options
        };
        
        this.render();
    }

    render() {
        const { totalPages, currentPage } = this.options;
        
        let pages = [];
        if (totalPages <= 5) {
            pages = Array.from({ length: totalPages }, (_, i) => i + 1);
        } else {
            if (currentPage <= 3) {
                pages = [1, 2, 3, 4, '...', totalPages];
            } else if (currentPage >= totalPages - 2) {
                pages = [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
            } else {
                pages = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
            }
        }

        this.container.innerHTML = `
            <div class="flex items-center justify-center space-x-2">
                <button 
                    class="px-3 py-1 rounded-md ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}"
                    ${currentPage === 1 ? 'disabled' : ''}
                    data-page="${currentPage - 1}"
                >
                    Previous
                </button>
                ${pages.map(page => `
                    ${page === '...' 
                        ? `<span class="px-3 py-1">...</span>`
                        : `<button 
                            class="px-3 py-1 rounded-md ${page === currentPage ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}"
                            data-page="${page}"
                        >
                            ${page}
                        </button>`
                    }
                `).join('')}
                <button 
                    class="px-3 py-1 rounded-md ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}"
                    ${currentPage === totalPages ? 'disabled' : ''}
                    data-page="${currentPage + 1}"
                >
                    Next
                </button>
            </div>
        `;

        this.attachEventListeners();
    }

    attachEventListeners() {
        this.container.querySelectorAll('button[data-page]').forEach(button => {
            button.addEventListener('click', (e) => {
                const page = parseInt(e.target.dataset.page);
                if (!isNaN(page) && page !== this.options.currentPage) {
                    this.options.onPageChange(page);
                }
            });
        });
    }
}

// Modal component
export class Modal {
    constructor(options = {}) {
        this.options = {
            id: 'modal',
            title: '',
            content: '',
            onClose: () => {},
            ...options
        };
        
        this.modal = null;
        this.render();
    }

    render() {
        const modal = document.createElement('div');
        modal.id = this.options.id;
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold">${this.options.title}</h2>
                    <button class="text-gray-400 hover:text-gray-600" data-close>
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-content">
                    ${this.options.content}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.modal = modal;
        this.attachEventListeners();
    }

    attachEventListeners() {
        this.modal.querySelector('[data-close]').addEventListener('click', () => {
            this.hide();
        });

        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hide();
            }
        });
    }

    show() {
        this.modal.classList.remove('hidden');
    }

    hide() {
        this.modal.classList.add('hidden');
        this.options.onClose();
    }

    updateContent(content) {
        this.modal.querySelector('.modal-content').innerHTML = content;
    }
}

// Form validation
export class FormValidator {
    static validate(form, rules) {
        const errors = {};
        
        Object.entries(rules).forEach(([field, validations]) => {
            const input = form.elements[field];
            if (!input) return;
            
            validations.forEach(validation => {
                const [rule, ...params] = validation.split(':');
                
                switch (rule) {
                    case 'required':
                        if (!input.value.trim()) {
                            errors[field] = 'This field is required';
                        }
                        break;
                        
                    case 'email':
                        if (!this.isValidEmail(input.value)) {
                            errors[field] = 'Please enter a valid email address';
                        }
                        break;
                        
                    case 'minLength':
                        if (input.value.length < parseInt(params[0])) {
                            errors[field] = `Must be at least ${params[0]} characters`;
                        }
                        break;
                        
                    case 'maxLength':
                        if (input.value.length > parseInt(params[0])) {
                            errors[field] = `Must not exceed ${params[0]} characters`;
                        }
                        break;
                }
            });
        });
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }

    static isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    static showErrors(form, errors) {
        // Remove existing error messages
        form.querySelectorAll('.error-message').forEach(el => el.remove());
        
        Object.entries(errors).forEach(([field, message]) => {
            const input = form.elements[field];
            if (!input) return;
            
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message text-red-500 text-sm mt-1';
            errorDiv.textContent = message;
            
            input.classList.add('border-red-500');
            input.parentNode.appendChild(errorDiv);
        });
    }
}

// Export all components
export default {
    Toast,
    LoadingSpinner,
    Pagination,
    Modal,
    FormValidator
};
