import { colors, globalFonts } from '@/styles/globalStyles';
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Text, TouchableOpacity, TextInput } from 'react-native';
import MapView, { Marker, MapPressEvent } from 'react-native-maps';
import { FontAwesome6 } from '@expo/vector-icons';
import { Locations } from '@/types/index';

const MAX_LOCATIONS = 3;

const initialRegion = {
  latitude: 36.9945,
  longitude: -122.0658,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

interface CardLocationProps {
  scale?: number;
  cardWidth?: number;
  mapActiveRef?: React.MutableRefObject<boolean>;
  isUser?: boolean;
  // ── User (primary) mode ───────────────────────────────────────────────────
  /** Locations pre-loaded from the backend for the logged-in user */
  initialLocations?: Locations[];
  /** Called with the full updated list whenever a location is added or removed */
  onConfirm?: (locations: Locations[]) => void;
  // ── Read-only (secondary) mode ────────────────────────────────────────────
  /** Other user's locations fetched from the backend; shown as selectable */
  externalLocations?: Locations[];
  /** Called when the viewing user selects or deselects a location */
  onSelectLocation?: (location: Locations | null) => void;
}

const uid = () => Math.random().toString(36).slice(2, 8);

const CardLocation: React.FC<CardLocationProps> = ({
  scale = 1,
  cardWidth,
  mapActiveRef,
  isUser = true,
  initialLocations = [],
  onConfirm,
  externalLocations = [],
  onSelectLocation,
}) => {
  const screenWidth = Dimensions.get('window').width;
  const defaultCardWidth = Math.min(screenWidth - 64, 400);
  const finalCardWidth = cardWidth ?? defaultCardWidth;
  const cardHeight = finalCardWidth * (3.5 / 2.5);

  // ── User (editable) state ─────────────────────────────────────────────────
  const [locations, setLocations] = useState<Locations[]>(initialLocations);

  // Sync when initialLocations arrives from the backend after mount
  useEffect(() => {
    if (initialLocations.length > 0) {
      setLocations(initialLocations);
    }
  }, [initialLocations]);
  const [pendingPin, setPendingPin] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isNaming, setIsNaming] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [descInput, setDescInput] = useState('');

  // ── Read-only state ───────────────────────────────────────────────────────
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [footerHeight, setFooterHeight] = useState(80);

  // ── Handlers: user mode ───────────────────────────────────────────────────
  const handleMapPress = (event: MapPressEvent) => {
    if (!isUser || isNaming) return;
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
    const newEntry: Locations = {
      id: uid(),
      latitude: pendingPin.latitude,
      longitude: pendingPin.longitude,
      name: nameInput.trim(),
      description: descInput.trim(),
    };
    const updated = [...locations, newEntry];
    setLocations(updated);
    onConfirm?.(updated);  // ← persists full list to backend via screen
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
    const updated = locations.filter(l => l.id !== id);
    setLocations(updated);
    onConfirm?.(updated);  // ← persists full list to backend via screen
  };

  // ── Handlers: read-only mode ──────────────────────────────────────────────
  const handleSelectLocation = (loc: Locations) => {
    const next = selectedId === loc.id ? null : loc.id;
    setSelectedId(next);
    onSelectLocation?.(next ? loc : null);
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const pinReady = !!pendingPin && !isNaming;
  const canAddMore = locations.length < MAX_LOCATIONS;
  const displayLocations = isUser ? locations : externalLocations.slice(0, MAX_LOCATIONS);

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
            {displayLocations.map(loc => (
              <Marker
                key={loc.id}
                coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
                pinColor={
                  !isUser && loc.id === selectedId
                    ? colors.actions.location
                    : colors.ui.cardsecondary
                }
                title={loc.name}
              />
            ))}
            {isUser && pendingPin && (
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
            <Text style={styles.footerTitle}>
              {isUser ? 'Your Safe Exchange Locations' : 'Safe Exchange Locations'}
            </Text>
            <FontAwesome6 name="circle-dot" size={24} color={colors.ui.cardsecondary} />
          </View>

          {/* ── User mode: editable list ── */}
          {isUser && locations.map(loc => (
            <View key={loc.id} style={styles.locationRow}>
              <View style={styles.locationInfo}>
                <Text style={styles.locationName}>{loc.name}</Text>
                {loc.description ? (
                  <Text style={styles.locationDesc}>{loc.description}</Text>
                ) : null}
                <Text style={styles.coordText}>
                  {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                </Text>
              </View>
              <TouchableOpacity onPress={() => removeLocation(loc.id)} hitSlop={8}>
                <FontAwesome6 name="circle-xmark" size={24} color={colors.ui.cardsecondary} />
              </TouchableOpacity>
            </View>
          ))}

          {isUser && canAddMore && !isNaming && (
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

          {isUser && isNaming && (
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
                  <FontAwesome6
                    name="circle-check"
                    size={24}
                    color={!nameInput.trim() ? colors.ui.cardsecondary : colors.actions.location}
                  />
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

          {/* ── Read-only mode: selectable list ── */}
          {!isUser && externalLocations.slice(0, MAX_LOCATIONS).map(loc => {
            const isSelected = loc.id === selectedId;
            return (
              <View key={loc.id} style={styles.locationRow}>
                <View style={styles.locationInfo}>
                  <Text style={styles.locationName}>{loc.name}</Text>
                  {loc.description ? (
                    <Text style={styles.locationDesc}>{loc.description}</Text>
                  ) : null}
                  <Text style={styles.coordText}>
                    {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleSelectLocation(loc)} hitSlop={8}>
                  <FontAwesome6
                    name={isSelected ? 'circle-check' : 'circle'}
                    size={24}
                    color={isSelected ? colors.actions.location : colors.ui.cardsecondary}
                  />
                </TouchableOpacity>
              </View>
            );
          })}
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
    gap: 4,
  },
  locationName: {
    fontSize: 18,
    fontFamily: globalFonts.bold,
    color: '#000',
  },
  coordText: {
    fontSize: 16,
    fontFamily: globalFonts.regular,
    color: colors.ui.cardsecondary,
    letterSpacing: -0.2,
  },
  locationDesc: {
    fontSize: 16,
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
    marginBottom: 6,
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
    fontSize: 16,
    lineHeight: 20,
    fontFamily: globalFonts.regular,
    color: '#000',
  },
});

export default CardLocation;