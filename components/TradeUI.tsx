import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, NativeScrollEvent, NativeSyntheticEvent, TouchableOpacity } from 'react-native';
import { globalFonts, colors } from '../styles/globalStyles';
import { FontAwesome6 } from '@expo/vector-icons';
import { TRADE_ACTIONS, TradeActionType } from '../config/tradeConfig';

export interface TradeAction {
    actionType: TradeActionType;
    subAction?: 'add' | 'remove' | 'write' | 'select';
    data?: any;
}

interface TradeUIProps {
    onActionSelected?: (action: TradeAction) => void;
}

const TradeUI: React.FC<TradeUIProps> = ({ onActionSelected }) => {
    const ITEM_HEIGHT = 54;
    const INITIAL_SCROLL_DELAY = 100;
    const SCROLL_THRESHOLD = 2; // Items from edge before we loop
    
    const scrollViewRef = useRef<ScrollView>(null);
    const isScrollingRef = useRef(false);
    const [currentActionIndex, setCurrentActionIndex] = useState(0);
    const [isActionSelected, setIsActionSelected] = useState(false);
    
    // Create tripled array for infinite scroll
    const infiniteActions = [...TRADE_ACTIONS, ...TRADE_ACTIONS, ...TRADE_ACTIONS];
    const scrollViewHeight = ITEM_HEIGHT - 8;
    
    const currentAction = TRADE_ACTIONS[currentActionIndex];
    
    const PlayAction = (subAction?: 'add' | 'remove' | 'write' | 'select') => {
        if (!isActionSelected && !subAction) return;
        
        const tradeAction: TradeAction = {
            actionType: currentAction.actionType,
            subAction: subAction
        };
        
        console.log('Playing action:', tradeAction);
        onActionSelected?.(tradeAction);
    };
    
    const handleActionTextPress = (index: number) => {
        const actualIndex = index % TRADE_ACTIONS.length;
        if (actualIndex === currentActionIndex) {
            setIsActionSelected((prev) => !prev);
        }
    };
    
    const isActionInTopSpot = (index: number) => {
        return index % TRADE_ACTIONS.length === currentActionIndex;
    };
    
    const calculateItemIndex = (offsetY: number): number => {
        let itemIndex = Math.round(offsetY / ITEM_HEIGHT) % TRADE_ACTIONS.length;
        return itemIndex < 0 ? (itemIndex + TRADE_ACTIONS.length) % TRADE_ACTIONS.length : itemIndex;
    };
    
    useEffect(() => {
        setTimeout(() => {
            scrollViewRef.current?.scrollTo({ 
                y: ITEM_HEIGHT * TRADE_ACTIONS.length, 
                animated: false 
            });
            setCurrentActionIndex(0);
        }, INITIAL_SCROLL_DELAY);
    }, []);
    
    const handleScrollBeginDrag = () => {
        isScrollingRef.current = true;
        setIsActionSelected(false);
    };
    
    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const itemIndex = calculateItemIndex(offsetY);
        
        if (itemIndex !== currentActionIndex) {
            setIsActionSelected(false);
            setCurrentActionIndex(itemIndex);
        }
    };
    
    const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (!isScrollingRef.current) return;
        
        const offsetY = event.nativeEvent.contentOffset.y;
        const contentHeight = ITEM_HEIGHT * TRADE_ACTIONS.length;
        
        // Near the top - loop to middle section
        if (offsetY < ITEM_HEIGHT * SCROLL_THRESHOLD) {
            const newOffset = offsetY + contentHeight;
            scrollViewRef.current?.scrollTo({ y: newOffset, animated: false });
            setCurrentActionIndex(calculateItemIndex(newOffset));
        }
        // Near the bottom - loop to middle section
        else if (offsetY >= contentHeight * 2 - ITEM_HEIGHT * SCROLL_THRESHOLD) {
            const newOffset = offsetY - contentHeight;
            scrollViewRef.current?.scrollTo({ y: newOffset, animated: false });
            setCurrentActionIndex(calculateItemIndex(newOffset));
        }
        
        isScrollingRef.current = false;
    };
    
    const renderActionButton = (action: typeof TRADE_ACTIONS[0], isInTopSpot: boolean) => {
        if (!action.hasButtons) return null;
        
        const buttonProps = {
            opacity: isInTopSpot ? 1 : 0.3,
            disabled: !isInTopSpot,
        };
        
        switch (action.text) {
            case 'COUNTER':
                return (
                    <>
                        <TouchableOpacity 
                            style={[styles.actionButton, styles.counterMinusButton, { opacity: buttonProps.opacity }]}
                            onPress={() => PlayAction('remove')}
                            disabled={buttonProps.disabled}
                        >
                            <FontAwesome6 name="circle-minus" size={24} color={colors.actions.counter} />
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.actionButton, styles.counterPlusButton, { opacity: buttonProps.opacity }]}
                            onPress={() => PlayAction('add')}
                            disabled={buttonProps.disabled}
                        >
                            <FontAwesome6 name="circle-plus" size={22} color={colors.actions.counter} />
                        </TouchableOpacity>
                    </>
                );
            case 'QUERY':
                return (
                    <TouchableOpacity 
                        style={[styles.actionButton, styles.queryButton, { opacity: buttonProps.opacity }]}
                        onPress={() => PlayAction('write')}
                        disabled={buttonProps.disabled}
                    >
                        <FontAwesome6 name="pen-to-square" size={22} color={colors.actions.query} />
                    </TouchableOpacity>
                );
            case 'WHERE':
                return (
                    <TouchableOpacity 
                        style={[styles.actionButton, styles.locationButton, { opacity: buttonProps.opacity }]}
                        onPress={() => PlayAction('select')}
                        disabled={buttonProps.disabled}
                    >
                        <FontAwesome6 name="location-dot" size={22} color={colors.actions.location} />
                    </TouchableOpacity>
                );
            case 'WHEN':
                return (
                    <TouchableOpacity 
                        style={[styles.actionButton, styles.timeButton, { opacity: buttonProps.opacity }]}
                        onPress={() => PlayAction('select')}
                        disabled={buttonProps.disabled}
                    >
                        <FontAwesome6 name="clock" size={22} color={colors.actions.time} />
                    </TouchableOpacity>
                );
            default:
                return null;
        }
    };
    
    return (
        <View style={styles.container}>
            <View style={styles.row}>
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
                    >
                        {infiniteActions.map((action, index) => {
                            const isInTopSpot = isActionInTopSpot(index);
                            
                            return (
                                <View 
                                    key={index} 
                                    style={[styles.tradeLine, { shadowColor: action.color }]}
                                >
                                    {renderActionButton(action, isInTopSpot)}
                                    
                                    <TouchableOpacity onPress={() => handleActionTextPress(index)}>
                                        <Text style={[styles.tradeLineText, { color: action.color }]}>
                                            {action.text}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                    </ScrollView>
                </View>

                <TouchableOpacity 
                    style={[
                        styles.playButton, 
                        { 
                            backgroundColor: isActionSelected ? currentAction?.color : 'transparent',
                            borderColor: currentAction?.color,
                            shadowColor: currentAction?.color,
                        }
                    ]}
                    onPress={() => PlayAction()}
                    disabled={!isActionSelected}
                >
                    <FontAwesome6 
                        name="arrow-left-long" 
                        size={26} 
                        color={isActionSelected ? '#000' : currentAction?.color} 
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'flex-start',
        backgroundColor: colors.ui.background,
        marginVertical: 4,
        marginHorizontal: 12,
        width: '100%'
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
        justifyContent: 'flex-end',
        shadowOffset: { width: 1, height: 1 },
        shadowOpacity: 0.9,
        shadowRadius: 3,
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
        borderTopLeftRadius: 25,
        borderBottomLeftRadius: 2,
        borderTopRightRadius: 2,
        borderBottomRightRadius: 25,
        borderWidth: 3,
        shadowOffset: { width: 1, height: 1 },
        shadowOpacity: 0.9,
        shadowRadius: 3,
    },
    // Base style for all action buttons
    actionButton: {
        justifyContent: 'center',
        alignItems: 'center',
        height: 40,
        width: 46,
        bottom: 12,
        borderWidth: 3,
        borderTopRightRadius: 2,
    },
    counterMinusButton: {
        width: 46,
        borderTopLeftRadius: 25,
        borderBottomLeftRadius: 2,
        borderBottomRightRadius: 2,
        borderColor: colors.actions.counter,
    },
    counterPlusButton: {
        width: 46,
        borderTopLeftRadius: 2,
        borderBottomLeftRadius: 2,
        borderBottomRightRadius: 2,
        borderColor: colors.actions.counter,
    },
    queryButton: {
        width: 46,
        borderTopLeftRadius: 25,
        borderBottomLeftRadius: 2,
        borderBottomRightRadius: 2,
        borderColor: colors.actions.query,
    },
    locationButton: {
        width: 46,
        borderTopLeftRadius: 25,
        borderBottomLeftRadius: 2,
        borderBottomRightRadius: 2,
        borderColor: colors.actions.location,
    },
    timeButton: {
        width: 46,
        borderTopLeftRadius: 25,
        borderBottomLeftRadius: 2,
        borderBottomRightRadius: 2,
        borderColor: colors.actions.time,
    },
});

export default TradeUI;