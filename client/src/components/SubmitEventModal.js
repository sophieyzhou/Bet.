import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    Dimensions
} from 'react-native';
import { Dialog, TextInput, Button, Text, Portal, Menu, Card } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { Video } from 'expo-av';

const screenHeight = Dimensions.get('window').height;

export default function SubmitEventModal({ visible, onClose, members, rules, onSubmit }) {
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedRuleId, setSelectedRuleId] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [media, setMedia] = useState(null); // {uri, type, mimeType}
    const [showMemberMenu, setShowMemberMenu] = useState(false);
    const [showRuleMenu, setShowRuleMenu] = useState(false);

    const pickMedia = async () => {
        try {
            setIsLoading(true);
            
            // Request permissions
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Please grant permission to access your media library');
                setIsLoading(false);
                return;
            }

            // Launch image picker - allow both images and videos
            // Note: For Expo SDK 49, using MediaTypeOptions.All as workaround
            // Array format ['images', 'videos'] causes iOS casting errors
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.All,
                allowsEditing: true,
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                setMedia({
                    uri: asset.uri,
                    type: asset.type, // 'image' or 'video'
                    mimeType: asset.mimeType || (asset.type === 'video' ? 'video/mp4' : 'image/jpeg')
                });
            }
        } catch (error) {
            console.error('Error picking media:', error);
            const errorMessage = error?.message || 'Failed to select media. Please try again.';
            Alert.alert('Error', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const removeMedia = () => {
        setMedia(null);
    };

    const handleSubmit = async () => {
        // Validation
        if (!selectedUserId) {
            Alert.alert('Error', 'Please select a member');
            return;
        }

        if (!selectedRuleId) {
            Alert.alert('Error', 'Please select a rule');
            return;
        }

        setIsLoading(true);

        try {
            await onSubmit({
                userId: selectedUserId,
                ruleId: selectedRuleId,
                description: description.trim(),
                media: media
            });

            // Reset form
            setSelectedUserId('');
            setSelectedRuleId('');
            setDescription('');
            setMedia(null);

            onClose();
        } catch (error) {
            // Error handled in parent
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        // Reset form
        setSelectedUserId('');
        setSelectedRuleId('');
        setDescription('');
        setMedia(null);
        onClose();
    };

    const getSelectedRule = () => {
        return rules.find(r => r._id === selectedRuleId);
    };

    return (
        <Portal>
            <Dialog visible={visible} onDismiss={handleCancel} style={[styles.dialog, { maxHeight: screenHeight * 0.9 }]}>
                <Dialog.Title>Submit Event</Dialog.Title>
                {Platform.OS !== 'web' ? (
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                        style={styles.keyboardView}
                    >
                        <Dialog.ScrollArea style={styles.scrollArea}>
                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                showsHorizontalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                                keyboardDismissMode="on-drag"
                                contentContainerStyle={styles.scrollContent}
                                bounces={false}
                            >
                        {/* Select Member */}
                            <Text variant="titleMedium" style={styles.label}>Submit for: *</Text>
                        <Menu
                            visible={showMemberMenu}
                            onDismiss={() => setShowMemberMenu(false)}
                            anchor={
                                <Button
                                    mode="outlined"
                                    onPress={() => setShowMemberMenu(true)}
                                    disabled={isLoading}
                                    style={styles.menuButton}
                                    contentStyle={styles.menuButtonContent}
                                    textColor="#2c3e50"
                                >
                                    {selectedUserId ? (members.find(m => m.userId === selectedUserId)?.name || 'Select a member...') : 'Select a member...'}
                                </Button>
                            }
                        >
                            {members && members.map(member => (
                                <Menu.Item
                                    key={member.userId}
                                    title={member.name}
                                    onPress={() => {
                                        setSelectedUserId(member.userId);
                                        setShowMemberMenu(false);
                                    }}
                                />
                            ))}
                        </Menu>

                        {/* Select Rule */}
                            <Text variant="titleMedium" style={styles.label}>Rule: *</Text>
                        <Menu
                            visible={showRuleMenu}
                            onDismiss={() => setShowRuleMenu(false)}
                            anchor={
                                <Button
                                    mode="outlined"
                                    onPress={() => setShowRuleMenu(true)}
                                    disabled={isLoading}
                                    style={styles.menuButton}
                                    contentStyle={styles.menuButtonContent}
                                    textColor="#2c3e50"
                                >
                                    {selectedRuleId ? (rules.find(r => r._id === selectedRuleId)?.description || 'Select a rule...') : 'Select a rule...'}
                                </Button>
                            }
                        >
                            {rules && rules.map(rule => (
                                <Menu.Item
                                    key={rule._id}
                                    title={`${rule.description} (${rule.points > 0 ? '+' : ''}${rule.points} pts)`}
                                    onPress={() => {
                                        setSelectedRuleId(rule._id);
                                        setShowRuleMenu(false);
                                    }}
                                />
                            ))}
                        </Menu>

                        {/* Show selected rule details */}
                        {getSelectedRule() && (
                                <Card style={styles.ruleInfo} mode="outlined">
                                    <Card.Content>
                                        <Text variant="bodyMedium" style={styles.ruleInfoText}>
                                    Points: {getSelectedRule().points > 0 ? '+' : ''}{getSelectedRule().points}
                                </Text>
                                        <Text variant="bodyMedium" style={styles.ruleInfoText}>
                                    Veto Threshold: {getSelectedRule().vetoThreshold} votes
                                </Text>
                                    </Card.Content>
                                </Card>
                        )}

                        {/* Description/Notes */}
                        <View style={styles.multilineContainer}>
                            <TextInput
                                label="Notes (Optional)"
                                value={description}
                                onChangeText={setDescription}
                                mode="outlined"
                                disabled={isLoading}
                                style={styles.input}
                                returnKeyType="done"
                                textContentType="none"
                            />
                        </View>

                        {/* Media Upload */}
                            <Text variant="titleMedium" style={styles.label}>
                                Add Photo/Video Evidence (Optional)
                            </Text>
                        {!media ? (
                                <Button
                                    mode="outlined"
                                onPress={pickMedia}
                                disabled={isLoading}
                                    icon="camera"
                                    style={styles.mediaButton}
                            >
                                    Select Image or Video
                                </Button>
                        ) : (
                            <View style={styles.mediaPreviewContainer}>
                                {media.type === 'image' ? (
                                    <Image
                                        source={{ uri: media.uri }}
                                        style={styles.mediaPreview}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <Video
                                        source={{ uri: media.uri }}
                                        style={styles.mediaPreview}
                                        useNativeControls
                                        resizeMode="contain"
                                    />
                                )}
                                    <Button
                                        mode="contained"
                                        buttonColor="#e74c3c"
                                    onPress={removeMedia}
                                    disabled={isLoading}
                                        style={styles.removeMediaButton}
                                >
                                        Remove
                                    </Button>
                            </View>
                        )}
                            </ScrollView>
                        </Dialog.ScrollArea>
                    </KeyboardAvoidingView>
                ) : (
                    <Dialog.Content style={styles.dialogContent}>
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            showsHorizontalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            keyboardDismissMode="on-drag"
                            style={styles.scrollView}
                            contentContainerStyle={styles.scrollContent}
                            bounces={false}
                        >
                            {/* Select Member */}
                            <Text variant="titleMedium" style={styles.label}>Submit for: *</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={selectedUserId}
                                    onValueChange={(value) => setSelectedUserId(value)}
                                    enabled={!isLoading}
                                    style={styles.picker}
                                    itemStyle={Platform.OS === 'ios' ? styles.pickerItem : undefined}
                                >
                                    <Picker.Item label="Select a member..." value="" />
                                    {members && members.map((member) => (
                                        <Picker.Item
                                            key={member.userId}
                                            label={member.name}
                                            value={member.userId}
                                        />
                                    ))}
                                </Picker>
                            </View>

                            {/* Select Rule */}
                            <Text variant="titleMedium" style={styles.label}>Rule: *</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={selectedRuleId}
                                    onValueChange={(value) => setSelectedRuleId(value)}
                                    enabled={!isLoading}
                                    style={styles.picker}
                                    itemStyle={Platform.OS === 'ios' ? styles.pickerItem : undefined}
                                >
                                    <Picker.Item label="Select a rule..." value="" />
                                    {rules && rules.map((rule) => (
                                        <Picker.Item
                                            key={rule._id}
                                            label={`${rule.description} (${rule.points > 0 ? '+' : ''}${rule.points} pts)`}
                                            value={rule._id}
                                        />
                                    ))}
                                </Picker>
                            </View>

                            {/* Show selected rule details */}
                            {getSelectedRule() && (
                                <Card style={styles.ruleInfo} mode="outlined">
                                    <Card.Content>
                                        <Text variant="bodyMedium" style={styles.ruleInfoText}>
                                            Points: {getSelectedRule().points > 0 ? '+' : ''}{getSelectedRule().points}
                                        </Text>
                                        <Text variant="bodyMedium" style={styles.ruleInfoText}>
                                            Veto Threshold: {getSelectedRule().vetoThreshold} votes
                                        </Text>
                                    </Card.Content>
                                </Card>
                            )}

                            {/* Description/Notes */}
                            <View style={styles.multilineContainer}>
                                <TextInput
                                    label="Notes (Optional)"
                                    value={description}
                                    onChangeText={setDescription}
                                    mode="outlined"
                                    disabled={isLoading}
                                    style={styles.input}
                                    returnKeyType="done"
                                    textContentType="none"
                                />
                            </View>

                            {/* Media Upload */}
                            <Text variant="titleMedium" style={styles.label}>
                                Add Photo/Video Evidence (Optional)
                            </Text>
                            {!media ? (
                                <Button
                                    mode="outlined"
                                    onPress={pickMedia}
                                    disabled={isLoading}
                                    icon="camera"
                                    style={styles.mediaButton}
                                >
                                    Select Image or Video
                                </Button>
                            ) : (
                                <View style={styles.mediaPreviewContainer}>
                                    {media.type === 'image' ? (
                                        <Image
                                            source={{ uri: media.uri }}
                                            style={styles.mediaPreview}
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <Video
                                            source={{ uri: media.uri }}
                                            style={styles.mediaPreview}
                                            useNativeControls
                                            resizeMode="contain"
                                        />
                                    )}
                                    <Button
                                        mode="contained"
                                        buttonColor="#e74c3c"
                                        onPress={removeMedia}
                                        disabled={isLoading}
                                        style={styles.removeMediaButton}
                                    >
                                        Remove
                                    </Button>
                                </View>
                            )}
                        </ScrollView>
                    </Dialog.Content>
                )}
                <Dialog.Actions style={styles.dialogActions}>
                    <Button onPress={handleCancel} disabled={isLoading} style={styles.actionButton}>Cancel</Button>
                    <Button
                        mode="contained"
                                onPress={handleSubmit}
                                disabled={isLoading}
                        loading={isLoading}
                        style={styles.actionButton}
                    >
                        Submit Event
                    </Button>
                </Dialog.Actions>
            </Dialog>
        </Portal>
    );
}

const styles = StyleSheet.create({
    dialog: {
        maxHeight: '80%',
    },
    keyboardView: {
        flexShrink: 1,
    },
    scrollArea: {
        maxHeight: screenHeight * 0.6,
    },
    dialogContent: {
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    scrollView: {
        flexGrow: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingVertical: 16,
        width: '100%',
    },
    label: {
        color: '#2c3e50',
        marginBottom: 8,
        marginTop: 10,
    },
    menuButton: {
        marginBottom: 12,
        borderColor: '#e1e8ed',
        backgroundColor: '#fff',
    },
    menuButtonContent: {
        justifyContent: 'flex-start',
    },
    ruleInfo: {
        marginBottom: 12,
        backgroundColor: '#f8f9fa',
    },
    ruleInfoText: {
        color: '#2c3e50',
        marginBottom: 4,
    },
    input: {
        marginBottom: 12,
    },
    multilineContainer: {
        width: '100%',
        alignSelf: 'stretch',
    },
    multilineContent: {
        minHeight: 80,
        paddingVertical: 8,
        textAlignVertical: 'top',
    },
    mediaButton: {
        marginTop: 8,
        marginBottom: 12,
    },
    mediaPreviewContainer: {
        marginBottom: 12,
    },
    mediaPreview: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        backgroundColor: '#f8f9fa',
        marginBottom: 8,
    },
    removeMediaButton: {
        marginTop: 8,
    },
    dialogActions: {
        paddingHorizontal: 8,
        paddingVertical: 8,
    },
    actionButton: {
        marginHorizontal: 4,
        flex: 1,
    },
});
