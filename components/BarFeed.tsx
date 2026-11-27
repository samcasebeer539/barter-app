import { View, StyleSheet, TouchableOpacity, Animated, TextInput } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useState, useRef } from 'react';
import { globalFonts, colors } from '../styles/globalStyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TEXT_LIMITS } from '@/config/textLimits';

interface FeedBarProps {
    showLocation: boolean;
    onLocationPress: () => void;
    headerTranslateY: Animated.Value;
    onSearchSubmit: (query: string) => void;
    onSearchClear: () => void;
    onSortPress: () => void;
}

export default function FeedBar({ headerTranslateY, onSearchSubmit, onSearchClear, onSortPress }: FeedBarProps) {
    const [searchText, setSearchText] = useState('');
    const [searchActive, setSearchActive] = useState(false);
    const searchInputRef = useRef<TextInput>(null);
    const insets = useSafeAreaInsets();

    const handleSearchSubmit = () => {
        const query = searchText.trim();
        if (query.length > 0) {
            setSearchActive(true);
            onSearchSubmit(query);
        }
    }
    const clearSearch = () => {
        setSearchText("");
        setSearchActive(false);
        searchInputRef.current?.blur()
        onSearchClear();
    }

    const handleSearchBarPress = () => {
        searchInputRef.current?.focus();
    };


    return (
        <>
            {/* Top Gradient Overlay */}

            <Animated.View
                style={[
                    styles.topIconsContainer,
                    { paddingTop: insets.top, transform: [{ translateY: headerTranslateY }] }
                ]}
            >
                <TouchableOpacity
                    style={styles.searchBar}
                    onPress={handleSearchBarPress}
                    activeOpacity={1}
                >
                    <TextInput
                        keyboardAppearance="dark"
                        ref={searchInputRef}
                        style={styles.searchInput}
                        placeholder="Search"
                        maxLength={TEXT_LIMITS.search}
                        placeholderTextColor={colors.ui.secondarydisabled}
                        value={searchText}
                        onChangeText={setSearchText}
                        returnKeyType="done"
                        onSubmitEditing={handleSearchSubmit}
                    />
                    {/* Magnifying glass on the right; while a search is
                        showing, an X there clears it instead. */}
                    {searchActive ? (
                        <TouchableOpacity onPress={clearSearch} hitSlop={8}>
                            <FontAwesome6
                                name="circle-xmark"
                                size={22}
                                color={colors.ui.secondarydisabled}
                            />
                        </TouchableOpacity>
                    ) : (
                        <FontAwesome6 name="magnifying-glass" size={20} color={colors.ui.secondarydisabled} />
                    )}
                </TouchableOpacity>
                {/* Sort: its own button on the right, like the other icon buttons. */}
                <TouchableOpacity style={styles.sortButton} onPress={onSortPress}>
                    <FontAwesome6 name="sliders" size={22} color="#FFFFFF" />
                </TouchableOpacity>
                
            </Animated.View>
        </>
    );
}

const styles = StyleSheet.create({
    topIconsContainer: {
        backgroundColor: colors.ui.background,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 4,
        paddingHorizontal: 12,
        zIndex: 10,
        paddingBottom: 8,
    },

    topGradientContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 40,
        zIndex: 5,
        pointerEvents: 'none',
    },
    topGradient: {
        flex: 1,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        fontFamily: globalFonts.regular,
    },

    saveButton: {
        width: 50,
        height: 44,
        borderTopLeftRadius: 25,
        borderBottomLeftRadius: 2,
        borderTopRightRadius: 2,
        borderBottomRightRadius: 2,
        backgroundColor: colors.ui.secondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    locationButton: {
        width: 50,
        height: 44,
        borderTopLeftRadius: 25,
        borderBottomLeftRadius: 2,
        borderTopRightRadius: 2,
        borderBottomRightRadius: 2,
        backgroundColor: colors.ui.secondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Sort button + search bar read as one pill: rounded outer corners,
    // 2px inner ones, 4px apart (the container's gap).
    searchBar: {
        flex: 1,
        height: 44,
        borderTopLeftRadius: 25,
        borderBottomLeftRadius: 2,
        borderTopRightRadius: 2,
        borderBottomRightRadius: 2,
        backgroundColor: colors.ui.secondary,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
    },

    sortButton: {
        width: 50,
        height: 44,
        borderTopLeftRadius: 2,
        borderBottomLeftRadius: 2,
        borderTopRightRadius: 25,
        borderBottomRightRadius: 2,
        backgroundColor: colors.ui.secondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
