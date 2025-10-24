import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert
} from 'react-native';

export default function RuleInput({ onAddRule, onCancel }) {
    const [description, setDescription] = useState('');
    const [points, setPoints] = useState('');
    const [vetoThreshold, setVetoThreshold] = useState('0');

    const handleAdd = () => {
        // Validation
        if (!description.trim()) {
            Alert.alert('Error', 'Rule description is required');
            return;
        }

        if (description.trim().length < 3 || description.trim().length > 100) {
            Alert.alert('Error', 'Rule description must be between 3 and 100 characters');
            return;
        }

        if (!points || points.trim() === '') {
            Alert.alert('Error', 'Points value is required');
            return;
        }

        const pointsNum = parseInt(points, 10);
        if (isNaN(pointsNum) || pointsNum < -1000 || pointsNum > 1000) {
            Alert.alert('Error', 'Points must be between -1000 and 1000');
            return;
        }

        const vetoNum = parseInt(vetoThreshold, 10);
        if (isNaN(vetoNum) || vetoNum < 0 || vetoNum > 100) {
            Alert.alert('Error', 'Veto threshold must be between 0 and 100');
            return;
        }

        // Create rule object
        const rule = {
            description: description.trim(),
            points: pointsNum,
            vetoThreshold: vetoNum
        };

        onAddRule(rule);

        // Reset form
        setDescription('');
        setPoints('');
        setVetoThreshold('0');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Rule Description *</Text>
            <TextInput
                style={styles.input}
                placeholder="e.g., Complete a workout"
                value={description}
                onChangeText={setDescription}
                maxLength={100}
            />

            <Text style={styles.label}>Points *</Text>
            <TextInput
                style={styles.input}
                placeholder="e.g., 10 or -5"
                value={points}
                onChangeText={setPoints}
                keyboardType="numeric"
            />
            <Text style={styles.hint}>Can be negative for penalties</Text>

            <Text style={styles.label}>Veto Threshold *</Text>
            <TextInput
                style={styles.input}
                placeholder="0"
                value={vetoThreshold}
                onChangeText={setVetoThreshold}
                keyboardType="numeric"
            />
            <Text style={styles.hint}>Number of votes needed to veto</Text>

            <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
                    <Text style={styles.addButtonText}>Add Rule</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 15,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 5,
        marginTop: 10,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e1e8ed',
        borderRadius: 6,
        padding: 12,
        fontSize: 16,
        color: '#2c3e50',
    },
    hint: {
        fontSize: 12,
        color: '#7f8c8d',
        marginTop: 4,
        marginBottom: 5,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 15,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#e1e8ed',
        paddingVertical: 12,
        borderRadius: 6,
        marginRight: 10,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#7f8c8d',
        fontSize: 16,
        fontWeight: '600',
    },
    addButton: {
        flex: 1,
        backgroundColor: '#4285f4',
        paddingVertical: 12,
        borderRadius: 6,
        alignItems: 'center',
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
