export class Toast {
    static show(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
            type === 'success' ? 'bg-green-500' :
            type === 'error' ? 'bg-red-500' :
            'bg-blue-500'
        } text-white`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

export class LoadingSpinner {
    static spinner = null;

    static show() {
        if (this.spinner) return;
        
        this.spinner = document.createElement('div');
        this.spinner.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        this.spinner.innerHTML = `
            <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
        `;
        
        document.body.appendChild(this.spinner);
    }

    static hide() {
        if (this.spinner) {
            this.spinner.remove();
            this.spinner = null;
        }
    }
}

export class Pagination {
    constructor(container, options) {
        this.container = container;
        this.options = options;
        this.render();
    }

    render() {
        const { totalPages, currentPage, onPageChange } = this.options;
        
        this.container.innerHTML = `
            <div class="flex justify-center space-x-2">
                <button class="px-3 py-1 rounded-md ${currentPage === 1 ? 'bg-gray-200 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}"
                        ${currentPage === 1 ? 'disabled' : ''}
                        onclick="this.pagination.changePage(${currentPage - 1})">
                    Previous
                </button>
                
                ${Array.from({ length: totalPages }, (_, i) => i + 1)
                    .map(page => `
                        <button class="px-3 py-1 rounded-md ${page === currentPage ? 'bg-indigo-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}"
                                onclick="this.pagination.changePage(${page})">
                            ${page}
                        </button>
                    `).join('')}
                
                <button class="px-3 py-1 rounded-md ${currentPage === totalPages ? 'bg-gray-200 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}"
                        ${currentPage === totalPages ? 'disabled' : ''}
                        onclick="this.pagination.changePage(${currentPage + 1})">
                    Next
                </button>
            </div>
        `;

        // Attach pagination instance to container for event handling
        this.container.pagination = this;
    }

    changePage(newPage) {
        if (newPage >= 1 && newPage <= this.options.totalPages) {
            this.options.onPageChange(newPage);
        }
    }
}
