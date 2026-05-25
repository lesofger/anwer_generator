export type ResumeId = "1" | "2" | "3";

export interface ResumeSlot {
  id: ResumeId;
  label: string;
  fileName: string;
}

export const resumeSlots: ResumeSlot[] = [
  { id: "1", label: "Resume 1", fileName: "resume.md" },
  { id: "2", label: "Resume 2", fileName: "resume-2.md" },
  { id: "3", label: "Resume 3", fileName: "resume-3.md" }
];

export const resumeIds: ResumeId[] = resumeSlots.map((slot) => slot.id);

export const emptyResumes = (): Record<ResumeId, string> => ({
  "1": "",
  "2": "",
  "3": ""
});

export const getResumeSlot = (id: ResumeId) => resumeSlots.find((slot) => slot.id === id) ?? resumeSlots[0];

export const getActiveResumeText = (resumes: Record<ResumeId, string>, selectedResumeId: ResumeId) =>
  resumes[selectedResumeId] ?? "";
