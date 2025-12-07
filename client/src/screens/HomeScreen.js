import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Alert,
  RefreshControl,
  FlatList
} from 'react-native';
import { Text, Button, Card, FAB, ActivityIndicator, Surface, Chip } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { groupService } from '../services/groupService';
import CreateGroupModal from '../components/CreateGroupModal';
import JoinGroupModal from '../components/JoinGroupModal';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Helper functions for cross-platform storage
const getItemAsync = async (key) => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  } else {
    return await SecureStore.getItemAsync(key);
  }
};

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const createModalRef = useRef(null);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const token = await getItemAsync('authToken');
      if (token) {
        const response = await groupService.getUserGroups(token);
        setGroups(response.groups || []);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      Alert.alert('Error', 'Failed to load groups');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchGroups();
  };

  const handleCreateGroup = () => {
    setShowCreateModal(true);
  };

  const handleCreateSuccess = async (groupData) => {
    try {
      const token = await getItemAsync('authToken');
      if (token) {
        const response = await groupService.createGroup(token, groupData);

        // Return the join code to show in the modal's success screen
        return {
          joinCode: response.group.joinCode,
          groupName: response.group.name
        };
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create group');
      throw error;
    }
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    fetchGroups(); // Refresh the groups list when modal closes
  };

  const handleJoinSuccess = async (joinCode) => {
    try {
      const token = await getItemAsync('authToken');
      if (token) {
        const response = await groupService.joinGroup(joinCode, token);

        // Close modal immediately on success
        setShowJoinModal(false);
        
        // Refresh groups list
        fetchGroups();
        
        // Show simple success notification
        Alert.alert('Success!', 'Game joined successfully!');
      }
    } catch (error) {
      // Error message is already extracted and formatted by groupService
      // Re-throw error so modal can display it and stay open
      throw error;
    }
  };

  const handleGroupPress = (group) => {
    navigation.navigate('GroupTabs', { groupId: group._id });
  };

  const handleLogout = () => {
    console.log('Logout button pressed');
    console.log('Calling logout function directly');
    logout();
  };

  const renderGroupCard = ({ item: group }) => (
    <Card
      style={styles.groupCard}
      mode="elevated"
      elevation={2}
      onPress={() => handleGroupPress(group)}
    >
      <Card.Content>
      <View style={styles.groupHeader}>
          <Text variant="titleLarge" style={styles.groupName}>{group.name}</Text>
          <Chip style={styles.memberCount} textStyle={styles.memberCountText}>
            {group.memberCount} members
          </Chip>
      </View>
      {group.description && (
          <Text variant="bodyMedium" style={styles.groupDescription}>{group.description}</Text>
      )}
      <View style={styles.groupFooter}>
          <Text variant="titleMedium" style={styles.userPoints}>
            Your score: {group.userPoints} pts
          </Text>
      </View>
      </Card.Content>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text variant="headlineLarge" style={styles.emptyTitle}>No groups yet!</Text>
      <Text variant="bodyLarge" style={styles.emptySubtitle}>
        Create one to get started with your friends
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Surface style={styles.header} elevation={1}>
          <Text variant="headlineLarge" style={styles.title}>My Groups</Text>
          <Button mode="contained" onPress={handleLogout} buttonColor="#e74c3c" compact>
            Logout
          </Button>
        </Surface>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text variant="bodyLarge" style={styles.loadingText}>Loading groups...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Surface style={styles.header} elevation={1}>
        <Text variant="headlineLarge" style={styles.title}>My Groups</Text>
        <View style={styles.headerButtons}>
          <Button
            mode="contained"
            onPress={() => setShowJoinModal(true)}
            style={styles.joinButton}
            compact
          >
            Join
          </Button>
          <Button
            mode="contained"
            onPress={handleLogout}
            buttonColor="#e74c3c"
            style={styles.logoutButton}
            compact
          >
            Logout
          </Button>
        </View>
      </Surface>

      <View style={styles.content}>
        {groups.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={groups}
            renderItem={renderGroupCard}
            keyExtractor={(item) => item._id}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={['#4285f4']}
                tintColor="#4285f4"
              />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            removeClippedSubviews={true}
          />
        )}
      </View>

      <FAB
        icon="plus"
        style={[styles.fab, { bottom: insets.bottom + 16 }]}
        onPress={handleCreateGroup}
        label="Create"
      />

      <CreateGroupModal
        ref={createModalRef}
        visible={showCreateModal}
        onClose={handleModalClose}
        onCreateSuccess={handleCreateSuccess}
      />

      <JoinGroupModal
        visible={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onJoinSuccess={handleJoinSuccess}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
  },
  title: {
    color: '#2c3e50',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  joinButton: {
    marginHorizontal: 0,
  },
  logoutButton: {
    marginHorizontal: 0,
  },
  content: {
    flex: 1,
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
  listContainer: {
    padding: 20,
  },
  groupCard: {
    marginBottom: 15,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  groupName: {
    color: '#2c3e50',
    flex: 1,
    marginRight: 10,
  },
  memberCount: {
    backgroundColor: '#f8f9fa',
    height: 28,
  },
  memberCountText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  groupDescription: {
    color: '#7f8c8d',
    marginBottom: 12,
    lineHeight: 22,
  },
  groupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  userPoints: {
    color: '#4285f4',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: '#2c3e50',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
  },
});
