import { StyleSheet, Text, View } from 'react-native';

import { AppText } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatGrade, joinNames, type GradeSummary } from '@/lib/calc';
import type { Subject } from '@/lib/types';

export function gradeMessage(subject: Subject, g: GradeSummary) {
  const pending = joinNames(g.pendingNames);
  const many = g.pendingNames.length > 1;
  const passing = formatGrade(subject.passingGrade);
  const needed = g.needed ?? 0;
  const pendingMax = g.neededEach.reduce((s, x) => s + x.maxPoints, 0);
  switch (g.status) {
    case 'empty':
      return {
        emoji: '📝',
        title: 'Sem avaliações',
        text: 'Edite a matéria para cadastrar as avaliações (N1, N2, PPD...).',
        tone: 'neutral' as const,
      };
    case 'approved':
      return g.finalAverage !== null
        ? {
            emoji: '🎉',
            title: `Aprovado com ${formatGrade(g.finalAverage)}`,
            text: `A média para passar era ${passing}.`,
            tone: 'success' as const,
          }
        : {
            emoji: '🎉',
            title: 'Já passou!',
            text: `Você já tem ${formatGrade(g.points)} pontos. Mesmo tirando 0 em ${pending}, fica com ${passing}.`,
            tone: 'success' as const,
          };
    case 'needs': {
      const hard = pendingMax > 0 && needed / pendingMax >= 0.8;
      return {
        emoji: hard ? '😬' : '💪',
        title: many
          ? `Precisa de ${formatGrade(needed)} pontos em ${pending}`
          : `Precisa de ${formatGrade(needed)} em ${pending}`,
        text: many
          ? `Ex.: ${g.neededEach.map((x) => `${formatGrade(x.needed)} em ${x.name}`).join(' e ')}. Você tem ${formatGrade(g.points)} e precisa de ${passing}.`
          : `Vale até ${formatGrade(pendingMax)}. Você tem ${formatGrade(g.points)} e precisa de ${passing}.`,
        tone: hard ? ('warning' as const) : ('primary' as const),
      };
    }
    case 'impossible':
      return {
        emoji: '😱',
        title: `Precisaria de ${formatGrade(needed)} pontos`,
        text: `${many ? `${pending} valem` : `${pending} vale`} só ${formatGrade(pendingMax)}, não dá para chegar em ${passing}. Hora de falar com o professor sobre recuperação.`,
        tone: 'danger' as const,
      };
    case 'failed':
      return {
        emoji: '📉',
        title: `Nota final ${formatGrade(g.finalAverage ?? 0)}`,
        text: `Ficou abaixo da média ${passing}. Confira se tem exame/recuperação.`,
        tone: 'danger' as const,
      };
  }
}

export function GradeResult({ subject, summary }: { subject: Subject; summary: GradeSummary }) {
  const theme = useTheme();
  const msg = gradeMessage(subject, summary);
  const palette = {
    neutral: { fg: theme.textSecondary, bg: theme.cardAlt },
    success: { fg: theme.success, bg: theme.successSoft },
    primary: { fg: theme.primary, bg: theme.primarySoft },
    warning: { fg: theme.warning, bg: theme.warningSoft },
    danger: { fg: theme.danger, bg: theme.dangerSoft },
  }[msg.tone];
  return (
    <View style={[styles.box, { backgroundColor: palette.bg }]}>
      <Text style={styles.emoji}>{msg.emoji}</Text>
      <View style={styles.flex}>
        <AppText variant="bodyStrong" style={{ color: palette.fg }}>
          {msg.title}
        </AppText>
        <AppText variant="caption" color="textSecondary">
          {msg.text}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.md,
  },
  emoji: { fontSize: 28 },
  flex: { flex: 1, gap: 2 },
});
