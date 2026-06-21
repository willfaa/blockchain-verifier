// @ts-nocheck
import { Request, Response } from "express";
import prisma from "../utils/prisma";

// --- ASSIGNMENT MANAGEMENT ---

export const createAssignment = async (req: Request, res: Response) => {
  try {
    const { moduleId, chapterId, title, description, maxScore, dueDate } =
      req.body;
    // Map chapterId to moduleId for backward compatibility
    const targetModuleId = moduleId || chapterId;

    const assignment = await prisma.assignment.create({
      data: {
        moduleId: targetModuleId,
        title,
        description,
        maxScore: maxScore ? parseInt(maxScore) : 100,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });
    res.json({ data: assignment });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateAssignment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, isVisible, maxScore, dueDate } = req.body;

    const updateData: any = { title, description, isVisible };
    if (maxScore !== undefined) updateData.maxScore = parseInt(maxScore);
    if (dueDate !== undefined)
      updateData.dueDate = dueDate ? new Date(dueDate) : null;

    const assignment = await prisma.assignment.update({
      where: { id },
      data: updateData,
    });
    res.json({ data: assignment });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteAssignment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.assignment.delete({ where: { id } });
    res.json({ message: "Assignment deleted" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAssignment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id || (req as any).user?.userId;

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        module: {
          // Linked to module
          select: { title: true, courseId: true },
        },
      },
    });

    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    // Check submission if user exists
    let submission = null;
    if (userId) {
      submission = await prisma.assignmentSubmission.findFirst({
        where: {
          assignmentId: id,
          studentId: userId,
        },
      });
    }

    res.json({ data: { ...assignment, submission } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// --- SUBMISSION ---

export const submitAssignment = async (req: Request, res: Response) => {
  try {
    const { assignmentId, fileUrl } = req.body;
    const userId = (req as any).user.userId; // Middleware adds user

    // Upsert submission (allow re-submit if not approved?)
    // For now, simple create or update
    const submission = await prisma.assignmentSubmission.create({
      data: {
        assignmentId,
        studentId: userId,
        fileUrl,
        status: "PENDING",
      },
    });
    res.json({ data: submission });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// --- GRADING / REVIEW ---

export const getAssignmentSubmissions = async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;

    // Fetch submissions with student info
    const submissions = await prisma.assignmentSubmission.findMany({
      where: { assignmentId },
      include: {
        student: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
      orderBy: { submittedAt: "desc" },
    });

    res.json({ data: submissions });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const gradeSubmission = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // Submission ID
    const { grade, feedback, status } = req.body; // status: APPROVED/REJECTED/GRADED

    // Logic: If APPROVED, we might trigger IPFS/Chaincode eventually
    if (status === "APPROVED") {
      // TODO: TRIGGER IPFS UPLOAD AND HYPERLEDGER CHAINCODE HERE
      console.log("TODO: Mint Assignment Credential on Blockchain");
    }

    const submission = await prisma.assignmentSubmission.update({
      where: { id },
      data: {
        grade: grade ? parseFloat(grade) : undefined,
        feedback,
        status,
        gradedAt: new Date(),
      },
    });
    res.json({ data: submission });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
