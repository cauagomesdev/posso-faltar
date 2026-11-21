/** 0 = domingo ... 6 = sábado (mesmo padrão do `Date.getDay()`). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Em quais dias da semana a matéria tem aula e quantas aulas por dia. */
export interface ClassSlot {
  weekday: Weekday;
  classes: number;
}

/**
 * Uma avaliação da matéria (N1, N2, PPD...). A nota final é a SOMA dos pontos
 * de todas as avaliações. Ex.: N1 vale até 4,5 + N2 até 4,5 + PPD até 1 = 10.
 */
export interface Assessment {
  id: string;
  name: string;
  /** Quantos pontos a avaliação vale no máximo. Ex.: 4.5 */
  maxPoints: number;
  /** Pontos tirados (0 a maxPoints), ou null se ainda não saiu. */
  grade: number | null;
}

export interface Subject {
  id: string;
  name: string;
  professor: string;
  color: string;
  /** Total de aulas (horas-aula) previstas no semestre. */
  totalClasses: number;
  /** Frequência mínima exigida, em %. Ex.: 75 */
  minAttendance: number;
  schedule: ClassSlot[];
  /** Soma mínima de pontos para aprovação. Ex.: 6.75 */
  passingGrade: number;
  assessments: Assessment[];
  createdAt: number;
}

export type AttendanceStatus = 'present' | 'absent';

export interface AttendanceRecord {
  id: string;
  subjectId: string;
  /** Data no formato YYYY-MM-DD (fuso local). */
  date: string;
  /** Quantas aulas aconteceram nesse dia. */
  classes: number;
  status: AttendanceStatus;
}

export interface AppData {
  version: 2;
  subjects: Subject[];
  records: AttendanceRecord[];
}

/** Dados editáveis no formulário de matéria. */
export type SubjectInput = Omit<Subject, 'id' | 'createdAt'>;
