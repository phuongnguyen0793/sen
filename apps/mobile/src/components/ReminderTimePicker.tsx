import React, { useMemo, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { colors, fonts, radius } from '../theme';

function parseLocalTime(value: string): Date {
  const match = value.match(/^(\d{1,2}):(\d{2})/);
  const hours = match ? Number(match[1]) : 0;
  const minutes = match ? Number(match[2]) : 0;
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function formatLocalTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

type Props = {
  value: string;
  enabled: boolean;
  label: string;
  doneLabel: string;
  onChange: (localTime: string) => void;
};

/** Tap to open the OS time picker (spinner on iOS, dialog on Android). */
export function ReminderTimePicker({ value, enabled, label, doneLabel, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => parseLocalTime(value));

  const display = useMemo(() => formatLocalTime(parseLocalTime(value)), [value]);

  function openPicker() {
    if (!enabled) return;
    setDraft(parseLocalTime(value));
    setOpen(true);
  }

  function onPickerChange(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') {
      setOpen(false);
      if (event.type === 'set' && selected) {
        onChange(formatLocalTime(selected));
      }
      return;
    }
    if (selected) setDraft(selected);
  }

  function confirmIos() {
    onChange(formatLocalTime(draft));
    setOpen(false);
  }

  return (
    <>
      <Pressable
        style={[styles.timeChip, !enabled && styles.timeDisabled]}
        disabled={!enabled}
        onPress={openPicker}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${display}`}
      >
        <Text style={styles.timeChipText}>{display}</Text>
        <Text style={styles.timeHint}>▾</Text>
      </Pressable>

      {open && Platform.OS === 'android' ? (
        <DateTimePicker
          value={draft}
          mode="time"
          is24Hour
          display="default"
          onChange={onPickerChange}
        />
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label}</Text>
              <Pressable onPress={confirmIos} hitSlop={8}>
                <Text style={styles.done}>{doneLabel}</Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={draft}
              mode="time"
              is24Hour
              display="spinner"
              onChange={onPickerChange}
              style={styles.iosPicker}
            />
          </View>
        </Modal>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  timeChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(42, 135, 105, 0.35)',
    backgroundColor: colors.mistDeep,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 100,
  },
  timeChipText: {
    fontSize: 18,
    fontFamily: fonts.bodyBold,
    color: colors.jade950,
    fontVariant: ['tabular-nums'],
  },
  timeHint: { color: colors.jade700, fontSize: 12 },
  timeDisabled: { opacity: 0.4, backgroundColor: colors.foam, borderColor: colors.line },
  backdrop: { flex: 1, backgroundColor: 'rgba(12,42,34,0.35)' },
  sheet: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingBottom: 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  sheetTitle: { fontSize: 16, fontFamily: fonts.display, color: colors.jade950 },
  done: { color: colors.jade700, fontFamily: fonts.bodyBold, fontSize: 16 },
  iosPicker: { alignSelf: 'center' },
});
