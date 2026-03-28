/**
 * API Route Unit Tests
 * Tests core validation logic for /api/analyze, /api/triage, /api/hospitals
 */

describe('Scam Analysis API - Input Validation', () => {
  it('rejects requests with no message field', () => {
    const { ScamRequestSchema } = require('../lib/schemas');
    const result = ScamRequestSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects requests with null message', () => {
    const { ScamRequestSchema } = require('../lib/schemas');
    const result = ScamRequestSchema.safeParse({ message: null });
    expect(result.success).toBe(false);
  });

  it('accepts a typical scam message', () => {
    const { ScamRequestSchema } = require('../lib/schemas');
    const result = ScamRequestSchema.safeParse({
      message: 'URGENT: Your account has been suspended. Click here to verify now.',
    });
    expect(result.success).toBe(true);
  });
});

describe('Triage API - Input Validation', () => {
  it('accepts a panicked emergency description', () => {
    const { TriageRequestSchema } = require('../lib/schemas');
    const result = TriageRequestSchema.safeParse({
      description:
        'my dad fell down stairs, head is bleeding, hes 72 and takes blood thinners, he is confused',
    });
    expect(result.success).toBe(true);
  });

  it('accepts description with geolocation data', () => {
    const { TriageRequestSchema } = require('../lib/schemas');
    const result = TriageRequestSchema.safeParse({
      description: 'Chest pain, short of breath',
      location: { lat: 40.7128, lng: -74.006 },
    });
    expect(result.success).toBe(true);
  });

  it('accepts description with base64 image', () => {
    const { TriageRequestSchema } = require('../lib/schemas');
    const result = TriageRequestSchema.safeParse({
      description: 'Bad cut on arm',
      imageBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    });
    expect(result.success).toBe(true);
  });

  it('rejects description that is too long', () => {
    const { TriageRequestSchema } = require('../lib/schemas');
    const result = TriageRequestSchema.safeParse({
      description: 'x'.repeat(5001),
    });
    expect(result.success).toBe(false);
  });
});

describe('Triage Result - Dispatch Payload', () => {
  it('validates all priority levels', () => {
    const { TriageResultSchema } = require('../lib/schemas');
    const priorities = ['Immediate', 'High', 'Medium', 'Low'];
    const base = {
      severity: 'Urgent',
      severityScore: 70,
      condition: 'Fracture',
      immediateActions: ['Immobilize limb'],
      doNotDo: ['Do not bear weight'],
      vitalsToMonitor: ['Pulse'],
      callEmergency: false,
      dispatchPayload: {
        incidentType: 'Orthopedic injury',
        severity: 'Urgent',
        symptoms: ['Swelling', 'Pain'],
        recommendedResponse: 'Send paramedics',
        estimatedArrivalPriority: 'High',
      },
    };

    priorities.forEach((p) => {
      const result = TriageResultSchema.safeParse({
        ...base,
        dispatchPayload: { ...base.dispatchPayload, estimatedArrivalPriority: p },
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('Hospital Result - Distance Formatting', () => {
  it('accepts km distance string', () => {
    const { HospitalSchema } = require('../lib/schemas');
    const result = HospitalSchema.safeParse({
      name: 'Apollo Hospital',
      address: 'Jubilee Hills, Hyderabad',
      distance: '2.3 km',
      placeId: 'ChIJ_place_id',
    });
    expect(result.success).toBe(true);
  });
});
