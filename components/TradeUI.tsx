import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, NativeScrollEvent, NativeSyntheticEvent, TouchableOpacity } from 'react-native';
import {globalFonts, colors } from '../styles/globalStyles';
import { FontAwesome6 } from '@expo/vector-icons';

//other actions
//   photo? open camera, no photo imports (react-native-image-picker or expo-image-picker or react-native-image-crop-picture)

export interface TradeAction {
    actionType: 'query' | 'counter' | 'stall' | 'accept' | 'decline' | 'where' | 'when';
    subAction?: 'add' | 'remove' | 'write' | 'select';
    data?: any;
}

interface TradeUIProps {
    onActionSelected?: (action: TradeAction) => void;
}

const TradeUI: React.FC<TradeUIProps> = ({ onActionSelected }) => {
    const ITEM_HEIGHT = 54; // tradeLine height + margin bottom
    const scrollViewRef = useRef<ScrollView>(null);
    const isScrollingRef = useRef(false);
    const [currentActionIndex, setCurrentActionIndex] = useState(0);
    const [isActionSelected, setIsActionSelected] = useState(false);
    
    const tradeActions = [
        { 
            text: 'QUERY', 
            color: colors.actions.query, 
            hasButtons: true,
            actionType: 'query' as const
        },
        { 
            text: 'COUNTER', 
            color: colors.actions.counter, 
            hasButtons: true,
            actionType: 'counter' as const
        },
        { 
            text: 'STALL', 
            color: colors.actions.time, 
            hasButtons: false,
            actionType: 'stall' as const
        },
        { 
            text: 'ACCEPT*', 
            color: colors.actions.accept, 
            hasButtons: false,
            actionType: 'accept' as const
        },
        { 
            text: 'DECLINE', 
            color: colors.actions.decline, 
            hasButtons: false,
            actionType: 'decline' as const
        },
        { 
            text: 'WHERE', 
            color: colors.actions.location, 
            hasButtons: true,
            actionType: 'where' as const
        },
        { 
            text: 'WHEN', 
            color: colors.actions.time, 
            hasButtons: true,
            actionType: 'when' as const
        },
    ];
    
    // Create tripled array for infinite scroll
    const infiniteActions = [...tradeActions, ...tradeActions, ...tradeActions];
    
    const scrollViewHeight = ITEM_HEIGHT * tradeActions.length - 8;
    
    const PlayAction = (subAction?: 'add' | 'remove' | 'write' | 'select') => {
        if (!isActionSelected && !subAction) return;
        
        const action = tradeActions[currentActionIndex];
        const tradeAction: TradeAction = {
            actionType: action.actionType,
            subAction: subAction
        };
        
        console.log('Playing action:', tradeAction);
        onActionSelected?.(tradeAction);
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
                onPress={() => PlayAction()}
                disabled={!isActionSelected}
            >
                <FontAwesome6 name={'arrow-right-long'} size={22} color={isActionSelected ? '#000' : tradeActions[currentActionIndex]?.color} />
            </TouchableOpacity>
            
            <View style={[styles.scrollViewContainer, { height: scrollViewHeight }]}>
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
                                            onPress={() => PlayAction('remove')}
                                            disabled={!isInTopSpot}
                                        >
                                            <FontAwesome6 name={'minus'} size={22} color={colors.actions.counter} />
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            style={[
                                                styles.counterPlusButton,
                                                { opacity: isInTopSpot ? 1 : 0.3 }
                                            ]}
                                            onPress={() => PlayAction('add')}
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
                                        onPress={() => PlayAction('write')}
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
                                        onPress={() => PlayAction('select')}
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
                                        onPress={() => PlayAction('select')}
                                        disabled={!isInTopSpot}
                                    >
                                        <FontAwesome6 name={'clock'} size={22} color={colors.actions.time} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        );
                    })}
                </ScrollView>
            </View>
        </View>
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
});

export default TradeUI;
