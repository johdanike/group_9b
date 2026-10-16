export enum ReportCategory {
  TRAFFIC = 'traffic',
  WEATHER = 'weather',
  FIRE = 'fire',
  SECURITY = 'security',
  MEDICAL = 'medical',
  UTILITIES = 'utilities',
  COMMUNITY = 'community',
  EVENT = 'event',
  OTHER = 'other',
}

export enum ReportState {
  UNVERIFIED = 'unverified',
  CORROBORATED = 'corroborated',
  VERIFIED = 'verified',
  DISPUTED = 'disputed',
  STALE = 'stale',
  RESOLVED = 'resolved',
  REMOVED = 'removed',
}

export enum LocationPrecision {
  EXACT = 'exact',
  APPROXIMATE = 'approximate',
  AREA = 'area',
  NEIGHBOURHOOD = 'neighbourhood',
}

export interface ReportResponse {
  id: string;
  reporterId: string;
  category: ReportCategory;
  description: string;
  observedAt: Date;
  submittedAt: Date;
  coordinates: {
    type: 'Point';
    coordinates: [number, number];
  };
  locationPrecision: LocationPrecision;
  state: ReportState;
  evidenceReferences?: string[];
  reporter?: {
    id: string;
    displayName: string;
  };
  confirmationsCount?: number;
  disputesCount?: number;
}

export interface FeedQueryParams {
  latitude?: number;
  longitude?: number;
  radius?: number;
  category?: ReportCategory;
  state?: ReportState;
  limit?: number;
  offset?: number;
  since?: string;
}