const api = {
    stories: {
        async getAll(baseUrl, page, limit) {
            try {
                const response = await fetch(`${baseUrl}/stories?page=${page}&limit=${limit}`);
                if (!response.ok) throw new Error('Failed to fetch stories');
                return await response.json();
            } catch (error) {
                console.error('Error fetching stories:', error);
                throw error;
            }
        },
        
        async create(baseUrl, storyData) {
            try {
                const response = await fetch(`${baseUrl}/stories`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(storyData)
                });
                if (!response.ok) throw new Error('Failed to create story');
                return await response.json();
            } catch (error) {
                console.error('Error creating story:', error);
                throw error;
            }
        }
    },
    
    festivals: {
        async getAll(baseUrl) {
            try {
                const response = await fetch(`${baseUrl}/festivals`);
                if (!response.ok) throw new Error('Failed to fetch festivals');
                return await response.json();
            } catch (error) {
                console.error('Error fetching festivals:', error);
                throw error;
            }
        },
        
        async getFestivalById(baseUrl, id) {
            try {
                const response = await fetch(`${baseUrl}/festivals/${id}`);
                if (!response.ok) throw new Error('Failed to fetch festival');
                return await response.json();
            } catch (error) {
                console.error('Error fetching festival:', error);
                throw error;
            }
        }
    },
    
    auth: {
        async login(baseUrl, credentials) {
            try {
                const response = await fetch(`${baseUrl}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(credentials)
                });
                if (!response.ok) throw new Error('Login failed');
                return await response.json();
            } catch (error) {
                console.error('Error during login:', error);
                throw error;
            }
        },
        
        async register(baseUrl, userData) {
            try {
                const response = await fetch(`${baseUrl}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userData)
                });
                if (!response.ok) throw new Error('Registration failed');
                return await response.json();
            } catch (error) {
                console.error('Error during registration:', error);
                throw error;
            }
        }
    }
};

export default api;
