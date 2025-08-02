import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { useUsers, useDatabaseStats } from '../hooks/useDatabase';

const DatabaseTest: React.FC = () => {
  const { users, loading, error, createUser, deleteUser, loadUsers } = useUsers();
  const { stats, loadStats } = useDatabaseStats();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleCreateUser = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Error', 'Please enter both name and email');
      return;
    }

    const newUser = await createUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      preferences: {
        language: 'en',
        theme: 'light',
        voiceEnabled: true,
        autoAnalysis: false,
        notifications: true,
      },
    });

    if (newUser) {
      setName('');
      setEmail('');
      loadStats(); // Refresh stats
      Alert.alert('Success', 'User created successfully!');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete ${userName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteUser(userId);
            if (success) {
              loadStats(); // Refresh stats
              Alert.alert('Success', 'User deleted successfully!');
            }
          },
        },
      ]
    );
  };

  const handleRefresh = async () => {
    await loadUsers();
    await loadStats();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading database...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>WatermelonDB Test</Text>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      )}

      {/* Database Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>Database Statistics</Text>
        <Text style={styles.statsText}>Total Users: {stats.userCount}</Text>
        <Text style={styles.statsText}>Active Users: {stats.activeUserCount}</Text>
      </View>

      {/* Create User Form */}
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>Create New User</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Enter name"
          value={name}
          onChangeText={setName}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Enter email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TouchableOpacity style={styles.createButton} onPress={handleCreateUser}>
          <Text style={styles.buttonText}>Create User</Text>
        </TouchableOpacity>
      </View>

      {/* Users List */}
      <View style={styles.usersContainer}>
        <View style={styles.usersHeader}>
          <Text style={styles.usersTitle}>Users ({users.length})</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {users.length === 0 ? (
          <Text style={styles.emptyText}>No users found. Create one above!</Text>
        ) : (
          users.map((user) => (
            <View key={user.id} style={styles.userCard}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                <Text style={styles.userStatus}>
                  Status: {user.isActive ? 'Active' : 'Inactive'}
                </Text>
                <Text style={styles.userPrefs}>
                  Theme: {user.preferences.theme} | Voice: {user.preferences.voiceEnabled ? 'On' : 'Off'}
                </Text>
                {user.lastLoginAt && (
                  <Text style={styles.userLogin}>
                    Last Login: {user.lastLoginAt.toLocaleString()}
                  </Text>
                )}
              </View>
              
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteUser(user.id, user.name)}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* Offline Status */}
      <View style={styles.offlineContainer}>
        <Text style={styles.offlineText}>
          ✅ This app works completely offline using local SQLite database!
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
  statsContainer: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1976d2',
  },
  statsText: {
    fontSize: 14,
    color: '#1976d2',
    marginBottom: 4,
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  createButton: {
    backgroundColor: '#4caf50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  usersContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  usersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  usersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 20,
  },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  userStatus: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  userPrefs: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  userLogin: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  deleteButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  offlineContainer: {
    backgroundColor: '#e8f5e8',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  offlineText: {
    fontSize: 14,
    color: '#2e7d32',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default DatabaseTest;
