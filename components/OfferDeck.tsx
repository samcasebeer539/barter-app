import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import Deck from './Deck';

import {globalFonts, colors} from '../styles/globalStyles';
import TradeUI from '../components/TradeUI';


const { width } = Dimensions.get('window');



interface Post {
    type: 'good' | 'service';
    name: string;
    description: string;
    photos: string[];
}

interface OfferDeckProps {
    posts: Post[];

}

const DECK_WIDTH = Math.min(width - 40, 600);

export default function OfferDeck({ posts}: OfferDeckProps) {


    // Count good and service posts
    const { goodCount, serviceCount } = useMemo(() => {
        const goodCount = posts.filter(post => post.type === 'good').length;
        const serviceCount = posts.filter(post => post.type === 'service').length;
        return { goodCount, serviceCount };
    }, [posts]);

    return (
        <View style={styles.modalContent} pointerEvents="box-none">

            <View style={styles.column}>

                <View style={styles.goodServiceRow}>
                    <View style={styles.goodServiceButton}>
                        <Text style={styles.secondaryText}>0{goodCount}</Text>
                        <FontAwesome6 name="gifts" size={18} color={colors.ui.secondarydisabled} />

                        <Text style={styles.secondaryText}> 0{serviceCount}</Text>
                        <FontAwesome6 name="hand-sparkles" size={18} color={colors.ui.secondarydisabled} />
                    </View>  
                </View>

                {/* BOTH decks in ONE row wrapper, sliding animated */}
        
                <View style={styles.deckWrapper}>
                    <Deck 
                    posts={posts}
                    cardWidth={DECK_WIDTH}
                    enabled={true}
                    />
                </View>

                <View style={styles.actionRow}>
                    <TradeUI />
                </View>

            </View>

        </View>
    );
}

const styles = StyleSheet.create({

    
    modalContent: {
        width: '100%',
        
        position: 'relative',
        
        alignItems: 'center',
        bottom: 400,
    },

    column: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    deckWrapper: {
        left: -12,
        bottom: -32,
    },

    goodServiceRow: {
        width: 334,
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 4,
        top: -198,
        left: 0,
        zIndex: 0,
    },

    goodServiceButton: {
        height: 36,
        flex: 1,
        flexDirection: 'row',
        gap: 4,
        borderTopRightRadius: 22,
        borderBottomRightRadius: 2,
        borderTopLeftRadius: 22,
        borderBottomLeftRadius: 2,
        backgroundColor: colors.ui.secondary,
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingHorizontal: 16,
       

    },
    
    actionRow: {
        width: 334,
        top: 302,
        justifyContent: 'center',
        alignItems: 'center',

    },
    decksRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        left: 0,
        bottom: -32,
        gap: 30,
    },
    secondaryText: {
        color: colors.ui.secondarydisabled,
        fontSize: 20,
        fontFamily: globalFonts.bold,
    },



});
