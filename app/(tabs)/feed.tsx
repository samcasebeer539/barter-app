import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Image, useWindowDimensions, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useState, useRef, useEffect, useCallback } from 'react';
import FeedDeck from '@/components/DeckFeed';
import FeedBar from '@/components/BarFeed';
import { globalFonts, colors } from '../../styles/globalStyles';
import { getFeedPosts, getFeedProfile, searchFeedPosts } from '@/services/feedService';
import { FeedItem, FeedProfile } from '@/types/index';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RefreshControl, Platform } from 'react-native';


// How long one image may hold up a batch before it falls back to a square.
const IMAGE_PREP_TIMEOUT_MS = 6000;

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
    return new Promise(resolve => {
        const timer = setTimeout(() => resolve(fallback), ms);
        promise.then(
            value => { clearTimeout(timer); resolve(value); },
            () => { clearTimeout(timer); resolve(fallback); },
        );
    });
}

function measureImage(uri: string): Promise<{ w: number; h: number } | null> {
    return new Promise(resolve => {
        Image.getSize(uri, (w, h) => resolve({ w, h }), () => resolve(null));
    });
}

// Measure and preload every image in a batch, so the posts can be shown at
// their final size with their images ready, instead of resizing and popping
// in one by one.
async function prepareFeedBatch(items: FeedItem[], columnWidth: number): Promise<Record<string, number>> {
    const heights: Record<string, number> = {};
    await Promise.all(items.map(async item => {
        if (!item.image) {
            heights[item.id] = columnWidth;
            return;
        }
        const [size] = await Promise.all([
            withTimeout(measureImage(item.image), IMAGE_PREP_TIMEOUT_MS, null),
            withTimeout(Image.prefetch(item.image), IMAGE_PREP_TIMEOUT_MS, false),
        ]);
        heights[item.id] = size && size.w > 0 ? columnWidth * (size.h / size.w) : columnWidth;
    }));
    return heights;
}

// Placeholder heights (× column width) for the loading skeleton.
const SKELETON_HEIGHTS = [[1.3, 1.0, 1.15], [1.0, 1.4, 0.9]];

