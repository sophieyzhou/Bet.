import React, { useState, useEffect, useCallback } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { groupService } from '../services/groupService';
import LeaderboardScreen from './LeaderboardScreen';
import EventsScreen from './EventsScreen';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { useGroupRealtime } from '../hooks/useGroupRealtime';

const Tab = createBottomTabNavigator();

// Helper functions for cross-platform storage
const getItemAsync = async (key) => {
    if (Platform.OS === 'web') {
        return localStorage.getItem(key);
    } else {
        return await SecureStore.getItemAsync(key);
    }
};

export default function GroupTabsScreen({ route, navigation }) {
    const { groupId } = route.params;
    const [groupData, setGroupData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchGroupData();
    }, [groupId]);

    const fetchGroupData = async () => {
        try {
            const token = await getItemAsync('authToken');
            if (token) {
                const response = await groupService.getGroupDetails(groupId, token);
                setGroupData(response.group);
                // Update header title with group name
                navigation.setOptions({
                    title: response.group.name
                });
            }
        } catch (error) {
            console.error('Error fetching group data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const refreshGroupData = useCallback(async () => {
        try {
            const token = await getItemAsync('authToken');
            if (token) {
                const response = await groupService.getGroupDetails(groupId, token);
                setGroupData(response.group);
                navigation.setOptions({
                    title: response.group.name
                });
            }
        } catch (error) {
            console.error('Error refreshing group data:', error);
        }
    }, [groupId, navigation]);

    // Realtime updates for group data and title
    useGroupRealtime({
        groupId,
        onGroupUpdate: (g) => {
            setGroupData(g);
            navigation.setOptions({ title: g.name });
        },
    });

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4285f4" />
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: '#4285f4',
                tabBarInactiveTintColor: '#7f8c8d',
                tabBarStyle: {
                    backgroundColor: '#fff',
                    borderTopWidth: 1,
                    borderTopColor: '#e1e8ed',
                },
                headerShown: false,
            }}
        >
            <Tab.Screen
                name="LeaderboardTab"
                options={{
                    title: 'Leaderboard',
                    tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📊</Text>
                }}
            >
                {(props) => <LeaderboardScreen {...props} route={{ params: { groupId, groupData } }} />}
            </Tab.Screen>

            <Tab.Screen
                name="EventsTab"
                options={{
                    title: 'Events',
                    tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📋</Text>
                }}
            >
                {(props) => <EventsScreen {...props} route={{ params: { groupId, groupData } }} onGroupDataRefresh={refreshGroupData} />}
            </Tab.Screen>
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#7f8c8d',
    },
});
