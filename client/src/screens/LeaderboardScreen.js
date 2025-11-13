import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    ActivityIndicator,
    ScrollView,
    Alert
} from 'react-native';
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
                    <ActivityIndicator size="large" color="#4285f4" />
                    <Text style={styles.loadingText}>Loading leaderboard...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!group) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Failed to load group</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchGroupDetails}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header Section */}
                <View style={styles.headerCard}>
                    <View style={styles.groupNameRow}>
                        <Text style={styles.groupName}>{group.name}</Text>
                        {isCreator && (
                            <TouchableOpacity
                                style={styles.editButton}
                                onPress={() => setShowEditModal(true)}
                            >
                                <Text style={styles.editButtonText}>Edit</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    {group.description && (
                        <Text style={styles.groupDescription}>{group.description}</Text>
                    )}

                    <View style={styles.infoRow}>
                        <Text style={styles.memberCount}>{group.memberCount} members</Text>
                    </View>

                    {/* Share Group Button */}
                    <TouchableOpacity
                        style={styles.shareButton}
                        onPress={handleShareGroup}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.shareButtonText}>Share Group</Text>
                    </TouchableOpacity>
                </View>

                {/* Leaderboard Section */}
                <View style={styles.leaderboardSection}>
                    <Text style={styles.sectionTitle}>Leaderboard</Text>
                    {group.members.map((member, index) => {
                        const rank = index + 1;
                        const isCurrentUser = member.userId === user?.id || member.email === user?.email;

                        return (
                            <View
                                key={member.userId}
                                style={[
                                    styles.leaderboardRow,
                                    isCurrentUser && styles.currentUserRow
                                ]}
                            >
                                <Text style={styles.rankText}>{getRankDisplay(rank)}</Text>
                                <View style={styles.memberInfo}>
                                    <Text style={[styles.memberName, isCurrentUser && styles.currentUserText]}>
                                        {member.name} {isCurrentUser && '(You)'}
                                    </Text>
                                    <Text style={styles.memberEmail}>{member.email}</Text>
                                </View>
                                <Text style={styles.pointsText}>{member.totalPoints} pts</Text>
                            </View>
                        );
                    })}
                </View>
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
        fontSize: 16,
        color: '#7f8c8d',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 18,
        color: '#e74c3c',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#4285f4',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
    },
    headerCard: {
        backgroundColor: '#fff',
        padding: 20,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    groupNameRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    groupName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2c3e50',
        flex: 1,
    },
    editButton: {
        backgroundColor: '#4285f4',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 6,
        marginLeft: 10,
    },
    editButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    groupDescription: {
        fontSize: 16,
        color: '#7f8c8d',
        marginBottom: 15,
        lineHeight: 22,
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 15,
    },
    memberCount: {
        fontSize: 14,
        color: '#7f8c8d',
        backgroundColor: '#f8f9fa',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    shareButton: {
        marginTop: 15,
        backgroundColor: '#4285f4',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    shareButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    leaderboardSection: {
        backgroundColor: '#fff',
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
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
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2c3e50',
        width: 50,
    },
    memberInfo: {
        flex: 1,
        marginHorizontal: 10,
    },
    memberName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 2,
    },
    currentUserText: {
        color: '#4285f4',
    },
    memberEmail: {
        fontSize: 12,
        color: '#7f8c8d',
    },
    pointsText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4285f4',
    },
});
