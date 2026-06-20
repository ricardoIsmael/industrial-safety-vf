export interface Lecture {
  id: string;
  title: string;
  duration: string;
  lectureType: string;
  contentUrl: string | null;
  isPreview: boolean;
}

export interface Section {
  id: string;
  title: string;
  lectureList: Lecture[];
}

export interface CourseData {
  id: string;
  title: string;
  subtitle: string;
  coverImageUrl: string | null;
  teacher: { id: string; name: string; profession: string } | null;
  details: { level: string; totalDurationHorus: number; totalLecture: number } | null;
  sectionList: Section[];
}

export interface ExamQuestion {
  id: string;
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
}

export interface ExamData {
  id: string;
  questions: ExamQuestion[];
  passingScore: number;
}

export interface ExamResult {
  score: number;
  passed: boolean;
  certificateUrl?: string;
}

export interface ForumPost {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string | null;
  authorAvatarUrl: string | null;
  content: string;
  createdAt: string;
  replies: {
    authorId: string;
    authorName: string;
    authorRole: string | null;
    authorAvatarUrl: string | null;
    content: string;
    createdAt: string;
  }[];
}
