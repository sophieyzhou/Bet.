import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    Alert
} from 'react-native';
import { Text, Card, Button, ActivityIndicator, Chip, Surface } from 'react-native-paper';
import { groupService } from '../services/groupService';
import { useAuth } from '../context/AuthContext';
import CreateGroupModal from '../components/CreateGroupModal';
import ShareGroupModal from '../components/ShareGroupModal';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

// Helper functions for cross-platform storage
const getItemAsync = async (key) => {
    if (Platform.OS === 'web') {
        return localStorage.getItem(key);
    } else {
        return await SecureStore.getItemAsync(key);
    }
};

export default function LeaderboardScreen({ route, navigation }) {
    const { groupId, groupData: initialGroupData } = route.params;
    const { user } = useAuth();
    const [group, setGroup] = useState(initialGroupData || null);
    const [isLoading, setIsLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);

    useEffect(() => {
        if (initialGroupData) {
            setGroup(initialGroupData);
            setIsLoading(false);
        } else {
            fetchGroupDetails();
        }
    }, [groupId]);

    // Update group when initialGroupData changes (from parent refresh)
    useEffect(() => {
        if (initialGroupData) {
            setGroup(initialGroupData);
        }
    }, [initialGroupData]);

    // Auto-refresh when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            fetchGroupDetails();
        }, [groupId])
    );

    const fetchGroupDetails = async () => {
        try {
            const token = await getItemAsync('authToken');
            if (token) {
                const response = await groupService.getGroupDetails(groupId, token);
                setGroup(response.group);
            }
        } catch (error) {
            console.error('Error fetching group details:', error);
            Alert.alert('Error', 'Failed to load group details', [
                {
                    text: 'Retry',
                    onPress: fetchGroupDetails
                },
                {
                    text: 'Go Back',
                    onPress: () => navigation.goBack()
                }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleShareGroup = () => {
        setShowShareModal(true);
    };

    const getRankDisplay = (rank) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return `#${rank}`;
    };

    const isCreator = group && user && (
        group.createdBy?.toString() === user.id?.toString() || 
        group.createdBy?.toString() === user._id?.toString()
    );

    const handleUpdateSuccess = async (groupId, groupData) => {
        try {
            const token = await getItemAsync('authToken');
            if (token) {
                await groupService.updateGroup(groupId, token, groupData);
                Alert.alert('Success', 'Group updated successfully');
                fetchGroupDetails(); // Refresh group data
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to update group');
            throw error;
        }
    };

    const handleEditModalClose = () => {
        setShowEditModal(false);
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" />
                    <Text variant="bodyLarge" style={styles.loadingText}>Loading leaderboard...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!group) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text variant="titleLarge" style={styles.errorText}>Failed to load group</Text>
                    <Button mode="contained" onPress={fetchGroupDetails} style={styles.retryButton}>
                        Retry
                    </Button>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
            >
                {/* Header Section */}
                <Card style={styles.headerCard} mode="elevated" elevation={2}>
                    <Card.Content>
                    <View style={styles.groupNameRow}>
                            <Text variant="headlineMedium" style={styles.groupName}>{group.name}</Text>
                        {isCreator && (
                                <Button
                                    mode="contained"
                                    onPress={() => setShowEditModal(true)}
                                style={styles.editButton}
                                    compact
                            >
                                    Edit
                                </Button>
                        )}
                    </View>
                    {group.description && (
                            <Text variant="bodyMedium" style={styles.groupDescription}>
                                {group.description}
                            </Text>
                    )}

                    <View style={styles.infoRow}>
                            <Chip style={styles.memberCount} textStyle={styles.memberCountText}>
                                {group.memberCount} members
                            </Chip>
                    </View>

                    {/* Share Group Button */}
                        <Button
                            mode="contained"
                            onPress={handleShareGroup}
                        style={styles.shareButton}
                        >
                            Share Group
                        </Button>
                    </Card.Content>
                </Card>

                {/* Leaderboard Section */}
                <Card style={styles.leaderboardSection} mode="elevated" elevation={2}>
                    <Card.Content>
                        <Text variant="titleLarge" style={styles.sectionTitle}>Leaderboard</Text>
                    {group.members.map((member, index) => {
                        const rank = index + 1;
                        const isCurrentUser = member.userId === user?.id || member.email === user?.email;

                        return (
                                <Surface
                                key={member.userId}
                                style={[
                                    styles.leaderboardRow,
                                    isCurrentUser && styles.currentUserRow
                                ]}
                                    elevation={isCurrentUser ? 1 : 0}
                            >
                                    <Text variant="titleLarge" style={styles.rankText}>
                                        {getRankDisplay(rank)}
                                    </Text>
                                <View style={styles.memberInfo}>
                                        <Text
                                            variant="titleMedium"
                                            style={[styles.memberName, isCurrentUser && styles.currentUserText]}
                                        >
                                        {member.name} {isCurrentUser && '(You)'}
                                        </Text>
                                        <Text variant="bodySmall" style={styles.memberEmail}>
                                            {member.email}
                                        </Text>
                                    </View>
                                    <Text variant="titleLarge" style={styles.pointsText}>
                                        {member.totalPoints} pts
                                    </Text>
                                </Surface>
                        );
                    })}
                    </Card.Content>
                </Card>
            </ScrollView>

            {/* Edit Group Modal */}
            <CreateGroupModal
                visible={showEditModal}
                onClose={handleEditModalClose}
                editMode={true}
                initialData={group}
                groupId={groupId}
                onUpdateSuccess={handleUpdateSuccess}
            />

            {/* Share Group Modal */}
            <ShareGroupModal
                visible={showShareModal}
                onClose={() => setShowShareModal(false)}
                joinCode={group?.joinCode}
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
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        color: '#e74c3c',
        marginBottom: 20,
    },
    retryButton: {
        marginTop: 10,
    },
    scrollView: {
        flex: 1,
    },
    headerCard: {
        margin: 15,
        marginBottom: 15,
    },
    groupNameRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    groupName: {
        color: '#2c3e50',
        flex: 1,
    },
    editButton: {
        marginLeft: 10,
    },
    groupDescription: {
        color: '#7f8c8d',
        marginBottom: 15,
        lineHeight: 22,
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 15,
    },
    memberCount: {
        backgroundColor: '#f8f9fa',
        height: 28,
    },
    memberCountText: {
        fontSize: 12,
        color: '#7f8c8d',
    },
    shareButton: {
        marginTop: 8,
    },
    leaderboardSection: {
        margin: 15,
        marginTop: 0,
        marginBottom: 20,
    },
    sectionTitle: {
        color: '#2c3e50',
        marginBottom: 15,
    },
    leaderboardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        marginBottom: 10,
    },
    currentUserRow: {
        backgroundColor: '#E3F2FD',
        borderWidth: 2,
        borderColor: '#4285f4',
    },
    rankText: {
        color: '#2c3e50',
        width: 50,
    },
    memberInfo: {
        flex: 1,
        marginHorizontal: 10,
    },
    memberName: {
        color: '#2c3e50',
        marginBottom: 2,
    },
    currentUserText: {
        color: '#4285f4',
    },
    memberEmail: {
        color: '#7f8c8d',
    },
    pointsText: {
        color: '#4285f4',
    },
});
