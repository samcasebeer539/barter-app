import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, PanResponder, Animated, TouchableOpacity, ScrollView, Text, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import Deck from './Deck';
import {globalFonts, colors } from '../styles/globalStyles';
import { FontAwesome6 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';


interface TradeUIProps {

}

const TradeUI: React.FC<TradeUIProps> = ({ }) => {
    const ITEM_HEIGHT = 54; // tradeLine height + margin bottom
    const scrollViewRef = useRef<ScrollView>(null);
    const isScrollingRef = useRef(false);
    const [currentActionIndex, setCurrentActionIndex] = useState(0);
    const [isActionSelected, setIsActionSelected] = useState(false);
    
    const tradeActions = [
        { text: 'ACCEPT', color: colors.actions.accept, hasButtons: false },
        { text: 'DECLINE', color: colors.actions.decline, hasButtons: false },
        { text: 'COUNTER', color: colors.actions.counter, hasButtons: true },
        { text: 'QUERY', color: colors.actions.query, hasButtons: true },
        { text: 'LOCATION', color: colors.actions.offer, hasButtons: true },
        { text: 'TIME', color: colors.actions.trade, hasButtons: true },
    ];
    
    // Create tripled array for infinite scroll
    const infiniteActions = [...tradeActions, ...tradeActions, ...tradeActions];
    
    const PlayAction = () => {
        if (!isActionSelected) return;
        // Execute the selected action here
        console.log('Playing action:', tradeActions[currentActionIndex].text);
    };
    
    const handleActionTextPress = (index: number) => {
        const actualIndex = index % tradeActions.length;
        if (actualIndex === currentActionIndex) {
            setIsActionSelected((prev) => !prev);
        }
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
                            : colors.ui.secondary,
                        opacity: isActionSelected ? 1 : 1
                    }
                ]}
                onPress={PlayAction}
                disabled={!isActionSelected}
            >
                <FontAwesome6 name={'arrow-right-long'} size={22} color={isActionSelected ? '#fff' : colors.ui.secondarydisabled} />
            </TouchableOpacity>
            
            <View style={[styles.scrollViewContainer, { height: ITEM_HEIGHT * tradeActions.length - 8 }]}>
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
                    {infiniteActions.map((action, index) => (
                        <View key={index} style={styles.tradeLine}>
                            <TouchableOpacity onPress={() => handleActionTextPress(index)} style={{ flex: 1 }}>
                                <Text style={[styles.tradeLineText, { color: action.color }]}>{action.text}</Text>
                            </TouchableOpacity>
                            
                            {action.hasButtons && action.text === 'COUNTER' && (
                                <>
                                    <TouchableOpacity 
                                        style={styles.counterMinusButton}
                                        onPress={PlayAction}
                                    >
                                        <FontAwesome6 name={'minus'} size={22} color='#FFFFFF' />
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={styles.counterPlusButton}
                                        onPress={PlayAction}
                                    >
                                        <FontAwesome6 name={'plus'} size={22} color='#FFFFFF' />
                                    </TouchableOpacity>
                                </>
                            )}
                            
                            {action.hasButtons && action.text === 'QUERY' && (
                                <TouchableOpacity 
                                    style={styles.queryButton}
                                    onPress={PlayAction}
                                >
                                    <FontAwesome6 name={'pen-to-square'} size={22} color='#FFFFFF' />
                                </TouchableOpacity>
                            )}

                            {action.hasButtons && action.text === 'LOCATION' && (
                                <TouchableOpacity 
                                    style={styles.locationButton}
                                    onPress={PlayAction}
                                >
                                    <FontAwesome6 name={'location-dot'} size={22} color='#FFFFFF' />
                                </TouchableOpacity>
                            )}

                            {action.hasButtons && action.text === 'TIME' && (
                                <TouchableOpacity 
                                    style={styles.timeButton}
                                    onPress={PlayAction}
                                >
                                    <FontAwesome6 name={'clock'} size={22} color='#FFFFFF' />
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}
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
        marginVertical: 16,
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
        height: 56,
        alignItems: 'center',
        marginBottom: -2,
    },
    tradeLineText: {
        fontSize: 52,
        fontFamily: globalFonts.extrabold,
        bottom: 10,
    },

    playButton: {
        justifyContent: 'center',
        alignItems: 'center',
        height: 40,
        width: 50,
        borderTopLeftRadius: 20,
        borderBottomLeftRadius: 20,
        borderTopRightRadius: 2,
        borderBottomRightRadius: 2,
    },
    counterMinusButton: {
        backgroundColor: colors.actions.counter,
        justifyContent: 'center',
        alignItems: 'center',
        height: 40,
        width: 40,
        borderRadius: 2,
        bottom: 8,
    },
    counterPlusButton: {
        backgroundColor: colors.actions.counter,
        justifyContent: 'center',
        alignItems: 'center',
        height: 40,
        width: 40,
        borderTopLeftRadius: 2,
        borderBottomLeftRadius: 2,
        borderTopRightRadius: 20,
        borderBottomRightRadius: 20,
        bottom: 8,
    },
    queryButton: {
        backgroundColor: colors.actions.query,
        justifyContent: 'center',
        alignItems: 'center',
        height: 40,
        width: 40,
        borderTopLeftRadius: 2,
        borderBottomLeftRadius: 2,
        borderTopRightRadius: 20,
        borderBottomRightRadius: 20,
        bottom: 8,
    },
    locationButton: {
        backgroundColor: colors.actions.offer,
        justifyContent: 'center',
        alignItems: 'center',
        height: 40,
        width: 40,
        borderTopLeftRadius: 2,
        borderBottomLeftRadius: 2,
        borderTopRightRadius: 20,
        borderBottomRightRadius: 20,
        bottom: 8,
    },
    timeButton: {
        backgroundColor: colors.actions.trade,
        justifyContent: 'center',
        alignItems: 'center',
        height: 40,
        width: 40,
        borderTopLeftRadius: 2,
        borderBottomLeftRadius: 2,
        borderTopRightRadius: 20,
        borderBottomRightRadius: 20,
        bottom: 8,
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