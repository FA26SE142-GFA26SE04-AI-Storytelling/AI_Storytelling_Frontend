import type { PublicReviewFlagDto } from '@/app/types/backendContracts';

export type GrayZoneEvidenceMetadata = {
  model: string | null;
  rubric: string | null;
  phase: string | null;
  risk: string | null;
  reason: string | null;
};

export type ParsedGrayZoneEvidence = {
  findings: PublicReviewFlagDto[];
  metadata: GrayZoneEvidenceMetadata;
  plainNote: string | null;
};

function readString(obj: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const val = obj[key];
    if (typeof val === 'string' && val.trim()) return val.trim();
  }
  return null;
}

function readInt(obj: Record<string, unknown>, ...keys: string[]): number | null {
  for (const key of keys) {
    const val = obj[key];
    if (typeof val === 'number' && Number.isInteger(val)) return val;
  }
  return null;
}

function toFinding(raw: unknown, index: number): PublicReviewFlagDto | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const name = readString(obj, 'name', 'Name', 'criterionCode', 'CriterionCode', 'category', 'Category');
  const reason = readString(obj, 'reason', 'Reason') ?? '';
  const evidenceQuote = readString(obj, 'evidenceQuote', 'EvidenceQuote') ?? '';
  const contextNote = readString(obj, 'contextNote', 'ContextNote') ?? '';
  const kind = readString(obj, 'kind', 'Kind') ?? '';
  const criterionCode = readString(obj, 'criterionCode', 'CriterionCode', 'category', 'Category') ?? '';
  if (!name && !reason && !evidenceQuote && !contextNote) return null;

  return {
    flagId: readString(obj, 'flagId', 'FlagId', 'id', 'Id') ?? `gz-${index}`,
    kind,
    name: name ?? 'Dấu hiệu vùng xám',
    criterionCode,
    reason,
    evidenceQuote,
    contextNote,
    startOffset: readInt(obj, 'startOffset', 'StartOffset'),
    endOffset: readInt(obj, 'endOffset', 'EndOffset'),
    resolved: false,
    resolvedReason: null,
  };
}

const EMPTY_META: GrayZoneEvidenceMetadata = {
  model: null,
  rubric: null,
  phase: null,
  risk: null,
  reason: null,
};

/** Đọc flags từ GrayZoneReviewDto một cách trung thực; không tự bịa field AI hoặc lộ checkpoint nội bộ. */
export function parseGrayZoneFlags(raw?: string | null): ParsedGrayZoneEvidence {
  const trimmed = raw?.trim();
  if (!trimmed) return { findings: [], metadata: EMPTY_META, plainNote: null };

  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      const findings = parsed.map(toFinding).filter((item): item is PublicReviewFlagDto => item !== null);
      return { findings, metadata: EMPTY_META, plainNote: null };
    }
    if (parsed && typeof parsed === 'object') {
      const obj = parsed as Record<string, unknown>;
      const rawFindings = Array.isArray(obj.findings)
        ? obj.findings
        : Array.isArray(obj.Findings)
          ? obj.Findings
          : [];
      const findings = rawFindings.map(toFinding).filter((item): item is PublicReviewFlagDto => item !== null);
      const riskVal = obj.riskScore ?? obj.RiskScore ?? obj.risk ?? obj.Risk;
      const risk = typeof riskVal === 'number' || typeof riskVal === 'string' ? String(riskVal) : null;
      return {
        findings,
        metadata: {
          model: readString(obj, 'model', 'Model'),
          rubric: readString(obj, 'rubric', 'Rubric', 'policyVersion', 'PolicyVersion'),
          phase: readString(obj, 'phase', 'Phase', 'zone', 'Zone'),
          risk,
          reason: readString(obj, 'reason', 'Reason', 'requestReason', 'RequestReason'),
        },
        plainNote: null,
      };
    }
  } catch {
    return { findings: [], metadata: EMPTY_META, plainNote: trimmed };
  }

  return { findings: [], metadata: EMPTY_META, plainNote: null };
}
