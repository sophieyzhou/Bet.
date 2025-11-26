import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Modal,
    ScrollView,
    Alert,
    ActivityIndicator,
    Image
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { Video } from 'expo-av';

export default function SubmitEventModal({ visible, onClose, members, rules, onSubmit }) {
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedRuleId, setSelectedRuleId] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [media, setMedia] = useState(null); // {uri, type, mimeType}

    const pickMedia = async () => {
        try {
            // Request permissions
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Please grant permission to access your media library');
                return;
            }

            // Launch image picker
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.All,
                allowsEditing: true,
                quality: 0.8,
                videoMaxDuration: 60, // 60 seconds max for videos
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
            Alert.alert('Error', 'Failed to select media');
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
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={handleCancel}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Text style={styles.modalTitle}>Submit Event</Text>

                        {/* Select Member */}
                        <Text style={styles.label}>Submit for: *</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={selectedUserId}
                                onValueChange={(value) => setSelectedUserId(value)}
                                enabled={!isLoading}
                                style={styles.picker}
                            >
                                <Picker.Item label="Select a member..." value="" />
                                {members.map((member) => (
                                    <Picker.Item
                                        key={member.userId}
                                        label={member.name}
                                        value={member.userId}
                                    />
                                ))}
                            </Picker>
                        </View>

                        {/* Select Rule */}
                        <Text style={styles.label}>Rule: *</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={selectedRuleId}
                                onValueChange={(value) => setSelectedRuleId(value)}
                                enabled={!isLoading}
                                style={styles.picker}
                            >
                                <Picker.Item label="Select a rule..." value="" />
                                {rules.map((rule) => (
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
                            <View style={styles.ruleInfo}>
                                <Text style={styles.ruleInfoText}>
                                    Points: {getSelectedRule().points > 0 ? '+' : ''}{getSelectedRule().points}
                                </Text>
                                <Text style={styles.ruleInfoText}>
                                    Veto Threshold: {getSelectedRule().vetoThreshold} votes
                                </Text>
                            </View>
                        )}

                        {/* Description/Notes */}
                        <Text style={styles.label}>Notes (Optional)</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Add any additional details..."
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={4}
                            editable={!isLoading}
                        />

                        {/* Media Upload */}
                        <Text style={styles.label}>Add Photo/Video Evidence (Optional)</Text>
                        {!media ? (
                            <TouchableOpacity
                                style={styles.mediaButton}
                                onPress={pickMedia}
                                disabled={isLoading}
                            >
                                <Text style={styles.mediaButtonText}>📷 Select Image or Video</Text>
                            </TouchableOpacity>
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
                                <TouchableOpacity
                                    style={styles.removeMediaButton}
                                    onPress={removeMedia}
                                    disabled={isLoading}
                                >
                                    <Text style={styles.removeMediaText}>✕ Remove</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Buttons */}
                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={handleCancel}
                                disabled={isLoading}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.submitButton, isLoading && styles.disabledButton]}
                                onPress={handleSubmit}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.submitButtonText}>Submit Event</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        width: '100%',
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 20,
        textAlign: 'center',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 8,
        marginTop: 10,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#e1e8ed',
        borderRadius: 8,
        backgroundColor: '#fff',
        marginBottom: 10,
    },
    picker: {
        height: 50,
    },
    ruleInfo: {
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
    },
    ruleInfoText: {
        fontSize: 14,
        color: '#2c3e50',
        marginBottom: 4,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e1e8ed',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#2c3e50',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        gap: 10,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#e1e8ed',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#7f8c8d',
        fontSize: 16,
        fontWeight: '600',
    },
    submitButton: {
        flex: 1,
        backgroundColor: '#4285f4',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    disabledButton: {
        opacity: 0.6,
    },
    mediaButton: {
        backgroundColor: '#e8f4f8',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#4285f4',
        borderStyle: 'dashed',
        marginBottom: 10,
    },
    mediaButtonText: {
        color: '#4285f4',
        fontSize: 16,
        fontWeight: '600',
    },
    mediaPreviewContainer: {
        marginBottom: 10,
    },
    mediaPreview: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        backgroundColor: '#f8f9fa',
    },
    removeMediaButton: {
        marginTop: 10,
        backgroundColor: '#e74c3c',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    removeMediaText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});
