import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { NavHeader } from '@/components/nav-header';
import { Screen } from '@/components/screen';
import { AppText, Button, Card, IconButton, Stepper, useLevelMeta } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { classesOn, classesPerMeeting, plural, summarizeAttendance } from '@/lib/calc';
import {
  WEEKDAY_SHORT,
  WEEK_ORDER,
  addDays,
  addMonths,
  monthGrid,
  monthKey,
  monthLabel,
  parseISODate,
  relativeDayLabel,
  semesterStart,
  toISODate,
  todayISO,
  weekdayOf,
} from '@/lib/dates';
import { successFeedback, tapFeedback, warningFeedback } from '@/lib/feedback';
import { useStore, useSubject } from '@/lib/store';
import type { AttendanceRecord, AttendanceStatus, Subject } from '@/lib/types';

export default function RegisterScreen() {
  const params = useLocalSearchParams<{ subjectId: string; status?: AttendanceStatus }>();
  const subject = useSubject(params.subjectId);
  const { data, setAttendance } = useStore();
  const theme = useTheme();
  const levelMeta = useLevelMeta();
  const today = todayISO();
  const start = semesterStart(today);
  const firstClassDay = subject ? lastClassDay(subject, today, start) : undefined;

  const [status, setStatus] = useState<AttendanceStatus>(params.status ?? 'absent');
  const [date, setDate] = useState(firstClassDay ?? today);
  const [month, setMonth] = useState(monthKey(firstClassDay ?? today));
  const [classes, setClasses] = useState(() =>
    subject ? classesOn(subject, weekdayOf(firstClassDay ?? today)) || classesPerMeeting(subject) : 2,
  );

  if (!subject) {
    return (
      <Screen withTabBar={false} header={<NavHeader backIcon="close" />}>
        <AppText>Matéria não encontrada.</AppText>
      </Screen>
    );
  }

  const existing = data.records.find((r) => r.subjectId === subject.id && r.date === date);
  const others = data.records.filter((r) => !(r.subjectId === subject.id && r.date === date));
  const after = summarizeAttendance(subject, others, status === 'absent' ? classes : 0);
  const meta = levelMeta(after.level);

  const pickDate = (d: string) => {
    setDate(d);
    const scheduled = classesOn(subject, weekdayOf(d));
    if (scheduled > 0) setClasses(scheduled);
  };

  const save = () => {
    if (status === 'absent' && after.level === 'failed') warningFeedback();
    else successFeedback();
    setAttendance(subject.id, date, status, classes);
    router.back();
  };

  const accent = status === 'absent' ? theme.danger : theme.success;

  return (
    <Screen
      withTabBar={false}
      header={
        <NavHeader
          title={subject.name}
          backIcon="close"
          safeTop={Platform.OS !== 'ios'}
        />
      }>
      {/* Presença ou falta */}
      <View style={[styles.segment, { backgroundColor: theme.cardAlt }]}>
        {(['present', 'absent'] as const).map((s) => {
          const active = s === status;
          const color = s === 'present' ? theme.success : theme.danger;
          return (
            <Pressable
              key={s}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => {
                tapFeedback();
                setStatus(s);
              }}
              style={[styles.segmentItem, active && { backgroundColor: theme.card }]}>
              <Icon name={s === 'present' ? 'check' : 'close'} size={16} color={active ? color : theme.textSecondary} />
              <Text style={[styles.segmentText, { color: active ? color : theme.textSecondary }]}>
                {s === 'present' ? 'Fui à aula' : 'Faltei'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Data */}
      <AppText variant="label" color="textSecondary" style={styles.label}>
        Quando?
      </AppText>
      <MonthCalendar
        subject={subject}
        records={data.records}
        month={month}
        onMonthChange={setMonth}
        selected={date}
        onSelect={pickDate}
        minDate={start}
        maxDate={today}
        accent={accent}
      />
      <AppText variant="caption" color="textMuted" style={styles.legend}>
        Dias apagados não têm aula dessa matéria · bolinha = já registrado. Dá para voltar até o
        começo do semestre.
      </AppText>

      {/* Quantidade */}
      <Card style={styles.amountCard}>
        <View style={styles.flex}>
          <AppText variant="bodyStrong">Quantas aulas?</AppText>
          <AppText variant="caption" color="textSecondary">
            {relativeDayLabel(date)}
          </AppText>
        </View>
        <Stepper value={classes} min={1} max={8} onChange={setClasses} />
      </Card>

      {/* Prévia */}
      <View style={[styles.preview, { backgroundColor: meta.soft }]}>
        <Text style={styles.previewEmoji}>{meta.emoji}</Text>
        <View style={styles.flex}>
          <AppText variant="bodyStrong" style={{ color: meta.color }}>
            {after.remaining >= 0
              ? `Depois disso: ${plural(after.remaining, 'falta restante', 'faltas restantes')}`
              : `Passa ${plural(-after.remaining, 'aula')} do limite de faltas`}
          </AppText>
          <AppText variant="caption" color="textSecondary">
            {existing
              ? `Vai substituir o registro de ${existing.status === 'absent' ? 'falta' : 'presença'} desse dia.`
              : `${after.absences} de ${after.maxAbsences} faltas usadas`}
          </AppText>
        </View>
      </View>

      <Button
        title={status === 'absent' ? 'Registrar falta' : 'Registrar presença'}
        icon={status === 'absent' ? 'close' : 'check'}
        variant="primary"
        size="lg"
        color={accent}
        style={styles.save}
        onPress={save}
      />
    </Screen>
  );
}

/** Último dia com aula dessa matéria, de hoje para trás, até o começo do semestre. */
function lastClassDay(subject: Subject, today: string, start: string) {
  for (let d = today; d >= start; d = toISODate(addDays(parseISODate(d), -1))) {
    if (classesOn(subject, weekdayOf(d)) > 0) return d;
  }
  return undefined;
}

/** Calendário de um mês (segunda a domingo) para escolher o dia do registro. */
function MonthCalendar({
  subject,
  records,
  month,
  onMonthChange,
  selected,
  onSelect,
  minDate,
  maxDate,
  accent,
}: {
  subject: Subject;
  records: AttendanceRecord[];
  month: string;
  onMonthChange: (month: string) => void;
  selected: string;
  onSelect: (date: string) => void;
  minDate: string;
  maxDate: string;
  accent: string;
}) {
  const theme = useTheme();
  const canPrev = month > monthKey(minDate);
  const canNext = month < monthKey(maxDate);
  const byDate = new Map(
    records.filter((r) => r.subjectId === subject.id).map((r) => [r.date, r]),
  );
  const cells = monthGrid(month);
  const weeks = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));

  const change = (delta: number) => onMonthChange(addMonths(month, delta));

  return (
    <Card style={styles.calendar}>
      <View style={styles.calendarHeader}>
        <IconButton
          icon="chevronLeft"
          size={34}
          accessibilityLabel="Mês anterior"
          disabled={!canPrev}
          onPress={() => change(-1)}
        />
        <AppText variant="bodyStrong">
          {monthLabel(month)}
        </AppText>
        <IconButton
          icon="chevron"
          size={34}
          accessibilityLabel="Próximo mês"
          disabled={!canNext}
          onPress={() => change(1)}
        />
      </View>

      <View style={styles.week}>
        {WEEK_ORDER.map((wd) => (
          <Text key={wd} style={[styles.weekLabel, { color: theme.textMuted }]}>
            {WEEKDAY_SHORT[wd].charAt(0)}
          </Text>
        ))}
      </View>

      {weeks.map((week, i) => (
        <View key={i} style={styles.week}>
          {week.map((d, j) => {
            if (!d) return <View key={j} style={styles.cell} />;
            const enabled = d >= minDate && d <= maxDate;
            const isSelected = d === selected;
            const hasClass = classesOn(subject, weekdayOf(d)) > 0;
            const recorded = byDate.get(d);
            const dotColor = recorded
              ? isSelected
                ? '#fff'
                : recorded.status === 'absent'
                  ? theme.danger
                  : theme.success
              : 'transparent';
            return (
              <Pressable
                key={d}
                disabled={!enabled}
                accessibilityRole="button"
                accessibilityLabel={relativeDayLabel(d)}
                accessibilityState={{ selected: isSelected, disabled: !enabled }}
                onPress={() => {
                  tapFeedback();
                  onSelect(d);
                }}
                style={styles.cell}>
                <View
                  style={[
                    styles.cellInner,
                    {
                      backgroundColor: isSelected
                        ? accent
                        : hasClass && enabled
                          ? theme.cardAlt
                          : 'transparent',
                      borderColor: d === maxDate && !isSelected ? accent : 'transparent',
                      opacity: !enabled ? 0.25 : hasClass || isSelected ? 1 : 0.45,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.cellText,
                      { color: isSelected ? '#fff' : theme.text },
                    ]}>
                    {parseISODate(d).getDate()}
                  </Text>
                  <View style={[styles.dateDot, { backgroundColor: dotColor }]} />
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  segment: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    padding: 4,
    marginTop: Spacing.two,
  },
  segmentItem: {
    flex: 1,
    height: 44,
    borderRadius: Radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  segmentText: { fontSize: 15, fontWeight: '800' },
  label: { marginTop: Spacing.six, marginBottom: Spacing.three, paddingHorizontal: Spacing.one },
  calendar: { padding: Spacing.three, gap: 4 },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  week: { flexDirection: 'row' },
  weekLabel: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '700', paddingVertical: 4 },
  cell: { flex: 1, padding: 2 },
  cellInner: {
    height: 44,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: { fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },
  dateDot: { width: 5, height: 5, borderRadius: 3, marginTop: 2 },
  legend: { marginTop: Spacing.two, paddingHorizontal: Spacing.one },
  amountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.five,
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Radius.lg,
    marginTop: Spacing.three,
  },
  previewEmoji: { fontSize: 30 },
  save: { marginTop: Spacing.five },
});
