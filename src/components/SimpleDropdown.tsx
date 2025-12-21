import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, FlatList, ViewStyle, TextStyle, Dimensions } from 'react-native';
import { Theme } from '../theme';
import { Ionicons } from '@expo/vector-icons';

interface SimpleDropdownProps {
    value: string;
    options: string[];
    onSelect: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    label?: string;
}

export const SimpleDropdown: React.FC<SimpleDropdownProps> = ({
    value,
    options,
    onSelect,
    placeholder = 'Select',
    disabled = false,
    style,
    textStyle,
    label
}) => {
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

    return (
        <>
            <TouchableOpacity
                ref={buttonRef}
                style={[
                    styles.button,
                    disabled && styles.disabledButton,
                    style
                ]}
                onPress={() => !disabled && openDropdown()}
                activeOpacity={disabled ? 1 : 0.7}
            >
                <Text style={[
                    styles.buttonText,
                    disabled && styles.disabledText,
                    textStyle
                ]}>
                    {label ? `${label}: ` : ''}{value ? value.toUpperCase() : placeholder}
                </Text>
                {!disabled && (
                    <Ionicons name="chevron-down" size={16} color={Theme.Colors.textSecondary} />
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
                        {
                            top: position.top,
                            left: position.left,
                            width: position.width,
                        }
                    ]}>
                        <FlatList
                            data={options}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.item,
                                        item === value && styles.selectedItem
                                    ]}
                                    onPress={() => handleSelect(item)}
                                >
                                    <Text style={[
                                        styles.itemText,
                                        item === value && styles.selectedItemText
                                    ]}>
                                        {item.toUpperCase()}
                                    </Text>
                                    {item === value && (
                                        <Ionicons name="checkmark" size={18} color={Theme.Colors.primary} />
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
        backgroundColor: Theme.Colors.surface,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Theme.Colors.border,
        minWidth: 100,
    },
    disabledButton: {
        backgroundColor: Theme.Colors.background,
        opacity: 0.6,
        borderColor: 'transparent'
    },
    buttonText: {
        fontSize: 14,
        fontWeight: '600',
        color: Theme.Colors.text,
        marginRight: 8,
    },
    disabledText: {
        color: Theme.Colors.textSecondary,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'transparent', // Make overlay transparent so it feels like a popup
    },
    dropdownMenu: {
        position: 'absolute',
        backgroundColor: Theme.Colors.surface,
        borderRadius: 12,
        maxHeight: 200,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 }, // Drop down shadow
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
        borderWidth: 1,
        borderColor: Theme.Colors.border, // Subtle border
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
        fontSize: 14, // Match button text
        color: Theme.Colors.text,
        fontWeight: '500',
    },
    selectedItemText: {
        color: Theme.Colors.primary,
        fontWeight: '600',
    }
});
