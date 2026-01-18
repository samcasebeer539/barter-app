import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, Dimensions, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface Post {
  type: 'good' | 'service';
  name: string;
  description: string;
  photos: string[];
}

interface PostCardProps {
  post: Post;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const [expandedDescription, setExpandedDescription] = useState(false);
  const [photoAspectRatios, setPhotoAspectRatios] = useState<number[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Animation values
  const descriptionHeight = useRef(new Animated.Value(58)).current; // 2 lines minimum

  // Calculate aspect ratios for all photos on mount
  useEffect(() => {
    const ratios: number[] = [];
    let loadedCount = 0;
    
    post.photos.forEach((photo, index) => {
      Image.getSize(
        photo,
        (width, height) => {
          ratios[index] = width / height;
          loadedCount++;
          
          // Once all images are loaded, update state
          if (loadedCount === post.photos.length) {
            setPhotoAspectRatios([...ratios]);
          }
        },
        () => {
          // Fallback if image fails to load
          ratios[index] = 1;
          loadedCount++;
          
          if (loadedCount === post.photos.length) {
            setPhotoAspectRatios([...ratios]);
          }
        }
      );
    });
  }, [post.photos]);

  // Animate expansion/collapse
  useEffect(() => {
    Animated.spring(descriptionHeight, {
      toValue: expandedDescription ? 250 : 58, // Expanded goes taller, collapsed is 2 lines
      useNativeDriver: false,
      damping: 20,
      stiffness: 200,
    }).start();
  }, [expandedDescription]);

  const toggleDescription = () => {
    setExpandedDescription(!expandedDescription);
  };

  const screenWidth = Dimensions.get('window').width;
  const cardWidth = Math.min(screenWidth - 64, 400);
  const cardHeight = cardWidth * (3.5 / 2.5); // Playing card aspect ratio
  const photoContainerWidth = cardWidth - 32; // Account for card padding (16px each side)

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / (photoContainerWidth + 16));
    if (index >= 0 && index < post.photos.length) {
      setCurrentPhotoIndex(index);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.card, { width: cardWidth, height: cardHeight }]}>
        {/* Header */}
        <View style={styles.header}>
          {/* Type Icon */}
          <View style={styles.iconContainer}>
            <MaterialIcons 
              name={post.type === 'good' ? 'shopping-bag' : 'build'} 
              size={20} 
              color="#000" 
            />
          </View>
          
          {/* Post Name */}
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={2}>
              {post.name}
            </Text>
          </View>
        </View>

        {/* Photo Section with horizontal scroll */}
        <View style={styles.photoSectionWrapper} pointerEvents="box-none">
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
                  style={[
                    styles.photoContainer,
                    { 
                      width: photoContainerWidth,
                      marginRight: index < post.photos.length - 1 ? 16 : 0
                    }
                  ]}
                >
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={toggleDescription}
                    style={styles.photoTouchable}
                  >
                    <View 
                      style={[
                        styles.photoFrame,
                        { aspectRatio: photoAspectRatios[index] || 1 }
                      ]}
                    >
                      <Image
                        source={{ uri: photo }}
                        style={styles.photo}
                        resizeMode="cover"
                      />
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            {/* Photo indicator dots - positioned just below top of image */}
            {post.photos.length > 1 && (
              <View style={styles.dotsContainer} pointerEvents="none">
                {post.photos.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      { 
                        backgroundColor: index === currentPhotoIndex ? '#000' : '#d4d4d4',
                        transform: [{ scale: index === currentPhotoIndex ? 1.2 : 1 }]
                      }
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Description Section - Always at bottom, expands upward */}
        <TouchableOpacity 
          activeOpacity={0.9}
          onPress={toggleDescription}
          style={styles.descriptionTouchable}
        >
          <Animated.View 
            style={[
              styles.descriptionSection,
              { height: descriptionHeight }
            ]}
          >
            <ScrollView 
              style={styles.descriptionScroll}
              showsVerticalScrollIndicator={expandedDescription}
              scrollEnabled={expandedDescription}
              nestedScrollEnabled={true}
            >
              <Text 
                style={styles.descriptionText}
                numberOfLines={expandedDescription ? undefined : 2}
              >
                {post.description}
              </Text>
            </ScrollView>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 40,
    elevation: 10,
    position: 'relative',
  },
  header: {
    padding: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  iconContainer: {
    flexShrink: 0,
    paddingTop: 2,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    color: '#000',
  },
  photoSectionWrapper: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    bottom: 74, // Leave room for minimum 2 lines of description
  },
  photoSection: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  scrollContent: {
    alignItems: 'flex-start',
  },
  photoContainer: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    height: '100%',
  },
  photoTouchable: {
    width: '100%',
  },
  photoFrame: {
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
    borderRadius: 4,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  dotsContainer: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  descriptionTouchable: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  descriptionSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  descriptionScroll: {
    flex: 1,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#525252',
  },
});

export default PostCard;
