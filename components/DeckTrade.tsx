import React, { useState, useReducer } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Deck from './Deck';
import { colors } from '../styles/globalStyles';
import TradeUI, { TradeAction } from './TradeActions';
import TradeTurns, { TradeTurn } from './TradeTurns';
import { TradeActionConfig, TradeActionType } from '../config/tradeConfig';
import { deckStyles, makeCountBar, barRadius, DECK_BAR_WIDTH } from '../styles/deckStyles';
import { Post } from '@/types/index';
import { acceptTrade, declineTrade } from '@/services/tradeService';

const { width } = Dimensions.get('window');

interface TradeDeckProps {
    posts: Post[];
    actions: TradeActionConfig[];
    turns: TradeTurn[];
    onHorizontalGestureStart?: () => void;
    onGestureEnd?: () => void;
    showDateTime?: boolean;
    showLocation?: boolean;
}

const DECK_WIDTH = Math.min(width - 36, 400);

type TradeMode = 'idle'| 'barter_select'| 'query_select';

type TradeState = {
    mode: TradeMode;
    activeAction: TradeActionType | null;
    // barter system
    selectedPosts: number[];
    // query system
    queryPostIndex: number | null;

    selectionCommitted: boolean;
  };

type TradeActionReducer =
  | { type: 'SET_ACTION'; actionType: TradeActionType }
  | { type: 'ENTER_BARTER'; baseIndex: number | null }
  | { type: 'TOGGLE_BARTER_POST'; postIndex: number }
  | { type: 'EXIT_BARTER' }
  | { type: 'ENTER_QUERY'; baseIndex: number | null }
  | { type: 'EXIT_QUERY' }
  | { type: 'COMMIT_SELECTION'}
  | { type: 'RESET' };

const initialTradeState: TradeState = {
    mode: 'idle',
    selectedPosts: [],
    queryPostIndex: null,
    activeAction: null,
    selectionCommitted: false,
};

function tradeReducer(state: TradeState, action: TradeActionReducer): TradeState {
    switch (action.type) {
        case 'SET_ACTION':
            return { ...state, activeAction: action.actionType, selectionCommitted: false, };

        case 'ENTER_BARTER':
            return {
                ...state,
                mode: 'barter_select',
                selectedPosts: action.baseIndex !== null ? [action.baseIndex] : [],
            };

        case 'TOGGLE_BARTER_POST': {
            const exists = state.selectedPosts.includes(action.postIndex);
            return {
                ...state,
                selectedPosts: exists
                    ? state.selectedPosts.filter(i => i !== action.postIndex)
                    : [...state.selectedPosts, action.postIndex],
            };
        }

        case 'EXIT_BARTER':
            return { ...state, mode: 'idle', selectedPosts: [] };

        case 'ENTER_QUERY':
            return {
                ...state,
                mode: 'query_select',
                queryPostIndex: action.baseIndex,
            };
        
        case 'COMMIT_SELECTION':
            return {...state, selectionCommitted: true };

        case 'EXIT_QUERY':
            return { ...state, mode: 'idle', queryPostIndex: null };

        case 'RESET':
            return initialTradeState;

        default:
            return state;
    }
}

// export default function TradeDeck({ posts, actions, turns, showDateTime = false, showLocation = false, onHorizontalGestureStart, onGestureEnd, }: TradeDeckProps) {
//     const [isExpanded, setIsExpanded] = useState(true);
//     const [showingPlayer, setShowingPlayer] = useState(false);
//     const [isQueryOpen, setIsQueryOpen] = useState(false);

//     // Partner deck (left) — the other user's posts, query-selectable
//     const [partnerTopPostIndex, setPartnerTopPostIndex] = useState<number | null>(null);
//     const [querySelectedPost, setQuerySelectedPost] = useState<number | null>(null);

//     // Player deck (right) — own posts, barter-selectable
//     const [playerTopPostIndex, setPlayerTopPostIndex] = useState<number | null>(null);
//     const [isSelectMode, setIsSelectMode] = useState(false);
//     const [selectedPosts, setSelectedPosts] = useState<number[]>([]);

//     const slideAnim = useRef(new Animated.Value(-12)).current;
//     const itemCount = useMemo(() => posts.length, [posts]);

//     const handleSwitchDecks = () => {
//         const toValue = showingPlayer ? -12 : -(DECK_WIDTH) - 38;
//         Animated.spring(slideAnim, { toValue, useNativeDriver: true, tension: 60, friction: 10 }).start();
//         setShowingPlayer(prev => !prev);
//     };

