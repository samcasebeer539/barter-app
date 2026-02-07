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
    const scrollViewRef = useRef<ScrollView>(null);
    const isScrollingRef = useRef(false);
    const [currentActionIndex, setCurrentActionIndex] = useState(0);
    const [isActionSelected, setIsActionSelected] = useState(false);
    
    // Create tripled array for infinite scroll
    const infiniteActions = [...TRADE_ACTIONS, ...TRADE_ACTIONS, ...TRADE_ACTIONS];
    
    const scrollViewHeight = ITEM_HEIGHT * TRADE_ACTIONS.length - 8;
    
    const PlayAction = (subAction?: 'add' | 'remove' | 'write' | 'select') => {
        if (!isActionSelected && !subAction) return;
        
        const action = TRADE_ACTIONS[currentActionIndex];
        const tradeAction: TradeAction = {
            actionType: action.actionType,
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
        const actualIndex = index % TRADE_ACTIONS.length;
        return actualIndex === currentActionIndex;
    };
    
    useEffect(() => {
        setTimeout(() => {
            scrollViewRef.current?.scrollTo({ y: ITEM_HEIGHT * TRADE_ACTIONS.length, animated: false });
            setCurrentActionIndex(0);
        }, 100);
    }, []);
    
    const handleScrollBeginDrag = () => {
        isScrollingRef.current = true;
        setIsActionSelected(false);
    };
    
    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        let itemIndex = Math.round(offsetY / ITEM_HEIGHT) % TRADE_ACTIONS.length;
        
        if (itemIndex < 0) {
            itemIndex = (itemIndex + TRADE_ACTIONS.length) % TRADE_ACTIONS.length;
        }
        
        if (itemIndex !== currentActionIndex) {
            setIsActionSelected(false);
        }
        
        setCurrentActionIndex(itemIndex);
    };
    
    const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (!isScrollingRef.current) return;
        
        const offsetY = event.nativeEvent.contentOffset.y;
        const contentHeight = ITEM_HEIGHT * TRADE_ACTIONS.length;
        
        if (offsetY < ITEM_HEIGHT * 2) {
            const newOffset = offsetY + contentHeight;
            scrollViewRef.current?.scrollTo({ y: newOffset, animated: false });
            
            let itemIndex = Math.round(newOffset / ITEM_HEIGHT) % TRADE_ACTIONS.length;
            if (itemIndex < 0) {
                itemIndex = (itemIndex + TRADE_ACTIONS.length) % TRADE_ACTIONS.length;
            }
            setCurrentActionIndex(itemIndex);
        }
        else if (offsetY >= contentHeight * 2 - ITEM_HEIGHT * 2) {
            const newOffset = offsetY - contentHeight;
            scrollViewRef.current?.scrollTo({ y: newOffset, animated: false });
            
            let itemIndex = Math.round(newOffset / ITEM_HEIGHT) % TRADE_ACTIONS.length;
            if (itemIndex < 0) {
                itemIndex = (itemIndex + TRADE_ACTIONS.length) % TRADE_ACTIONS.length;
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
                            ? TRADE_ACTIONS[currentActionIndex]?.color 
                            : colors.ui.background,
                        borderColor: TRADE_ACTIONS[currentActionIndex]?.color,
                    }
                ]}
                onPress={() => PlayAction()}
                disabled={!isActionSelected}
            >
                <FontAwesome6 
                    name={'arrow-right-long'} 
                    size={22} 
                    color={isActionSelected ? '#000' : TRADE_ACTIONS[currentActionIndex]?.color} 
                />
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
                                            style={[styles.counterMinusButton, { opacity: isInTopSpot ? 1 : 0.3 }]}
                                            onPress={() => PlayAction('remove')}
                                            disabled={!isInTopSpot}
                                        >
                                            <FontAwesome6 name={'minus'} size={22} color={colors.actions.counter} />
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            style={[styles.counterPlusButton, { opacity: isInTopSpot ? 1 : 0.3 }]}
                                            onPress={() => PlayAction('add')}
                                            disabled={!isInTopSpot}
                                        >
                                            <FontAwesome6 name={'plus'} size={22} color={colors.actions.counter} />
                                        </TouchableOpacity>
                                    </>
                                )}
                                
                                {action.hasButtons && action.text === 'QUERY' && (
                                    <TouchableOpacity 
                                        style={[styles.queryButton, { opacity: isInTopSpot ? 1 : 0.3 }]}
                                        onPress={() => PlayAction('write')}
                                        disabled={!isInTopSpot}
                                    >
                                        <FontAwesome6 name={'pen-to-square'} size={22} color={colors.actions.query} />
                                    </TouchableOpacity>
                                )}

                                {action.hasButtons && action.text === 'WHERE' && (
                                    <TouchableOpacity 
                                        style={[styles.locationButton, { opacity: isInTopSpot ? 1 : 0.3 }]}
                                        onPress={() => PlayAction('select')}
                                        disabled={!isInTopSpot}
                                    >
                                        <FontAwesome6 name={'location-dot'} size={22} color={colors.actions.location} />
                                    </TouchableOpacity>
                                )}

                                {action.hasButtons && action.text === 'WHEN' && (
                                    <TouchableOpacity 
                                        style={[styles.timeButton, { opacity: isInTopSpot ? 1 : 0.3 }]}
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
