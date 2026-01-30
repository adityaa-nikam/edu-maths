import { CronJob } from "cron";
import { db } from "../db/index.js";
import { exams } from "../db/schema/exams.js";
import { examAttempts } from "../db/schema/examAttempts.js";
import { and, eq, lt, isNull } from "drizzle-orm";
import { finalizeExamAttempt } from "../utils/examFinalization.js";
import { logger } from "../utils/logger.js";

// ⏰ Run every minute
const autoSubmitJob = new CronJob(
  "* * * * *",
  async () => {
    try {
      const now = new Date();

      // 🔥 Find attempts where exam time is over but not submitted
      const expiredAttempts = await db
        .select({
          attemptId: examAttempts.id,
        })
        .from(examAttempts)
        .innerJoin(
          exams,
          eq(examAttempts.examId, exams.id)
        )
        .where(
          and(
            isNull(examAttempts.submittedAt),
            lt(exams.endTime, now)
          )
        );

      if (expiredAttempts.length === 0) return;

      logger.info("Auto-submit triggered", {
        count: expiredAttempts.length,
      });

      for (const attempt of expiredAttempts) {
        await finalizeExamAttempt(attempt.attemptId, true);
      }

    } catch (error: any) {
      logger.error("Auto-submit cron failed", error);
    }
  },
  null,   // onComplete
  true,   // 🔥 start job immediately
  "Asia/Kolkata" // ✅ IMPORTANT: timezone
);

export default autoSubmitJob;
