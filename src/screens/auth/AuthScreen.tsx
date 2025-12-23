import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Theme } from '../../theme';
import { supabase } from '../../services/supabase';
import { useTheme } from '../../context/ThemeContext';

export const AuthScreen = () => {
    const { colors } = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [loading, setLoading] = useState(false);
    const [isLogin, setIsLogin] = useState(true);
    const [isForgotPassword, setIsForgotPassword] = useState(false);

    const [showPassword, setShowPassword] = useState(false);
    const [forceValidation, setForceValidation] = useState(false);

    const validateOne = (pass: string, regex: RegExp) => regex.test(pass);
    const validateLength = (pass: string) => pass.length > 8;

    const validations = [
        { label: '> 8 Characters', valid: validateLength(password) },
        { label: 'Capital Letter', valid: validateOne(password, /[A-Z]/) },
        { label: 'Number', valid: validateOne(password, /[0-9]/) },
        { label: 'Symbol', valid: validateOne(password, /[!@#$%^&*(),.?":{}|<>]/) },
    ];

    const isPasswordValid = validations.every(v => v.valid);

    async function signInWithEmail() {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) Alert.alert('Error', error.message);
        setLoading(false);
    }

    async function signUpWithEmail() {
        if (!firstName.trim() || !lastName.trim()) {
            Alert.alert('Error', 'Please enter your first and last name.');
            return;
        }

        if (!isPasswordValid) {
            setForceValidation(true);
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    first_name: firstName,
                    last_name: lastName,
                }
            }
        });

        if (error) Alert.alert('Error', error.message);
        else Alert.alert('Success', 'Please check your inbox for email verification!');
        setLoading(false);
    }

    async function resetPassword() {
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email address.');
            return;
        }
        setLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        setLoading(false);

        if (error) Alert.alert('Error', error.message);
        else {
            Alert.alert('Success', 'Password reset instructions sent to your email.');
            setIsForgotPassword(false);
        }
    }

    const renderForgotPassword = () => (
        <View style={[styles.form, { backgroundColor: colors.surface }]}>
            <Text style={[styles.title, { color: colors.text }]}>Reset Password</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>Enter your email to receive reset instructions</Text>

            <View style={styles.inputContainer}>
                <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                    onChangeText={setEmail}
                    value={email}
                    placeholder="email@address.com"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
            </View>

            <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.primary }]}
                onPress={resetPassword}
                disabled={loading}
            >
                {loading ? <ActivityIndicator color="#FFF" /> : (
                    <Text style={styles.buttonText}>Send Instructions</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsForgotPassword(false)} style={styles.switchButton}>
                <Text style={[styles.switchText, { color: colors.primary }]}>Back to Sign In</Text>
            </TouchableOpacity>
        </View>
    );

    const renderAuth = () => (
        <View style={[styles.form, { backgroundColor: colors.surface }]}>
            <Text style={[styles.title, { color: colors.text }]}>{isLogin ? 'Welcome Back' : 'Create Account'}</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>{isLogin ? 'Sign in to access your workouts' : 'Start your training journey'}</Text>

            {!isLogin && (
                <>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                            onChangeText={setFirstName}
                            value={firstName}
                            placeholder="First Name"
                            placeholderTextColor={colors.textMuted}
                        />
                    </View>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                            onChangeText={setLastName}
                            value={lastName}
                            placeholder="Last Name"
                            placeholderTextColor={colors.textMuted}
                        />
                    </View>
                </>
            )}

            <View style={styles.inputContainer}>
                <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                    onChangeText={setEmail}
                    value={email}
                    placeholder="email@address.com"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
            </View>
            <View style={[styles.inputContainer, styles.passwordContainer, { backgroundColor: colors.background }]}>
                <TextInput
                    style={[styles.input, styles.passwordInput, { color: colors.text }]}
                    onChangeText={setPassword}
                    value={password}
                    secureTextEntry={!showPassword}
                    placeholder="Password"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                    <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color={colors.textMuted} />
                </TouchableOpacity>
            </View>

            {!isLogin && (
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
            )}

            <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.primary }]}
                onPress={() => isLogin ? signInWithEmail() : signUpWithEmail()}
                disabled={loading}
            >
                {loading ? <ActivityIndicator color="#FFF" /> : (
                    <Text style={styles.buttonText}>{isLogin ? 'Sign In' : 'Sign Up'}</Text>
                )}
            </TouchableOpacity>

            {isLogin && (
                <TouchableOpacity onPress={() => setIsForgotPassword(true)} style={styles.forgotButton}>
                    <Text style={[styles.forgotText, { color: colors.textMuted }]}>Forgot Password?</Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.switchButton}>
                <Text style={[styles.switchText, { color: colors.primary }]}>
                    {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                </Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {isForgotPassword ? renderForgotPassword() : renderAuth()}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: Theme.Spacing.l,
    },
    form: {
        padding: Theme.Spacing.xl,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 32,
        textAlign: 'center',
    },
    inputContainer: {
        marginBottom: 16,
    },
    input: {
        padding: 16,
        borderRadius: 12,
        fontSize: 16,
    },
    button: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    switchButton: {
        marginTop: 24,
        alignItems: 'center',
    },
    switchText: {
        fontSize: 14,
    },
    forgotButton: {
        marginTop: 16,
        alignItems: 'center',
    },
    forgotText: {
        fontSize: 14,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingRight: 12,
    },
    passwordInput: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    eyeButton: {
        padding: 4,
    },
    requirementsContainer: {
        marginTop: 0,
        marginBottom: 16,
        paddingHorizontal: 4,
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
    passwordHint: {
        fontSize: 12,
        marginBottom: 16,
        marginTop: -8,
        marginLeft: 4,
    }
});

