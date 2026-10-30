export const AREAS = {
  Yaba: { latitude: 6.5158, longitude: 3.3711 },
  Ikeja: { latitude: 6.6018, longitude: 3.3515 },
  Surulere: { latitude: 6.5, longitude: 3.35 },
  'Eti-Osa': { latitude: 6.4474, longitude: 3.4723 },
  'Lagos Island': { latitude: 6.4541, longitude: 3.3947 },
  Ikorodu: { latitude: 6.6194, longitude: 3.5105 },
};
export const CATEGORIES = [
  'traffic',
  'weather',
  'fire',
  'security',
  'medical',
  'utilities',
  'community',
  'event',
  'other',
];
export const STATUS_HELP = {
  unverified: 'Submitted by a resident; not independently verified.',
  corroborated:
    'At least two independent residents confirmed firsthand observations. This is not moderator verification.',
  disputed: 'A resident has challenged this report. Treat it with caution.',
  verified:
    'A moderator reviewed this report and recorded a reason for verification.',
  resolved: 'This incident has been marked resolved.',
  stale: 'This report may no longer reflect current conditions.',
};
