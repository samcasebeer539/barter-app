// components/ReportSheet.tsx
//
// Report a user or one of their posts: pick a reason, optionally add a
// note, send. Afterwards it offers to block them too.
import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome6 } from '@expo/vector-icons';
import { colors, globalFonts } from '@/styles/globalStyles';
import { deckStyles } from '@/styles/deckStyles';
import { REPORT_REASONS, ReportReason, report, confirmBlock } from '@/lib/safety';

interface ReportSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Who's being reported (or whose post). Either is enough for the server. */
  userId?: string;
  postId?: string;
  /** For the title and the block prompt, e.g. "Sam". */
  name?: string;
}

export default function ReportSheet({ visible, onClose, userId, postId, name }: ReportSheetProps) {
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const who = name || 'this user';

  const close = () => {
    setReason(null);
    setNote('');
    onClose();
  };

  const send = async () => {
    if (!reason || sending) return;
    setSending(true);
    try {
      const reportedUserId = await report({ userId, postId, reason, note: note.trim() || undefined });
      close();
      Alert.alert(
        'Thanks for reporting',
        "We'll review it. Do you also want to block them?",
        [
          { text: 'Not now', style: 'cancel' },
          { text: `Block ${who}`, style: 'destructive', onPress: () => confirmBlock(reportedUserId, who) },
        ],
      );
    } catch (err) {
      Alert.alert("Couldn't send the report", err instanceof Error ? err.message : String(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close}>
        {/* Near the top, so the keyboard never covers the note. Taps inside
            don't close it. */}
        <View
          style={[styles.sheet, { marginTop: insets.top + 60 }]}
          onStartShouldSetResponder={() => true}
        >
          <Text style={styles.title}>{postId ? 'Report this post' : `Report ${who}`}</Text>

          {REPORT_REASONS.map(r => (
            <TouchableOpacity key={r.key} style={styles.reasonRow} onPress={() => setReason(r.key)}>
              <Text style={[styles.reasonText, reason !== r.key && styles.faded]}>{r.label}</Text>
              {reason === r.key && <FontAwesome6 name="circle-check" size={24} color="#fff" />}
            </TouchableOpacity>
          ))}

          <TextInput
            style={styles.note}
            value={note}
            onChangeText={setNote}
            placeholder="Add details (optional)"
            placeholderTextColor={colors.ui.secondarydisabled}
            keyboardAppearance="dark"
            multiline
            maxLength={1000}
            returnKeyType="done"
            submitBehavior="blurAndSubmit"
          />

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.button} onPress={close}>
              <Text style={[deckStyles.actionButtonText, styles.faded]}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={send} disabled={!reason || sending}>
              <Text style={[
                deckStyles.actionButtonText,
                { color: reason && !sending ? colors.actions.decline : colors.ui.secondarydisabled },
              ]}>
                REPORT
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12 },
  sheet: {
    backgroundColor: colors.ui.secondary,
    borderRadius: 2,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { fontSize: 18, fontFamily: globalFonts.bold, color: '#FFFFFF', marginBottom: 8 },
  reasonRow: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // Same as the sort menu: item-title style, faded unless picked.
  reasonText: { fontSize: 18, fontFamily: globalFonts.bold, color: '#FFFFFF' },
  faded: { color: colors.ui.secondarydisabled },
  note: {
    marginTop: 8,
    minHeight: 72,
    backgroundColor: colors.ui.background,
    borderRadius: 2,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: globalFonts.regular,
    textAlignVertical: 'top',
  },
  buttons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 24, marginTop: 12 },
  button: { height: 36, justifyContent: 'center' },
});
