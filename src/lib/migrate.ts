import type { AppData, Assessment, Subject } from './types';

/** Formato da versão 1: notas com peso e média ponderada (0 a maxGrade). */
interface AssessmentV1 {
  id: string;
  name: string;
  weight: number;
  grade: number | null;
}

type SubjectV1 = Omit<Subject, 'assessments'> & {
  maxGrade?: number;
  assessments: AssessmentV1[];
};

const round4 = (v: number) => Math.round(v * 10_000) / 10_000;

/**
 * v1 → v2: a média ponderada vira soma de pontos, sem mudar o resultado.
 * Cada avaliação passa a valer `maxGrade × peso ÷ somaPesos` pontos, e a nota
 * tirada é convertida na mesma proporção. Ex.: N1 e N2 com peso 1, nota 0–10:
 * cada uma passa a valer 5 pontos, e um 8 na N1 vira 4 pontos.
 */
function migrateSubjectV1(subject: SubjectV1): Subject {
  const { maxGrade = 10, ...rest } = subject;
  const totalWeight = subject.assessments.reduce((s, a) => s + Math.max(0, a.weight ?? 0), 0);
  const assessments: Assessment[] = subject.assessments.map((a) => {
    const share = totalWeight > 0 ? Math.max(0, a.weight ?? 0) / totalWeight : 0;
    return {
      id: a.id,
      name: a.name,
      maxPoints: round4(maxGrade * share),
      grade: a.grade === null ? null : round4(a.grade * share),
    };
  });
  return { ...rest, assessments };
}

function isV2Assessment(a: unknown): boolean {
  return typeof a === 'object' && a !== null && typeof (a as Assessment).maxPoints === 'number';
}

/** Lê dados salvos de qualquer versão e devolve no formato atual. */
export function migrateData(raw: unknown): AppData | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const data = raw as { version?: number; subjects?: unknown; records?: unknown };
  if (!Array.isArray(data.subjects) || !Array.isArray(data.records)) return null;

  const subjects = (data.subjects as (Subject | SubjectV1)[]).map((s) =>
    s.assessments.every(isV2Assessment) ? (s as Subject) : migrateSubjectV1(s as SubjectV1),
  );
  return { version: 2, subjects, records: data.records as AppData['records'] };
}
