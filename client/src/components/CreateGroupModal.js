import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    Alert,
    Clipboard,
    KeyboardAvoidingView,
    Platform,
    Dimensions
} from 'react-native';
import { Dialog, TextInput, Button, Text, Card, Chip, IconButton, Portal } from 'react-native-paper';
import RuleInput from './RuleInput';

const screenHeight = Dimensions.get('window').height;

export default function CreateGroupModal({ visible, onClose, onCreateSuccess, editMode = false, initialData = null, onUpdateSuccess = null, groupId = null }) {
    const [groupName, setGroupName] = useState('');
    const [description, setDescription] = useState('');
    const [rules, setRules] = useState([]);
    const [showRuleInput, setShowRuleInput] = useState(false);
    const [editingRuleIndex, setEditingRuleIndex] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [rulesError, setRulesError] = useState(null);

    // Populate form when in edit mode
    useEffect(() => {
        if (visible && editMode && initialData) {
            setGroupName(initialData.name || '');
            setDescription(initialData.description || '');
            // Convert rules from server format to form format
            const formattedRules = (initialData.rules || []).map(rule => ({
                description: rule.description,
                points: rule.points,
                vetoThreshold: rule.vetoThreshold
            }));
            setRules(formattedRules);
        } else if (visible && !editMode) {
            // Reset form when opening in create mode
            setGroupName('');
            setDescription('');
            setRules([]);
            setRulesError(null);
        }
        // Reset editing state when modal opens/closes
        setEditingRuleIndex(null);
        setShowRuleInput(false);
        setRulesError(null);
    }, [visible, editMode, initialData]);

    const handleAddRule = (rule) => {
        if (editingRuleIndex !== null) {
            // Editing existing rule
            const newRules = [...rules];
            newRules[editingRuleIndex] = rule;
            setRules(newRules);
            setEditingRuleIndex(null);

            // Show success message for rule update
            Alert.alert('Success', 'Rule updated successfully');
        } else {
            // Adding new rule
            if (rules.length >= 20) {
                Alert.alert('Maximum Reached', 'You can only add up to 20 rules');
                return;
            }
            setRules([...rules, rule]);
        }
        setShowRuleInput(false);
        setRulesError(null);
    };

    const handleEditRule = (index) => {
        setEditingRuleIndex(index);
        setShowRuleInput(true);
        setRulesError(null);
    };

    const handleRemoveRule = (index) => {
        const newRules = rules.filter((_, i) => i !== index);
        setRules(newRules);
    };

    const handleCancelRuleInput = () => {
        setShowRuleInput(false);
        setEditingRuleIndex(null);
    };

    const handleCreate = async () => {
        // Validation
        if (!groupName.trim()) {
            Alert.alert('Error', 'Group name is required');
            return;
        }

        if (groupName.trim().length < 3 || groupName.trim().length > 50) {
            Alert.alert('Error', 'Group name must be between 3 and 50 characters');
            return;
        }

        if (description.length > 200) {
            Alert.alert('Error', 'Description must be less than 200 characters');
            return;
        }

        if (rules.length === 0) {
            setRulesError('At least one rule is required');
            Alert.alert('Error', 'At least one rule is required');
            return;
        }

        const groupData = {
            name: groupName.trim(),
            description: description.trim(),
            rules: rules
        };

        setIsLoading(true);

        try {
            if (editMode && onUpdateSuccess) {
                // Edit mode: call update handler
                await onUpdateSuccess(groupId, groupData);
                // Don't show success modal for edit, just close
                handleCancel();
            } else {
                // Create mode: call create handler
                const result = await onCreateSuccess(groupData);
                // Show success modal with join code
                if (result && result.joinCode) {
                    setJoinCode(result.joinCode);
                    setShowSuccessModal(true);
                }
            }
        } catch (error) {
            // Error handling is done in the parent
        } finally {
            setIsLoading(false);
        }
    };

    const handleShowSuccess = (code) => {
        setJoinCode(code);
        setShowSuccessModal(true);
    };

    const handleSuccessClose = () => {
        setShowSuccessModal(false);
        setJoinCode('');
        // Reset form
        setGroupName('');
        setDescription('');
        setRules([]);
        setShowRuleInput(false);
        setRulesError(null);
        // Call onClose to trigger refresh in parent
        onClose();
    };

    const handleCopyCode = () => {
        Clipboard.setString(joinCode);
        Alert.alert('Copied!', 'Join code copied to clipboard');
    };

    const handleCancel = () => {
        // Reset form
        setGroupName('');
        setDescription('');
        setRules([]);
        setShowRuleInput(false);
        setRulesError(null);
        onClose();
    };

    return (
        <Portal>
            <Dialog visible={visible} onDismiss={handleCancel} style={[styles.dialog, { maxHeight: screenHeight * 0.9 }]}>
                <Dialog.Title>{editMode ? 'Edit Group' : 'Create New Group'}</Dialog.Title>
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
                                <TextInput
                                    label="Group Name *"
                                    value={groupName}
                                    onChangeText={setGroupName}
                                    mode="outlined"
                                    maxLength={50}
                                    disabled={isLoading}
                                    style={styles.input}
                                    returnKeyType="next"
                                    blurOnSubmit={false}
                                    textContentType="none"
                                />

                                <View style={styles.multilineContainer}>
                                    <TextInput
                                        label="Description (Optional)"
                                        value={description}
                                        onChangeText={setDescription}
                                        mode="outlined"
                                        maxLength={200}
                                        disabled={isLoading}
                                        style={styles.input}
                                        returnKeyType="done"
                                        textContentType="none"
                                    />
                                </View>

                            <View style={styles.rulesSection}>
                                <View style={styles.rulesSectionHeader}>
                                    <Text variant="titleMedium">Rules * (Minimum 1)</Text>
                                    <Chip style={styles.ruleCountChip} textStyle={styles.ruleCountText}>
                                        {rules.length}/20
                                    </Chip>
                                </View>

                                {rules.map((rule, index) => (
                                    <Card key={index} style={styles.ruleCard} mode="outlined">
                                        <Card.Content>
                                            <View style={styles.ruleContent}>
                                                <Text variant="bodyMedium" style={styles.ruleDescription}>
                                                    {rule.description}
                                                </Text>
                                                <View style={styles.ruleDetails}>
                                                    <Chip style={styles.rulePointsChip} textStyle={styles.rulePointsText}>
                                                        {rule.points > 0 ? '+' : ''}{rule.points} pts
                                                    </Chip>
                                                    <Chip style={styles.ruleVetoChip} textStyle={styles.ruleVetoText}>
                                                        Veto: {rule.vetoThreshold}
                                                    </Chip>
                                                </View>
                                            </View>
                                            <View style={styles.ruleActions}>
                                                <Button
                                                    mode="outlined"
                                                    onPress={() => handleEditRule(index)}
                                                    disabled={isLoading}
                                                    compact
                                                    style={styles.editButton}
                                                >
                                                    Edit
                                                </Button>
                                                <IconButton
                                                    icon="close"
                                                    size={20}
                                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                                    onPress={() => handleRemoveRule(index)}
                                                    disabled={isLoading}
                                                    iconColor="#e74c3c"
                                                />
                                            </View>
                                        </Card.Content>
                                    </Card>
                                ))}

                                <Button
                                    mode="outlined"
                                    onPress={() => {
                                        setShowRuleInput(true);
                                        setRulesError(null);
                                    }}
                                    disabled={isLoading || rules.length >= 20}
                                    style={styles.addRuleButton}
                                    icon="plus"
                                >
                                    Add Rule
                                </Button>

                                {rulesError && (
                                    <Text variant="bodySmall" style={styles.errorText}>{rulesError}</Text>
                                )}
                            </View>
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
                            <TextInput
                                label="Group Name *"
                                value={groupName}
                                onChangeText={setGroupName}
                                mode="outlined"
                                maxLength={50}
                                disabled={isLoading}
                                style={styles.input}
                                returnKeyType="next"
                                blurOnSubmit={false}
                                textContentType="none"
                            />

                            <View style={styles.multilineContainer}>
                                <TextInput
                                    label="Description (Optional)"
                                    value={description}
                                    onChangeText={setDescription}
                                    mode="outlined"
                                    maxLength={200}
                                    disabled={isLoading}
                                    style={styles.input}
                                    returnKeyType="done"
                                    textContentType="none"
                                />
                            </View>

                            <View style={styles.rulesSection}>
                                <View style={styles.rulesSectionHeader}>
                                    <Text variant="titleMedium">Rules * (Minimum 1)</Text>
                                    <Chip style={styles.ruleCountChip} textStyle={styles.ruleCountText}>
                                        {rules.length}/20
                                    </Chip>
                                </View>

                                {rules.map((rule, index) => (
                                    <Card key={index} style={styles.ruleCard} mode="outlined">
                                        <Card.Content>
                                            <View style={styles.ruleContent}>
                                                <Text variant="bodyMedium" style={styles.ruleDescription}>
                                                    {rule.description}
                                                </Text>
                                                <View style={styles.ruleDetails}>
                                                    <Chip style={styles.rulePointsChip} textStyle={styles.rulePointsText}>
                                                        {rule.points > 0 ? '+' : ''}{rule.points} pts
                                                    </Chip>
                                                    <Chip style={styles.ruleVetoChip} textStyle={styles.ruleVetoText}>
                                                        Veto: {rule.vetoThreshold}
                                                    </Chip>
                                                </View>
                                            </View>
                                            <View style={styles.ruleActions}>
                                                <Button
                                                    mode="outlined"
                                                    onPress={() => handleEditRule(index)}
                                                    disabled={isLoading}
                                                    compact
                                                    style={styles.editButton}
                                                >
                                                    Edit
                                                </Button>
                                                <IconButton
                                                    icon="close"
                                                    size={20}
                                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                                    onPress={() => handleRemoveRule(index)}
                                                    disabled={isLoading}
                                                    iconColor="#e74c3c"
                                                />
                                            </View>
                                        </Card.Content>
                                    </Card>
                                ))}

                                <Button
                                    mode="outlined"
                                    onPress={() => {
                                        setShowRuleInput(true);
                                        setRulesError(null);
                                    }}
                                    disabled={isLoading || rules.length >= 20}
                                    style={styles.addRuleButton}
                                    icon="plus"
                                >
                                    Add Rule
                                </Button>

                                {rulesError && (
                                    <Text variant="bodySmall" style={styles.errorText}>{rulesError}</Text>
                                )}
                            </View>
                        </ScrollView>
                    </Dialog.Content>
                )}
                <Dialog.Actions style={styles.dialogActions}>
                    <Button onPress={handleCancel} disabled={isLoading} style={styles.actionButton}>Cancel</Button>
                    <Button
                        mode="contained"
                        onPress={handleCreate}
                        disabled={isLoading}
                        loading={isLoading}
                        style={styles.actionButton}
                    >
                        {editMode ? 'Update Group' : 'Create Group'}
                    </Button>
                </Dialog.Actions>
            </Dialog>

            {/* Rule editor dialog */}
            <Dialog
                visible={showRuleInput}
                onDismiss={handleCancelRuleInput}
            >
                <Dialog.Title>{editingRuleIndex !== null ? 'Edit Rule' : 'Add Rule'}</Dialog.Title>
                <Dialog.Content>
                    <RuleInput
                        onAddRule={handleAddRule}
                        onCancel={handleCancelRuleInput}
                        initialRule={editingRuleIndex !== null ? rules[editingRuleIndex] : null}
                    />
                </Dialog.Content>
            </Dialog>

            {/* Success Dialog */}
            <Dialog visible={showSuccessModal} onDismiss={handleSuccessClose}>
                <Dialog.Title>🎉 Group Created!</Dialog.Title>
                <Dialog.Content>
                    <Text variant="bodyMedium" style={styles.successMessage}>
                        Share this code with friends to let them join:
                    </Text>
                    <Card style={styles.codeContainer} mode="outlined">
                        <Card.Content>
                            <Text variant="displaySmall" style={styles.joinCodeText}>{joinCode}</Text>
                        </Card.Content>
                    </Card>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button onPress={handleCopyCode}>Copy Code</Button>
                    <Button mode="contained" onPress={handleSuccessClose}>Done</Button>
                </Dialog.Actions>
            </Dialog>
        </Portal>
    );
}

