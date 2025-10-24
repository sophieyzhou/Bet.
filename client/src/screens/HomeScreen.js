import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  FlatList
} from 'react-native';
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

        // Show success message
        Alert.alert(
          'Success!',
          response.message || `Successfully joined ${response.group.name}!`,
          [
            {
              text: 'OK',
              onPress: () => {
                setShowJoinModal(false);
                fetchGroups(); // Refresh the groups list
              }
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to join group');
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
    <TouchableOpacity
      style={styles.groupCard}
      onPress={() => handleGroupPress(group)}
      activeOpacity={0.7}
    >
      <View style={styles.groupHeader}>
        <Text style={styles.groupName}>{group.name}</Text>
        <Text style={styles.memberCount}>{group.memberCount} members</Text>
      </View>
      {group.description && (
        <Text style={styles.groupDescription}>{group.description}</Text>
      )}
      <View style={styles.groupFooter}>
        <Text style={styles.userPoints}>Your score: {group.userPoints} pts</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No groups yet!</Text>
      <Text style={styles.emptySubtitle}>Create one to get started with your friends</Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>My Groups</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4285f4" />
          <Text style={styles.loadingText}>Loading groups...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Groups</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={() => setShowJoinModal(true)} style={styles.joinButton}>
            <Text style={styles.joinButtonText}>Join</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

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
          />
        )}
      </View>

      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreateGroup}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

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
    backgroundColor: '#1A1A1A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  joinButton: {
    backgroundColor: '#4285f4',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
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
    fontSize: 16,
    color: '#cccccc',
  },
  listContainer: {
    padding: 20,
  },
  groupCard: {
    backgroundColor: '#2A2A2A',
    padding: 20,
    borderRadius: 12,
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
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  groupName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
    marginRight: 10,
  },
  memberCount: {
    fontSize: 14,
    color: '#7f8c8d',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  groupDescription: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 12,
    lineHeight: 22,
  },
  groupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userPoints: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4285f4',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4285f4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  fabText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
});
