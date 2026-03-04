import { StyleSheet } from 'react-native';
import { globalFonts, colors } from './globalStyles';

// ─── Constants ───────────────────────────────────────────────────────────────

export const DECK_BAR_WIDTH = 342;
export const DECK_LEFT_OFFSET = -12;

// ─── Border radius presets ───────────────────────────────────────────────────

export const barRadius = {
leftCap: {
    borderTopLeftRadius: 22,
    borderBottomLeftRadius: 2,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
},
rightCap: {
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    borderTopRightRadius: 22,
    borderBottomRightRadius: 2,
},
pill: {
    borderTopLeftRadius: 22,
    borderBottomLeftRadius: 2,
    borderTopRightRadius: 22,
    borderBottomRightRadius: 2,
},
flat: {
    borderRadius: 2,
},
bottomLeftCap: {
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 25,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
},
bottomRightCap: {
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 25,
},
topLeftCap: {
    borderTopLeftRadius: 25,
    borderBottomLeftRadius: 2,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
},
topRightCap: {
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    borderTopRightRadius: 25,
    borderBottomRightRadius: 2,
},
bottomCap: {
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 25,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 25,
},
};

// ─── Count bar factory ───────────────────────────────────────────────────────

const countBarBase = {
    height: 36,
    flex: 1,
    flexDirection: 'row' as const,
    gap: 8,
    backgroundColor: colors.ui.secondary,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
};

export const makeCountBar = (
    radiusKey: keyof typeof barRadius,
    justify: 'flex-start' | 'flex-end' | 'center' = 'flex-end'
) => ({
    ...countBarBase,
    ...barRadius[radiusKey],
    justifyContent: justify,
});

// ─── Icon button factory ─────────────────────────────────────────────────────

export const makeIconButton = (
    radiusKey: keyof typeof barRadius,
    size: { width?: number; height?: number } = {}
) => ({
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.ui.secondary,
    width: size.width ?? 50,
    height: size.height ?? 44,
    ...barRadius[radiusKey],
});

// ─── Shared stylesheet ───────────────────────────────────────────────────────

export const deckStyles = StyleSheet.create({
// ── Layout ──────────────────────────────────────────────────
column: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
},
deckWrapper: {
    left: DECK_LEFT_OFFSET,
},
itemCountRow: {
    width: DECK_BAR_WIDTH,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
},
actionRow: {
    width: DECK_BAR_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
},
turnsRow: {
    width: DECK_BAR_WIDTH,
    top: -6
},
turnsAndButtonRow: {
    width: DECK_BAR_WIDTH,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    zIndex: 10,
    gap: 4,
    
},

// ── Count bars ───────────────────────────────────────────────
countBarLeftCap: makeCountBar('leftCap', 'flex-start'),
countBarRightCap: makeCountBar('rightCap', 'flex-end'),
countBarPill: makeCountBar('pill', 'flex-end'),

// ── Icon buttons ─────────────────────────────────────────────
iconButton: makeIconButton('flat'),
iconButtonAddCorner: makeIconButton('bottomRightCap'),
iconButtonDeleteCorner: makeIconButton('bottomLeftCap'),

// ── Typography ───────────────────────────────────────────────
countText: {
    fontSize: 20,
    fontFamily: globalFonts.bold,
    color: colors.ui.secondarydisabled,
},
actionButtonText: {
    fontSize: 20,
    fontFamily: globalFonts.bold,
},
});