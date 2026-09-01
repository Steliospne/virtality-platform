-- CreateEnum
CREATE TYPE "HighlightCardCollection" AS ENUM ('benefits', 'features');

-- CreateTable
CREATE TABLE "MarketingHighlightCard" (
    "id" TEXT NOT NULL,
    "collection" "HighlightCardCollection" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "iconName" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "MarketingHighlightCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarketingHighlightCard_collection_sortOrder_idx" ON "MarketingHighlightCard"("collection", "sortOrder");

-- Seed both collections from the current landing-page Highlight Card copy.
INSERT INTO "MarketingHighlightCard" ("id", "collection", "title", "body", "iconName", "sortOrder", "createdAt", "updatedAt")
VALUES
    ('c3f8e2a1-4b5c-4d6e-8f70-000000000001', 'benefits', 'Help patients follow guided movement again', 'Patients who resist or avoid exercise can start participating in clinician-guided VR sessions instead of sitting out.', 'PersonStanding', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('c3f8e2a1-4b5c-4d6e-8f70-000000000002', 'benefits', 'Support fearful and guarded movement patterns', 'Virtality can support patients facing kinesiophobia, chronic pain, fibromyalgia, and tendinopathy by reducing fear and improving guided movement—without claiming to treat those conditions directly.', 'Shield', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('c3f8e2a1-4b5c-4d6e-8f70-000000000003', 'benefits', 'Free you to see more patients in the same hour', 'A patient can continue a guided VR session while you step away to assess or treat someone else.', 'Users', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('c3f8e2a1-4b5c-4d6e-8f70-000000000004', 'benefits', 'Keep patients engaged between hands-on visits', 'When motivation drops mid-program, immersive guided exercises help patients stay with their plan between appointments.', 'Sparkles', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('c3f8e2a1-4b5c-4d6e-8f70-000000000005', 'benefits', 'Ground decisions in session-level insight', 'Progress from each session gives physiotherapists concrete signals to adjust guided movement before the next visit.', 'ClipboardList', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('c3f8e2a1-4b5c-4d6e-8f70-000000000006', 'benefits', 'Built for private clinic realities', 'From lead physiotherapists to clinic owners, Virtality fits workflows where time, staffing, and throughput shape every treatment decision.', 'Building2', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('d4a9f3b2-5c6d-4e7f-9a81-000000000001', 'features', 'Real-time Biofeedback', 'Monitor patient progress in real time, visualize movement patterns, identify areas of improvement, and adapt therapy plans based on measurable performance insights.', 'Activity', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('d4a9f3b2-5c6d-4e7f-9a81-000000000002', 'features', 'Neuroplasticity Exercises', 'Specialized VR environments designed to stimulate neural pathways, accelerate recovery, and optimize outcomes through targeted exercises.', 'Brain', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('d4a9f3b2-5c6d-4e7f-9a81-000000000003', 'features', 'Quick setup, equipment included', 'Get started in under 40 seconds with no extra cameras, sensors, cables, or calibration. Equipment is provided so your clinic can begin guided VR sessions without sourcing hardware.', 'Package', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('d4a9f3b2-5c6d-4e7f-9a81-000000000004', 'features', 'Progress Analytics', 'Built-in analytics track key recovery metrics and generate clear, actionable reports to support decision-making.', 'BarChartBig', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('d4a9f3b2-5c6d-4e7f-9a81-000000000005', 'features', 'Customizable Therapy', 'Create personalized treatment plans with flexible, inclusive tools that adapt to each patient’s individual needs.', 'Sliders', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('d4a9f3b2-5c6d-4e7f-9a81-000000000006', 'features', 'Engagement Tracking', 'Monitor patient engagement and adherence to prescribed exercises to ensure optimal therapeutic outcomes.', 'Clock', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
