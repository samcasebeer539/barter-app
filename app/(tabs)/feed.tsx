import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  useWindowDimensions,
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useState, useRef, useEffect, useCallback } from 'react';
import FeedDeck from '@/components/DeckFeed';
import FeedBar from '@/components/BarFeed';
import { globalFonts, colors } from '../../styles/globalStyles';
import { deckStyles } from '../../styles/deckStyles';
import { onBlockChange } from '@/lib/safety';
import { getFeedPage, getFeedProfile, FeedSort } from '@/services/feedService';
import { FeedItem, FeedProfile } from '@/types/index';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// How long one image may hold up a batch before it falls back to a square.
const IMAGE_PREP_TIMEOUT_MS = 6000;

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise(resolve => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise.then(
      value => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(fallback);
      },
    );
  });
}

// Downloads the image into the on-phone cache (the one the tiles and cards
// read from), then reads its size from there.
async function cacheAndMeasure(uri: string): Promise<{ w: number; h: number } | null> {
  try {
    await Image.prefetch(uri, 'memory-disk');
    const ref = await Image.loadAsync(uri);
    const size = { w: ref.width, h: ref.height };
    ref.release();
    return size;
  } catch {
    return null;
  }
}

// Measure and preload every image in a batch, so the posts can be shown at
// their final size with their images ready, instead of resizing and popping
// in one by one.
async function prepareFeedBatch(items: FeedItem[], columnWidth: number): Promise<Record<string, number>> {
  const heights: Record<string, number> = {};
  await Promise.all(
    items.map(async item => {
      if (!item.image) {
        heights[item.id] = columnWidth;
        return;
      }
      const size = await withTimeout(cacheAndMeasure(item.image), IMAGE_PREP_TIMEOUT_MS, null);
      heights[item.id] = size && size.w > 0 ? columnWidth * (size.h / size.w) : columnWidth;
    }),
  );
  return heights;
}

// "0.4 mi", "3.5 mi", "27 mi"; "?" until both players have saved a location.
function formatDistance(mi: number | null): string {
  if (mi == null) return '?';
  if (mi < 10) return `${Math.max(mi, 0.1).toFixed(1)}\u00A0mi`;
  return `${Math.round(mi)}\u00A0mi`;
}

// Placeholder heights (× column width) for the loading skeleton.
const SKELETON_HEIGHTS = [
  [1.3, 1.0, 1.15],
  [1.0, 1.4, 0.9],
];

// The server sorts (and pages) the feed; these are its sort options.
type SortOption = FeedSort;

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: 'nearest', label: 'Nearest' },
  { key: 'farthest', label: 'Farthest' },
  { key: 'newest', label: 'Newest' },
  { key: 'oldest', label: 'Oldest' },
];

// Start loading the next page this far (px) before the bottom.
const LOAD_MORE_DISTANCE = 800;

