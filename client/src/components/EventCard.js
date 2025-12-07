import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Alert,
    Image,
    Dimensions,
    ScrollView
} from 'react-native';
import { Card, Text, Chip, Button, IconButton, Dialog, Portal, ProgressBar } from 'react-native-paper';
import { Video } from 'expo-av';

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
        votes,
        media
    } = event;

    const hasUserVoted = votes.some(v => v.userId === currentUserId);
    const isOwnEvent = userId === currentUserId;
    const isUserSubmitter = submittedBy === currentUserId;
    // Can only veto events you didn't create and that are not applied to you
    const canVeto = !isOwnEvent && !isUserSubmitter;
    const isPending = status === 'pending';
    
    const videoRef = useRef(null);
    const [showMediaModal, setShowMediaModal] = useState(false);

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

    const hasMedia = !!media && !!media.url && !!media.type;

    const getMediaUri = () => {
        if (!hasMedia) return null;
        return media.url;
    };

    // Auto-play video when component mounts
    useEffect(() => {
        if (hasMedia && media.type === 'video' && videoRef.current) {
            videoRef.current.playAsync();
        }
    }, [hasMedia, media]);

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
        <Card style={styles.card} mode="elevated" elevation={2}>
            <Card.Content>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                        <Text variant="titleMedium" style={styles.userName}>{userName}</Text>
                        <Text variant="bodySmall" style={styles.ruleDescription}>{rule.description}</Text>
                </View>
                <View style={styles.headerRight}>
                        <Chip
                            style={[styles.pointsChip, { backgroundColor: getPointsColor() === '#27ae60' ? '#E8F5E9' : '#FFEBEE' }]}
                            textStyle={[styles.pointsText, { color: getPointsColor() }]}
                        >
                        {rule.points > 0 ? '+' : ''}{rule.points} pts
                        </Chip>
                    {isUserSubmitter && (
                            <IconButton
                                icon="dots-vertical"
                                size={20}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            onPress={() => {
                                console.log('Menu button pressed, eventId:', _id, 'status:', status);
                                setShowMenu(true);
                            }}
                            />
                    )}
                </View>
            </View>

            {/* Submitted by */}
                <Text variant="bodySmall" style={styles.submittedBy}>
                    Submitted by {submittedByName}
                </Text>

            {/* Description/Notes */}
            {description && description.trim() !== '' && (
                    <Text variant="bodyMedium" style={styles.description}>{description}</Text>
            )}

            {/* Media Display */}
            {hasMedia && (
                    <Card
                    style={styles.mediaContainer}
                    onPress={() => setShowMediaModal(true)}
                        mode="outlined"
                >
                    {media.type === 'image' ? (
                        <Image
                            source={{ uri: getMediaUri() }}
                            style={styles.mediaImage}
                            resizeMode="cover"
                        />
                    ) : (
                        <Video
                            ref={videoRef}
                            source={{ uri: getMediaUri() }}
                            style={styles.mediaVideo}
                            resizeMode="cover"
                            isLooping
                            isMuted={true}
                            shouldPlay={true}
                        />
                    )}
                    </Card>
            )}

            {/* Status Badge */}
            <View style={styles.statusRow}>
                    <Chip
                        style={[styles.statusChip, { backgroundColor: getStatusColor() }]}
                        textStyle={styles.statusText}
                    >
                        {getStatusText()}
                    </Chip>
            </View>

            {/* Date Information */}
            <View style={styles.dateRow}>
                    <Text variant="bodySmall" style={styles.dateText}>
                        Created: {formattedCreatedAt}
                    </Text>
                    <Text variant="bodySmall" style={styles.dateText}>
                    {status === 'approved' ? 'Approved: ' : 'Expires: '}
                    {formattedExpiresAt}
                </Text>
            </View>

            {/* Veto Section - only for pending events */}
            {isPending && (
                <View style={styles.vetoSection}>
                    <View style={styles.vetoProgress}>
                            <Text variant="bodyMedium" style={styles.vetoText}>
                            {vetoCount}/{rule.vetoThreshold} vetos
                        </Text>
                            <ProgressBar
                                progress={Math.min(vetoCount / rule.vetoThreshold, 1)}
                                color="#e74c3c"
                                style={styles.progressBar}
                            />
                    </View>

                    {canVeto && !hasUserVoted && (
                            <Button
                                mode="contained"
                                buttonColor="#e74c3c"
                                onPress={() => onVoteToVeto(_id)}
                            style={styles.vetoButton}
                                compact
                        >
                                Vote to Veto
                            </Button>
                    )}

                    {hasUserVoted && (
                            <Chip style={styles.votedBadge} textStyle={styles.votedText}>
                                You voted to veto
                            </Chip>
                    )}

                    {isOwnEvent && (
                            <Text variant="bodySmall" style={styles.cannotVoteText}>
                                Your event
                            </Text>
                    )}

                    {isUserSubmitter && !isOwnEvent && !hasUserVoted && (
                            <Text variant="bodySmall" style={styles.cannotVoteText}>
                                You created this event
                            </Text>
                    )}
                </View>
            )}
            </Card.Content>

            {/* Menu Dialog */}
            <Portal>
                <Dialog visible={showMenu} onDismiss={() => setShowMenu(false)}>
                    <Dialog.Title>Event Options</Dialog.Title>
                    <Dialog.Content>
                        <Button
                            mode="text"
                            textColor="#e74c3c"
                            onPress={() => {
                    setShowMenu(false);
                                handleDeleteClick();
                        }}
                        >
                            Delete Event
                        </Button>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setShowMenu(false)}>Cancel</Button>
                    </Dialog.Actions>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog visible={showDeleteConfirm} onDismiss={() => setShowDeleteConfirm(false)}>
                    <Dialog.Title>Delete Event</Dialog.Title>
                    <Dialog.Content>
                        <Text variant="bodyMedium">
                                Are you sure you want to delete this event? This action cannot be undone.
                            </Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setShowDeleteConfirm(false)}>Cancel</Button>
                        <Button
                            mode="contained"
                            buttonColor="#e74c3c"
                            onPress={handleDeleteConfirm}
                                >
                            Delete
                        </Button>
                    </Dialog.Actions>
                </Dialog>

                {/* Fullscreen Media Dialog */}
            {hasMedia && (
                    <Dialog
                    visible={showMediaModal}
                        onDismiss={() => setShowMediaModal(false)}
                        style={[styles.fullscreenDialog, { maxHeight: Dimensions.get('window').height }]}
                >
                        <Dialog.Actions style={styles.fullscreenDialogActions}>
                            <IconButton
                                icon="close"
                                size={24}
                                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                                onPress={() => setShowMediaModal(false)}
                                iconColor="#fff"
                            style={styles.fullscreenCloseButton}
                            />
                        </Dialog.Actions>
                        <Dialog.ScrollArea>
                        <ScrollView
                            contentContainerStyle={styles.fullscreenScrollContent}
                            maximumZoomScale={3}
                            minimumZoomScale={1}
                                keyboardShouldPersistTaps="handled"
                        >
                            {media.type === 'image' ? (
                                <Image
                                    source={{ uri: getMediaUri() }}
                                    style={styles.fullscreenImage}
                                    resizeMode="contain"
                                />
                            ) : (
                                <Video
                                    source={{ uri: getMediaUri() }}
                                    style={styles.fullscreenVideo}
                                    resizeMode="contain"
                                    useNativeControls
                                    shouldPlay
                                />
                            )}
                        </ScrollView>
                        </Dialog.ScrollArea>
                    </Dialog>
            )}
            </Portal>
        </Card>
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: 15,
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
    userName: {
        color: '#2c3e50',
        marginBottom: 4,
    },
    ruleDescription: {
        color: '#7f8c8d',
    },
    pointsChip: {
        height: 32,
        marginRight: 8,
    },
    pointsText: {
        fontSize: 14,
        fontWeight: '600',
    },
    submittedBy: {
        color: '#95a5a6',
        marginBottom: 8,
    },
    description: {
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
    statusChip: {
        height: 28,
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
        color: '#2c3e50',
        marginBottom: 8,
    },
    progressBar: {
        height: 8,
        borderRadius: 4,
        marginTop: 4,
    },
    vetoButton: {
        marginTop: 8,
    },
    votedBadge: {
        height: 32,
        backgroundColor: '#95a5a6',
        marginTop: 8,
    },
    votedText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    cannotVoteText: {
        textAlign: 'center',
        color: '#95a5a6',
        fontStyle: 'italic',
        marginTop: 8,
    },
    mediaContainer: {
        width: '100%',
        height: 200,
        marginBottom: 10,
        overflow: 'hidden',
    },
    mediaImage: {
        width: '100%',
        height: 200,
    },
    mediaVideo: {
        width: '100%',
        height: 200,
    },
    fullscreenDialog: {
        backgroundColor: '#000',
        margin: 0,
        maxHeight: '100%',
    },
    fullscreenDialogActions: {
        position: 'absolute',
        top: 0,
        right: 0,
        zIndex: 10,
        backgroundColor: 'transparent',
    },
    fullscreenCloseButton: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    fullscreenScrollContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: Dimensions.get('window').height * 0.8,
    },
    fullscreenImage: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height * 0.8,
    },
    fullscreenVideo: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height * 0.7,
    },
});

export default EventCard;
