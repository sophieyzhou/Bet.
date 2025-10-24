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
    }
};
