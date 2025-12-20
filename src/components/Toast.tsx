import React, { useRef, useEffect } from 'react';
import { Animated, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
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

    return (
        <Animated.View
            style={[
                styles.toast,
                { opacity: fadeAnim, backgroundColor: colors.surface },
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
