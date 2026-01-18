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
  const [photoAspectRatio, setPhotoAspectRatio] = useState(1);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Animation values
  const descriptionHeight = useRef(new Animated.Value(80)).current;
  const photoSectionPadding = useRef(new Animated.Value(80)).current;

  // Calculate photo aspect ratio when image loads
  useEffect(() => {
    Image.getSize(post.photos[currentPhotoIndex], (width, height) => {
      setPhotoAspectRatio(width / height);
    });
  }, [currentPhotoIndex, post.photos]);

  // Animate expansion/collapse
  useEffect(() => {
    Animated.spring(descriptionHeight, {
      toValue: expandedDescription ? 180 : 80,
      useNativeDriver: false,
      damping: 20,
      stiffness: 200,
    }).start();

    Animated.spring(photoSectionPadding, {
      toValue: expandedDescription ? 180 : 80,
      useNativeDriver: false,
      damping: 20,
      stiffness: 200,
    }).start();
  }, [expandedDescription]);

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const screenWidth = Dimensions.get('window').width;
    const cardWidth = Math.min(screenWidth - 64, 400) - 32; // Account for padding
    const index = Math.round(scrollPosition / cardWidth);
    setCurrentPhotoIndex(index);
  };

  const screenWidth = Dimensions.get('window').width;
  const cardWidth = Math.min(screenWidth - 64, 400);
  const cardHeight = cardWidth * (3.5 / 2.5); // Playing card aspect ratio
  const photoWidth = cardWidth - 32; // Account for card padding

  return (
    <View style={styles.container}>
      <View style={[styles.card, { width: cardWidth, height: cardHeight }]}>
        {/* Header Section */}
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
            <Text style={styles.title}>{post.name}</Text>
          </View>
        </View>

        {/* Photo Section with horizontal scroll */}
        <TouchableOpacity 
          activeOpacity={1}
          onPress={() => setExpandedDescription(!expandedDescription)}
          style={styles.photoSectionWrapper}
        >
          <Animated.View 
            style={[
              styles.photoSection,
              { paddingBottom: photoSectionPadding }
            ]}
          >
            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              style={styles.photoScrollView}
              contentContainerStyle={styles.photoScrollContent}
            >
              {post.photos.map((photo, index) => (
                <View 
                  key={index}
                  style={[
                    styles.photoContainer,
                    { width: photoWidth }
                  ]}
                >
                  <View 
                    style={[
                      styles.photoFrame,
                      { aspectRatio: photoAspectRatio }
                    ]}
                  >
                    <Image
                      source={{ uri: photo }}
                      style={styles.photo}
                      resizeMode="cover"
                    />
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Photo indicator dots */}
            {post.photos.length > 1 && (
              <View style={styles.dotsContainer}>
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
          </Animated.View>
        </TouchableOpacity>

        {/* Description Section */}
        <TouchableOpacity 
          activeOpacity={1}
          onPress={() => setExpandedDescription(!expandedDescription)}
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
            >
              <Text 
                style={styles.descriptionText}
                numberOfLines={expandedDescription ? undefined : 3}
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
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconContainer: {
    flexShrink: 0,
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
    left: 0,
    right: 0,
    bottom: 0,
  },
  photoSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  photoScrollView: {
    flex: 1,
  },
  photoScrollContent: {
    alignItems: 'center',
  },
  photoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  photoFrame: {
    width: '100%',
    maxHeight: '100%',
    backgroundColor: '#fff',
    borderWidth: 16,
    borderColor: '#fff',
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  descriptionSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    paddingTop: 16,
    paddingBottom: 20,
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
