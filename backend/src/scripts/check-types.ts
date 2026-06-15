import { PrismaClient, Lesson } from "@prisma/client";

// This script only needs to compile to prove types are correct.
function checkTypes() {
  const l: Lesson = {
    id: "uuid",
    title: "Test Lesson",
    // content: "Content", // Removed as it does not exist in Lesson type
    videoUrl: "http://example.com/video.mp4", // This line proves videoUrl exists
    position: 1,
    isPublished: true,
    // isFreePreview: false, // Removed: Not in schema
    moduleId: "uuid",
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  console.log("Video URL:", l.videoUrl);
}

checkTypes();
