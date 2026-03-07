import { colors, globalFonts } from '@/styles/globalStyles';
import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, Text, TouchableOpacity, TextInput } from 'react-native';
import MapView, { Marker, MapPressEvent } from 'react-native-maps';
import { FontAwesome6 } from '@expo/vector-icons';

const MAX_LOCATIONS = 3;

const initialRegion = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

interface LocationEntry {
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  description: string;
}

interface CardLocationProps {
  scale?: number;
  cardWidth?: number;
  mapActiveRef?: React.MutableRefObject<boolean>;
  onConfirm?: (locations: LocationEntry[]) => void;
}

const uid = () => Math.random().toString(36).slice(2, 8);

const CardLocation: React.FC<CardLocationProps> = ({
  scale = 1,
  cardWidth,
  mapActiveRef,
  onConfirm,
}) => {
  const screenWidth = Dimensions.get('window').width;
  const defaultCardWidth = Math.min(screenWidth - 64, 400);
  const finalCardWidth = cardWidth ?? defaultCardWidth;
  const cardHeight = finalCardWidth * (3.5 / 2.5);

  const [locations, setLocations] = useState<LocationEntry[]>([]);
  const [pendingPin, setPendingPin] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isNaming, setIsNaming] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [footerHeight, setFooterHeight] = useState(80);

  const handleMapPress = (event: MapPressEvent) => {
    if (isNaming) return;
    const { coordinate } = event.nativeEvent;
    setPendingPin(coordinate);
  };

  const handleAddLocationPress = () => {
    if (!pendingPin) return;
    setNameInput('');
    setDescInput('');
    setIsNaming(true);
  };

  const handleSave = () => {
    if (!pendingPin || !nameInput.trim()) return;
    setLocations(prev => [...prev, {
      id: uid(),
      latitude: pendingPin.latitude,
      longitude: pendingPin.longitude,
      name: nameInput.trim(),
      description: descInput.trim(),
    }]);
    setPendingPin(null);
    setNameInput('');
    setDescInput('');
    setIsNaming(false);
  };

  const handleCancelNaming = () => {
    setIsNaming(false);
    setNameInput('');
    setDescInput('');
  };

  const removeLocation = (id: string) => {
    setLocations(prev => prev.filter(l => l.id !== id));
  };

  const pinReady = !!pendingPin && !isNaming;
  const canAddMore = locations.length < MAX_LOCATIONS;

  return (
    <View
      style={[styles.container, { transform: [{ scale }] }]}
      onStartShouldSetResponder={() => true}
    >
      <View style={[styles.card, { width: finalCardWidth, height: cardHeight }]}>

        <View
          style={[styles.mapWrapper, { marginBottom: footerHeight }]}
          onTouchStart={() => { if (mapActiveRef) mapActiveRef.current = true; }}
          onTouchEnd={() => { if (mapActiveRef) mapActiveRef.current = false; }}
          onTouchCancel={() => { if (mapActiveRef) mapActiveRef.current = false; }}
        >
          <MapView
            style={StyleSheet.absoluteFillObject}
            initialRegion={initialRegion}
            onPress={handleMapPress}
            scrollEnabled={true}
            zoomEnabled={true}
            rotateEnabled={true}
            pitchEnabled={true}
            userInterfaceStyle="dark"
          >
            {locations.map(loc => (
              <Marker
                key={loc.id}
                coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
                pinColor={colors.ui.cardsecondary}
                title={loc.name}
              />
            ))}
            {pendingPin && (
              <Marker
                coordinate={pendingPin}
                pinColor={colors.actions.location}
              />
            )}
          </MapView>
        </View>

        <View
          style={styles.footer}
          onLayout={e => setFooterHeight(e.nativeEvent.layout.height)}
        >
          <View style={styles.titleRow}>
            <Text style={styles.footerTitle}>Your Safe Exchange Locations</Text>
            <FontAwesome6 name="circle-dot" size={24} color={colors.ui.cardsecondary} />
          </View>

          {locations.map(loc => (
            <View key={loc.id} style={styles.locationRow}>
              <View style={styles.locationInfo}>
                <Text style={styles.locationName}>{loc.name}</Text>
                <Text style={styles.coordText}>
                  {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                </Text>
                {loc.description ? (
                  <Text style={styles.locationDesc}>{loc.description}</Text>
                ) : null}
              </View>
              <TouchableOpacity onPress={() => removeLocation(loc.id)} hitSlop={8}>
                <FontAwesome6 name="circle-xmark" size={24} color={colors.ui.cardsecondary} />
              </TouchableOpacity>
            </View>
          ))}

          {canAddMore && !isNaming && (
            <TouchableOpacity
              style={styles.addLocationBtn}
              onPress={handleAddLocationPress}
              disabled={!pinReady}
              activeOpacity={pinReady ? 0.7 : 1}
            >
              <FontAwesome6
                name="circle-plus"
                size={24}
                color={pinReady ? colors.actions.location : colors.ui.cardsecondary}
              />
              <Text style={[
                styles.addLocationText,
                { color: pinReady ? colors.actions.location : colors.ui.cardsecondary }
              ]}>
                Location
              </Text>
            </TouchableOpacity>
          )}

          {isNaming && (
            <View style={styles.namingBlock}>
              <View style={styles.nameRow}>
                <TextInput
                  style={styles.nameInput}
                  value={nameInput}
                  onChangeText={setNameInput}
                  placeholder="Name"
                  placeholderTextColor={colors.ui.cardsecondary}
                  autoFocus
                  returnKeyType="next"
                />
                <TouchableOpacity onPress={handleSave} hitSlop={8} disabled={!nameInput.trim()}>
                  <FontAwesome6 name="circle-check" size={24} color={!nameInput.trim() ? colors.ui.cardsecondary : colors.actions.location} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCancelNaming} hitSlop={8}>
                  <FontAwesome6 name="circle-xmark" size={24} color={colors.ui.cardsecondary} />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.descInput}
                value={descInput}
                onChangeText={setDescInput}
                placeholder="Description (optional)"
                placeholderTextColor={colors.ui.cardsecondary}
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />
            </View>
          )}
        </View>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 2,
    overflow: 'hidden',
  },
  mapWrapper: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 2,
    flex: 1,
    overflow: 'hidden',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  footerTitle: {
    fontSize: 18,
    fontFamily: globalFonts.bold,
    color: '#000',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  locationInfo: {
    flex: 1,
    paddingRight: 8,
    gap: 1,
  },
  locationName: {
    fontSize: 18,
    fontFamily: globalFonts.bold,
    color: '#000',
  },
  coordText: {
    fontSize: 15,
    fontFamily: globalFonts.regular,
    color: colors.ui.cardsecondary,
    letterSpacing: -0.2,
  },
  locationDesc: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: globalFonts.regular,
    color: colors.ui.background,
  },
  addLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    
  },
  addLocationText: {
    fontSize: 18,
    fontFamily: globalFonts.bold,
  },
  namingBlock: {
    gap: 8,
    marginTop: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nameInput: {
    flex: 1,
    fontSize: 18,
    fontFamily: globalFonts.bold,
    color: '#000',
  },
  descInput: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: globalFonts.regular,
    color: '#000',
  },
  saveBtn: {
    backgroundColor: colors.actions.location,
    borderRadius: 4,
    paddingVertical: 7,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnDisabled: {
    opacity: 0.4,
  },
  saveBtnText: {
    color: '#fff',
    fontFamily: globalFonts.bold,
    fontSize: 14,
  },
  confirmBtn: {
    backgroundColor: colors.actions.location,
    borderRadius: 4,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  confirmBtnText: {
    color: '#fff',
    fontFamily: globalFonts.bold,
    fontSize: 14,
  },
});

export default CardLocation;