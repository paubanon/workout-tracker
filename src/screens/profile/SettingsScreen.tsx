import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, Alert, TouchableOpacity, Modal, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
// Using legacy API as per SDK 54 deprecation warning for writeAsStringAsync
import * as FileSystem from 'expo-file-system/legacy';


import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../theme';
import { supabaseService } from '../../services/SupabaseDataService';
import { useAuth } from '../../context/AuthContext';

export const SettingsScreen = () => {
    const [trackRpe, setTrackRpe] = useState(false);
    const [loading, setLoading] = useState(true);
    const { signOut } = useAuth();

    // Password Change State
    const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [forceValidation, setForceValidation] = useState(false);

    // Delete Account State
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [showDeletePassword, setShowDeletePassword] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const profile = await supabaseService.getUserProfile();
        if (profile) {
            setTrackRpe(profile.preferences?.trackRpe ?? false);
        }
        setLoading(false);
    };

    const toggleRpe = async (value: boolean) => {
        setTrackRpe(value);
        try {
            const profile = await supabaseService.getUserProfile();
            if (profile) {
                await supabaseService.updateUserProfile({
                    preferences: {
                        ...profile.preferences,
                        trackRpe: value
                    }
                });
            }
        } catch (error) {
            Alert.alert("Error", "Failed to update settings");
            setTrackRpe(!value); // Revert on error
        }
    };

    const validateOne = (pass: string, regex: RegExp) => regex.test(pass);
    const validateLength = (pass: string) => pass.length > 8;

    const validations = [
        { label: '> 8 Chars', valid: validateLength(newPassword) },
        { label: 'Caps', valid: validateOne(newPassword, /[A-Z]/) },
        { label: 'Num', valid: validateOne(newPassword, /[0-9]/) },
        { label: 'Sym', valid: validateOne(newPassword, /[!@#$%^&*(),.?":{}|<>]/) },
    ];

    const isPasswordValid = validations.every(v => v.valid);

    const handleChangePassword = async () => {
        if (!isPasswordValid) {
            setForceValidation(true);
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setPasswordLoading(true);
        const { error } = await supabaseService.updateUserPassword(newPassword);
        setPasswordLoading(false);

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            Alert.alert('Success', 'Password updated successfully');
            setIsPasswordModalVisible(false);
            setNewPassword('');
            setConfirmPassword('');
            setForceValidation(false);
        }
    };

    const handleExportData = async () => {
        try {
            setLoading(true);
            const data = await supabaseService.exportAllUserData();
            const fileUri = FileSystem.documentDirectory + 'workout_tracker_backup.json';
            await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(data, null, 2));

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri);
            } else {
                Alert.alert("Success", "Backup saved to documents.");
            }
        } catch (error: any) {
            Alert.alert("Error", "Failed to export data: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleImportData = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/json',
                copyToCacheDirectory: true
            });

            if (result.canceled) return;

            setLoading(true);
            const fileUri = result.assets[0].uri;
            const fileContent = await FileSystem.readAsStringAsync(fileUri);
            const jsonData = JSON.parse(fileContent);

            await supabaseService.importUserData(jsonData);
            Alert.alert("Success", "Data imported successfully. Please restart the app to see all changes.");
            loadSettings(); // Reload settings to reflect imported profile
        } catch (error: any) {
            Alert.alert("Error", "Failed to import data: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!deletePassword) {
            Alert.alert("Error", "Please enter your password to confirm.");
            return;
        }
        setDeleteLoading(true);
        const { error } = await supabaseService.deleteUserAccount(deletePassword);
        setDeleteLoading(false);

        if (error) {
            Alert.alert("Error", "Failed to delete account: " + error.message);
        } else {
            setIsDeleteModalVisible(false);
            // SignOut happens in service
        }
    };


    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Settings</Text>
            </View>

            <ScrollView>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account</Text>
                    <TouchableOpacity
                        style={styles.row}
                        onPress={() => setIsPasswordModalVisible(true)}
                    >
                        <Text style={styles.optionTitle}>Change Password</Text>
                        <Ionicons name="chevron-forward" size={20} color={Theme.Colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                <View style={[styles.section, { marginTop: 24 }]}>
                    <Text style={styles.sectionTitle}>Preferences</Text>
                    <View style={styles.row}>
                        <View>
                            <Text style={styles.optionTitle}>Track RPE</Text>
                            <Text style={styles.optionSubtitle}>Rate Perceived Exertion (1-10) after each set</Text>
                        </View>
                        <Switch
                            trackColor={{ false: Theme.Colors.switchTrackOff, true: Theme.Colors.primary }}
                            thumbColor={Theme.Colors.switchThumb}
                            onValueChange={toggleRpe}
                            value={trackRpe}
                            disabled={loading}
                        />
                    </View>
                </View>

                <View style={[styles.section, { marginTop: 24 }]}>
                    <Text style={styles.sectionTitle}>Data Management</Text>
                    <TouchableOpacity style={[styles.row, { marginBottom: 1 }]} onPress={handleExportData}>
                        <Text style={styles.optionTitle}>Export Data (Backup)</Text>
                        <Ionicons name="download-outline" size={24} color={Theme.Colors.primary} />
                    </TouchableOpacity>
                    <View style={styles.separator} />
                    <TouchableOpacity style={styles.row} onPress={handleImportData}>
                        <Text style={styles.optionTitle}>Import Data</Text>
                        <Ionicons name="cloud-upload-outline" size={24} color={Theme.Colors.primary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
                        <Text style={styles.logoutText}>Log Out</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.logoutButton, { backgroundColor: Theme.Colors.background, marginTop: 12 }]}
                        onPress={() => setIsDeleteModalVisible(true)}
                    >
                        <Text style={[styles.logoutText, { color: Theme.Colors.danger, fontSize: 15 }]}>Delete Account</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Change Password Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={isPasswordModalVisible}
                onRequestClose={() => setIsPasswordModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Change Password</Text>

                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="New Password"
                                placeholderTextColor={Theme.Colors.textSecondary}
                                secureTextEntry={!showNewPassword}
                                value={newPassword}
                                onChangeText={setNewPassword}
                            />
                            <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeButton}>
                                <Ionicons name={showNewPassword ? "eye-outline" : "eye-off-outline"} size={20} color={Theme.Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.requirementsContainer}>
                            {!isPasswordValid && forceValidation && (
                                <Text style={styles.errorText}>
                                    Please create a password that meets all requirements below
                                </Text>
                            )}
                            {validations.map((v, i) => (
                                <View key={i} style={styles.requirementRow}>
                                    <Ionicons
                                        name={v.valid ? "checkmark-circle" : "close-circle"}
                                        size={18}
                                        color={v.valid ? Theme.Colors.success : Theme.Colors.textSecondary}
                                        style={{ marginRight: 6 }}
                                    />
                                    <Text
                                        style={{
                                            color: v.valid ? Theme.Colors.success : Theme.Colors.textSecondary,
                                            fontSize: 13,
                                            fontWeight: '500',
                                        }}
                                    >
                                        {v.label}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="Confirm Password"
                                placeholderTextColor={Theme.Colors.textSecondary}
                                secureTextEntry={!showConfirmPassword}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                            />
                            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeButton}>
                                <Ionicons name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} size={20} color={Theme.Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setIsPasswordModalVisible(false)}
                            >
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={handleChangePassword}
                                disabled={passwordLoading}
                            >
                                <Text style={[styles.modalButtonText, styles.saveButtonText]}>
                                    {passwordLoading ? "Saving..." : "Save"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Delete Account Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={isDeleteModalVisible}
                onRequestClose={() => setIsDeleteModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={[styles.modalTitle, { color: Theme.Colors.danger }]}>Delete Account</Text>
                        <Text style={styles.modalSubtitle}>
                            Are you sure you want to delete your account? This will permanently remove all your workouts, templates, and history.
                            {"\n\n"}
                            We strongly recommend backing up your data first.
                        </Text>

                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="Enter Password to Confirm"
                                placeholderTextColor={Theme.Colors.textSecondary}
                                secureTextEntry={!showDeletePassword}
                                value={deletePassword}
                                onChangeText={setDeletePassword}
                            />
                            <TouchableOpacity onPress={() => setShowDeletePassword(!showDeletePassword)} style={styles.eyeButton}>
                                <Ionicons name={showDeletePassword ? "eye-outline" : "eye-off-outline"} size={20} color={Theme.Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setIsDeleteModalVisible(false)}
                            >
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: Theme.Colors.danger }]}
                                onPress={handleDeleteAccount}
                                disabled={deleteLoading}
                            >
                                <Text style={[styles.modalButtonText, styles.saveButtonText]}>
                                    {deleteLoading ? "Deleting..." : "Delete Permanently"}
                                </Text>
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
        paddingHorizontal: Theme.Spacing.m,
        paddingTop: Theme.Spacing.m,
        marginBottom: Theme.Spacing.l,
    },
    headerTitle: {
        ...Theme.Typography.title,
    },
    section: {
        paddingHorizontal: Theme.Spacing.m,
    },
    sectionTitle: {
        ...Theme.Typography.subtitle,
        fontSize: 13,
        textTransform: 'uppercase',
        color: Theme.Colors.textSecondary,
        marginBottom: Theme.Spacing.s,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Theme.Colors.surface,
        padding: 16,
        borderRadius: 12,
    },
    separator: {
        height: 1,
        backgroundColor: Theme.Colors.background,
        marginHorizontal: 16,
    },
    optionTitle: {
        fontSize: 17,
        fontWeight: '500',
        color: Theme.Colors.text,
        marginBottom: 4,
    },
    optionSubtitle: {
        fontSize: 13,
        color: Theme.Colors.textSecondary,
        maxWidth: 240,
    },
    logoutButton: {
        marginTop: Theme.Spacing.xl,
        backgroundColor: Theme.Colors.surface,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoutText: {
        fontSize: 17,
        fontWeight: '600',
        color: Theme.Colors.danger,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: Theme.Colors.surface,
        borderRadius: 20,
        padding: 24,
        width: '90%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        color: Theme.Colors.text,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 14,
        color: Theme.Colors.text,
        marginBottom: 20,
        textAlign: 'center',
        lineHeight: 20,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.Colors.background,
        borderRadius: 10,
        marginBottom: 16,
        paddingRight: 12,
    },
    passwordInput: {
        flex: 1,
        padding: 12,
        color: Theme.Colors.text,
        fontSize: 16,
    },
    eyeButton: {
        padding: 8,
    },
    requirementsContainer: {
        marginTop: 4,
        paddingHorizontal: 4,
        marginBottom: 16,
    },
    requirementRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    errorText: {
        color: Theme.Colors.danger,
        fontSize: 12,
        marginBottom: 10,
        fontWeight: '500',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    modalButton: {
        flex: 1,
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginHorizontal: 6,
    },
    cancelButton: {
        backgroundColor: Theme.Colors.background,
    },
    saveButton: {
        backgroundColor: Theme.Colors.primary,
    },
    modalButtonText: {
        fontWeight: 'bold',
        color: Theme.Colors.text,
        fontSize: 16,
    },
    saveButtonText: {
        color: 'white',
    },
});
