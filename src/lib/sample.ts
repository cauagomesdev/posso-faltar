import { addDays, parseISODate, semesterStart, toISODate } from './dates';
import { newId } from './id';
import type { AppData, Assessment, AttendanceRecord, ClassSlot, Subject } from './types';

interface SampleSpec {
  name: string;
  professor: string;
  color: string;
  totalClasses: number;
  schedule: ClassSlot[];
  /** Quantos dias de aula o aluno faltou no exemplo. */
  missedMeetings: number;
  /** Pontos tirados em N1 (até 4,5), N2 (até 4,5) e PPD (até 1). */
  grades: [n1: number | null, n2: number | null, ppd: number | null];
}

const SPECS: SampleSpec[] = [
  {
    name: 'Desenvolvimento Mobile',
    professor: 'Prof. Ricardo',
    color: '#5B4BF5',
    totalClasses: 80,
    schedule: [
      { weekday: 1, classes: 2 },
      { weekday: 3, classes: 2 },
    ],
    missedMeetings: 2,
    grades: [4, null, null],
  },
  {
    name: 'Banco de Dados',
    professor: 'Profa. Juliana',
    color: '#00A3FF',
    totalClasses: 80,
    schedule: [
      { weekday: 2, classes: 2 },
      { weekday: 4, classes: 2 },
    ],
    missedMeetings: 6,
    grades: [2, null, 1],
  },
  {
    name: 'Cálculo II',
    professor: 'Prof. Marcos',
    color: '#FF6B6B',
    totalClasses: 60,
    schedule: [
      { weekday: 3, classes: 2 },
      { weekday: 5, classes: 2 },
    ],
    missedMeetings: 7,
    grades: [1, null, 0.5],
  },
  {
    name: 'Engenharia de Software',
    professor: 'Profa. Camila',
    color: '#12B886',
    totalClasses: 40,
    schedule: [{ weekday: 4, classes: 2 }],
    missedMeetings: 1,
    grades: [4, 3.5, 1],
  },
  {
    name: 'Inglês Técnico',
    professor: 'Prof. Daniel',
    color: '#F59F00',
    totalClasses: 40,
    schedule: [{ weekday: 5, classes: 2 }],
    missedMeetings: 3,
    grades: [null, null, null],
  },
];

const PASSING_GRADE = 6.75;
const ASSESSMENTS: [name: string, maxPoints: number][] = [
  ['N1', 4.5],
  ['N2', 4.5],
  ['PPD', 1],
];

/**
 * Dados de exemplo relativos à data de hoje: presenças desde o começo do
 * semestre (ou das últimas 8 semanas, se o semestre acabou de começar).
 */
export function buildSampleData(today = new Date()): AppData {
  const subjects: Subject[] = [];
  const records: AttendanceRecord[] = [];
  const eightWeeksAgo = addDays(today, -56);
  const semester = parseISODate(semesterStart(toISODate(today)));
  const start = semester < eightWeeksAgo ? semester : eightWeeksAgo;

  SPECS.forEach((spec, index) => {
    const id = newId();
    const assessments: Assessment[] = ASSESSMENTS.map(([name, maxPoints], i) => ({
      id: newId(),
      name,
      maxPoints,
      grade: spec.grades[i],
    }));
    subjects.push({
      id,
      name: spec.name,
      professor: spec.professor,
      color: spec.color,
      totalClasses: spec.totalClasses,
      minAttendance: 75,
      schedule: spec.schedule,
      passingGrade: PASSING_GRADE,
      assessments,
      createdAt: Date.now() + index,
    });

    // Dias de aula passados (até ontem).
    const meetings: { date: string; classes: number }[] = [];
    for (let d = start; toISODate(d) < toISODate(today); d = addDays(d, 1)) {
      const slot = spec.schedule.find((s) => s.weekday === d.getDay());
      if (slot) meetings.push({ date: toISODate(d), classes: slot.classes });
    }
    // Espalha as faltas ao longo do semestre.
    const step = meetings.length / Math.max(1, spec.missedMeetings);
    const missed = new Set(
      Array.from({ length: spec.missedMeetings }, (_, i) => Math.floor(i * step + step / 2)),
    );
    meetings.forEach((m, i) => {
      records.push({
        id: newId(),
        subjectId: id,
        date: m.date,
        classes: m.classes,
        status: missed.has(i) ? 'absent' : 'present',
      });
    });
  });

  return { version: 2, subjects, records };
}
