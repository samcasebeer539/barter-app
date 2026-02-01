import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, Dimensions, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { defaultTextStyle, globalFonts } from '../styles/globalStyles';


interface Post {
  type: 'good' | 'service';
  name: string;
  description: string;
  photos: string[];
}

interface PostCardProps {
  post: Post;
  scale?: number; // optional scaling factor
  cardWidth?: number; // optional width override
}

const PostCard: React.FC<PostCardProps> = ({ post, scale = 1, cardWidth }) => {
  
  const [isDescriptionMode, setIsDescriptionMode] = useState(false);
  const [photoAspectRatios, setPhotoAspectRatios] = useState<number[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const titleScrollViewRef = useRef<ScrollView>(null);
  const [titleWidth, setTitleWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const titleScrollX = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);


  const isGood = post.type === 'good';
  const borderColor = isGood ? '#FFA600' : '#ff536a';


  // Animation values
  const descriptionHeight = useRef(new Animated.Value(100)).current;
  const photoMode4Lines = 100;
  const descriptionModeHeight = 250;

  // New animated value for photo section bottom
  const photoBottom = useRef(new Animated.Value(photoMode4Lines)).current;

  useEffect(() => {
    const ratios: number[] = [];
    let loadedCount = 0;

    post.photos.forEach((photo, index) => {
      Image.getSize(
        photo,
        (width, height) => {
          ratios[index] = width / height;
          loadedCount++;
          if (loadedCount === post.photos.length) setPhotoAspectRatios([...ratios]);
        },
        () => {
          ratios[index] = 1;
          loadedCount++;
          if (loadedCount === post.photos.length) setPhotoAspectRatios([...ratios]);
        }
      );
    });
  }, [post.photos]);

  // Auto-scroll title if it's too long
  useEffect(() => {
    // Stop any existing animation
    if (animationRef.current) {
      animationRef.current.stop();
    }

    if (titleWidth > containerWidth && containerWidth > 0) {
      const scrollDistance = titleWidth - containerWidth + 20; // Add padding
      const duration = Math.max(scrollDistance * 30, 2000); // Minimum 2 seconds
      
      animationRef.current = Animated.loop(
        Animated.sequence([
          Animated.delay(1500),
          Animated.timing(titleScrollX, {
            toValue: -scrollDistance,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.delay(1500),
          Animated.timing(titleScrollX, {
            toValue: 0,
            duration: duration,
            useNativeDriver: true,
          }),
        ])
      );
      
      animationRef.current.start();
    } else {
      // Reset position if title fits
      titleScrollX.setValue(0);
    }

    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [titleWidth, containerWidth, titleScrollX]);

  // Animate both description height and photo bottom
  useEffect(() => {
    Animated.spring(descriptionHeight, {
      toValue: isDescriptionMode ? descriptionModeHeight : photoMode4Lines,
      useNativeDriver: false,
      damping: 20,
      stiffness: 200,
    }).start();

    Animated.spring(photoBottom, {
      toValue: isDescriptionMode ? descriptionModeHeight : photoMode4Lines,
      useNativeDriver: false,
      damping: 20,
      stiffness: 200,
    }).start();
  }, [isDescriptionMode]);

  const toggleMode = () => setIsDescriptionMode(!isDescriptionMode);

  const screenWidth = Dimensions.get('window').width;
  const defaultCardWidth = Math.min(screenWidth - 64, 400);
  const finalCardWidth = cardWidth ?? defaultCardWidth;
  const cardHeight = finalCardWidth * (3.5 / 2.5);
  const photoContainerWidth = finalCardWidth - 32;

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / (photoContainerWidth + 16));
    if (index >= 0 && index < post.photos.length) setCurrentPhotoIndex(index);
  };

  

  return (
    <Animated.View
      style={[styles.container, { transform: [{ scale }] }]} 
    >
      <View style={[styles.card, { width: finalCardWidth, height: cardHeight, borderColor: borderColor }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <FontAwesome6
              name={post.type === 'good' ? 'cube' : 'stopwatch'}
              size={24}
              color={post.type === 'good' ? '#FFA600' : '#ff536a'}
            />
        

          </View>
          <View 
            style={styles.titleContainer}
            onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
          >
            <View style={styles.titleScrollContainer}>
              <Animated.Text 
                style={[
                  styles.title,
                  { transform: [{ translateX: titleScrollX }] }
                ]}
                numberOfLines={1}
                onLayout={(e) => setTitleWidth(e.nativeEvent.layout.width)}
              >
                {post.name}
              </Animated.Text>
            </View>
          </View>
        </View>

        {/* Photo Section */}
        <Animated.View
          style={[styles.photoSectionWrapper, { bottom: photoBottom }]} // Animated bottom for smooth transitions
          pointerEvents="box-none"
        >
          <View style={styles.photoSection}>
            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              snapToInterval={photoContainerWidth + 16}
              decelerationRate="fast"
              contentContainerStyle={styles.scrollContent}
            >
              {post.photos.map((photo, index) => (
                <View
                  key={index}
                  style={[styles.photoContainer, { width: photoContainerWidth, marginRight: index < post.photos.length - 1 ? 16 : 0 }]}
                >
                  <TouchableOpacity activeOpacity={1} onPress={toggleMode} style={styles.photoTouchable}>
                    <View
                      style={[styles.photoFrame, { aspectRatio: photoAspectRatios[index] || 1, maxHeight: '100%', maxWidth: '100%' }]}
                    >
                      <Image source={{ uri: photo }} style={styles.photo} resizeMode="cover" />
                      {/* Inner shadow using LinearGradient overlays */}
                      <View style={styles.innerShadowContainer} pointerEvents="none">
                        {/* Top gradient */}
                        <LinearGradient
                          colors={['rgba(0,0,0,0.1)', 'transparent']}
                          style={styles.gradientTop}
                          pointerEvents="none"
                        />
                        {/* Bottom gradient */}
                        <LinearGradient
                          colors={['transparent', 'rgba(0,0,0,0.1)']}
                          style={styles.gradientBottom}
                          pointerEvents="none"
                        />
                        
                    
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            {post.photos.length > 1 && (
              <View style={styles.dotsContainer} pointerEvents="none">
                {post.photos.map((_, index) => (
                  <View
                    key={index}
                    style={[styles.dot, { backgroundColor: index === currentPhotoIndex ? '#000' : '#d4d4d4', transform: [{ scale: index === currentPhotoIndex ? 1.2 : 1 }] }]}
                  />
                ))}
              </View>
            )}
          </View>
        </Animated.View>

        {/* Description */}
        <TouchableOpacity activeOpacity={0.9} onPress={toggleMode} style={styles.descriptionTouchable}>
          <Animated.View style={[styles.descriptionSection, { height: descriptionHeight }]}>
            <ScrollView
              style={styles.descriptionScroll}
              showsVerticalScrollIndicator={isDescriptionMode}
              scrollEnabled={isDescriptionMode}
              nestedScrollEnabled={true}
            >
              <Text style={styles.descriptionText} numberOfLines={isDescriptionMode ? undefined : 4}>
                {post.description}
              </Text>
            </ScrollView>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  card: {
    backgroundColor: '#fff',
    borderWidth: 4,
    borderRadius: 12,
    borderColor: '#f39406',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.0,
    shadowRadius: 40,
    elevation: 10,
    position: 'relative',
  },
  header: {
    padding: 14,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  iconContainer: { flexShrink: 0, paddingBottom: 12 },
  titleContainer: { 
    flex: 1,
    overflow: 'hidden',
  },
  titleScrollContainer: {
    flexDirection: 'row',
  },
  title: { 
    fontSize: 18, 
    fontWeight: '600', 
    lineHeight: 24, 
    color: '#000',
    fontFamily: globalFonts.bold,
  },
  photoSectionWrapper: { position: 'absolute', top: 60, left: 12, right: 12 },
  photoSection: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { alignItems: 'center' },
  photoContainer: { justifyContent: 'center', alignItems: 'center', height: '100%' },
  photoTouchable: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  photoFrame: { 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 8, 
    elevation: 3, 
    overflow: 'hidden', 
    borderRadius: 4,
    position: 'relative',
  },
  photo: { width: '100%', height: '100%' },
  innerShadowContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 4,
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 10,
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 5,
  },
  gradientLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 10,
  },
  gradientRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 5,
  },
  dotsContainer: { position: 'absolute', top: 16, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  descriptionTouchable: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20 },
  descriptionSection: { backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20, borderTopWidth: 1, borderTopColor: '#fff', borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
  descriptionScroll: { flex: 1 },
  descriptionText: { fontSize: 15, lineHeight: 21, color: '#000000', ...defaultTextStyle },
});

export default PostCard;