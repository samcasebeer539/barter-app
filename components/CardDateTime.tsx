import React, { useState } from 'react';
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

const MAX_DATES = 5;

interface TimeSpan {
  id: string;
  start: string;
  end: string;
}

interface DateEntry {
  id: string;
  date: string;
  times: TimeSpan[];
}

interface MeetupCardProps {
  mode: 'propose' | 'select';
  scale?: number;
  cardWidth?: number;
  initialDates?: DateEntry[];
  onConfirm?: (date: DateEntry, time: TimeSpan) => void;
}

const TIME_OPTIONS = [
  '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM',
  '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM',
];

function getUpcomingDates(count: number): string[] {
  const dates: string[] = [];
  const d = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  for (let i = 1; i <= count * 3 && dates.length < count; i++) {
    d.setDate(d.getDate() + 1);
    dates.push(formatter.format(new Date(d)));
  }
  return dates;
}

const uid = () => Math.random().toString(36).slice(2, 8);

const MeetupCard: React.FC<MeetupCardProps> = ({
  mode,
  scale = 1,
  cardWidth,
  initialDates = [],
  onConfirm,
}) => {
  const screenWidth = Dimensions.get('window').width;
  const defaultCardWidth = Math.min(screenWidth - 64, 400);
  const finalCardWidth = cardWidth ?? defaultCardWidth;
  const cardHeight = finalCardWidth * (3.5 / 2.5);

  const [dates, setDates] = useState<DateEntry[]>(initialDates);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState<{ dateId: string; field: 'start' | 'end' } | null>(null);
  const [pendingTime, setPendingTime] = useState<Partial<TimeSpan>>({});
  const [selectedDateId, setSelectedDateId] = useState<string | null>(null);
  const [selectedTimeId, setSelectedTimeId] = useState<string | null>(null);

  const availableDates = getUpcomingDates(20);
  const usedDates = dates.map(d => d.date);

  const addDate = (dateStr: string) => {
    if (dates.length >= MAX_DATES) return;
    setDates(prev => [...prev, { id: uid(), date: dateStr, times: [] }]);
    setShowDatePicker(false);
  };

  const removeDate = (dateId: string) => {
    setDates(prev => prev.filter(d => d.id !== dateId));
  };

  const startAddingTime = (dateId: string) => {
    setPendingTime({});
    setShowTimePicker({ dateId, field: 'start' });
  };

  const selectTime = (time: string) => {
    if (!showTimePicker) return;
    if (showTimePicker.field === 'start') {
      setPendingTime({ start: time });
      setShowTimePicker({ dateId: showTimePicker.dateId, field: 'end' });
    } else {
      const span: TimeSpan = { id: uid(), start: pendingTime.start!, end: time };
      setDates(prev => prev.map(d =>
        d.id === showTimePicker.dateId
          ? { ...d, times: [...d.times, span] }
          : d
      ));
      setShowTimePicker(null);
      setPendingTime({});
    }
  };

  const removeTime = (dateId: string, timeId: string) => {
    setDates(prev => prev.map(d =>
      d.id === dateId ? { ...d, times: d.times.filter(t => t.id !== timeId) } : d
    ));
  };

  const cancelPicker = () => {
    setShowDatePicker(false);
    setShowTimePicker(null);
    setPendingTime({});
  };

  const handleConfirm = () => {
    const date = (mode === 'select' ? initialDates : dates).find(d => d.id === selectedDateId);
    const time = date?.times.find(t => t.id === selectedTimeId);
    if (date && time) onConfirm?.(date, time);
  };

  const displayDates = mode === 'select' ? initialDates : dates;

  // ---- Date picker overlay ----
  if (showDatePicker) {
    return (
      <View style={[styles.container, { transform: [{ scale }] }]}>
        <View style={[styles.card, { width: finalCardWidth, height: cardHeight }]}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Pick a Date</Text>
            <TouchableOpacity onPress={cancelPicker}>
              <FontAwesome6 name="circle-xmark" size={22} color={colors.ui.cardsecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
            {availableDates
              .filter(d => !usedDates.includes(d))
              .map(d => (
                <TouchableOpacity key={d} style={styles.pickerRow} onPress={() => addDate(d)}>
                  <Text style={styles.pickerRowText}>{d}</Text>
                </TouchableOpacity>
              ))}
          </ScrollView>
        </View>
      </View>
    );
  }

  // ---- Time picker overlay ----
  if (showTimePicker) {
    const isEnd = showTimePicker.field === 'end';
    const startIdx = isEnd ? TIME_OPTIONS.indexOf(pendingTime.start!) + 1 : 0;
    return (
      <View style={[styles.container, { transform: [{ scale }] }]}>
        <View style={[styles.card, { width: finalCardWidth, height: cardHeight }]}>
          <View style={styles.header}>
            <Text style={styles.headerText}>
              {isEnd ? `End time (after ${pendingTime.start})` : 'Start time'}
            </Text>
            <TouchableOpacity onPress={cancelPicker}>
              <FontAwesome6 name="circle-xmark" size={22} color={colors.ui.cardsecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
            {TIME_OPTIONS.slice(startIdx).map(t => (
              <TouchableOpacity key={t} style={styles.pickerRow} onPress={() => selectTime(t)}>
                <Text style={styles.pickerRowText}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  }

  // ---- Main card ----
  return (
    <View style={[styles.container, { transform: [{ scale }] }]}>
      <View style={[styles.card, { width: finalCardWidth, height: cardHeight }]}>
        <View style={styles.header}>
          <Text style={styles.headerText}>
            {mode === 'propose' ? 'Propose Meetup Times' : 'Select Meetup Time'}
          </Text>
        </View>

        <ScrollView style={styles.dateList} showsVerticalScrollIndicator={false}>
          {displayDates.length === 0 && mode === 'select' && (
            <Text style={styles.emptyText}>No times proposed yet.</Text>
          )}

          {displayDates.map(dateEntry => {
            const isDateSelected = selectedDateId === dateEntry.id;
            return (
              <View key={dateEntry.id} style={styles.dateBlock}>
                <View style={styles.dateRow}>
                  {mode === 'select' ? (
                    <TouchableOpacity
                      style={styles.dateSelectRow}
                      onPress={() => {
                        setSelectedDateId(dateEntry.id);
                        setSelectedTimeId(null);
                      }}
                    >
                      <View style={[styles.radio, isDateSelected && styles.radioSelected]} />
                      <Text style={[styles.dateText, isDateSelected && styles.dateTextSelected]}>
                        {dateEntry.date}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <>
                      <Text style={styles.dateText}>{dateEntry.date}</Text>
                      <TouchableOpacity onPress={() => removeDate(dateEntry.id)}>
                        <FontAwesome6 name="circle-xmark" size={22} color={colors.ui.cardsecondary} />
                      </TouchableOpacity>
                    </>
                  )}
                </View>

                <View style={styles.timeList}>
                  {dateEntry.times.map(span => {
                    const isTimeSelected = isDateSelected && selectedTimeId === span.id;
                    return (
                      <View key={span.id} style={styles.timeRow}>
                        {mode === 'select' ? (
                          <TouchableOpacity
                            style={[styles.timeChip, isTimeSelected && styles.timeChipSelected]}
                            onPress={() => {
                              setSelectedDateId(dateEntry.id);
                              setSelectedTimeId(span.id);
                            }}
                          >
                            <Text style={[styles.timeText, isTimeSelected && styles.timeChipTextSelected]}>
                              {span.start} – {span.end}
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <View style={styles.timeChip}>
                            
                            <TouchableOpacity onPress={() => removeTime(dateEntry.id, span.id)}>
                              <FontAwesome6 name="circle-xmark" size={22} color={colors.ui.cardsecondary} />
                            </TouchableOpacity>
                            <Text style={styles.timeText}>{span.start} – {span.end}</Text>
                          </View>
                        )}
                      </View>
                    );
                  })}

                  {mode === 'propose' && (
                    <TouchableOpacity style={styles.addTimeBtn} onPress={() => startAddingTime(dateEntry.id)}>
                      <FontAwesome6 name="circle-plus" size={22} color={colors.ui.cardsecondary} />
                      <Text style={styles.timeText}>Time span</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}

          {/* Add Date button lives inline at the bottom of the list */}
          {mode === 'propose' && dates.length < MAX_DATES && (
            <TouchableOpacity style={styles.addDateBtn} onPress={() => setShowDatePicker(true)}>
              <FontAwesome6 name="circle-plus" size={22} color={colors.actions.time} />
              <Text style={[styles.addDateText, { color: colors.actions.time }]}>
                Date
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {mode === 'select' && selectedDateId && selectedTimeId && (
          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
            <Text style={styles.confirmText}>Confirm</Text>
          </TouchableOpacity>
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
    borderRadius: 6,
    padding: 16,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerText: {
    fontSize: 18,
    fontFamily: globalFonts.bold,
    color: '#000',
  },
  dateList: {
    flex: 1,
  },
  emptyText: {
    fontSize: 14,
    color: colors.ui.cardsecondary,
    fontFamily: globalFonts.regular,
    textAlign: 'center',
    marginTop: 32,
  },
  dateBlock: {
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  dateSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.ui.cardsecondary,
  },
  radioSelected: {
    borderColor: colors.actions.accept,
    backgroundColor: colors.actions.accept,
  },
  dateText: {
    fontSize: 16,
    fontFamily: globalFonts.bold,
    color: '#000',
  },
  dateTextSelected: {
    color: colors.actions.accept,
  },
  timeList: {
    flexDirection: 'column',
    flexWrap: 'wrap',
    
  },
  timeRow: {},
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    
    
    paddingBottom: 4,
  },
  timeChipSelected: {
    backgroundColor: colors.actions.accept,
  },
  timeText: {
    fontSize: 15,
    fontFamily: globalFonts.regular,
    color: colors.ui.cardsecondary,
  },
  addTimeText: {
    fontSize: 15,
    fontFamily: globalFonts.regular,
    color: colors.ui.cardsecondary,
  },
  timeChipTextSelected: {
    color: '#fff',
    fontFamily: globalFonts.bold,
  },
  addTimeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    
    paddingVertical: 4,
  },
 
  addDateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    marginTop: 4,
  },
  addDateText: {
    fontSize: 15,
    fontFamily: globalFonts.bold,
  },
  confirmBtn: {
    backgroundColor: colors.actions.accept,
    borderRadius: 4,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  confirmText: {
    color: '#fff',
    fontFamily: globalFonts.bold,
    fontSize: 16,
  },
  pickerScroll: {
    flex: 1,
  },
  pickerRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.ui.secondary,
  },
  pickerRowText: {
    fontSize: 16,
    fontFamily: globalFonts.regular,
    color: '#000',
  },
});

export default MeetupCard;