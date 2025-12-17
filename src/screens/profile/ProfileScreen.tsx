import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Modal, TextInput, Alert, ActionSheetIOS, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../theme';
import { supabaseService } from '../../services/SupabaseDataService';
import { UserProfile } from '../../models';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export const ProfileScreen = () => {
    const navigation = useNavigation();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    // Edit Form State
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [sex, setSex] = useState<'male' | 'female' | 'other'>('male'); // Simple selection for now

    // Weight Modal State
    const [weightModalVisible, setWeightModalVisible] = useState(false);
    const [newWeight, setNewWeight] = useState('');

    useEffect(() => {
        loadProfile();
        const unsubscribe = navigation.addListener('focus', loadProfile);
        return unsubscribe;
    }, [navigation]);

    const [recentSessions, setRecentSessions] = useState<any[]>([]);

    useEffect(() => {
        loadProfile();
        loadRecentSessions();
        const unsubscribe = navigation.addListener('focus', () => {
            loadProfile();
            loadRecentSessions();
        });
        return unsubscribe;
    }, [navigation]);

    const loadProfile = async () => {
        const p = await supabaseService.getUserProfile();
        if (p) {
            setProfile(p);
            if (!isEditing) {
                setFirstName(p.firstName);
                setLastName(p.lastName);
                setEmail(p.email);
                setSex(p.sex);
            }
        }
    };

    const loadRecentSessions = async () => {
        const data = await supabaseService.getWorkoutSessions(5, 0);
        setRecentSessions(data);
    };

    const handleSaveProfile = async () => {
        await supabaseService.updateUserProfile({
            firstName,
            lastName,
            email,
            sex
        });
        setIsEditing(false);
        loadProfile();
    };

    const handleAddWeight = async () => {
        const w = parseFloat(newWeight);
        if (!w || isNaN(w)) {
            Alert.alert("Invalid Weight", "Please enter a valid number.");
            return;
        }
        await supabaseService.addWeightEntry(w);
        setNewWeight('');
        setWeightModalVisible(false);
        loadProfile();
    };

    const toggleSex = () => {
        const options: ('male' | 'female' | 'other')[] = ['male', 'female', 'other'];
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['Cancel', 'Male', 'Female', 'Other'],
                    cancelButtonIndex: 0,
                },
                (buttonIndex) => {
                    if (buttonIndex === 1) setSex('male');
                    if (buttonIndex === 2) setSex('female');
                    if (buttonIndex === 3) setSex('other');
                }
            );
        } else {
            // Rotate for Android simplicity for now, or use a picker
            const currIdx = options.indexOf(sex);
            const nextIdx = (currIdx + 1) % options.length;
            setSex(options[nextIdx]);
        }
    };

    if (!profile) return null;

    const currentWeight = profile.weightHistory.length > 0 ? profile.weightHistory[0].weightKg : '-';

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Profile</Text>
                <TouchableOpacity onPress={() => isEditing ? handleSaveProfile() : setIsEditing(true)}>
                    <Text style={styles.editButton}>{isEditing ? 'Save' : 'Edit'}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                {/* Profile Card */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                        {profile.avatarUrl ? (
                            <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                <Text style={styles.avatarInitial}>{profile.firstName[0]}</Text>
                            </View>
                        )}
                        <TouchableOpacity style={styles.cameraIcon}>
                            <Ionicons name="camera" size={20} color="white" />
                        </TouchableOpacity>
                    </View>

                    {!isEditing ? (
                        <View style={{ alignItems: 'center' }}>
                            <Text style={styles.nameText}>{profile.firstName} {profile.lastName}</Text>
                            <Text style={styles.emailText}>{profile.email}</Text>
                        </View>
                    ) : (
                        <View style={styles.editForm}>
                            <View style={styles.row}>
                                <TextInput style={styles.inputHalf} value={firstName} onChangeText={setFirstName} placeholder="First Name" />
                                <TextInput style={styles.inputHalf} value={lastName} onChangeText={setLastName} placeholder="Last Name" />
                            </View>
                            <TextInput style={styles.inputFull} value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" />
                            <TouchableOpacity style={styles.sexInput} onPress={toggleSex}>
                                <Text style={styles.inputText}>{sex.charAt(0).toUpperCase() + sex.slice(1)}</Text>
                                <Ionicons name="chevron-down" size={16} color={Theme.Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Metrics Section */}
                <Text style={styles.sectionTitle}>Body Metrics</Text>
                <View style={styles.card}>
                    <View style={styles.metricRow}>
                        <View>
                            <Text style={styles.metricLabel}>Current Weight</Text>
                            <Text style={styles.metricValue}>{currentWeight} kg</Text>
                        </View>
                        <TouchableOpacity style={styles.logButton} onPress={() => setWeightModalVisible(true)}>
                            <Text style={styles.logButtonText}>Log Weight</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Recent History Preview */}
                    {profile.weightHistory.length > 0 && (
                        <View style={styles.historyContainer}>
                            <Text style={styles.historyTitle}>Recent History</Text>
                            {profile.weightHistory.slice(0, 5).map((entry) => (
                                <View key={entry.id} style={styles.historyRow}>
                                    <Text style={styles.historyDate}>
                                        {new Date(entry.date).toLocaleDateString()}
                                    </Text>
                                    <Text style={styles.historyValue}>{entry.weightKg} kg</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Recent Workouts Section */}
                <Text style={styles.sectionTitle}>Recent Workouts</Text>
                <View style={[styles.card, { padding: 0, overflow: 'hidden' }]}>
                    {recentSessions.length === 0 ? (
                        <View style={{ padding: 16 }}>
                            <Text style={styles.emptyText}>No workouts yet.</Text>
                        </View>
                    ) : (
                        recentSessions.map((session, index) => (
                            <View key={session.id}>
                                <View style={styles.sessionRow}>
                                    <View>
                                        <Text style={styles.sessionTitle}>{session.name || 'Untitled Workout'}</Text>
                                        <Text style={styles.sessionDate}>{new Date(session.date).toLocaleDateString()}</Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={styles.sessionVolume}>
                                            {session.sets.reduce((acc: number, s: any) => acc + (s.loadKg || 0) * (s.reps || 0), 0)} kg
                                        </Text>
                                        <Text style={styles.sessionSets}>{session.sets.length} Sets</Text>
                                    </View>
                                </View>
                                {index < recentSessions.length - 1 && <View style={styles.divider} />}
                            </View>
                        ))
                    )}

                    <TouchableOpacity
                        style={styles.showMoreButton}
                        onPress={() => (navigation as any).navigate('History')}
                    >
                        <Text style={styles.showMoreText}>Show More</Text>
                    </TouchableOpacity>
                </View>

                {/* Other Info Display (Read Only when not editing) */}
                {!isEditing && (
                    <>
                        <Text style={styles.sectionTitle}>Personal Info</Text>
                        <View style={styles.card}>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Sex</Text>
                                <Text style={styles.infoValue}>{profile.sex.charAt(0).toUpperCase() + profile.sex.slice(1)}</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Email</Text>
                                <Text style={styles.infoValue}>{profile.email}</Text>
                            </View>
                        </View>
                    </>
                )}

                <View style={{ marginTop: Theme.Spacing.l, paddingBottom: Theme.Spacing.xl }}>
                    <TouchableOpacity
                        style={styles.settingsButton}
                        onPress={() => (navigation as any).navigate('Settings')}
                    >
                        <Ionicons name="settings-outline" size={20} color={Theme.Colors.primary} style={{ marginRight: 8 }} />
                        <Text style={styles.settingsButtonText}>Settings</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Weight Entry Modal */}
            <Modal
                transparent={true}
                visible={weightModalVisible}
                animationType="fade"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Log Weight</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="kg"
                            keyboardType="numeric"
                            value={newWeight}
                            onChangeText={setNewWeight}
                            autoFocus
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={() => setWeightModalVisible(false)} style={styles.modalButton}>
                                <Text style={styles.modalButtonCancel}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleAddWeight} style={styles.modalButton}>
                                <Text style={styles.modalButtonSave}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.Colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Theme.Spacing.m,
        paddingTop: Theme.Spacing.m,
        marginBottom: Theme.Spacing.m,
    },
    headerTitle: {
        ...Theme.Typography.title,
    },
    editButton: {
        color: Theme.Colors.primary,
        fontSize: 17,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        paddingHorizontal: Theme.Spacing.m,
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: Theme.Spacing.xl,
    },
    avatarContainer: {
        marginBottom: Theme.Spacing.m,
        position: 'relative',
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#E1E1E1',
    },
    avatarPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        fontSize: 40,
        color: '#8E8E93',
        fontWeight: '600',
    },
    cameraIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: Theme.Colors.primary,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Theme.Colors.background,
    },
    nameText: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    emailText: {
        ...Theme.Typography.caption,
        fontSize: 15,
    },
    editForm: {
        width: '100%',
        paddingHorizontal: Theme.Spacing.l,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Theme.Spacing.s,
    },
    inputHalf: {
        flex: 0.48,
        backgroundColor: Theme.Colors.surface,
        padding: 12,
        borderRadius: 8,
        fontSize: 16,
    },
    inputFull: {
        backgroundColor: Theme.Colors.surface,
        padding: 12,
        borderRadius: 8,
        fontSize: 16,
        marginBottom: Theme.Spacing.s,
    },
    sexInput: {
        backgroundColor: Theme.Colors.surface,
        padding: 12,
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    inputText: {
        fontSize: 16,
    },
    sectionTitle: {
        ...Theme.Typography.subtitle,
        marginBottom: Theme.Spacing.s,
        marginTop: Theme.Spacing.m,
        fontSize: 13,
        textTransform: 'uppercase',
        color: Theme.Colors.textSecondary,
    },
    card: {
        backgroundColor: Theme.Colors.surface,
        borderRadius: 12,
        padding: Theme.Spacing.m,
    },
    metricRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    metricLabel: {
        fontSize: 15,
        color: Theme.Colors.textSecondary,
        marginBottom: 4,
    },
    metricValue: {
        fontSize: 28,
        fontWeight: '700',
        color: Theme.Colors.text,
    },
    logButton: {
        backgroundColor: '#F2F2F7',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    logButtonText: {
        color: Theme.Colors.primary,
        fontWeight: '600',
    },
    historyContainer: {
        marginTop: Theme.Spacing.m,
        paddingTop: Theme.Spacing.m,
        borderTopWidth: 1,
        borderTopColor: '#F2F2F7',
    },
    historyTitle: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: Theme.Spacing.s,
        color: Theme.Colors.textSecondary,
    },
    historyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    historyDate: {
        fontSize: 15,
        color: Theme.Colors.textSecondary,
    },
    historyValue: {
        fontSize: 15,
        fontWeight: '500',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    infoLabel: {
        fontSize: 17,
        color: Theme.Colors.text,
    },
    infoValue: {
        fontSize: 17,
        color: Theme.Colors.textSecondary,
    },
    divider: {
        height: 1,
        backgroundColor: '#F2F2F7',
        marginVertical: 4,
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        width: '80%',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 16,
    },
    modalInput: {
        fontSize: 32,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 24,
        width: 120,
        borderBottomWidth: 1,
        borderBottomColor: '#CCC',
        paddingBottom: 8,
    },
    modalButtons: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
    },
    modalButton: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
    },
    modalButtonCancel: {
        fontSize: 17,
        color: Theme.Colors.textSecondary,
    },
    modalButtonSave: {
        fontSize: 17,
        fontWeight: '600',
        color: Theme.Colors.primary,
    },
    sessionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: Theme.Spacing.m,
        alignItems: 'center',
    },
    sessionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    sessionDate: {
        fontSize: 13,
        color: Theme.Colors.textSecondary,
    },
    sessionVolume: {
        fontSize: 15,
        fontWeight: '500',
    },
    sessionSets: {
        fontSize: 13,
        color: Theme.Colors.textSecondary,
    },
    showMoreButton: {
        padding: Theme.Spacing.m,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F2F2F7',
        backgroundColor: '#FAFAFA'
    },
    showMoreText: {
        color: Theme.Colors.primary,
        fontWeight: '600',
        fontSize: 15,
    },
    emptyText: {
        color: Theme.Colors.textSecondary,
        textAlign: 'center',
    },
    settingsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backgroundColor: Theme.Colors.surface,
        borderRadius: 12,
    },
    settingsButtonText: {
        fontSize: 17,
        fontWeight: '600',
        color: Theme.Colors.primary,
    }
});
