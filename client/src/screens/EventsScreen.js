import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    StyleSheet,
    SafeAreaView,
    FlatList,
    Alert,
    RefreshControl,
    ScrollView
} from 'react-native';
import { Text, Chip, FAB, ActivityIndicator, Surface } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { eventService } from '../services/eventService';
import { useAuth } from '../context/AuthContext';
import EventCard from '../components/EventCard';
import SubmitEventModal from '../components/SubmitEventModal';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { useGroupRealtime } from '../hooks/useGroupRealtime';

// Helper functions for cross-platform storage
const getItemAsync = async (key) => {
    if (Platform.OS === 'web') {
        return localStorage.getItem(key);
    } else {
        return await SecureStore.getItemAsync(key);
    }
};

export default function EventsScreen({ route, onGroupDataRefresh }) {
    const { groupId, groupData } = route.params;
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
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

    // Realtime event handlers
    const handleEventNew = useCallback((payload) => {
        setEvents(prev => (
            prev.some(e => e._id === payload._id) ? prev : [payload, ...prev]
        ));
    }, []);

    const handleEventUpdate = useCallback((payload) => {
        setEvents(prev => prev.map(e => (
            e._id === payload._id
                ? { ...e, status: payload.status, votes: payload.votes, vetoCount: payload.vetoCount }
                : e
        )));
    }, []);

    const handleEventDelete = useCallback((payload) => {
        const id = payload?.eventId || payload?._id;
        if (!id) return;
        setEvents(prev => prev.filter(e => e._id !== id));
    }, []);

    // Subscribe to realtime group events
    useGroupRealtime({
        groupId,
        onEventNew: handleEventNew,
        onEventUpdate: handleEventUpdate,
        onEventDelete: handleEventDelete,
    });

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
                // Refresh group data to update points if event was vetoed
                if (onGroupDataRefresh) {
                    onGroupDataRefresh();
                }
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to vote');
        }
    };

    const handleDeleteEvent = async (eventId) => {
        console.log('=== handleDeleteEvent called ===');
        console.log('EventId:', eventId);
        console.log('EventId type:', typeof eventId);
        
        try {
            if (!eventId) {
                console.error('No eventId provided');
                Alert.alert('Error', 'Invalid event ID');
                return;
            }

            console.log('Getting auth token...');
            const token = await getItemAsync('authToken');
            if (!token) {
                console.error('No auth token found');
                Alert.alert('Error', 'Authentication required. Please log in again.');
                return;
            }
            console.log('Auth token retrieved');

            console.log('Calling eventService.deleteEvent with eventId:', eventId);
            const result = await eventService.deleteEvent(eventId, token);
            console.log('Delete result:', result);
            console.log('Delete successful!');
            
            Alert.alert('Success', 'Event deleted successfully');
            console.log('Refreshing events list...');
            fetchEvents(); // Refresh to remove deleted event
            // Refresh group data to update points
            if (onGroupDataRefresh) {
                onGroupDataRefresh();
            }
        } catch (error) {
            console.error('=== DELETE EVENT ERROR ===');
            console.error('Error object:', error);
            console.error('Error message:', error?.message);
            console.error('Error stack:', error?.stack);
            console.error('Error response:', error?.response);
            const errorMessage = error?.message || error?.toString() || 'Failed to delete event';
            console.error('Showing error alert:', errorMessage);
            Alert.alert('Error', errorMessage);
        }
    };

    const handleSubmitEvent = async (eventData) => {
        try {
            const token = await getItemAsync('authToken');
            if (token) {
                await eventService.createEvent(groupId, eventData, token);
                Alert.alert('Success', 'Event submitted successfully');
                fetchEvents(); // Refresh to show new event
                // Refresh group data to update points
                if (onGroupDataRefresh) {
                    onGroupDataRefresh();
                }
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to submit event');
            throw error;
        }
    };

    const renderFilterButton = (filter, label) => {
        const isSelected = selectedFilter === filter;
        return (
            <Chip
                selected={isSelected}
                onPress={() => setSelectedFilter(filter)}
                style={[styles.filterChip, isSelected && styles.selectedChip]}
                selectedColor="#fff"
                textStyle={isSelected ? styles.selectedChipText : styles.unselectedChipText}
                mode={isSelected ? 'flat' : 'outlined'}
            >
                    {label}
            </Chip>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Text variant="titleLarge" style={styles.emptyTitle}>No events yet</Text>
            <Text variant="bodyLarge" style={styles.emptySubtitle}>
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
                    <ActivityIndicator size="large" />
                    <Text variant="bodyLarge" style={styles.loadingText}>Loading events...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Filters */}
            <Surface style={styles.filtersContainer} elevation={1}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filtersScrollContent}
                    style={styles.filtersScrollView}
                >
                    {renderFilterButton('all', 'All')}
                    {renderFilterButton('pending', 'Pending')}
                    {renderFilterButton('approved', 'Approved')}
                    {renderFilterButton('vetoed', 'Vetoed')}
                </ScrollView>
            </Surface>

            {/* Events List */}
            <FlatList
                data={filteredEvents}
                renderItem={({ item }) => (
                    <EventCard
                        event={item}
                        currentUserId={user?.id}
                        onVoteToVeto={handleVoteToVeto}
                        onDelete={handleDeleteEvent}
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
                keyboardDismissMode="on-drag"
                keyboardShouldPersistTaps="handled"
                removeClippedSubviews={true}
            />

            {/* Submit Event FAB */}
            <FAB
                icon="plus"
                style={[styles.fab, { bottom: insets.bottom + 16 }]}
                onPress={() => setShowSubmitModal(true)}
                label="Submit"
            />

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
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#7f8c8d',
    },
    filtersContainer: {
        paddingVertical: 15,
        backgroundColor: '#fff',
    },
    filtersScrollView: {
        flexGrow: 0,
    },
    filtersScrollContent: {
        paddingHorizontal: 15,
        gap: 10,
    },
    filterChip: {
        marginRight: 8,
    },
    selectedChip: {
        backgroundColor: '#4285f4',
    },
    selectedChipText: {
        color: '#fff',
        fontWeight: '600',
    },
    unselectedChipText: {
        color: '#2c3e50',
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
        color: '#2c3e50',
        marginBottom: 8,
    },
    emptySubtitle: {
        color: '#7f8c8d',
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
    },
});
