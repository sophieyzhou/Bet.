import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

export const eventService = {
    async getGroupEvents(groupId, token, status = null) {
        try {
            let url = `${API_BASE_URL}/events/group/${groupId}`;
            if (status) {
                url += `?status=${status}`;
            }

            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching events:', error);
            throw error;
        }
    },

    async createEvent(groupId, eventData, token) {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/events/create`,
                { groupId, ...eventData },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error creating event:', error);
            if (error.response?.data?.error) {
                throw new Error(error.response.data.error);
            }
            throw error;
        }
    },

    async voteToVeto(eventId, token) {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/events/${eventId}/vote`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error voting on event:', error);
            if (error.response?.data?.error) {
                throw new Error(error.response.data.error);
            }
            throw error;
        }
    }
};
