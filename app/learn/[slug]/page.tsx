import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Chat } from "@/components/chat";
import { getLesson, lessons } from "@/lib/content/lessons";

const levelTone = {
  awareness: "cream",
  everyday: "teal",
  confidence: "gold",
} as const;

export async function generateStaticParams() {
  return lessons.map((l) => ({ slug: l.slug }));
}

export default async function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lesson = getLesson(slug);
  if (!lesson) notFound();

  return (
    <main className="flex flex-1 flex-col gap-6 px-5 pb-6 pt-6">
      <Link
        href="/learn"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
      >
        <ArrowLeft className="h-4 w-4" />
        All lessons
      </Link>

      <header className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge tone={levelTone[lesson.level]}>{lesson.level}</Badge>
          <span className="inline-flex items-center gap-1 text-xs text-[var(--color-muted)]">
            <Clock3 className="h-3.5 w-3.5" />
            {lesson.minutes} min read
          </span>
        </div>
        <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight text-balance text-[var(--color-ink)]">
          {lesson.title}
        </h1>
      </header>

      <article className="space-y-4 text-pretty text-[1.0625rem] leading-relaxed text-[var(--color-ink)]">
        {lesson.body.split("\n\n").map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </article>

      <hr className="my-2" />

      <section className="space-y-3">
        <div className="space-y-1">
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-[var(--color-muted)]">
            Ask Gwinya
          </p>
          <h2 className="font-display text-xl font-semibold tracking-tight">
            Anything unclear? Ask gently.
          </h2>
          <p className="text-sm text-[var(--color-ink-soft)]">
            I'll answer in plain language. If something's outside what your clinician should
            decide, I'll say so.
          </p>
        </div>
        <Chat
          mode="lesson"
          lessonContext={`Title: ${lesson.title}\n\n${lesson.body}`}
          starter={`Hi — I'm here while you read "${lesson.title}". Ask me anything about it, and we can write down questions for your SLT together.`}
        />
      </section>
    </main>
  );
}
