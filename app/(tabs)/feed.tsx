import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Image, useWindowDimensions, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useState, useRef, useEffect, useCallback } from 'react';
import FeedDeck from '@/components/DeckFeed';
import FeedBar from '@/components/BarFeed';
import { globalFonts, colors } from '../../styles/globalStyles';
import { getFeedPosts, getFeedProfile, FeedItem, FeedProfile } from '@/services/feedService';



export default function FeedScreen() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [imageHeights, setImageHeights] = useState<Record<string, number>>({});
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [loadingPostId, setLoadingPostId] = useState<string | null>(null);
  const [prefetchedProfile, setPrefetchedProfile] = useState<FeedProfile | null>(null);
  const [showDeck, setShowDeck] = useState(false);
  const [showSaved, setShowSaved] = useState(true);
  const [showLocation, setShowLocation] = useState(true);
  const scrollY = useRef(0);
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const [showHeader, setShowHeader] = useState(true);
  const { width } = useWindowDimensions();
  // Each column is half the screen minus padding/gap
  const columnWidth = (width - 24 - 4) / 2;

  useEffect(() => {
    getFeedPosts()
      .then(setFeedItems)
      .catch(err => console.error('Feed load error:', err));
  }, []);

  // When a new image URI is known, measure its natural dimensions
  useEffect(() => {
    feedItems.forEach(item => {
      if (!item.image || imageHeights[item.id] !== undefined) return;
      Image.getSize(
        item.image,
        (w, h) => {
          const aspectRatio = h / w;
          setImageHeights(prev => ({ ...prev, [item.id]: columnWidth * aspectRatio }));
        },
        () => {
          // Fallback height if getSize fails
          setImageHeights(prev => ({ ...prev, [item.id]: columnWidth }));
        }
      );
    });
  }, [feedItems, columnWidth]);

  const leftColumn = feedItems.filter((_, i) => i % 2 === 0);
  const rightColumn = feedItems.filter((_, i) => i % 2 === 1);

  const handleScroll = (event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
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
                <ActivityIndicator size="small" color="#ffffff" />
              </View>
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.itemTitleWrapper}>
          <Text style={styles.itemTitle}>
            {item.title}
            <Text style={styles.itemDistance}> 12{'\u00A0'}mi</Text>
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <FeedBar
        showLocation={showLocation}
        showSaved={showSaved}
        onLocationPress={() => setShowLocation(prev => !prev)}
        onSavePress={() => setShowSaved(prev => !prev)}
        headerTranslateY={headerTranslateY}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.columnsContainer}>
          <View style={styles.column}>
            {leftColumn.map(renderItem)}
          </View>
          <View style={styles.column}>
            {rightColumn.map(renderItem)}
          </View>
        </View>
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
    marginTop: 44,
  },
  scrollContent: {
    padding: 12,
    paddingTop: 56,
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
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
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
    paddingLeft: 8,
    paddingRight: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 2,
    minHeight: 36,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 2,
    flexWrap: 'wrap',
  },
  itemTitle: {
    fontSize: 16,
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
});