// src/components/me/CourseList.tsx
"use client";

import { CourseCard, type UICourse } from "./CourseCard";

export type { UICourse };

export function CourseList(props: {
  courses: UICourse[];
  onComplete?: (itemId: string, courseId: string, points?: number) => void;
}) {
  const { courses, onComplete } = props;

  if (!courses?.length) {
    return (
      <div className="text-sm text-white/60 bg-white/[0.03] border border-white/10 rounded-2xl p-6">
        Nenhum curso ativo no momento.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:gap-5">
      {courses.map((c) => (
        <CourseCard key={c.id} course={c} onComplete={onComplete} />
      ))}
    </div>
  );
}
