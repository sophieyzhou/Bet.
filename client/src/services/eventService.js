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
    },

    async deleteEvent(eventId, token) {
        console.log('=== eventService.deleteEvent called ===');
        console.log('EventId:', eventId);
        console.log('Token exists:', !!token);
        console.log('API URL:', `${API_BASE_URL}/events/${eventId}`);
        
        try {
            if (!eventId) {
                console.error('Event ID validation failed');
                throw new Error('Event ID is required');
            }
            if (!token) {
                console.error('Token validation failed');
                throw new Error('Authentication token is required');
            }

            console.log('Making DELETE request...');
            const response = await axios.delete(
                `${API_BASE_URL}/events/${eventId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    timeout: 10000 // 10 second timeout
                }
            );
            console.log('DELETE request successful');
            console.log('Response status:', response.status);
            console.log('Response data:', response.data);
            return response.data;
        } catch (error) {
            console.error('=== eventService.deleteEvent ERROR ===');
            console.error('Error object:', error);
            console.error('Error message:', error?.message);
            console.error('Error code:', error?.code);
            console.error('Error response status:', error?.response?.status);
            console.error('Error response data:', error?.response?.data);
            console.error('Error request:', error?.request);
            
            if (error.response) {
                // Server responded with error status
                const errorMessage = error.response.data?.error || error.response.data?.message || 'Failed to delete event';
                console.error('Server error message:', errorMessage);
                throw new Error(errorMessage);
            } else if (error.request) {
                // Request was made but no response received
                console.error('No response received from server');
                throw new Error('Network error: Could not reach server');
            } else {
                // Error setting up the request
                console.error('Request setup error:', error.message);
                throw new Error(error.message || 'Failed to delete event');
            }
        }
    }
};
