import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, Dimensions, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface Post {
  type: 'good' | 'service';
  name: string;
  description: string;
  photos: string[];
}

interface BarterCardProps {
  post: Post;
}

const BarterCard: React.FC<BarterCardProps> = ({ post }) => {
  const [expandedDescription, setExpandedDescription] = useState(false);
  const [photoAspectRatio, setPhotoAspectRatio] = useState(1);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Calculate photo aspect ratio when image loads
  useEffect(() => {
    Image.getSize(post.photos[currentPhotoIndex], (width, height) => {
      setPhotoAspectRatio(width / height);
    });
  }, [currentPhotoIndex, post.photos]);

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % post.photos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + post.photos.length) % post.photos.length);
  };

  const screenWidth = Dimensions.get('window').width;
  const cardWidth = Math.min(screenWidth - 64, 400);
  const cardHeight = cardWidth * (3.5 / 2.5); // Playing card aspect ratio

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

        {/* Photo Section */}
        <TouchableOpacity 
          activeOpacity={1}
          onPress={() => setExpandedDescription(!expandedDescription)}
          style={[
            styles.photoSection,
            { 
              paddingBottom: expandedDescription ? 180 : 80,
            }
          ]}
        >
          <View style={styles.photoContainer}>
            <View 
              style={[
                styles.photoFrame,
                { aspectRatio: photoAspectRatio }
              ]}
            >
              <Image
                source={{ uri: post.photos[currentPhotoIndex] }}
                style={styles.photo}
                resizeMode="cover"
              />
              
              {/* Photo navigation buttons */}
              {post.photos.length > 1 && (
                <>
                  <TouchableOpacity
                    onPress={prevPhoto}
                    style={[styles.navButton, styles.navButtonLeft]}
                  >
                    <MaterialIcons name="chevron-left" size={24} color="#000" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={nextPhoto}
                    style={[styles.navButton, styles.navButtonRight]}
                  >
                    <MaterialIcons name="chevron-right" size={24} color="#000" />
                  </TouchableOpacity>
                  
                  {/* Photo indicator dots */}
                  <View style={styles.dotsContainer}>
                    {post.photos.map((_, index) => (
                      <View
                        key={index}
                        style={[
                          styles.dot,
                          { backgroundColor: index === currentPhotoIndex ? '#000' : '#d4d4d4' }
                        ]}
                      />
                    ))}
                  </View>
                </>
              )}
            </View>
          </View>
        </TouchableOpacity>

        {/* Description Section */}
        <TouchableOpacity 
          activeOpacity={1}
          onPress={() => setExpandedDescription(!expandedDescription)}
          style={[
            styles.descriptionSection,
            { height: expandedDescription ? 180 : 80 }
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
  photoSection: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
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
  navButton: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -20 }],
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  navButtonLeft: {
    left: 8,
  },
  navButtonRight: {
    right: 8,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 8,
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

export default BarterCard;
