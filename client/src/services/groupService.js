import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

export const groupService = {
    async getUserGroups(token) {
        try {
            const response = await axios.get(`${API_BASE_URL}/groups/user`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching user groups:', error);
            throw error;
        }
    },

    async getGroupDetails(groupId, token) {
        try {
            const response = await axios.get(`${API_BASE_URL}/groups/${groupId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching group details:', error);
            throw error;
        }
    },

    async createGroup(token, groupData) {
        try {
            const response = await axios.post(`${API_BASE_URL}/groups/create`, groupData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error creating group:', error);
            if (error.response?.data?.error) {
                throw new Error(error.response.data.error);
            }
            throw error;
        }
    },

    async joinGroup(joinCode, token) {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/groups/join`,
                { joinCode: joinCode.toUpperCase() },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error joining group:', error);
            // Extract error message from response
            if (error.response) {
                // Server responded with error status
                const errorMessage = error.response.data?.error || 
                                    error.response.data?.message || 
                                    `Failed to join group (${error.response.status})`;
                const customError = new Error(errorMessage);
                customError.response = error.response;
                throw customError;
            } else if (error.request) {
                // Request made but no response received
                throw new Error('Network error: Could not reach server. Please check your connection.');
            } else {
                // Error setting up request
                throw new Error(error.message || 'Failed to join group');
            }
        }
    },

    async updateGroup(groupId, token, groupData) {
        try {
            const response = await axios.put(
                `${API_BASE_URL}/groups/${groupId}`,
                groupData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error updating group:', error);
            if (error.response?.data?.error) {
                throw new Error(error.response.data.error);
            }
            throw error;
        }
    }
};
