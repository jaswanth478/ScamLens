import { z } from 'zod';

// Scam Analysis Schema
export const ScamResultSchema = z.object({
  classification: z.enum(['Scam', 'Suspicious', 'Safe', 'Emergency']),
  score: z.number().min(0).max(100),
  redFlags: z.array(z.string()),
  recommendedActions: z.array(z.string()),
  summary: z.string(),
});

export type ScamResult = z.infer<typeof ScamResultSchema>;

// Medical Triage Schema
export const TriageResultSchema = z.object({
  severity: z.enum(['Critical', 'Urgent', 'Non-Urgent', 'Stable']),
  severityScore: z.number().min(0).max(100),
  condition: z.string(),
  immediateActions: z.array(z.string()),
  doNotDo: z.array(z.string()),
  vitalsToMonitor: z.array(z.string()),
  callEmergency: z.boolean(),
  dispatchPayload: z.object({
    incidentType: z.string(),
    severity: z.string(),
    symptoms: z.array(z.string()),
    recommendedResponse: z.string(),
    estimatedArrivalPriority: z.enum(['Immediate', 'High', 'Medium', 'Low']),
  }),
});

export type TriageResult = z.infer<typeof TriageResultSchema>;

// Hospital Schema
export const HospitalSchema = z.object({
  name: z.string(),
  address: z.string(),
  distance: z.string(),
  phone: z.string().optional(),
  openNow: z.boolean().optional(),
  rating: z.number().optional(),
  placeId: z.string(),
});

export type Hospital = z.infer<typeof HospitalSchema>;

// API Request Schemas
export const ScamRequestSchema = z.object({
  message: z.string().min(1).max(5000),
});

export const TriageRequestSchema = z.object({
  description: z.string().min(1).max(5000),
  imageBase64: z.string().optional(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
});