//     const topPostIndex = showingPlayer ? playerTopPostIndex : partnerTopPostIndex;
//     const topCardIsSelected = topPostIndex !== null && selectedPosts.includes(topPostIndex);
//     {/*
//     const handleActionSelected = (action: TradeAction) => {
//         if (action.actionType === 'barter' && action.subAction === 'write') {
//             if (!isSelectMode) {
//                 setIsSelectMode(true);
//                 if (playerTopPostIndex !== null) setSelectedPosts([playerTopPostIndex]);
//             } else {
//                 if (playerTopPostIndex !== null) {
//                 setSelectedPosts(prev =>
//                     prev.includes(playerTopPostIndex)
//                     ? prev.filter(i => i !== playerTopPostIndex)
//                     : [...prev, playerTopPostIndex]
//                 );
//                 }
//             }
//         }
//         if (action.actionType === 'barter' && action.subAction === 'select') {
//             setIsSelectMode(false);
//             setSelectedPosts([]);
//             }
//         };
//     */}
//     const handleBarter = (subAction?: TradeAction['subAction']) => {
//         if (subAction === 'write') {
//             setIsSelectMode(true);
        
//             if (playerTopPostIndex !== null) {
//                 setSelectedPosts([playerTopPostIndex]);
//             }
//             return;
//             }
        
//             if (subAction === 'add' || subAction === 'remove') {
//             if (playerTopPostIndex === null) return;
        
//             setSelectedPosts(prev => {
//                 if (prev.includes(playerTopPostIndex)) {
//                     return prev.filter(i => i !== playerTopPostIndex);
//                 }
//                 return [...prev, playerTopPostIndex];
//             });
//             }
        
//             if (subAction === 'select') {
//                 setIsSelectMode(false);
//                 setSelectedPosts([]);
//             }
//     };

//     const handleQuery = (subAction?: TradeAction['subAction']) => {
//         if (subAction === 'write') {
//             setQuerySelectedPost(partnerTopPostIndex);
//             setIsQueryOpen(prev => !prev);
//         }
      
//         if (subAction === 'select') {
//             setQuerySelectedPost(null);
//             setIsQueryOpen(false);
//         }
//       };

//     const handleActionSelected = async (action: TradeAction) => {
//         const { actionType, subAction } = action;
    
//         switch (actionType) {
//         case 'barter':
//             handleBarter(subAction);
//             break;
    
//         case 'query':
//             handleQuery(subAction);
//             break;
    
//         case 'accept':
//             await acceptTrade("tradeId");
//             break;
    
//         case 'decline':
//             await declineTrade("tradeId");
//             break;
    
//         default:
//             console.log('Unhandled action:', action);
//         }
//     };

//     const sharedDeckProps = {
//         cardWidth: DECK_WIDTH,
//         enabled: true,
//         onHorizontalGestureStart,
//         onGestureEnd,
//         showDateTime,
//         showLocation,
//     };

//     return (
//         <View style={styles.modalContent} pointerEvents="box-none">
//         <View style={deckStyles.column}>
//             {/* Partner / Player switcher bar */}
//             <View style={deckStyles.itemCountRow}>
//             <TouchableOpacity style={styles.partnerBar} onPress={handleSwitchDecks}>
//                 <FontAwesome6 name="circle-user" size={24} color={colors.ui.secondarydisabled} />
//                 <Text style={[deckStyles.countText, !showingPlayer && styles.activeText]}>0{itemCount}</Text>
//                 <FontAwesome6 name="arrows-rotate" size={24} color={!showingPlayer ? colors.actions.trade : colors.ui.secondarydisabled} />
//             </TouchableOpacity>
//             <TouchableOpacity style={styles.playerBar} onPress={handleSwitchDecks}>
//                 <FontAwesome6 name="circle-user" size={24} color={colors.ui.secondarydisabled} />
//                 <Text style={[deckStyles.countText, showingPlayer && styles.activeText]}>0{itemCount}</Text>
//                 <FontAwesome6 name="arrows-rotate" size={24} color={showingPlayer ? colors.actions.trade : colors.ui.secondarydisabled} />
//             </TouchableOpacity>
//             </View>

//             {isExpanded && (
//             <View style={styles.deckClipWindow}>
//                 <Animated.View style={[styles.decksRow, { transform: [{ translateX: slideAnim }] }]}>
//                 {/* Partner deck — query mode */}
//                 <View style={{ width: DECK_WIDTH }}>
//                     <Deck
//                     posts={posts}
//                     {...sharedDeckProps}
//                     isUser={false}
//                     onTopCardChange={setPartnerTopPostIndex}
//                     isQueryMode={true}
//                     querySelectedPostIndex={querySelectedPost}
//                     />
//                 </View>
//                 {/* Player deck — barter select mode */}
//                 <View style={{ width: DECK_WIDTH }}>
//                     <Deck
//                     posts={posts}
//                     {...sharedDeckProps}
//                     isUser={true}
//                     onTopCardChange={setPlayerTopPostIndex}
//                     isSelectMode={isSelectMode}
//                     selectedPosts={selectedPosts}
//                     selectColor={colors.actions.trade}
//                     />
//                 </View>
//                 </Animated.View>
//             </View>
//             )}

