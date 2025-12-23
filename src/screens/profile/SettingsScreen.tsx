import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, Alert, TouchableOpacity, Modal, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
// Using legacy API as per SDK 54 deprecation warning for writeAsStringAsync
import * as FileSystem from 'expo-file-system/legacy';
import { Theme } from '../../theme';
import { supabaseService } from '../../services/SupabaseDataService';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { GlowCard } from '../../components/GlowCard';
import { ThemedSafeAreaView } from '../../components/ThemedSafeAreaView';

export const SettingsScreen = () => {
    const [trackRpe, setTrackRpe] = useState(false);
    const [loading, setLoading] = useState(true);
    const { signOut } = useAuth();
    const { colors, isDark, toggleTheme } = useTheme();

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

    // Dynamic Styles Helpers
    const containerStyle = { backgroundColor: colors.background };
    const rowStyle = { backgroundColor: colors.surface };
    const textStyle = { color: colors.text };
    const subtitleStyle = { color: colors.textMuted };
    const titleStyle = { color: colors.textMuted }; // Section titles
    const iconColor = colors.textMuted;
    const shadowStyle = isDark ? Theme.TopLight.m : Theme.Shadows.light.m;

    return (
        <ThemedSafeAreaView style={[styles.container, containerStyle]} edges={['top', 'bottom']}>
            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                <View style={[styles.section, { marginTop: Theme.Spacing.l }]}>
                    <Text style={[styles.sectionTitle, titleStyle]}>Appearance</Text>
                    <GlowCard style={styles.row} level="m">
                        <View style={styles.rowContent}>
                            <View>
                                <Text style={[styles.optionTitle, textStyle]}>Dark Mode</Text>
                                <Text style={[styles.optionSubtitle, subtitleStyle]}>
                                    {isDark ? "On" : "Off"}
                                </Text>
                            </View>
                            <Switch
                                trackColor={{ false: "#767577", true: isDark ? colors.primary : colors.primary }}
                                thumbColor={"#f4f3f4"}
                                onValueChange={toggleTheme}
                                value={isDark}
                            />
                        </View>
                    </GlowCard>
                </View>

                <View style={[styles.section, { marginTop: 24 }]}>
                    <Text style={[styles.sectionTitle, titleStyle]}>Account</Text>
                    <GlowCard style={styles.row} level="m">
                        <TouchableOpacity
                            style={styles.rowContent}
                            onPress={() => setIsPasswordModalVisible(true)}
                        >
                            <Text style={[styles.optionTitle, textStyle]}>Change Password</Text>
                            <Ionicons name="chevron-forward" size={20} color={iconColor} />
                        </TouchableOpacity>
                    </GlowCard>
                </View>

                <View style={[styles.section, { marginTop: 24 }]}>
                    <Text style={[styles.sectionTitle, titleStyle]}>Preferences</Text>
                    <GlowCard style={styles.row} level="m">
                        <View style={styles.rowContent}>
                            <View>
                                <Text style={[styles.optionTitle, textStyle]}>Track RPE</Text>
                                <Text style={[styles.optionSubtitle, subtitleStyle]}>Rate Perceived Exertion (1-10) after each set</Text>
                            </View>
                            <Switch
                                trackColor={{ false: "#767577", true: isDark ? colors.primary : colors.primary }}
                                thumbColor={trackRpe ? "#f4f3f4" : "#f4f3f4"}
                                onValueChange={toggleRpe}
                                value={trackRpe}
                                disabled={loading}
                            />
                        </View>
                    </GlowCard>
                </View>

                <View style={[styles.section, { marginTop: 24 }]}>
                    <Text style={[styles.sectionTitle, titleStyle]}>Data Management</Text>
                    <GlowCard style={[styles.row, { marginBottom: Theme.Spacing.s }]} level="m">
                        <TouchableOpacity
                            style={styles.rowContent}
                            onPress={handleExportData}
                            accessibilityRole="button"
                            accessibilityLabel="Export data backup"
                        >
                            <Text style={[styles.optionTitle, textStyle]}>Export Data (Backup)</Text>
                            <Ionicons name="download-outline" size={24} color={colors.primary} />
                        </TouchableOpacity>
                    </GlowCard>

                    <GlowCard style={styles.row} level="m">
                        <TouchableOpacity
                            style={styles.rowContent}
                            onPress={handleImportData}
                            accessibilityRole="button"
                            accessibilityLabel="Import data"
                        >
                            <Text style={[styles.optionTitle, textStyle]}>Import Data</Text>
                            <Ionicons name="cloud-upload-outline" size={24} color={colors.primary} />
                        </TouchableOpacity>
                    </GlowCard>
                </View>

                <View style={[styles.section, { marginTop: 24 }]}>
                    <Text style={[styles.sectionTitle, titleStyle]}>Contact or Report a Bug</Text>
                    <GlowCard style={[styles.row, { marginBottom: Theme.Spacing.s }]} level="m">
                        <TouchableOpacity
                            style={styles.rowContent}
                            onPress={() => {
                                import('expo-linking').then(Linking => {
                                    Linking.openURL('https://github.com/paubanon/workout-tracker/issues');
                                });
                            }}
                            accessibilityRole="button"
                            accessibilityLabel="Report a bug on GitHub"
                        >
                            <Text style={[styles.optionTitle, textStyle]}>Report a Bug (GitHub)</Text>
                            <Ionicons name="logo-github" size={24} color={iconColor} />
                        </TouchableOpacity>
                    </GlowCard>

                    <GlowCard style={styles.row} level="m">
                        <TouchableOpacity
                            style={styles.rowContent}
                            onPress={() => {
                                import('expo-linking').then(Linking => {
                                    Linking.openURL('https://t.me/pablo_banon');
                                });
                            }}
                            accessibilityRole="button"
                            accessibilityLabel="Send a Telegram message"
                        >
                            <Text style={[styles.optionTitle, textStyle]}>Send a Message (Telegram)</Text>
                            <Ionicons name="send" size={24} color={iconColor} />
                        </TouchableOpacity>
                    </GlowCard>
                </View>

                <View style={styles.section}>
                    <GlowCard style={[styles.logoutButton, { borderWidth: 1, borderColor: colors.border }]} level="m">
                        <TouchableOpacity
                            style={styles.logoutContent}
                            onPress={signOut}
                            accessibilityRole="button"
                            accessibilityLabel="Log out"
                        >
                            <Text style={[styles.logoutText, { color: colors.danger }]}>Log Out</Text>
                        </TouchableOpacity>
                    </GlowCard>

                    <GlowCard style={[styles.logoutButton, { marginTop: Theme.Spacing.m, borderWidth: 1, borderColor: colors.danger }]} level="m">
                        <TouchableOpacity
                            style={styles.logoutContent}
                            onPress={() => setIsDeleteModalVisible(true)}
                            accessibilityRole="button"
                            accessibilityLabel="Delete account"
                        >
                            <Text style={[styles.logoutText, { color: colors.danger }]}>Delete Account</Text>
                        </TouchableOpacity>
                    </GlowCard>
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
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalTitle, textStyle]}>Change Password</Text>

                        <View style={[styles.passwordContainer, { backgroundColor: colors.background }]}>
                            <TextInput
                                style={[styles.passwordInput, { color: colors.text }]}
                                placeholder="New Password"
                                placeholderTextColor={colors.textMuted}
                                secureTextEntry={!showNewPassword}
                                value={newPassword}
                                onChangeText={setNewPassword}
                            />
                            <TouchableOpacity
                                onPress={() => setShowNewPassword(!showNewPassword)}
                                style={styles.eyeButton}
                                accessibilityRole="button"
                                accessibilityLabel={showNewPassword ? 'Hide password' : 'Show password'}
                            >
                                <Ionicons name={showNewPassword ? "eye-outline" : "eye-off-outline"} size={20} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.requirementsContainer}>
                            {!isPasswordValid && forceValidation && (
                                <Text style={[styles.errorText, { color: colors.danger }]}>
                                    Please create a password that meets all requirements below
                                </Text>
                            )}
                            {validations.map((v, i) => (
                                <View key={i} style={styles.requirementRow}>
                                    <Ionicons
                                        name={v.valid ? "checkmark-circle" : "close-circle"}
                                        size={18}
                                        color={v.valid ? colors.success : colors.textMuted}
                                        style={{ marginRight: 6 }}
                                    />
                                    <Text
                                        style={{
                                            color: v.valid ? colors.success : colors.textMuted,
                                            fontSize: 13,
                                            fontWeight: '500',
                                        }}
                                    >
                                        {v.label}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        <View style={[styles.passwordContainer, { backgroundColor: colors.background }]}>
                            <TextInput
                                style={[styles.passwordInput, { color: colors.text }]}
                                placeholder="Confirm Password"
                                placeholderTextColor={colors.textMuted}
                                secureTextEntry={!showConfirmPassword}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                            />
                            <TouchableOpacity
                                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                style={styles.eyeButton}
                                accessibilityRole="button"
                                accessibilityLabel={showConfirmPassword ? 'Hide password' : 'Show password'}
                            >
                                <Ionicons name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} size={20} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: colors.background }]}
                                onPress={() => setIsPasswordModalVisible(false)}
                            >
                                <Text style={[styles.modalButtonText, textStyle]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: colors.primary }]}
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
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: colors.danger }]}>Delete Account</Text>
                        <Text style={[styles.modalSubtitle, textStyle]}>
                            Are you sure you want to delete your account? This will permanently remove all your workouts, templates, and history.
                            {"\n\n"}
                            We strongly recommend backing up your data first.
                        </Text>

                        <View style={[styles.passwordContainer, { backgroundColor: colors.background }]}>
                            <TextInput
                                style={[styles.passwordInput, { color: colors.text }]}
                                placeholder="Enter Password to Confirm"
                                placeholderTextColor={colors.textMuted}
                                secureTextEntry={!showDeletePassword}
                                value={deletePassword}
                                onChangeText={setDeletePassword}
                            />
                            <TouchableOpacity
                                onPress={() => setShowDeletePassword(!showDeletePassword)}
                                style={styles.eyeButton}
                                accessibilityRole="button"
                                accessibilityLabel={showDeletePassword ? 'Hide password' : 'Show password'}
                            >
                                <Ionicons name={showDeletePassword ? "eye-outline" : "eye-off-outline"} size={20} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: colors.background }]}
                                onPress={() => setIsDeleteModalVisible(false)}
                            >
                                <Text style={[styles.modalButtonText, textStyle]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: colors.danger }]}
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
        </ThemedSafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    // Header style moved to inline or managed by navigation options, kept here if needed but mostly empty now in ScrollView
    section: {
        paddingHorizontal: Theme.Spacing.m,
    },
    sectionTitle: {
        fontSize: Theme.Typography.scale.lg,
        fontWeight: '600',
        marginBottom: Theme.Spacing.m,
        marginTop: Theme.Spacing.m,
    },
    row: {
        borderRadius: 12,
    },
    rowContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    separator: {
        height: 1,
        marginHorizontal: 16,
    },
    optionTitle: {
        fontSize: Theme.Typography.scale.md,
        fontWeight: '500',
        marginBottom: 4,
    },
    optionSubtitle: {
        fontSize: Theme.Typography.scale.sm,
        maxWidth: 240,
    },
    logoutButton: {
        marginTop: Theme.Spacing.xl,
        borderRadius: 12,
    },
    logoutContent: {
        padding: Theme.Spacing.m,
        alignItems: 'center',
    },
    logoutText: {
        fontSize: Theme.Typography.scale.md,
        fontWeight: '600',
    },
    // New styles from instruction
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        marginBottom: 8,
    },
    itemText: {
        fontSize: Theme.Typography.scale.md,
    },
    versionText: {
        fontSize: Theme.Typography.scale.sm,
        marginTop: Theme.Spacing.xl,
        textAlign: 'center',
    },
    deleteButton: {
        marginTop: Theme.Spacing.l,
        padding: Theme.Spacing.m,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
    },
    deleteText: {
        fontSize: Theme.Typography.scale.md,
        fontWeight: '600',
    },
    modalContainer: { // Renamed from modalOverlay in instruction to match existing
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Theme.Spacing.l,
    },
    modalContent: {
        borderRadius: 20,
        width: '100%',
        maxWidth: 320,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: Theme.Typography.scale.xl,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    modalSubtitle: { // Renamed from modalText in instruction to match existing
        fontSize: Theme.Typography.scale.md,
        marginBottom: 24,
        textAlign: 'center',
        lineHeight: 20, // Keep original line height
    },
    modalActions: { // New style from instruction
        width: '100%',
        marginBottom: 16,
    },
    modalButton: {
        flex: 1, // Keep original flex property
        padding: 14, // Keep original padding
        borderRadius: 10, // Keep original border radius
        alignItems: 'center',
        marginHorizontal: 6, // Keep original margin
    },
    modalButtonText: {
        fontWeight: '600', // Changed from 'bold' to '600'
        fontSize: Theme.Typography.scale.md, // Changed from 16 to scale.md
    },
    saveButtonText: {
        color: 'white',
    },
    divider: { // New style from instruction
        height: 1,
        marginVertical: 4,
    },
    cancelButton: { // New style from instruction
        marginTop: 8,
    },
    cancelButtonText: { // New style from instruction
        fontSize: Theme.Typography.scale.md,
        fontWeight: '600',
    },
    // Remaining original styles
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 10,
        marginBottom: 16,
        paddingRight: 12,
    },
    passwordInput: {
        flex: 1,
        padding: 12,
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
        fontSize: 12,
        marginBottom: 10,
        fontWeight: '500',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
});

