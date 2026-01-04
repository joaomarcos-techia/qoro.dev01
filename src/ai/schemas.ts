

import { z } from 'zod';

export const QualificationLeadSchema = z.object({
  clinicSpecialty: z.string().optional(),
  clinicChallenges: z.string().optional(),
  currentTools: z.string().optional(),
  mainGoal: z.string().optional(),
  interestedFeatures: z.record(z.array(z.string())).optional(),
  fullName: z.string().optional(),
  role: z.string().optional(),
  email: z.string().optional(),
});
