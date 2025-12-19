import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Theme } from '../../theme';
import { supabase } from '../../services/supabase';

export const AuthScreen = () => {
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
        <View style={styles.form}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>Enter your email to receive reset instructions</Text>

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    onChangeText={setEmail}
                    value={email}
                    placeholder="email@address.com"
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
            </View>

            <TouchableOpacity
                style={styles.button}
                onPress={resetPassword}
                disabled={loading}
            >
                {loading ? <ActivityIndicator color="#FFF" /> : (
                    <Text style={styles.buttonText}>Send Instructions</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsForgotPassword(false)} style={styles.switchButton}>
                <Text style={styles.switchText}>Back to Sign In</Text>
            </TouchableOpacity>
        </View>
    );

    const renderAuth = () => (
        <View style={styles.form}>
            <Text style={styles.title}>{isLogin ? 'Welcome Back' : 'Create Account'}</Text>
            <Text style={styles.subtitle}>{isLogin ? 'Sign in to access your workouts' : 'Start your training journey'}</Text>

            {!isLogin && (
                <>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            onChangeText={setFirstName}
                            value={firstName}
                            placeholder="First Name"
                        />
                    </View>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            onChangeText={setLastName}
                            value={lastName}
                            placeholder="Last Name"
                        />
                    </View>
                </>
            )}

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    onChangeText={setEmail}
                    value={email}
                    placeholder="email@address.com"
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
            </View>
            <View style={[styles.inputContainer, styles.passwordContainer]}>
                <TextInput
                    style={[styles.input, styles.passwordInput]}
                    onChangeText={setPassword}
                    value={password}
                    secureTextEntry={!showPassword}
                    placeholder="Password"
                    autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                    <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color={Theme.Colors.textSecondary} />
                </TouchableOpacity>
            </View>

            {!isLogin && (
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
            )}

            <TouchableOpacity
                style={styles.button}
                onPress={() => isLogin ? signInWithEmail() : signUpWithEmail()}
                disabled={loading}
            >
                {loading ? <ActivityIndicator color="#FFF" /> : (
                    <Text style={styles.buttonText}>{isLogin ? 'Sign In' : 'Sign Up'}</Text>
                )}
            </TouchableOpacity>

            {isLogin && (
                <TouchableOpacity onPress={() => setIsForgotPassword(true)} style={styles.forgotButton}>
                    <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.switchButton}>
                <Text style={styles.switchText}>
                    {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                </Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
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
        backgroundColor: Theme.Colors.background,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: Theme.Spacing.l,
    },
    form: {
        backgroundColor: Theme.Colors.surface,
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
        color: Theme.Colors.text,
    },
    subtitle: {
        fontSize: 16,
        color: Theme.Colors.textSecondary,
        marginBottom: 32,
        textAlign: 'center',
    },
    inputContainer: {
        marginBottom: 16,
    },
    input: {
        backgroundColor: Theme.Colors.background,
        padding: 16,
        borderRadius: 12,
        fontSize: 16,
    },
    button: {
        backgroundColor: Theme.Colors.primary,
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
        color: Theme.Colors.primary,
        fontSize: 14,
    },
    forgotButton: {
        marginTop: 16,
        alignItems: 'center',
    },
    forgotText: {
        color: Theme.Colors.textSecondary,
        fontSize: 14,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.Colors.background,
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
        color: Theme.Colors.danger,
        fontSize: 12,
        marginBottom: 10,
        fontWeight: '500',
    },
    passwordHint: {
        fontSize: 12,
        color: Theme.Colors.textSecondary,
        marginBottom: 16,
        marginTop: -8,
        marginLeft: 4,
    }
});
