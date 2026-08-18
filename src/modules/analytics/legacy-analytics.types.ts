export type LegacyAnalyticsOverviewItem = {
  templateId: string;
  mode: 'Practice Mode' | 'Interview Mode';
  title: string;
  averageScore: number;
  completedSessions: number;
  imageUrl: string | null;
};
