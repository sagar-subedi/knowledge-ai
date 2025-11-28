export interface SRSResult {
    interval: number;
    repetitions: number;
    easeFactor: number;
    nextReviewAt: Date;
}

export function calculateSRS(
    quality: number, // 0-5 rating
    repetitions: number,
    easeFactor: number,
    interval: number
): SRSResult {
    let nextInterval: number;
    let nextRepetitions: number;
    let nextEaseFactor: number;

    if (quality >= 3) {
        // Correct response
        if (repetitions === 0) {
            nextInterval = 1;
        } else if (repetitions === 1) {
            nextInterval = 6;
        } else {
            nextInterval = Math.round(interval * (easeFactor / 100));
        }
        nextRepetitions = repetitions + 1;
    } else {
        // Incorrect response
        nextRepetitions = 0;
        nextInterval = 1;
    }

    // Update ease factor
    // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    nextEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)) * 100;

    // Ease factor cannot go below 130
    if (nextEaseFactor < 130) {
        nextEaseFactor = 130;
    }

    const nextReviewAt = new Date();
    nextReviewAt.setDate(nextReviewAt.getDate() + nextInterval);

    return {
        interval: nextInterval,
        repetitions: nextRepetitions,
        easeFactor: Math.round(nextEaseFactor),
        nextReviewAt,
    };
}
