import React, { useRef, useEffect } from 'react';
import { Animated, Text, StyleSheet, ViewStyle, StyleProp, Keyboard, Platform, KeyboardEvent } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Theme } from '../theme';

interface ToastProps {
    message: string;
    visible: boolean;
    onHide: () => void;
    duration?: number;
    style?: StyleProp<ViewStyle>;
}

/**
 * Toast - A reusable toast notification component
 * 
 * Displays a message at the bottom of the screen with a fade animation.
 * Automatically hides after the specified duration.
 */
export const Toast: React.FC<ToastProps> = ({
    message,
    visible,
    onHide,
    duration = 1500,
    style
}) => {
    const { colors } = useTheme();
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Track keyboard height to show toast above it
    const [keyboardOffset, setKeyboardOffset] = React.useState(0);

    useEffect(() => {
        const showSubscription = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            (e) => setKeyboardOffset(e.endCoordinates.height)
        );
        const hideSubscription = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => setKeyboardOffset(0)
        );

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    useEffect(() => {
        if (visible) {
            // Fade in
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true
            }).start();

            // Auto hide after duration
            const timer = setTimeout(() => {
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true
                }).start(() => onHide());
            }, duration);

            return () => clearTimeout(timer);
        } else {
            // Reset animation value when not visible
            fadeAnim.setValue(0);
        }
    }, [visible, duration, onHide]);

    if (!visible) return null;

    // Calculate bottom position: default 40, or keyboardHeight + 20
    const bottomPosition = keyboardOffset > 0 ? keyboardOffset + 20 : 40;

    return (
        <Animated.View
            style={[
                styles.toast,
                { opacity: fadeAnim, backgroundColor: colors.surface, bottom: bottomPosition },
                style
            ]}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
        >
            <Text style={[styles.toastText, { color: colors.text }]}>{message}</Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    toast: {
        position: 'absolute',
        bottom: 40,
        alignSelf: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 5,
        zIndex: 1000,
    },
    toastText: {
        fontWeight: '600',
        fontSize: Theme.Typography.scale.md,
    },
});
