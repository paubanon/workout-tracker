import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Theme } from '../../theme';
import { supabase } from '../../services/supabase';

export const AuthScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isLogin, setIsLogin] = useState(true);

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
        setLoading(true);
        const { error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) Alert.alert('Error', error.message);
        else Alert.alert('Success', 'Please check your inbox for email verification!');
        setLoading(false);
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.form}>
                <Text style={styles.title}>{isLogin ? 'Welcome Back' : 'Create Account'}</Text>
                <Text style={styles.subtitle}>{isLogin ? 'Sign in to access your workouts' : 'Start your training journey'}</Text>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        onChangeText={(text) => setEmail(text)}
                        value={email}
                        placeholder="email@address.com"
                        autoCapitalize="none"
                    />
                </View>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        onChangeText={(text) => setPassword(text)}
                        value={password}
                        secureTextEntry={true}
                        placeholder="Password"
                        autoCapitalize="none"
                    />
                </View>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() => isLogin ? signInWithEmail() : signUpWithEmail()}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#FFF" /> : (
                        <Text style={styles.buttonText}>{isLogin ? 'Sign In' : 'Sign Up'}</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.switchButton}>
                    <Text style={styles.switchText}>
                        {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.Colors.background,
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
    }
});
