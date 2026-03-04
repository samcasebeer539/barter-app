import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, Dimensions, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import TextTicker from 'react-native-text-ticker';
import { globalFonts, colors } from '../styles/globalStyles';

interface Post {
  name: string;
  description: string;
  photos: string[];
}

interface PostCardProps {
  post: Post;
  scale?: number;
  cardWidth?: number;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  selectColor?: string;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  scale = 1,
  cardWidth,
  isSelectMode = false,
  isSelected = false,
  onSelect,
  selectColor = colors.actions.offer,
}) => {
  console.log('PostCard render - isSelectMode:', isSelectMode, 'isSelected:', isSelected); // ADD HERE
  const [isDescriptionMode, setIsDescriptionMode] = useState(false);
  const [photoAspectRatios, setPhotoAspectRatios] = useState<number[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

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

  return (
    <Animated.View style={[styles.container, { transform: [{ scale }] }]}>
      <View style={[styles.card, { width: finalCardWidth, height: cardHeight }]}>
        <View style={styles.header}>
           

            <View style={styles.titleContainer}>
                
                <TextTicker
                    key={isSelectMode ? 'select' : 'normal'}
                    style={styles.title}
                    duration={8000}
                    loop
                    bounce={false}
                    repeatSpacer={20}
                    marqueeDelay={200}
                    ellipsizeMode='tail'
                >
                    {post.name}
                </TextTicker>
                <View style={{ flex: 1 }} />
                
                    <TouchableOpacity
                        activeOpacity={0.2}
                        onPress={onSelect}
                        style={[styles.selectIconContainer, {backgroundColor: isSelected ? '#fff' : 'transparent'}]}
                    >
                        {isSelectMode && (
                        <FontAwesome6
                            name={isSelected ? 'circle-check' : 'circle'}
                            size={22}
                            color={isSelected ? selectColor : 'transparent'}
                        />
                        )}
                    </TouchableOpacity>
                
                <View style={styles.iconContainer}>
                  <FontAwesome6
                      name={'arrows-rotate'}
                      size={22}
                      color={colors.actions.trade}
                  />
                </View>
            </View>

            
            
        </View>

        <Animated.View
          style={[styles.photoSectionWrapper, { bottom: photoBottom }]}
          pointerEvents="box-none"
        >
          <View style={styles.photoSection}>
            <View style={styles.photoContainer}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handlePhotoTap}
                style={styles.photoTouchable}
              >
                <View style={[styles.photoFrame, {
                  aspectRatio: photoAspectRatios[currentPhotoIndex] || 1,
                  maxHeight: '100%',
                  maxWidth: '100%'
                }]}>
                  <Image
                    source={{ uri: post.photos[currentPhotoIndex] }}
                    style={styles.photo}
                    resizeMode="cover"
                  />
                </View>
              </TouchableOpacity>
            </View>

            {post.photos.length > 1 && (
              <View style={styles.dotsContainer} pointerEvents="none">
                {post.photos.map((_, index) => (
                  <View
                    key={index}
                    style={[styles.dot, {
                      
                      transform: [{ scale: index === currentPhotoIndex ? 1.2 : 1 }]
                    }]}
                  />
                ))}
              </View>
            )}
          </View>
        </Animated.View>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={toggleMode}
          style={styles.descriptionTouchable}
        >
          <Animated.View style={[styles.descriptionSection, { height: descriptionHeight }]}>
            <View style={styles.descriptionScroll}>
              <Text
                style={styles.descriptionText}
                numberOfLines={isDescriptionMode ? undefined : 4}
              >
                {post.description}
              </Text>
            </View>
          </Animated.View>
        </TouchableOpacity>

        <View style={styles.dateWrapper}>
          <Text style={[styles.date, { color: colors.ui.cardsecondary }]}>{"\n"}11/26/24</Text>
        </View>
{/* 
       {isSelectMode && (
          <>
              <View style={[
                  styles.selectBackground2,
                  { borderColor: isSelected ? selectColor + '75' : '#ffffff22' }
              ]} />
              <View style={[
                  styles.selectBackground,
                  { borderColor: isSelected ? selectColor + '75' : '#ffffff22' }
              ]} />
              <View style={[
                  styles.selectBorder,
                  { borderColor: isSelected ? 'transparent' : 'transparent' }
              ]} />
          </>
      )} */}

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
  selectBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 3,
   
    borderTopLeftRadius: 4,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    zIndex: 99,
    pointerEvents: 'none',
    marginHorizontal: 6,
    marginVertical: 6,
  },
  selectBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 8,
    borderColor: colors.actions.trade,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    zIndex: 99,
    pointerEvents: 'none',

},
selectBackground2: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 10,
    borderColor: colors.actions.trade,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 34,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    zIndex: 99,
    pointerEvents: 'none',
    marginHorizontal: -10,
    marginVertical: -10,

},
  card: {
    backgroundColor: '#fff',
    borderWidth: 0,
    borderRadius: 2,
    shadowColor: colors.ui.secondary,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  iconContainer: {
    flexShrink: 0,
    paddingBottom: 16,
  },
  selectIconContainer: {
    
    flexShrink: 0,
    paddingBottom: 16,
},
  titleContainer: {
    flex: 1,
   
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 4,
    
  },
  textTickerWidth: {
    width: 200,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 22,
    color: '#000',
    fontFamily: globalFonts.bold,
    flex: 1, 
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
    position: 'absolute',
    right: 16,
    bottom: 10,
    zIndex: 30,
  },
  photoSectionWrapper: {
    position: 'absolute',
    top: 48,
    left: 16,
    right: 16,
  },
  photoSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoFrame: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
    borderRadius: 2,
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
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
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
    paddingTop: 8,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#fff',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  descriptionScroll: { flex: 1, flexDirection: 'row' },
  descriptionText: {
    fontSize: 15,
    lineHeight: 20,
    color: colors.ui.background,
    fontFamily: globalFonts.regular,
    letterSpacing: -0.1,
  },
});

export default PostCard;