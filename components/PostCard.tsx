import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, Dimensions, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import TextTicker from 'react-native-text-ticker';
import { defaultTextStyle, globalFonts, colors } from '../styles/globalStyles';


interface Post {
  type: 'good' | 'service';
  name: string;
  description: string;
  photos: string[];
}

interface PostCardProps {
  post: Post;
  scale?: number;
  cardWidth?: number;
}

const PostCard: React.FC<PostCardProps> = ({ post, scale = 1, cardWidth }) => {
  
  const [isDescriptionMode, setIsDescriptionMode] = useState(false);
  const [photoAspectRatios, setPhotoAspectRatios] = useState<number[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [isSelected, setIsSelected] = useState(false);

  const descriptionHeight = useRef(new Animated.Value(100)).current;
  const photoMode4Lines = 100;
  const descriptionModeHeight = 250;
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

  const handlePhotoTap = () => {
    if (post.photos.length <= 1) return;

    let newIndex = currentPhotoIndex;
    let newDirection = direction;

    if (direction === 'forward') {
      if (currentPhotoIndex < post.photos.length - 1) {
        newIndex = currentPhotoIndex + 1;
      } else {
        newDirection = 'backward';
        newIndex = currentPhotoIndex - 1;
      }
    } else {
      if (currentPhotoIndex > 0) {
        newIndex = currentPhotoIndex - 1;
      } else {
        newDirection = 'forward';
        newIndex = currentPhotoIndex + 1;
      }
    }

    setCurrentPhotoIndex(newIndex);
    setDirection(newDirection);
  };

  const handleSelect = () => {
    console.log('card selected');
    setIsSelected(prev => !prev);
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ scale }] }]}>
      <View style={[styles.card, { width: finalCardWidth, height: cardHeight}]}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <FontAwesome6
              name={post.type === 'good' ? 'gifts' : 'hand-sparkles'}
              size={24}
              color={post.type === 'good' ? colors.cardTypes.good : colors.cardTypes.service}
            />
            
          </View>

          <View style={styles.titleContainer}>
            <TextTicker
              style={styles.title}
              duration={8000}
              loop
              bounce={false}
              repeatSpacer={50}
              marqueeDelay={200}
              ellipsizeMode='tail'
            >
              
              {post.name}
              <TouchableOpacity activeOpacity={0.2} onPress={handleSelect} style={styles.selectContainer}>
              <FontAwesome6
                name={isSelected ? 'circle-check' : 'circle'}
                size={24}
                color={'#fff'}
              />
            </TouchableOpacity> 
            </TextTicker>
          </View>

          
        </View>

        <Animated.View style={[styles.photoSectionWrapper, { bottom: photoBottom }]} pointerEvents="box-none">
          <View style={styles.photoSection}>
            <View style={styles.photoContainer}>
              <TouchableOpacity activeOpacity={0.8} onPress={handlePhotoTap} style={styles.photoTouchable}>
                <View style={[styles.photoFrame, { aspectRatio: photoAspectRatios[currentPhotoIndex] || 1, maxHeight: '100%', maxWidth: '100%' }]}>
                  <Image source={{ uri: post.photos[currentPhotoIndex] }} style={styles.photo} resizeMode="cover" />
                </View>
              </TouchableOpacity>
            </View>

            {post.photos.length > 1 && (
              <View style={styles.dotsContainer} pointerEvents="none">
                {post.photos.map((_, index) => (
                  <View
                    key={index}
                    style={[styles.dot, { backgroundColor: index === currentPhotoIndex ? post.type === 'good' ? colors.cardTypes.good : colors.cardTypes.service : '#fff', transform: [{ scale: index === currentPhotoIndex ? 1.2 : 1 }] }]}
                  />
                ))}
              </View>
            )}
          </View>
        </Animated.View>

        <TouchableOpacity activeOpacity={0.9} onPress={toggleMode} style={styles.descriptionTouchable}>
          <Animated.View style={[styles.descriptionSection, { height: descriptionHeight }]}>
            <View style={styles.descriptionScroll}>
              
              <Text style={styles.descriptionText} numberOfLines={isDescriptionMode ? undefined : 4}>
                
                {post.description}
                {/* <Text style={styles.date}>{"\n"}11/26/24</Text> */}
              </Text>
              
            </View>
          </Animated.View>
        </TouchableOpacity>
        
        <View style={styles.dateWrapper}>
          <Text style={styles.date}>{"\n"}11/26/24</Text>
        </View>
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
    borderWidth: 0,
    borderRadius: 6,
    shadowColor: colors.ui.secondary,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 10,
    position: 'relative',
  },
  header: {
    padding: 14,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  iconContainer: { 
    flexShrink: 0, 
    paddingBottom: 12,
  },
  selectContainer: { 
    position: 'absolute', 
    bottom: 10, 
    right: 16, 
     
    zIndex: 30,
  },
  titleContainer: { 
    flex: 1,
    overflow: 'hidden',
  },
  title: { 
    fontSize: 18, 
    fontWeight: '600', 
    lineHeight: 24, 
    color: '#000',
    fontFamily: globalFonts.bold,
  },
  date: { 
    fontSize: 18, 
    fontWeight: '600', 
    lineHeight: 24, 
    color: colors.ui.cardsecondary,
    fontFamily: globalFonts.regular,
    textAlign: 'right',
    
  },
  dateWrapper: {
    right: 16,
    top: 374,
    zIndex: 30,
  
  },
  photoSectionWrapper: { 
    position: 'absolute', 
    top: 52, 
    left: 16, 
    right: 16 
  },
  photoSection: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  photoContainer: { 
    width: '100%',
    height: '100%',
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  photoTouchable: { 
    width: '100%', 
    height: '100%', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
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
  dotsContainer: { 
    position: 'absolute', 
    bottom: 8,
    left: 0, 
    right: 0, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    gap: 6 
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  descriptionTouchable: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    zIndex: 20 
  },
  descriptionSection: { 
    backgroundColor: '#fff', 
    paddingHorizontal: 16, 
    paddingTop: 8, 
    paddingBottom: 20, 
    borderTopWidth: 1, 
    borderTopColor: '#fff', 
    borderBottomLeftRadius: 8, 
    borderBottomRightRadius: 8 
  },
  descriptionScroll: { flex: 1, flexDirection: 'row' },
  descriptionText: { 
    fontSize: 15, 
    lineHeight: 18, 
    color: colors.ui.background, 
    ...defaultTextStyle 
  },
});

export default PostCard;