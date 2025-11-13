import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Alert
} from 'react-native';

const EventCard = ({ event, currentUserId, onVoteToVeto, onDelete }) => {
    const {
        _id,
        userName,
        submittedByName,
        rule,
        description,
        status,
        vetoCount,
        createdAt,
        expiresAt,
        userId,
        submittedBy,
        votes
    } = event;

    const hasUserVoted = votes.some(v => v.userId === currentUserId);
    const isOwnEvent = userId === currentUserId;
    const isUserSubmitter = submittedBy === currentUserId;
    // Can only veto events you didn't create and that are not applied to you
    const canVeto = !isOwnEvent && !isUserSubmitter;
    const isPending = status === 'pending';

    // Format date nicely (UTC to local time)
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid date';
        const options = {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        };
        return date.toLocaleString('en-US', options);
    };

    const formattedCreatedAt = formatDate(createdAt);
    const formattedExpiresAt = formatDate(expiresAt);
    const [showMenu, setShowMenu] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleDeleteClick = () => {
        console.log('handleDeleteClick called, eventId:', _id);
        console.log('onDelete function exists:', !!onDelete);
        
        if (!onDelete) {
            console.error('onDelete function is not available');
            Alert.alert('Error', 'Delete function not available');
            return;
        }

        if (!_id) {
            console.error('Event ID is missing');
            Alert.alert('Error', 'Invalid event ID');
            return;
        }

        setShowMenu(false);
        setShowDeleteConfirm(true);
    };

    const handleDeleteConfirm = () => {
        console.log('Delete confirmed, calling onDelete with eventId:', _id);
        setShowDeleteConfirm(false);
        try {
            if (onDelete) {
                onDelete(_id);
            }
        } catch (error) {
            console.error('Error calling onDelete:', error);
            Alert.alert('Error', 'Failed to initiate delete: ' + error.message);
        }
    };

    const getStatusColor = () => {
        if (status === 'approved') return '#27ae60';
        if (status === 'vetoed') return '#e74c3c';
        return '#f39c12';
    };

    const getStatusText = () => {
        if (status === 'approved') return 'Approved';
        if (status === 'vetoed') return 'Vetoed';
        return 'Pending';
    };

    const getPointsColor = () => {
        return rule.points >= 0 ? '#27ae60' : '#e74c3c';
    };

    return (
        <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.userName}>{userName}</Text>
                    <Text style={styles.ruleDescription}>{rule.description}</Text>
                </View>
                <View style={styles.headerRight}>
                    <Text style={[styles.points, { color: getPointsColor() }]}>
                        {rule.points > 0 ? '+' : ''}{rule.points} pts
                    </Text>
                    {isUserSubmitter && (
                        <TouchableOpacity
                            style={styles.menuButton}
                            onPress={() => {
                                console.log('Menu button pressed, eventId:', _id, 'status:', status);
                                setShowMenu(true);
                            }}
                        >
                            <Text style={styles.menuButtonText}>⋯</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Submitted by */}
            <Text style={styles.submittedBy}>Submitted by {submittedByName}</Text>

            {/* Description/Notes */}
            {description && description.trim() !== '' && (
                <Text style={styles.description}>{description}</Text>
            )}

            {/* Status Badge */}
            <View style={styles.statusRow}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
                    <Text style={styles.statusText}>{getStatusText()}</Text>
                </View>
            </View>

            {/* Date Information */}
            <View style={styles.dateRow}>
                <Text style={styles.dateText}>Created: {formattedCreatedAt}</Text>
                <Text style={styles.dateText}>
                    {status === 'approved' ? 'Approved: ' : 'Expires: '}
                    {formattedExpiresAt}
                </Text>
            </View>

            {/* Veto Section - only for pending events */}
            {isPending && (
                <View style={styles.vetoSection}>
                    <View style={styles.vetoProgress}>
                        <Text style={styles.vetoText}>
                            {vetoCount}/{rule.vetoThreshold} vetos
                        </Text>
                        <View style={styles.progressBar}>
                            <View
                                style={[
                                    styles.progressFill,
                                    { width: `${Math.min((vetoCount / rule.vetoThreshold) * 100, 100)}%` }
                                ]}
                            />
                        </View>
                    </View>

                    {canVeto && !hasUserVoted && (
                        <TouchableOpacity
                            style={styles.vetoButton}
                            onPress={() => onVoteToVeto(_id)}
                        >
                            <Text style={styles.vetoButtonText}>Vote to Veto</Text>
                        </TouchableOpacity>
                    )}

                    {hasUserVoted && (
                        <View style={styles.votedBadge}>
                            <Text style={styles.votedText}>You voted to veto</Text>
                        </View>
                    )}

                    {isOwnEvent && (
                        <Text style={styles.cannotVoteText}>Your event</Text>
                    )}

                    {isUserSubmitter && !isOwnEvent && !hasUserVoted && (
                        <Text style={styles.cannotVoteText}>You created this event</Text>
                    )}
                </View>
            )}

            {/* Menu Modal */}
            <Modal
                visible={showMenu}
                transparent={true}
                animationType="fade"
                onRequestClose={() => {
                    console.log('Modal onRequestClose called');
                    setShowMenu(false);
                }}
            >
                <View style={styles.menuOverlay}>
                    <TouchableOpacity
                        style={StyleSheet.absoluteFill}
                        activeOpacity={1}
                        onPress={() => {
                            console.log('Overlay pressed, closing menu');
                            setShowMenu(false);
                        }}
                    />
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={(e) => {
                            e.stopPropagation();
                        }}
                    >
                        <View style={styles.menuContent}>
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={(e) => {
                                    console.log('Delete menu item pressed');
                                    e.stopPropagation();
                                    handleDeleteClick();
                                }}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.menuItemTextDelete}>Delete Event</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.menuItem, styles.menuItemLast]}
                                onPress={(e) => {
                                    console.log('Cancel menu item pressed');
                                    e.stopPropagation();
                                    setShowMenu(false);
                                }}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.menuItemText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </View>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                visible={showDeleteConfirm}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowDeleteConfirm(false)}
            >
                <View style={styles.menuOverlay}>
                    <TouchableOpacity
                        style={StyleSheet.absoluteFill}
                        activeOpacity={1}
                        onPress={() => setShowDeleteConfirm(false)}
                    />
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={(e) => e.stopPropagation()}
                    >
                        <View style={styles.confirmModalContent}>
                            <Text style={styles.confirmModalTitle}>Delete Event</Text>
                            <Text style={styles.confirmModalMessage}>
                                Are you sure you want to delete this event? This action cannot be undone.
                            </Text>
                            <View style={styles.confirmModalButtons}>
                                <TouchableOpacity
                                    style={[styles.confirmModalButton, styles.confirmModalButtonCancel]}
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        console.log('Delete cancelled');
                                        setShowDeleteConfirm(false);
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.confirmModalButtonTextCancel}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.confirmModalButton, styles.confirmModalButtonDelete]}
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        handleDeleteConfirm();
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.confirmModalButtonTextDelete}>Delete</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    headerLeft: {
        flex: 1,
        marginRight: 10,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuButton: {
        padding: 5,
        marginLeft: 5,
    },
    menuButtonText: {
        fontSize: 24,
        color: '#7f8c8d',
        lineHeight: 24,
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 4,
    },
    ruleDescription: {
        fontSize: 14,
        color: '#7f8c8d',
    },
    points: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    submittedBy: {
        fontSize: 12,
        color: '#95a5a6',
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        color: '#2c3e50',
        marginBottom: 10,
        lineHeight: 20,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginBottom: 10,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    dateRow: {
        marginBottom: 10,
    },
    dateText: {
        fontSize: 12,
        color: '#7f8c8d',
        marginBottom: 4,
    },
    vetoSection: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#ecf0f1',
    },
    vetoProgress: {
        marginBottom: 10,
    },
    vetoText: {
        fontSize: 14,
        color: '#2c3e50',
        marginBottom: 5,
        fontWeight: '600',
    },
    progressBar: {
        height: 8,
        backgroundColor: '#ecf0f1',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#e74c3c',
        borderRadius: 4,
    },
    vetoButton: {
        backgroundColor: '#e74c3c',
        paddingVertical: 10,
        borderRadius: 6,
        alignItems: 'center',
    },
    vetoButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    votedBadge: {
        backgroundColor: '#95a5a6',
        paddingVertical: 10,
        borderRadius: 6,
        alignItems: 'center',
    },
    votedText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    cannotVoteText: {
        textAlign: 'center',
        color: '#95a5a6',
        fontSize: 14,
        fontStyle: 'italic',
    },
    menuOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    menuContent: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 10,
        minWidth: 200,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    menuItem: {
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e1e8ed',
    },
    menuItemLast: {
        borderBottomWidth: 0,
    },
    menuItemText: {
        fontSize: 16,
        color: '#2c3e50',
    },
    menuItemTextDelete: {
        fontSize: 16,
        color: '#e74c3c',
        fontWeight: '600',
    },
    confirmModalContent: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        minWidth: 300,
        maxWidth: '90%',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    confirmModalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 10,
    },
    confirmModalMessage: {
        fontSize: 16,
        color: '#7f8c8d',
        marginBottom: 20,
        lineHeight: 22,
    },
    confirmModalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    confirmModalButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        minWidth: 80,
        alignItems: 'center',
    },
    confirmModalButtonCancel: {
        backgroundColor: '#e1e8ed',
        marginRight: 10,
    },
    confirmModalButtonDelete: {
        backgroundColor: '#e74c3c',
    },
    confirmModalButtonTextCancel: {
        color: '#2c3e50',
        fontSize: 16,
        fontWeight: '600',
    },
    confirmModalButtonTextDelete: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default EventCard;
