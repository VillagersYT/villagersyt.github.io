export interface Question {
  id: string;
  text: string;
  options: Option[];
  timeLimit: number;
  points: number;
}

export interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface User {
  id: string;
  lastName: string;
  firstName: string;
  email: string;
  isAdmin: boolean;
}

export interface QuizResult {
  userId: string;
  score: number;
  totalQuestions: number;
  completedAt: Date;
  answers: UserAnswer[];
}

export interface UserAnswer {
  questionId: string;
  questionText: string;
  selectedOption: string;
  isCorrect: boolean;
  points: number;
  answeredAt: Date;
}