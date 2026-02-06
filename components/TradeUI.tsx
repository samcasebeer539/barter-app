import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, PanResponder, Animated, TouchableOpacity, ScrollView, Text, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import Deck from './Deck';
import {globalFonts, colors } from '../styles/globalStyles';
import { FontAwesome6 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

//other actions
//   photo? open camera, no photo imports (react-native-image-picker or expo-image-picker or react-native-image-crop-picture)
//   stall (skip turn)

//turn description -> appears upon clicking action word

//note: modal would be much easier 
//  remove deck 
//  - deck modal for counter (just a selector button and a play button, select -> play (close deck) -> play counter)
//  - modals for time/location?



interface TradeUIProps {

}

const TradeUI: React.FC<TradeUIProps> = ({ }) => {
    const ITEM_HEIGHT = 54; // tradeLine height + margin bottom
    const scrollViewRef = useRef<ScrollView>(null);
    const isScrollingRef = useRef(false);
    const [currentActionIndex, setCurrentActionIndex] = useState(0);
    const [isActionSelected, setIsActionSelected] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const collapseAnimation = useRef(new Animated.Value(1)).current;
    const deckAnimation = useRef(new Animated.Value(0)).current;
    
    const tradeActions = [
        { text: 'QUERY', color: colors.actions.query, hasButtons: true },
        { text: 'COUNTER', color: colors.actions.counter, hasButtons: true },
        { text: 'STALL', color: colors.actions.time, hasButtons: true },
        { text: 'ACCEPT*', color: colors.actions.accept, hasButtons: false },
        { text: 'DECLINE', color: colors.actions.decline, hasButtons: false },
        
        { text: 'WHERE', color: colors.actions.location, hasButtons: true },
        { text: 'WHEN', color: colors.actions.time, hasButtons: true },
        
    ];
    
    // Create tripled array for infinite scroll
    const infiniteActions = [...tradeActions, ...tradeActions, ...tradeActions];
    
    // Sample data for Deck - replace with your actual data
    const deckPosts = [
        {
            type: 'service' as const,
            name: 'Bike Repair Service',
            description: 'Professional bike repair and maintenance services. I have over 10 years of experience fixing all types of bikes from mountain bikes to road bikes.',
            photos: [
            'https://picsum.photos/seed/landscape1/800/400',
            'https://picsum.photos/seed/portrait1/400/600',
            'https://picsum.photos/seed/square1/500/500',
            ],
        },
        {
            type: 'good' as const,
            name: 'Vintage Camera Collection',
            description: 'Beautiful vintage cameras from the 1960s-1980s. Perfect working condition, includes lenses and cases.',
            photos: [
            'https://picsum.photos/seed/camera1/600/400',
            'https://picsum.photos/seed/camera2/500/700',
            'https://picsum.photos/seed/camera3/600/600',
            ],
        },
        {
            type: 'service' as const,
            name: 'Guitar Lessons',
            description: 'Experienced guitar teacher offering beginner to intermediate lessons. All ages welcome!',
            photos: [
            'https://picsum.photos/seed/guitar1/700/500',
            'https://picsum.photos/seed/guitar2/400/600',
            'https://picsum.photos/seed/guitar3/500/500',
            ],
        },
    ];
    
    const toggleCollapse = () => {
        const toValue = isCollapsed ? 1 : 0;
        const deckToValue = isCollapsed ? 0 : 1;
        
        Animated.parallel([
            Animated.timing(collapseAnimation, {
                toValue,
                duration: 300,
                useNativeDriver: false,
            }),
            Animated.timing(deckAnimation, {
                toValue: deckToValue,
                duration: 300,
                useNativeDriver: false,
            })
        ]).start();
        
        setIsCollapsed(!isCollapsed);
    };
    
    const containerHeight = collapseAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [ITEM_HEIGHT, ITEM_HEIGHT * tradeActions.length - 8],
    });
    
    const deckHeight = deckAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 480], // Adjust the expanded height as needed
    });
    
    const deckOpacity = deckAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });
    const deckPaddingTop = deckAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 216],
    });
    
    const PlayAction = () => {
        if (!isActionSelected) return;
        // Execute the selected action here
        console.log('Playing action:', tradeActions[currentActionIndex].text);
    };

    const handleCounterPlus = () => {
        toggleCollapse();
        // Execute the selected action here
        console.log('Deck revealed');
    };
    
    const handleActionTextPress = (index: number) => {
        const actualIndex = index % tradeActions.length;
        if (actualIndex === currentActionIndex) {
            setIsActionSelected((prev) => !prev);
        }
    };
    
    const isActionInTopSpot = (index: number) => {
        const actualIndex = index % tradeActions.length;
        return actualIndex === currentActionIndex;
    };
    
    useEffect(() => {
        // Start at the middle section (first item of middle section aligned with play button)
        setTimeout(() => {
            scrollViewRef.current?.scrollTo({ y: ITEM_HEIGHT * tradeActions.length, animated: false });
            setCurrentActionIndex(0);
        }, 100);
    }, []);
    
    const handleScrollBeginDrag = () => {
        isScrollingRef.current = true;
        setIsActionSelected(false); // Reset selection when scrolling
    };
    
    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        
        // Calculate which item is at the top
        let itemIndex = Math.round(offsetY / ITEM_HEIGHT) % tradeActions.length;
        
        // Ensure itemIndex is always positive and within bounds
        if (itemIndex < 0) {
            itemIndex = (itemIndex + tradeActions.length) % tradeActions.length;
        }
        
        if (itemIndex !== currentActionIndex) {
            setIsActionSelected(false); // Reset selection when action changes
        }
        
        setCurrentActionIndex(itemIndex);
    };
    
    const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (!isScrollingRef.current) return;
        
        const offsetY = event.nativeEvent.contentOffset.y;
        const contentHeight = ITEM_HEIGHT * tradeActions.length;
        
        // If scrolled to top section, jump to middle section
        if (offsetY < ITEM_HEIGHT * 2) {
            const newOffset = offsetY + contentHeight;
            scrollViewRef.current?.scrollTo({ y: newOffset, animated: false });
            
            // Update index after jump
            let itemIndex = Math.round(newOffset / ITEM_HEIGHT) % tradeActions.length;
            if (itemIndex < 0) {
                itemIndex = (itemIndex + tradeActions.length) % tradeActions.length;
            }
            setCurrentActionIndex(itemIndex);
        }
        // If scrolled to bottom section, jump to middle section
        else if (offsetY >= contentHeight * 2 - ITEM_HEIGHT * 2) {
            const newOffset = offsetY - contentHeight;
            scrollViewRef.current?.scrollTo({ y: newOffset, animated: false });
            
            // Update index after jump
            let itemIndex = Math.round(newOffset / ITEM_HEIGHT) % tradeActions.length;
            if (itemIndex < 0) {
                itemIndex = (itemIndex + tradeActions.length) % tradeActions.length;
            }
            setCurrentActionIndex(itemIndex);
        }
        
        isScrollingRef.current = false;
    };
    
    return (
    <View style={styles.container}>
        
        <View style={styles.row}>
            
            <TouchableOpacity 
                style={[
                    styles.playButton, 
                    { 
                        backgroundColor: isActionSelected 
                            ? tradeActions[currentActionIndex]?.color 
                            : colors.ui.background,
                        borderColor: tradeActions[currentActionIndex]?.color,
                        opacity: isActionSelected ? 1 : 1
                    }
                ]}
                onPress={PlayAction}
                disabled={!isActionSelected}
            >
                <FontAwesome6 name={'arrow-right-long'} size={22} color={isActionSelected ? '#000' : tradeActions[currentActionIndex]?.color} />
            </TouchableOpacity>
            
            <Animated.View style={[styles.scrollViewContainer, { height: containerHeight }]}>
                <ScrollView 
                    ref={scrollViewRef}
                    style={styles.scrollView}
                    snapToInterval={ITEM_HEIGHT}
                    snapToAlignment="start"
                    decelerationRate="fast"
                    showsVerticalScrollIndicator={false}
                    onScrollBeginDrag={handleScrollBeginDrag}
                    onScroll={handleScroll}
                    onMomentumScrollEnd={handleMomentumScrollEnd}
                    scrollEventThrottle={16}
                    pagingEnabled={false}
                    scrollEnabled={!isCollapsed}
                >
                    {infiniteActions.map((action, index) => {
                        const isInTopSpot = isActionInTopSpot(index);
                        
                        return (
                            <View key={index} style={styles.tradeLine}>
                                <TouchableOpacity onPress={() => handleActionTextPress(index)} style={{ flex: 1 }}>
                                    <Text style={[styles.tradeLineText, { color: action.color }]}>{action.text}</Text>
                                </TouchableOpacity>
                                
                                {action.hasButtons && action.text === 'COUNTER' && (
                                    <>
                                        <TouchableOpacity 
                                            style={[
                                                styles.counterMinusButton,
                                                { opacity: isInTopSpot ? 1 : 0.3 }
                                            ]}
                                            onPress={PlayAction}
                                            disabled={!isInTopSpot}
                                        >
                                            <FontAwesome6 name={'minus'} size={22} color={colors.actions.counter} />
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            style={[
                                                styles.counterPlusButton,
                                                { opacity: isInTopSpot ? 1 : 0.3 }
                                            ]}
                                            onPress={handleCounterPlus}
                                            disabled={!isInTopSpot}
                                        >
                                            <FontAwesome6 name={'plus'} size={22} color={colors.actions.counter} />
                                        </TouchableOpacity>
                                    </>
                                )}
                                
                                {action.hasButtons && action.text === 'QUERY' && (
                                    <TouchableOpacity 
                                        style={[
                                            styles.queryButton,
                                            { opacity: isInTopSpot ? 1 : 0.3 }
                                        ]}
                                        onPress={PlayAction}
                                        disabled={!isInTopSpot}
                                    >
                                        <FontAwesome6 name={'pen-to-square'} size={22} color={colors.actions.query} />
                                    </TouchableOpacity>
                                )}

                                {action.hasButtons && action.text === 'WHERE' && (
                                    <TouchableOpacity 
                                        style={[
                                            styles.locationButton,
                                            { opacity: isInTopSpot ? 1 : 0.3 }
                                        ]}
                                        onPress={PlayAction}
                                        disabled={!isInTopSpot}
                                    >
                                        <FontAwesome6 name={'location-dot'} size={22} color={colors.actions.location} />
                                    </TouchableOpacity>
                                )}

                                {action.hasButtons && action.text === 'WHEN' && (
                                    <TouchableOpacity 
                                        style={[
                                            styles.timeButton,
                                            { opacity: isInTopSpot ? 1 : 0.3 }
                                        ]}
                                        onPress={PlayAction}
                                        disabled={!isInTopSpot}
                                    >
                                        <FontAwesome6 name={'clock'} size={22} color={colors.actions.time} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        );
                    })}
                </ScrollView>
            </Animated.View>
            
            
        </View>
        
        {/* Deck Section - only render when collapsed */}
        <Animated.View 
            style={[
                styles.deckContainer,
                { 
                    height: deckHeight,
                    opacity: deckOpacity,
                    paddingTop: deckPaddingTop,
                }
            ]}
            onStartShouldSetResponder={() => false}
        >
            {isCollapsed && <Deck posts={deckPosts} />}
        </Animated.View>
    </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'flex-start',
        backgroundColor: colors.ui.background,
        marginVertical: 12,
        marginHorizontal: 12,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        gap: 4,
        
    },
    scrollViewContainer: {
        overflow: 'hidden',
        flex: 1,
        
    },
    scrollView: {
        flex: 1,
      
    },
    tradeLine: {
        flexDirection: 'row', 
        gap: 4,
        height: 64,
        alignItems: 'center',
        marginBottom: -10,
    },
    tradeLineText: {
        fontSize: 48,
        fontFamily: globalFonts.extrabold,
        bottom: 18,
    },

    playButton: {
        justifyContent: 'center',
        alignItems: 'center',
        height: 40,
        width: 50,
        borderTopLeftRadius: 2,
        borderBottomLeftRadius: 25,
        borderTopRightRadius: 25,
        borderBottomRightRadius: 2,
        borderWidth: 3,
    
    },
    counterMinusButton: {
        justifyContent: 'center',
        alignItems: 'center',
        height: 40,
        width: 48,
        borderTopLeftRadius: 25,
        borderBottomLeftRadius: 2,
        borderTopRightRadius: 2,
        borderBottomRightRadius: 2,
        bottom: 12,
        borderWidth: 3,
        borderColor: colors.actions.counter
    },
    counterPlusButton: {
        justifyContent: 'center',
        alignItems: 'center',
        height: 40,
        width: 48,
        borderTopLeftRadius: 2,
        borderBottomLeftRadius: 2,
        borderTopRightRadius: 2,
        borderBottomRightRadius: 25,
        bottom: 12,
        borderWidth: 3,
        borderColor: colors.actions.counter
    },
    queryButton: {
        
        justifyContent: 'center',
        alignItems: 'center',
        height: 40,
        width: 50,
        borderTopLeftRadius: 25,
        borderBottomLeftRadius: 2,
        borderTopRightRadius: 2,
        borderBottomRightRadius: 25,
        bottom: 12,
        borderWidth: 3,
        borderColor: colors.actions.query
    },
    locationButton: {
        
        justifyContent: 'center',
        alignItems: 'center',
        height: 40,
        width: 50,
        borderTopLeftRadius: 25,
        borderBottomLeftRadius: 2,
        borderTopRightRadius: 2,
        borderBottomRightRadius: 25,
        bottom: 12,
        borderWidth: 3,
        borderColor: colors.actions.location
    },
    timeButton: {
        justifyContent: 'center',
        alignItems: 'center',
        height: 40,
        width: 50,
        borderTopLeftRadius: 25,
        borderBottomLeftRadius: 2,
        borderTopRightRadius: 2,
        borderBottomRightRadius: 25,
        bottom: 12,
        borderWidth: 3,
        borderColor: colors.actions.time
    },
    deckContainer: {
        width: '100%',
        
        paddingHorizontal: 24,
        right: 12,
    },
    gradientTop: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 40,
        zIndex: 10,
    },
    gradientBottom: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 40,
        zIndex: 10,
    },
});

export default TradeUI;