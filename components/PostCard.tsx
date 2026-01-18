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
  // Service type starts in description mode, good type starts in photo mode
  const [isDescriptionMode, setIsDescriptionMode] = useState(post.type === 'service');
  const [photoAspectRatios, setPhotoAspectRatios] = useState<number[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Animation values
  const descriptionHeight = useRef(new Animated.Value(post.type === 'service' ? 250 : 100)).current;
  const photoMode4Lines = 100; // 4 lines in photo mode
  const descriptionModeHeight = 250; // Larger in description mode

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
          
          if (loadedCount === post.photos.length) {
            setPhotoAspectRatios([...ratios]);
          }
        },
        () => {
          ratios[index] = 1;
          loadedCount++;
          
          if (loadedCount === post.photos.length) {
            setPhotoAspectRatios([...ratios]);
          }
        }
      );
    });
  }, [post.photos]);

  // Animate mode switch
  useEffect(() => {
    Animated.spring(descriptionHeight, {
      toValue: isDescriptionMode ? descriptionModeHeight : photoMode4Lines,
      useNativeDriver: false,
      damping: 20,
      stiffness: 200,
    }).start();
  }, [isDescriptionMode]);

  const toggleMode = () => {
    setIsDescriptionMode(!isDescriptionMode);
  };

  const screenWidth = Dimensions.get('window').width;
  const cardWidth = Math.min(screenWidth - 64, 400);
  const cardHeight = cardWidth * (3.5 / 2.5);
  const photoContainerWidth = cardWidth - 32;

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
          <View style={styles.iconContainer}>
            <MaterialIcons 
              name={post.type === 'good' ? 'shopping-bag' : 'build'} 
              size={20} 
              color="#000" 
            />
          </View>
          
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={2}>
              {post.name}
            </Text>
          </View>
        </View>

        {/* Photo Section */}
        <View 
          style={[
            styles.photoSectionWrapper,
            { bottom: isDescriptionMode ? descriptionModeHeight : photoMode4Lines }
          ]} 
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
                    onPress={isDescriptionMode ? toggleMode : undefined}
                    style={styles.photoTouchable}
                  >
                    <View 
                      style={[
                        styles.photoFrame,
                        { 
                          aspectRatio: photoAspectRatios[index] || 1,
                          maxHeight: isDescriptionMode ? '100%' : undefined
                        }
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

            {/* Photo indicator dots */}
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

        {/* Description Section - Always at bottom */}
        <TouchableOpacity 
          activeOpacity={0.9}
          onPress={toggleMode}
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
              showsVerticalScrollIndicator={isDescriptionMode}
              scrollEnabled={isDescriptionMode}
              nestedScrollEnabled={true}
            >
              <Text 
                style={styles.descriptionText}
                numberOfLines={isDescriptionMode ? undefined : 4}
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
    height: '100%',
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