export default function FeedScreen() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [imageHeights, setImageHeights] = useState<Record<string, number>>({});
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [loadingPostId, setLoadingPostId] = useState<string | null>(null);
  const [prefetchedProfile, setPrefetchedProfile] = useState<FeedProfile | null>(null);
  const [showDeck, setShowDeck] = useState(false);
  // const [showSaved, setShowSaved] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
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

  // Sort and search. The server sorts and pages; changing either reloads
  // from the first page.
  const [sortBy, setSortBy] = useState<SortOption>('nearest');
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Paging: where the next page starts (null: no more), and whether one is
  // on its way. Refs, so a scroll event always sees the latest values.
  const nextOffset = useRef<number | null>(null);
  const loadingMore = useRef(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  /** Load the first page (replacing what's shown). */
  const loadFirstPage = useCallback(
    async (query: string, sort: SortOption) => {
      const loadId = ++latestLoad.current;
      loadingMore.current = false;
      setIsLoadingMore(false);
      try {
        const page = await getFeedPage({ sort, query });
        const heights = await prepareFeedBatch(page.items, columnWidth);
        if (loadId !== latestLoad.current) return; // a newer load replaced this one
        nextOffset.current = page.nextOffset;
        setImageHeights(heights);
        setFeedItems(page.items);
      } catch (err) {
        console.error('Feed load error:', err);
      } finally {
        if (loadId === latestLoad.current) setIsInitialLoading(false);
      }
    },
    [columnWidth],
  );

  /** Add the next page under what's shown (if there is one). */
  const loadNextPage = useCallback(async () => {
    if (nextOffset.current === null || loadingMore.current) return;
    const loadId = latestLoad.current; // a first-page load cancels this one
    loadingMore.current = true;
    setIsLoadingMore(true);
    try {
      const page = await getFeedPage({ sort: sortBy, query: searchQuery, offset: nextOffset.current });
      const heights = await prepareFeedBatch(page.items, columnWidth);
      if (loadId !== latestLoad.current) return;
      nextOffset.current = page.nextOffset;
      setImageHeights(prev => ({ ...prev, ...heights }));
      // A post can shift pages if posts were added meanwhile: skip
      // ones already shown.
      setFeedItems(prev => {
        const shown = new Set(prev.map(p => p.id));
        return [...prev, ...page.items.filter(p => !shown.has(p.id))];
      });
    } catch (err) {
      console.error('Feed load error:', err);
    } finally {
      if (loadId === latestLoad.current) {
        loadingMore.current = false;
        setIsLoadingMore(false);
      }
    }
  }, [columnWidth, sortBy, searchQuery]);

  // Skeleton pulse.
  const skeletonOpacity = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    if (!isInitialLoading) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(skeletonOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(skeletonOpacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [isInitialLoading, skeletonOpacity]);

  // In the server's order; new pages add to the bottom of both columns.
  const leftColumn = feedItems.filter((_, i) => i % 2 === 0);
  const rightColumn = feedItems.filter((_, i) => i % 2 === 1);

  const handleScroll = (event: any) => {
    // Near the bottom: start loading the next page.
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    if (contentOffset.y + layoutMeasurement.height >= contentSize.height - LOAD_MORE_DISTANCE) {
      loadNextPage();
    }

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
          accessibilityRole="button"
          accessibilityLabel={item.title ? `Open ${item.title}` : 'Open post'}
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
              <Image source={{ uri: item.image }} style={styles.image} contentFit="cover" cachePolicy="memory-disk" />
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
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemDistance}>{formatDistance(item.distanceMi)}</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    await loadFirstPage(query, sortBy);
  };

  const clearSearch = async () => {
    setSearchQuery('');
    await loadFirstPage('', sortBy);
  };

  // First load, and again whenever the sort changes.
  useEffect(() => {
    loadFirstPage(searchQuery, sortBy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, loadFirstPage]);

  const HEADER_HEIGHT = 52;
  const [refreshing, setRefreshing] = useState(false);

  // After blocking someone: close their deck and reload without their posts.
  useEffect(
    () =>
      onBlockChange(() => {
        setShowDeck(false);
        loadFirstPage(searchQuery, sortBy);
      }),
    [searchQuery, sortBy, loadFirstPage],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Re-run the active search, or reload the feed. The current posts
      // stay up until the new batch is fully ready.
      await loadFirstPage(searchQuery, sortBy);
    } finally {
      setRefreshing(false);
    }
  }, [searchQuery, sortBy, loadFirstPage]);

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
        onSortPress={() => setShowSortMenu(true)}
      />

      <ScrollView
        testID="feed-scroll"
        style={[styles.scrollView, { marginTop: insets.top }]}
        contentContainerStyle={[styles.scrollContent, Platform.OS === 'android' && { paddingTop: HEADER_HEIGHT }]}
        contentInset={{ top: HEADER_HEIGHT }} // iOS
        contentOffset={{ x: 0, y: -HEADER_HEIGHT }} // iOS: start at the first row
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.ui.secondarydisabled}
            // Android only: iOS already accounts for contentInset, and newer
            // React Native applies this on iOS too, which pushed the spinner
            // down behind the posts.
            progressViewOffset={Platform.OS === 'android' ? HEADER_HEIGHT : undefined}
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
                      <Text style={[styles.itemTitle, styles.skeletonText]} numberOfLines={1}>
                        Item
                      </Text>
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
            <Text style={styles.noResultsText}>There were no posts found under "{searchQuery}"</Text>
          </View>
        )}
        {feedItems.length > 0 && (
          <View style={styles.columnsContainer}>
            <View style={styles.column}>{leftColumn.map(renderItem)}</View>
            <View style={styles.column}>{rightColumn.map(renderItem)}</View>
          </View>
        )}
        {isLoadingMore && (
          <ActivityIndicator
            testID="feed-loading-more"
            style={styles.loadingMore}
            color={colors.ui.secondarydisabled}
          />
        )}
      </ScrollView>

      <FeedDeck
        postId={selectedPostId}
        visible={showDeck}
        onClose={() => setShowDeck(false)}
        prefetchedProfile={prefetchedProfile}
      />
      <Modal transparent visible={showSortMenu} animationType="fade" onRequestClose={() => setShowSortMenu(false)}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowSortMenu(false)}>
          {/* Full width under the header, with 8px of black below. */}
          <View style={[styles.sortMenuArea, { top: insets.top + HEADER_HEIGHT }]}>
            {/* Taps inside the menu don't close it; tap outside to close. */}
            <View style={styles.sortMenu} onStartShouldSetResponder={() => true}>
              <Text style={styles.sortMenuTitle}>SORT BY</Text>
              {SORT_OPTIONS.map(opt => (
                <TouchableOpacity key={opt.key} style={styles.sortOption} onPress={() => setSortBy(opt.key)}>
                  <Text style={[styles.sortOptionText, sortBy !== opt.key && styles.sortOptionTextFaded]}>
                    {opt.label}
                  </Text>
                  {sortBy === opt.key && <FontAwesome6 name="circle-check" size={24} color="#fff" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingMore: {
    paddingVertical: 16,
  },
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
    alignItems: 'center',
  },

  noResultsText: {
    color: colors.ui.secondarydisabled,
    fontSize: 16,
    fontFamily: globalFonts.regular,
    textAlign: 'center',
  },

  // Sort menu: square, under the header with the header's side margins
  // (12); options styled like feed item titles, faded unless selected.
  sortMenuArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingBottom: 8,
    backgroundColor: colors.ui.background,
  },
  sortMenu: {
    backgroundColor: colors.ui.secondary,
    borderRadius: 2,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sortMenuTitle: {
    ...deckStyles.countText,
    height: 36,
    lineHeight: 36,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 36,
  },
  sortOptionText: { fontSize: 18, fontFamily: globalFonts.bold, color: '#FFFFFF' }, // = itemTitle
  sortOptionTextFaded: { color: colors.ui.secondarydisabled },
});
