import { ScamResultSchema, TriageResultSchema, ScamRequestSchema, TriageRequestSchema, HospitalSchema } from '../lib/schemas';

describe('ScamResultSchema', () => {
  it('validates a valid scam result', () => {
    const data = {
      classification: 'Scam',
      score: 95,
      redFlags: ['Urgent language', 'Fake bank link'],
      recommendedActions: ['Do not click', 'Report to bank'],
      summary: 'This is a phishing attempt.',
    };
    expect(() => ScamResultSchema.parse(data)).not.toThrow();
  });

  it('rejects invalid classification', () => {
    const data = {
      classification: 'Unknown',
      score: 50,
      redFlags: [],
      recommendedActions: [],
      summary: '',
    };
    expect(() => ScamResultSchema.parse(data)).toThrow();
  });

  it('rejects score above 100', () => {
    const data = {
      classification: 'Safe',
      score: 150,
      redFlags: [],
      recommendedActions: [],
      summary: 'ok',
    };
    expect(() => ScamResultSchema.parse(data)).toThrow();
  });

  it('rejects score below 0', () => {
    const data = {
      classification: 'Safe',
      score: -5,
      redFlags: [],
      recommendedActions: [],
      summary: 'ok',
    };
    expect(() => ScamResultSchema.parse(data)).toThrow();
  });

  it('accepts all valid classifications', () => {
    const classes = ['Scam', 'Suspicious', 'Safe', 'Emergency'];
    classes.forEach((cls) => {
      expect(() =>
        ScamResultSchema.parse({
          classification: cls,
          score: 50,
          redFlags: [],
          recommendedActions: [],
          summary: 'test',
        })
      ).not.toThrow();
    });
  });
});

describe('TriageResultSchema', () => {
  const validTriage = {
    severity: 'Critical',
    severityScore: 90,
    condition: 'Severe head trauma',
    immediateActions: ['Apply pressure', 'Call 911'],
    doNotDo: ['Do not move patient'],
    vitalsToMonitor: ['Pulse', 'Breathing'],
    callEmergency: true,
    dispatchPayload: {
      incidentType: 'Traumatic injury',
      severity: 'Critical',
      symptoms: ['Bleeding', 'Confusion'],
      recommendedResponse: 'Send ambulance immediately',
      estimatedArrivalPriority: 'Immediate',
    },
  };

  it('validates a complete triage result', () => {
    expect(() => TriageResultSchema.parse(validTriage)).not.toThrow();
  });

  it('rejects invalid severity', () => {
    expect(() =>
      TriageResultSchema.parse({ ...validTriage, severity: 'Moderate' })
    ).toThrow();
  });

  it('rejects invalid dispatch priority', () => {
    expect(() =>
      TriageResultSchema.parse({
        ...validTriage,
        dispatchPayload: { ...validTriage.dispatchPayload, estimatedArrivalPriority: 'ASAP' },
      })
    ).toThrow();
  });

  it('accepts all valid severities', () => {
    const severities = ['Critical', 'Urgent', 'Non-Urgent', 'Stable'];
    severities.forEach((s) => {
      expect(() => TriageResultSchema.parse({ ...validTriage, severity: s })).not.toThrow();
    });
  });
});

describe('ScamRequestSchema', () => {
  it('accepts valid message', () => {
    expect(() => ScamRequestSchema.parse({ message: 'Check this link' })).not.toThrow();
  });

  it('rejects empty message', () => {
    expect(() => ScamRequestSchema.parse({ message: '' })).toThrow();
  });

  it('rejects message over 5000 chars', () => {
    expect(() => ScamRequestSchema.parse({ message: 'a'.repeat(5001) })).toThrow();
  });
});

describe('TriageRequestSchema', () => {
  it('accepts valid description', () => {
    expect(() => TriageRequestSchema.parse({ description: 'Patient is unconscious' })).not.toThrow();
  });

  it('accepts optional image and location', () => {
    expect(() =>
      TriageRequestSchema.parse({
        description: 'Injury',
        imageBase64: 'base64string',
        location: { lat: 12.9716, lng: 77.5946 },
      })
    ).not.toThrow();
  });

  it('rejects empty description', () => {
    expect(() => TriageRequestSchema.parse({ description: '' })).toThrow();
  });

  it('rejects invalid location (missing lng)', () => {
    expect(() =>
      TriageRequestSchema.parse({ description: 'test', location: { lat: 12.9 } })
    ).toThrow();
  });
});

describe('HospitalSchema', () => {
  it('validates a hospital with all fields', () => {
    expect(() =>
      HospitalSchema.parse({
        name: 'City Hospital',
        address: '123 Main St',
        distance: '1.2 km',
        phone: '+91-9876543210',
        openNow: true,
        rating: 4.2,
        placeId: 'abc123',
      })
    ).not.toThrow();
  });

  it('validates without optional fields', () => {
    expect(() =>
      HospitalSchema.parse({
        name: 'City Hospital',
        address: '123 Main St',
        distance: '1.2 km',
        placeId: 'abc123',
      })
    ).not.toThrow();
  });

  it('rejects missing required name', () => {
    expect(() =>
      HospitalSchema.parse({
        address: '123 Main St',
        distance: '1.2 km',
        placeId: 'abc123',
      })
    ).toThrow();
  });
});