//             {/* Actions + turns */}
//             {isExpanded && (
//             <View style={styles.turnsAndButtonColumn}>
//                 <View style={[styles.queryRow, { marginBottom: isQueryOpen ? 4 : 0 }]}>
//                 <TradeTurns turns={[]} isQueryOpen={isQueryOpen} />
//                 </View>
//                 <View style={styles.actionRow}>
//                 <TradeUI
//                     actions={actions}
//                     onActionSelected={handleActionSelected}
//                     onQueryToggle={setIsQueryOpen}
//                     isSelectMode={isSelectMode}
//                     selectedCount={selectedPosts.length}
//                     topCardIsSelected={topCardIsSelected}
//                     isQueryMode={true}
//                     queryPostSelected={querySelectedPost !== null}
//                     onQueryPostSelect={() => setQuerySelectedPost(partnerTopPostIndex)}
//                     onQueryPostDeselect={() => setQuerySelectedPost(null)}
//                 />
//                 </View>
//                 <View style={styles.turnsRow}>
//                 <TradeTurns turns={turns} />
//                 </View>
//             </View>
//             )}

//             <TouchableOpacity
//             style={styles.collapseBar}
//             onPress={() => setIsExpanded(prev => !prev)}
//             >
//             <FontAwesome6 name={isExpanded ? 'angle-up' : 'angle-down'} size={26} color="#fff" />
//             </TouchableOpacity>
//         </View>
//         </View>
//     );
// }
export default function TradeDeck({
    posts,
    actions,
    turns,
    showDateTime = false,
    showLocation = false,
  }: TradeDeckProps) {
  
    const [state, dispatch] = useReducer(tradeReducer, initialTradeState);
  
    const [partnerTopPostIndex, setPartnerTopPostIndex] = useState<number | null>(null);
    const [playerTopPostIndex, setPlayerTopPostIndex] = useState<number | null>(null);
  
    const isSelectMode = state.mode === 'barter_select';
    const isQueryMode = state.mode === 'query_select';
  
    const handleActionSelected = async (action: TradeAction) => {
        dispatch({ type: 'SET_ACTION', actionType: action.actionType });
    
        switch (action.actionType) {
            case 'barter': {
                if (action.subAction === 'write') {
                    dispatch({
                        type: 'ENTER_BARTER',
                        baseIndex: playerTopPostIndex,
                    });
                }
        
                if (action.subAction === 'add' || action.subAction === 'remove') {
                    if (playerTopPostIndex !== null) {
                    dispatch({
                        type: 'TOGGLE_BARTER_POST',
                        postIndex: playerTopPostIndex,
                    });
                    }
                }
        
                if (action.subAction === 'select') {
                    dispatch({ type: 'COMMIT_SELECTION' });
                }
        
                break;
            }

        case 'query': {
            if (action.subAction === 'write') {
                dispatch({
                    type: 'ENTER_QUERY',
                    baseIndex: partnerTopPostIndex,
                });
            }
    
            if (action.subAction === 'select') {
                dispatch({ type: 'EXIT_QUERY' });
            }
    
            break;
        }
    
        case 'accept':
            await acceptTrade('tradeId');
            dispatch({ type: 'RESET' });
            break;
    
        case 'decline':
            await declineTrade('tradeId');
            dispatch({ type: 'RESET' });
            break;
        }
    };
  
    return (
      <View style={styles.modalContent}>
  
        <Deck
            posts={posts}
            isUser
            isSelectMode={isSelectMode}
            selectedPosts={state.selectedPosts}
            onTopCardChange={setPlayerTopPostIndex}
        />
  
        <Deck
            posts={posts}
            isUser={false}
            isQueryMode={isQueryMode}
            querySelectedPostIndex={state.queryPostIndex}
            onTopCardChange={setPartnerTopPostIndex}
        />
  
        <TradeUI
            actions={actions}
            onActionSelected={handleActionSelected}
            isSelectMode={isSelectMode}
            selectedCount={state.selectedPosts.length}
            selectionCommitted={state.selectionCommitted}
            topCardIsSelected={
                playerTopPostIndex !== null &&
                state.selectedPosts.includes(playerTopPostIndex)
            }
            isQueryMode={isQueryMode}
            queryPostSelected={state.queryPostIndex !== null}
            onQueryPostSelect={() =>
                dispatch({
                type: 'ENTER_QUERY',
                baseIndex: partnerTopPostIndex,
                })
            }
            onQueryPostDeselect={() =>
                dispatch({ type: 'EXIT_QUERY' })
            }
        />
      </View>
    );
  }

const styles = StyleSheet.create({
  modalContent: {
    width: '100%',
    position: 'relative',
    alignItems: 'center',
  },
  turnsAndButtonColumn: { flexDirection: 'column', width: DECK_BAR_WIDTH },
  queryRow: {},
  actionRow: {marginBottom: -2},
  turnsRow: {},
  partnerBar: {
    ...makeCountBar('leftCap', 'flex-start'),
  },
  playerBar: {
    ...makeCountBar('rightCap', 'flex-end'),
  },
  activeText: {
    color: colors.actions.trade,
  },
  deckClipWindow: {
    width: width,
    alignItems: 'flex-start',
  },
  decksRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 26,
    zIndex: 30,
  },
  collapseBar: {
    top: 0,
    width: DECK_BAR_WIDTH,
    height: 44,
    ...barRadius.bottomCap,
    backgroundColor: colors.ui.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    zIndex: 10,
  },
});