export default function FeedScreen() {
    const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
    const [imageHeights, setImageHeights] = useState<Record<string, number>>({});
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
    const [loadingPostId, setLoadingPostId] = useState<string | null>(null);
    const [prefetchedProfile, setPrefetchedProfile] = useState<FeedProfile | null>(null);
    const [showDeck, setShowDeck] = useState(false);
    // const [showSaved, setShowSaved] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [showLocation, setShowLocation] = useState(true);
    const scrollY = useRef(0);
    const headerTranslateY = useRef(new Animated.Value(0)).current;
    const [showHeader, setShowHeader] = useState(true);
    const { width } = useWindowDimensions();
    // Each column is half the screen minus padding/gap
    const columnWidth = (width - 24 - 4) / 2;
    const insets = useSafeAreaInsets();


    // Posts appear only once a whole batch is ready (sizes measured, images
    // preloaded). Until the first batch, a skeleton shows. If loads overlap
    // (refresh, search, clear), only the latest one is shown.
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const latestLoad = useRef(0);
    const showBatch = useCallback(async (fetchPosts: () => Promise<FeedItem[]>) => {
        const loadId = ++latestLoad.current;
        try {
            const posts = await fetchPosts();
            const heights = await prepareFeedBatch(posts, columnWidth);
            if (loadId !== latestLoad.current) return; // a newer load replaced this one
            setImageHeights(heights);
            setFeedItems(posts);
        } catch (err) {
            console.error('Feed load error:', err);
        } finally {
            if (loadId === latestLoad.current) setIsInitialLoading(false);
        }
    }, [columnWidth]);

    useEffect(() => {
        showBatch(getFeedPosts);
    }, [showBatch]);

    // Skeleton pulse.
    const skeletonOpacity = useRef(new Animated.Value(0.5)).current;
    useEffect(() => {
        if (!isInitialLoading) return;
        const pulse = Animated.loop(Animated.sequence([
            Animated.timing(skeletonOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
            Animated.timing(skeletonOpacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
        ]));
        pulse.start();
        return () => pulse.stop();
    }, [isInitialLoading, skeletonOpacity]);

    const leftColumn = feedItems.filter((_, i) => i % 2 === 0);
    const rightColumn = feedItems.filter((_, i) => i % 2 === 1);

    const handleScroll = (event: any) => {
        const currentScrollY = event.nativeEvent.contentOffset.y + HEADER_HEIGHT;
        const scrollingDown = currentScrollY > scrollY.current && currentScrollY > 50;
        const scrollingUp = currentScrollY < scrollY.current;

        if (scrollingDown && showHeader) {
            setShowHeader(false);
            Animated.timing(headerTranslateY, {
                toValue: -110,
                duration: 200,
                useNativeDriver: true,
            }).start();
        } else if (scrollingUp && !showHeader) {
            setShowHeader(true);
            Animated.timing(headerTranslateY, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
        scrollY.current = currentScrollY;
    };

    const renderItem = (item: FeedItem) => {
        // Use measured height, or a placeholder while loading
        const imgHeight = imageHeights[item.id];
        return (
            <View key={item.id} style={styles.cardWrapper}>
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => {
                        setLoadingPostId(item.id);
                        getFeedProfile(item.id)
                            .then(profile => {
                                setPrefetchedProfile(profile);
                                setSelectedPostId(item.id);
                                setShowDeck(true);
                            })
                            .catch(err => console.error('Feed prefetch error:', err))
                            .finally(() => setLoadingPostId(null));
                    }}
                >
                    <View style={[styles.imageContainer, { height: imgHeight ?? columnWidth }]}>
                        {item.image ? (
                            <Image
                                source={{ uri: item.image }}
                                style={styles.image}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={styles.imagePlaceholder} />
                        )}
                        {loadingPostId === item.id && (
                            <View style={styles.imageLoadingOverlay}>
                                {/* <ActivityIndicator size="large" color={colors.actions.trade} /> */}
                                <FontAwesome6 name="arrows-rotate" size={24} color={colors.ui.secondarydisabled} />
                            </View>
                        )}
                    </View>
                </TouchableOpacity>
                <TouchableOpacity

                    onPress={() => {
                        setLoadingPostId(item.id);
                        getFeedProfile(item.id)
                            .then(profile => {
                                setPrefetchedProfile(profile);
                                setSelectedPostId(item.id);
                                setShowDeck(true);
                            })
                            .catch(err => console.error('Feed prefetch error:', err))
                            .finally(() => setLoadingPostId(null));
                    }}
                >
                    <View style={styles.itemTitleWrapper}>
                        <Text style={styles.itemTitle}>
                            {item.title}

                        </Text>
                        <Text style={styles.itemDistance}>3.5{'\u00A0'}mi</Text>
                    </View>
                </TouchableOpacity>
            </View>
        );
    };

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        await showBatch(() => searchFeedPosts(query));
    };

    const clearSearch = async () => {
        setSearchQuery("");
        await showBatch(getFeedPosts);
    }

    const HEADER_HEIGHT = 52;
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            // Re-run the active search, or reload the feed. The current posts
            // stay up until the new batch is fully ready.
            await showBatch(searchQuery.length > 0 ? () => searchFeedPosts(searchQuery) : getFeedPosts);
        } finally {
            setRefreshing(false);
        }
    }, [searchQuery, showBatch]);

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            <FeedBar
                showLocation={showLocation}
                // showSaved={showSaved}
                onLocationPress={() => setShowLocation(prev => !prev)}
                // onSavePress={() => setShowSaved(prev => !prev)}
                headerTranslateY={headerTranslateY}
                onSearchSubmit={handleSearch}
                onSearchClear={clearSearch}
            />

            <ScrollView
                style={[styles.scrollView, { marginTop: insets.top }]}
                contentContainerStyle={[
                    styles.scrollContent,
                    Platform.OS === 'android' && { paddingTop: HEADER_HEIGHT },
                ]}
                contentInset={{ top: HEADER_HEIGHT }}                 // iOS
                contentOffset={{ x: 0, y: -HEADER_HEIGHT }}           // iOS: start at the first row
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.ui.secondary}
                        progressViewOffset={HEADER_HEIGHT}            // Android
                    />
                }
                showsVerticalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
            >
                {isInitialLoading && feedItems.length === 0 && (
                    <Animated.View style={[styles.columnsContainer, { opacity: skeletonOpacity }]}>
                        {SKELETON_HEIGHTS.map((column, c) => (
                            <View key={c} style={styles.column}>
                                {column.map((h, i) => (
                                    <View key={i} style={styles.cardWrapper}>
                                        <View style={[styles.card, { height: columnWidth * h }]} />
                                        {/* Same text as a real post, invisible, so the
                                            box is exactly a one-line post's height. */}
                                        <View style={styles.itemTitleWrapper}>
                                            <Text style={[styles.itemTitle, styles.skeletonText]} numberOfLines={1}>Item</Text>
                                            <Text style={[styles.itemDistance, styles.skeletonText]}>0.0{'\u00A0'}mi</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        ))}
                    </Animated.View>
                )}
                {feedItems.length === 0 && searchQuery.length > 0 && (
                    <View style={styles.noResultsContainer}>
                        <Text style={styles.noResultsText}>
                            There were no posts found under "{searchQuery}"
                        </Text>
                    </View>
                )}
                {feedItems.length > 0 && (
                    <View style={styles.columnsContainer}>
                        <View style={styles.column}>
                            {leftColumn.map(renderItem)}
                        </View>
                        <View style={styles.column}>
                            {rightColumn.map(renderItem)}
                    </View>
                </View>
                )}
            </ScrollView>

            <FeedDeck
                postId={selectedPostId}
                visible={showDeck}
                onClose={() => setShowDeck(false)}
                prefetchedProfile={prefetchedProfile}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.ui.background,
    },
    scrollView: {
        flex: 1,

    },
    scrollContent: {
        paddingLeft: 12,
        paddingRight: 12,
    },
    columnsContainer: {
        flexDirection: 'row',
        gap: 4,
    },
    column: {
        flex: 1,
        gap: 8,
    },
    cardWrapper: {
        marginBottom: 0,
    },
    card: {
        backgroundColor: colors.ui.secondary,
        borderTopLeftRadius: 2,
        borderTopRightRadius: 2,
        borderBottomRightRadius: 2,
        borderBottomLeftRadius: 2,
        overflow: 'hidden',
    },
    imageContainer: {
        width: '100%',
        backgroundColor: colors.ui.secondary,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imageLoadingOverlay: {
        ...StyleSheet.absoluteFill,
        backgroundColor: colors.ui.secondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: colors.ui.secondary,
    },
    itemTitleWrapper: {
        backgroundColor: colors.ui.secondary,
        marginTop: 4,
        paddingVertical: 8,
        paddingLeft: 12,
        paddingRight: 12,
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 2,
        minHeight: 36,
        borderTopLeftRadius: 2,
        borderTopRightRadius: 2,
        borderBottomRightRadius: 2,
        borderBottomLeftRadius: 2,

    },
    itemTitle: {
        fontSize: 18,
        color: '#FFFFFF',
        fontFamily: globalFonts.bold,
        flex: 1,
        minWidth: 0,
    },
    itemDistance: {
        fontSize: 16,
        color: colors.ui.secondarydisabled,
        fontFamily: globalFonts.regular,
        flexShrink: 0,
        letterSpacing: -0.3,
    },
    skeletonText: {
        color: 'transparent',
    },
    noResultsContainer: {
        paddingVertical: 32,
        alignItems: "center",
    },
    
    noResultsText: {
        color: colors.ui.secondarydisabled,
        fontSize: 16,
        fontFamily: globalFonts.regular,
        textAlign: "center",
    },
});