import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { CheckInStatus } from '../lib/api';
import { colors, fonts, radius } from '../theme';

export function CheckInActions({
  status,
  doneLabel,
  missedLabel,
  onChange,
}: {
  status: CheckInStatus | null;
  doneLabel: string;
  missedLabel: string;
  onChange: (status: 'DONE' | 'MISSED') => void;
}) {
  return (
    <View style={styles.row}>
      <Pressable
        style={[styles.button, status === 'DONE' && styles.doneOn]}
        accessibilityRole="button"
        accessibilityState={{ selected: status === 'DONE' }}
        onPress={() => onChange('DONE')}
      >
        <Text style={[styles.label, status === 'DONE' && styles.labelOn]}>{doneLabel}</Text>
      </Pressable>
      <Pressable
        style={[styles.button, status === 'MISSED' && styles.missedOn]}
        accessibilityRole="button"
        accessibilityState={{ selected: status === 'MISSED' }}
        onPress={() => onChange('MISSED')}
      >
        <Text style={[styles.label, status === 'MISSED' && styles.labelOn]}>{missedLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, marginTop: 12 },
  button: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.paper,
    paddingHorizontal: 12,
  },
  doneOn: { backgroundColor: colors.jade800, borderColor: colors.jade800 },
  missedOn: { backgroundColor: colors.lotusDeep, borderColor: colors.lotusDeep },
  label: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.jade800 },
  labelOn: { color: colors.white },
});
