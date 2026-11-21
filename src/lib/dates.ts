import type { Weekday } from './types';

export const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;
export const WEEKDAY_LONG = [
  'domingo',
  'segunda',
  'terça',
  'quarta',
  'quinta',
  'sexta',
  'sábado',
] as const;
const MONTHS = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
] as const;

/** Ordem dos dias exibida no app: segunda primeiro. */
export const WEEK_ORDER: Weekday[] = [1, 2, 3, 4, 5, 6, 0];

const pad = (n: number) => String(n).padStart(2, '0');

/** Data local no formato YYYY-MM-DD. */
export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Converte YYYY-MM-DD em Date local (meio-dia, para evitar problemas de horário de verão). */
export function parseISODate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function weekdayOf(value: string): Weekday {
  return parseISODate(value).getDay() as Weekday;
}

/** Os 7 dias (seg → dom) da semana que contém `date`. */
export function weekDates(date: Date): string[] {
  const offset = (date.getDay() + 6) % 7; // dias desde segunda
  const monday = addDays(date, -offset);
  return Array.from({ length: 7 }, (_, i) => toISODate(addDays(monday, i)));
}

/** "Hoje", "Ontem", "Amanhã" ou "qua, 12 nov". */
export function relativeDayLabel(value: string, today = todayISO()): string {
  const diff = Math.round(
    (parseISODate(value).getTime() - parseISODate(today).getTime()) / 86_400_000,
  );
  if (diff === 0) return 'Hoje';
  if (diff === -1) return 'Ontem';
  if (diff === 1) return 'Amanhã';
  const d = parseISODate(value);
  return `${WEEKDAY_SHORT[d.getDay()].toLowerCase()}, ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}

/** "quarta, 18 de novembro" */
export function longDateLabel(value: string): string {
  const d = parseISODate(value);
  return `${WEEKDAY_LONG[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
}

export function greeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

/**
 * Primeiro dia do semestre atual: 1º de agosto no 2º semestre (ago–jan)
 * e 1º de fevereiro no 1º semestre (fev–jul).
 */
export function semesterStart(today = todayISO()): string {
  const d = parseISODate(today);
  const month = d.getMonth(); // 0 = janeiro
  if (month >= 7) return toISODate(new Date(d.getFullYear(), 7, 1, 12));
  if (month === 0) return toISODate(new Date(d.getFullYear() - 1, 7, 1, 12));
  return toISODate(new Date(d.getFullYear(), 1, 1, 12));
}

/** "2026-08" de uma data YYYY-MM-DD. */
export function monthKey(value: string): string {
  return value.slice(0, 7);
}

/**
 * Grade do mês para um calendário que começa na segunda: datas YYYY-MM-DD,
 * com `null` nas casas vazias antes do dia 1 e depois do último dia.
 */
export function monthGrid(key: string): (string | null)[] {
  const [y, m] = key.split('-').map(Number);
  const first = new Date(y, m - 1, 1, 12);
  const daysInMonth = new Date(y, m, 0, 12).getDate();
  const offset = (first.getDay() + 6) % 7;
  const cells: (string | null)[] = Array.from({ length: offset }, () => null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(toISODate(new Date(y, m - 1, day, 12)));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/** "Agosto de 2026" */
export function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  const name = MONTHS[m - 1];
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} de ${y}`;
}

/** Soma `delta` meses a uma chave "YYYY-MM". */
export function addMonths(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1, 12);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}
