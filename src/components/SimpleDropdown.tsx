import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, FlatList, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { Theme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface SimpleDropdownProps {
    value: string;
    options: string[];
    onSelect: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    label?: string;
    dropdownStyle?: StyleProp<ViewStyle>;
    dropdownTextStyle?: StyleProp<TextStyle>;
}

export const SimpleDropdown: React.FC<SimpleDropdownProps> = ({
    value,
    options,
    onSelect,
    placeholder = 'Select',
    disabled = false,
    style,
    textStyle,
    label,
    dropdownStyle,
    dropdownTextStyle
}) => {
    const { colors } = useTheme();
    const [visible, setVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
    const buttonRef = useRef<React.ElementRef<typeof TouchableOpacity>>(null);

    const openDropdown = () => {
        if (buttonRef.current) {
            buttonRef.current.measureInWindow((x, y, width, height) => {
                setPosition({ top: y + height + 4, left: x, width });
                setVisible(true);
            });
        }
    };

    const handleSelect = (item: string) => {
        onSelect(item);
        setVisible(false);
    };

    // Dynamic Styles
    const buttonStyle = { backgroundColor: colors.surface, borderColor: colors.border };
    const dropdownBgStyle = { backgroundColor: colors.surface, borderColor: colors.border };
    const itemTextStyle = { color: colors.text };
    const selectedItemStyle = { backgroundColor: colors.background }; // Use background color for selection highlight

    return (
        <>
            <TouchableOpacity
                ref={buttonRef}
                style={[
                    styles.button,
                    buttonStyle,
                    disabled && styles.disabledButton,
                    style
                ]}
                onPress={() => !disabled && openDropdown()}
                activeOpacity={disabled ? 1 : 0.7}
            >
                <Text style={[
                    styles.buttonText,
                    { color: colors.text },
                    disabled && { color: colors.textMuted },
                    textStyle
                ]}>
                    {label ? `${label}: ` : ''}{value ? value.toUpperCase() : placeholder}
                </Text>
                {!disabled && (
                    <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                )}
            </TouchableOpacity>

            <Modal
                transparent
                visible={visible}
                animationType="fade"
                onRequestClose={() => setVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setVisible(false)}
                >
                    <View style={[
                        styles.dropdownMenu,
                        dropdownBgStyle,
                        {
                            top: position.top,
                            left: position.left,
                            width: position.width,
                        },
                        dropdownStyle
                    ]}>
                        <FlatList
                            data={options}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.item,
                                        item === value && selectedItemStyle
                                    ]}
                                    onPress={() => handleSelect(item)}
                                >
                                    <Text style={[
                                        styles.itemText,
                                        itemTextStyle,
                                        item === value && { color: colors.primary, fontWeight: '600' },
                                        dropdownTextStyle
                                    ]}>
                                        {item.toUpperCase()}
                                    </Text>
                                    {item === value && (
                                        <Ionicons name="checkmark" size={18} color={colors.primary} />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        minWidth: 100,
    },
    disabledButton: {
        opacity: 0.6,
        borderColor: 'transparent'
    },
    buttonText: {
        fontSize: 14,
        fontWeight: '600',
        marginRight: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    dropdownMenu: {
        position: 'absolute',
        borderRadius: 12,
        maxHeight: 200,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
        borderWidth: 1,
        overflow: 'hidden',
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 14,
        // No bottom border for cleaner look, or maybe subtle separator
    },
    selectedItem: {
        backgroundColor: Theme.Colors.background, // Light highlight
    },
    itemText: {
        fontSize: 14,
        fontWeight: '500',
    },
});
