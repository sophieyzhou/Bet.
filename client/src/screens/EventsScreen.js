import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    FlatList,
    ActivityIndicator,
    Alert,
    RefreshControl
} from 'react-native';
import { eventService } from '../services/eventService';
import { useAuth } from '../context/AuthContext';
import EventCard from '../components/EventCard';
import SubmitEventModal from '../components/SubmitEventModal';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Helper functions for cross-platform storage
const getItemAsync = async (key) => {
    if (Platform.OS === 'web') {
        return localStorage.getItem(key);
    } else {
        return await SecureStore.getItemAsync(key);
    }
};

export default function EventsScreen({ route }) {
    const { groupId, groupData } = route.params;
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [showSubmitModal, setShowSubmitModal] = useState(false);

    useEffect(() => {
        fetchEvents();
    }, [groupId]);

    useEffect(() => {
        filterEvents();
    }, [events, selectedFilter]);

    const fetchEvents = async () => {
        try {
            const token = await getItemAsync('authToken');
            if (token) {
                const response = await eventService.getGroupEvents(groupId, token);
                setEvents(response.events || []);
            }
        } catch (error) {
            console.error('Error fetching events:', error);
            Alert.alert('Error', 'Failed to load events');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const filterEvents = () => {
        if (selectedFilter === 'all') {
            setFilteredEvents(events);
        } else {
            setFilteredEvents(events.filter(e => e.status === selectedFilter));
        }
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchEvents();
    };

    const handleVoteToVeto = async (eventId) => {
        try {
            const token = await getItemAsync('authToken');
            if (token) {
                await eventService.voteToVeto(eventId, token);
                Alert.alert('Success', 'Your veto vote has been recorded');
                fetchEvents(); // Refresh to show updated vote
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to vote');
        }
    };

    const handleSubmitEvent = async (eventData) => {
        try {
            const token = await getItemAsync('authToken');
            if (token) {
                await eventService.createEvent(groupId, eventData, token);
                Alert.alert('Success', 'Event submitted successfully');
                fetchEvents(); // Refresh to show new event
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to submit event');
            throw error;
        }
    };

    const renderFilterButton = (filter, label) => {
        const isSelected = selectedFilter === filter;
        return (
            <TouchableOpacity
                style={[styles.filterButton, isSelected && styles.filterButtonActive]}
                onPress={() => setSelectedFilter(filter)}
            >
                <Text style={[styles.filterButtonText, isSelected && styles.filterButtonTextActive]}>
                    {label}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No events yet</Text>
            <Text style={styles.emptySubtitle}>
                {selectedFilter === 'all'
                    ? 'Submit an event to get started!'
                    : `No ${selectedFilter} events`}
            </Text>
        </View>
    );

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4285f4" />
                    <Text style={styles.loadingText}>Loading events...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Filters */}
            <View style={styles.filtersContainer}>
                {renderFilterButton('all', 'All')}
                {renderFilterButton('pending', 'Pending')}
                {renderFilterButton('approved', 'Approved')}
                {renderFilterButton('vetoed', 'Vetoed')}
            </View>

            {/* Events List */}
            <FlatList
                data={filteredEvents}
                renderItem={({ item }) => (
                    <EventCard
                        event={item}
                        currentUserId={user?.id}
                        onVoteToVeto={handleVoteToVeto}
                    />
                )}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        colors={['#4285f4']}
                        tintColor="#4285f4"
                    />
                }
                ListEmptyComponent={renderEmptyState}
                showsVerticalScrollIndicator={false}
            />

            {/* Submit Event FAB */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => setShowSubmitModal(true)}
                activeOpacity={0.8}
            >
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>

            {/* Submit Event Modal */}
            <SubmitEventModal
                visible={showSubmitModal}
                onClose={() => setShowSubmitModal(false)}
                members={groupData?.members || []}
                rules={groupData?.rules || []}
                onSubmit={handleSubmitEvent}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1A1A1A',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#cccccc',
    },
    filtersContainer: {
        flexDirection: 'row',
        padding: 15,
        backgroundColor: '#2A2A2A',
        borderBottomWidth: 1,
        borderBottomColor: '#333333',
    },
    filterButton: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f8f9fa',
        marginRight: 10,
    },
    filterButtonActive: {
        backgroundColor: '#4285f4',
    },
    filterButtonText: {
        fontSize: 14,
        color: '#7f8c8d',
        fontWeight: '600',
    },
    filterButtonTextActive: {
        color: '#fff',
    },
    listContainer: {
        padding: 15,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#cccccc',
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#4285f4',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    fabText: {
        fontSize: 24,
        color: '#fff',
        fontWeight: 'bold',
    },
});
