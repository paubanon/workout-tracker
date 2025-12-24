import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Modal } from 'react-native';
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
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [consentGiven, setConsentGiven] = useState(false);
    const [showConsentModal, setShowConsentModal] = useState(false);

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

        if (!consentGiven) {
            Alert.alert('Consent Required', 'You must agree to the data processing terms to sign up.');
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

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            setShowOtpInput(true);
            Alert.alert('Success', 'Please check your inbox for verification code!');
        }
        setLoading(false);
    }

    async function verifyOtp() {
        if (otpCode.length < 6 || otpCode.length > 8) {
            Alert.alert('Error', 'Please enter a valid code.');
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.verifyOtp({
            email,
            token: otpCode,
            type: 'signup'
        });

        if (error) {
            Alert.alert('Error', error.message);
        }
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

    const renderOtpInput = () => (
        <View style={[styles.form, { backgroundColor: colors.surface }]}>
            <Text style={[styles.title, { color: colors.text }]}>Verify Email</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                Enter the code sent to {email}
            </Text>

            <View style={styles.inputContainer}>
                <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text, textAlign: 'center', letterSpacing: 10, fontSize: 24 }]}
                    onChangeText={setOtpCode}
                    value={otpCode}
                    placeholder="00000000"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={8}
                />
            </View>

            <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.primary }]}
                onPress={verifyOtp}
                disabled={loading}
            >
                {loading ? <ActivityIndicator color="#FFF" /> : (
                    <Text style={styles.buttonText}>Verify Code</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowOtpInput(false)} style={styles.switchButton}>
                <Text style={[styles.switchText, { color: colors.primary }]}>Back to Sign Up</Text>
            </TouchableOpacity>
        </View>
    );

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

            {!isLogin && (
                <View style={styles.consentContainer}>
                    <TouchableOpacity onPress={() => setConsentGiven(!consentGiven)} style={styles.checkboxContainer}>
                        <Ionicons
                            name={consentGiven ? "checkbox" : "square-outline"}
                            size={24}
                            color={consentGiven ? colors.primary : colors.textMuted}
                        />
                    </TouchableOpacity>
                    <View style={styles.consentTextContainer}>
                        <Text style={[styles.consentText, { color: colors.textMuted }]}>
                            I agree to the {' '}
                            <Text
                                style={{ color: colors.primary, textDecorationLine: 'underline' }}
                                onPress={() => setShowConsentModal(true)}
                            >
                                processing of my data
                            </Text>
                            {' '}by this app as well as third parties.
                        </Text>
                    </View>
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
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                {showOtpInput ? renderOtpInput() : (isForgotPassword ? renderForgotPassword() : renderAuth())}

                <Modal
                    visible={showConsentModal}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowConsentModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Privacy Policy & Data Processing Agreement</Text>
                            <ScrollView style={styles.modalScroll}>
                                <Text style={[styles.modalText, { color: colors.textMuted, marginBottom: 16 }]}>
                                    Last Updated: December 2024
                                </Text>

                                <Text style={[styles.sectionHeader, { color: colors.text }]}>1. Data Controller</Text>
                                <Text style={[styles.modalText, { color: colors.text }]}>
                                    The data controller responsible for processing your personal data is Workout Lab ("we", "us", "our"). For any inquiries regarding your data, please contact us via the in-app "Send me a Message" feature in Settings.
                                </Text>

                                <Text style={[styles.sectionHeader, { color: colors.text }]}>2. Types of Personal Data Collected</Text>
                                <Text style={[styles.modalText, { color: colors.text }]}>
                                    We collect and process the following categories of personal data:{'\n'}
                                    • Account Information: Email address, password (encrypted).{'\n'}
                                    • Profile Information: First name, last name, sex, weight history, birthday.{'\n'}
                                    • Workout Data: Exercise logs, workout templates, session history, pain entries, goals and performance metrics.{'\n'}
                                    • Technical Data: Device type, operating system, and app usage analytics (anonymized).
                                </Text>

                                <Text style={[styles.sectionHeader, { color: colors.text }]}>3. Purposes and Legal Basis for Processing</Text>
                                <Text style={[styles.modalText, { color: colors.text }]}>
                                    We process your data for the following purposes:{'\n'}
                                    • <Text style={styles.boldText}>Contractual Necessity (Art. 6(1)(b) GDPR):</Text> To provide the core functionality of the app, including tracking workouts, saving templates, and displaying your history.{'\n'}
                                    • <Text style={styles.boldText}>Consent (Art. 6(1)(a) GDPR):</Text> For optional features, such as receiving personalized AI-powered workout recommendations (if enabled in the future). You can withdraw consent at any time.{'\n'}
                                    • <Text style={styles.boldText}>Legitimate Interests (Art. 6(1)(f) GDPR):</Text> To improve our services, fix bugs, and ensure app security.
                                </Text>

                                <Text style={[styles.sectionHeader, { color: colors.text }]}>4. Data Retention</Text>
                                <Text style={[styles.modalText, { color: colors.text }]}>
                                    Your personal data is retained for as long as your account is active. If you delete your account, all associated data will be permanently removed from our systems within 30 days, except where we are legally required to retain certain records.
                                </Text>

                                <Text style={[styles.sectionHeader, { color: colors.text }]}>5. Third-Party Data Processors</Text>
                                <Text style={[styles.modalText, { color: colors.text }]}>
                                    We share your data with the following third-party processors who act on our behalf:{'\n'}
                                    • <Text style={styles.boldText}>Supabase (Database & Authentication):</Text> Your account and workout data are stored securely on Supabase servers. Supabase is GDPR-compliant and data is hosted in AWS data centers in the EU.{'\n'}
                                    • <Text style={styles.boldText}>Future AI Services:</Text> In the future, we may integrate third-party AI services to provide personalized insights. Before any such integration, we will update this policy and seek your explicit consent where required.
                                </Text>

                                <Text style={[styles.sectionHeader, { color: colors.text }]}>6. International Data Transfers</Text>
                                <Text style={[styles.modalText, { color: colors.text }]}>
                                    Your data is primarily stored within the European Union. In cases where data is transferred outside the EU/EEA, we ensure appropriate safeguards are in place, such as Standard Contractual Clauses approved by the European Commission.
                                </Text>

                                <Text style={[styles.sectionHeader, { color: colors.text }]}>7. Your Rights Under GDPR</Text>
                                <Text style={[styles.modalText, { color: colors.text }]}>
                                    As a data subject in the EU, you have the following rights:{'\n'}
                                    • <Text style={styles.boldText}>Right of Access:</Text> Request a copy of your personal data.{'\n'}
                                    • <Text style={styles.boldText}>Right to Rectification:</Text> Correct inaccurate or incomplete data via your profile settings.{'\n'}
                                    • <Text style={styles.boldText}>Right to Erasure:</Text> Delete your account and all associated data at any time via Settings {'>'} Delete Account.{'\n'}
                                    • <Text style={styles.boldText}>Right to Data Portability:</Text> Export your data in a machine-readable format via Settings {'>'} Export Data.{'\n'}
                                    • <Text style={styles.boldText}>Right to Object:</Text> Object to processing based on legitimate interests.{'\n'}
                                    • <Text style={styles.boldText}>Right to Restrict Processing:</Text> Request limitation of processing in certain circumstances.{'\n'}
                                    • <Text style={styles.boldText}>Right to Withdraw Consent:</Text> Where processing is based on consent, you may withdraw it at any time without affecting the lawfulness of prior processing.
                                </Text>

                                <Text style={[styles.sectionHeader, { color: colors.text }]}>8. Data Security</Text>
                                <Text style={[styles.modalText, { color: colors.text }]}>
                                    We implement appropriate technical and organizational measures to protect your data, including:{'\n'}
                                    • Secure password storage using industry-standard hashing algorithms.{'\n'}
                                    • Encrypted data transmission (HTTPS/TLS).{'\n'}
                                    • Row-Level Security policies on our database to ensure users can only access their own data.
                                </Text>

                                <Text style={[styles.sectionHeader, { color: colors.text }]}>9. Children's Privacy</Text>
                                <Text style={[styles.modalText, { color: colors.text }]}>
                                    This app is not intended for use by individuals under the age of 16. We do not knowingly collect personal data from children.
                                </Text>

                                <Text style={[styles.sectionHeader, { color: colors.text }]}>10. Changes to This Policy</Text>
                                <Text style={[styles.modalText, { color: colors.text }]}>
                                    We may update this Privacy Policy from time to time. We will notify you of any significant changes via the app or email. Continued use of the app after such changes constitutes acceptance of the updated policy.
                                </Text>

                                <Text style={[styles.sectionHeader, { color: colors.text }]}>11. Contact & Complaints</Text>
                                <Text style={[styles.modalText, { color: colors.text }]}>
                                    If you have questions or wish to exercise your rights, please contact us via the in-app message feature. You also have the right to lodge a complaint with a supervisory authority in your country of residence.
                                </Text>
                            </ScrollView>
                            <TouchableOpacity
                                style={[styles.button, { backgroundColor: colors.primary, marginTop: 16 }]}
                                onPress={() => setShowConsentModal(false)}
                            >
                                <Text style={styles.buttonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
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
    },
    consentContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 20,
        paddingHorizontal: 4,
    },
    checkboxContainer: {
        marginRight: 10,
        marginTop: 2,
    },
    consentTextContainer: {
        flex: 1,
    },
    consentText: {
        fontSize: 13,
        lineHeight: 18,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: Theme.Spacing.l,
    },
    modalContent: {
        borderRadius: Theme.BorderRadius.l,
        padding: Theme.Spacing.l,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: Theme.Typography.h2.fontSize,
        fontWeight: Theme.Typography.h2.fontWeight,
        marginBottom: Theme.Spacing.m,
        textAlign: 'center',
    },
    modalScroll: {
        marginBottom: Theme.Spacing.m,
    },
    modalText: {
        fontSize: Theme.Typography.body.fontSize,
        lineHeight: 22,
        marginBottom: Theme.Spacing.s,
    },
    sectionHeader: {
        fontSize: Theme.Typography.subtitle.fontSize,
        fontWeight: Theme.Typography.subtitle.fontWeight,
        marginTop: Theme.Spacing.m,
        marginBottom: Theme.Spacing.s,
    },
    boldText: {
        fontWeight: Theme.Typography.weight.bold,
    }
});

