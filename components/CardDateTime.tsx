import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { globalFonts, colors } from '../styles/globalStyles';

/** A proposed meetup time, as sent with the WHEN action. */
export interface ProposedTime {
  /** The moment, as an ISO timestamp (UTC). */
  proposedAt: string;
  /** How it reads to people, e.g. "Mon, Nov 24 at 3:00 PM". */
  label: string;
}

interface UpcomingDate {
  label: string;      // "Mon, Nov 24"
  year: number;
  month: number;      // 0-11
  day: number;
}

interface PickedTime {
  date: UpcomingDate;
  time: string;       // "3:00 PM"
}

interface MeetupCardProps {
  scale?: number;
  cardWidth?: number;
  /** Your own card is editable; the other player's is read-only. */
  isUser?: boolean;
  /** While true (WHEN is armed), a complete date + time is proposed. */
  isSelectMode?: boolean;
  /** Fires with the date + time once both are set (null if cleared) while isSelectMode is true. */
  onProposeTime?: (time: ProposedTime | null) => void;
  /** A standing WHEN proposal to display (read-only, with a check) when not editing. */
  proposedTime?: string | null;
}

const TIME_OPTIONS = [
  '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM',
  '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM',
];

function getUpcomingDates(count: number): UpcomingDate[] {
  const formatter = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const dates: UpcomingDate[] = [];
  const d = new Date();
  for (let i = 0; i < count; i++) {
    d.setDate(d.getDate() + 1);
    dates.push({ label: formatter.format(d), year: d.getFullYear(), month: d.getMonth(), day: d.getDate() });
  }
  return dates;
}

/** "3:00 PM" on a picked day -> the moment it names, in the phone's time zone. */
function toProposedTime({ date, time }: PickedTime): ProposedTime {
  const [, h, m, ampm] = time.match(/^(\d+):(\d+) (AM|PM)$/) ?? [];
  let hours = Number(h) % 12;
  if (ampm === 'PM') hours += 12;
  const moment = new Date(date.year, date.month, date.day, hours, Number(m));
  return { proposedAt: moment.toISOString(), label: `${date.label} at ${time}` };
}

const MeetupCard: React.FC<MeetupCardProps> = ({
  scale = 1,
  cardWidth,
  isUser = true,
  isSelectMode = false,
  onProposeTime,
  proposedTime = null,
}) => {
  const screenWidth = Dimensions.get('window').width;
  const defaultCardWidth = Math.min(screenWidth - 64, 400);
  const finalCardWidth = cardWidth ?? defaultCardWidth;
  const cardHeight = finalCardWidth * (3.5 / 2.5);

  // One date and one time. Picking goes date -> time.
  const [picked, setPicked] = useState<PickedTime | null>(null);
  const [pendingDate, setPendingDate] = useState<UpcomingDate | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const availableDates = useMemo(() => getUpcomingDates(20), []);

  // While WHEN is armed, hand the full date + time up (or null) whenever it
  // changes, including a time that was already set when WHEN was tapped.
  useEffect(() => {
    if (!isSelectMode) return;
    onProposeTime?.(picked ? toProposedTime(picked) : null);
  }, [isSelectMode, picked]);

  const chooseDate = (date: UpcomingDate) => {
    setPendingDate(date);
    setShowDatePicker(false);
  };

  const chooseTime = (time: string) => {
    if (!pendingDate) return;
    setPicked({ date: pendingDate, time });
    setPendingDate(null);
  };

  const cancelPicker = () => {
    setShowDatePicker(false);
    setPendingDate(null);
  };

  // ---- Date picker ----
  if (showDatePicker) {
    return (
      <View style={[styles.container, { transform: [{ scale }] }]}>
        <View style={[styles.card, { width: finalCardWidth, height: cardHeight }]}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Pick a Date</Text>
            <TouchableOpacity onPress={cancelPicker}>
              <FontAwesome6 name="circle-xmark" size={24} color={colors.ui.cardsecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.pickerScroll} contentContainerStyle={styles.pickerList} showsVerticalScrollIndicator={false}>
            {availableDates.map(d => (
              <TouchableOpacity key={d.label} style={styles.pickerRow} onPress={() => chooseDate(d)}>
                <Text style={styles.pickerRowText}>{d.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  }

  // ---- Time picker (after a date) ----
  if (pendingDate) {
    return (
      <View style={[styles.container, { transform: [{ scale }] }]}>
        <View style={[styles.card, { width: finalCardWidth, height: cardHeight }]}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Time on {pendingDate.label}</Text>
            <TouchableOpacity onPress={cancelPicker}>
              <FontAwesome6 name="circle-xmark" size={24} color={colors.ui.cardsecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.pickerScroll} contentContainerStyle={styles.pickerList} showsVerticalScrollIndicator={false}>
            {TIME_OPTIONS.map(t => (
              <TouchableOpacity key={t} style={styles.pickerRow} onPress={() => chooseTime(t)}>
                <Text style={styles.pickerRowText}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  }

  // ---- Standing proposal (not editing) ----
  if (proposedTime && !isSelectMode) {
    return (
      <View style={[styles.container, { transform: [{ scale }] }]}>
        <View style={[styles.card, { width: finalCardWidth, height: cardHeight }]}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Meetup Time</Text>
            <FontAwesome6 name="clock" size={24} color={colors.ui.cardsecondary} />
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{proposedTime}</Text>
            <FontAwesome6 name="circle-check" size={24} color={colors.actions.time} />
          </View>
        </View>
      </View>
    );
  }

  // ---- Main card ----
  return (
    <View
      style={[styles.container, { transform: [{ scale }] }]}
      onStartShouldSetResponder={() => true}
    >
      <View style={[styles.card, { width: finalCardWidth, height: cardHeight }]}>
        <View style={styles.header}>
          <Text style={styles.headerText}>{isUser ? 'Propose a Meetup Time' : 'Meetup Time'}</Text>
          <FontAwesome6 name="clock" size={24} color={colors.ui.cardsecondary} />
        </View>

        {picked ? (
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{picked.date.label} at {picked.time}</Text>
            <View style={styles.rowIcons}>
              {isSelectMode && (
                <FontAwesome6 name="circle-check" size={24} color={colors.actions.time} />
              )}
              {isUser && (
                <TouchableOpacity onPress={() => setPicked(null)} hitSlop={8}>
                  <FontAwesome6 name="circle-xmark" size={24} color={colors.ui.cardsecondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : isUser ? (
          <TouchableOpacity style={styles.addDateBtn} onPress={() => setShowDatePicker(true)}>
            <FontAwesome6 name="circle-plus" size={24} color={colors.actions.time} />
            <Text style={[styles.addDateText, { color: colors.actions.time }]}>Date</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.emptyText}>No time proposed yet</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: 'transparent',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 2,
    padding: 16,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  headerText: {
    fontSize: 18,
    fontFamily: globalFonts.bold,
    color: '#000',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  timeText: {
    fontSize: 18,
    fontFamily: globalFonts.bold,
    color: '#000',
    flex: 1,
    paddingRight: 8,
  },
  rowIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: globalFonts.regular,
    color: colors.ui.cardsecondary,
  },
  addDateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    marginTop: 4,
  },
  addDateText: {
    fontSize: 18,
    fontFamily: globalFonts.bold,
  },
  pickerScroll: {
    flex: 1,
  },
  // Dates and times are separated by space only.
  pickerList: {
    gap: 4,
  },
  pickerRow: {
    paddingVertical: 8,
  },
  pickerRowText: {
    fontSize: 16,
    fontFamily: globalFonts.regular,
    color: '#000',
  },
});

export default MeetupCard;
