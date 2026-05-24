import { PageHeader } from "@/components/layout";
import { LessonCard } from "@/components/lesson-card";
import { lessons } from "@/lib/content/lessons";

export const metadata = {
  title: "Learn",
};

export default function LearnPage() {
  return (
    <main className="flex-1 px-5">
      <PageHeader
        eyebrow="Library"
        title="Learn, a little at a time."
        subtitle="Two-minute reads. No pressure to finish them all."
      />
      <ul className="space-y-3">
        {lessons.map((lesson) => (
          <li key={lesson.slug}>
            <LessonCard lesson={lesson} />
          </li>
        ))}
      </ul>
    </main>
  );
}