// Expose method to show success from parent
CreateGroupModal.showSuccess = function (modalRef, code) {
    if (modalRef && modalRef.current) {
        modalRef.current.handleShowSuccess(code);
    }
};

const styles = StyleSheet.create({
    dialog: {
        maxHeight: '90%',
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
    rulesSection: {
        marginTop: 15,
    },
    rulesSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    ruleCountChip: {
        height: 28,
        backgroundColor: '#f8f9fa',
    },
    ruleCountText: {
        fontSize: 12,
        color: '#7f8c8d',
    },
    ruleCard: {
        marginTop: 10,
        marginBottom: 8,
    },
    ruleContent: {
        marginBottom: 8,
    },
    ruleDescription: {
        color: '#2c3e50',
        marginBottom: 8,
    },
    ruleDetails: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    rulePointsChip: {
        height: 28,
        backgroundColor: '#E3F2FD',
    },
    rulePointsText: {
        fontSize: 12,
        color: '#4285f4',
        fontWeight: '600',
    },
    ruleVetoChip: {
        height: 28,
        backgroundColor: '#f8f9fa',
    },
    ruleVetoText: {
        fontSize: 12,
        color: '#7f8c8d',
    },
    ruleActions: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 8,
    },
    editButton: {
        marginRight: 8,
    },
    addRuleButton: {
        marginTop: 10,
    },
    errorText: {
        color: '#e74c3c',
        marginTop: 8,
    },
    successMessage: {
        textAlign: 'center',
        marginBottom: 20,
        color: '#7f8c8d',
    },
    codeContainer: {
        marginTop: 10,
        marginBottom: 10,
        alignItems: 'center',
    },
    joinCodeText: {
        color: '#4285f4',
        letterSpacing: 5,
        textAlign: 'center',
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
