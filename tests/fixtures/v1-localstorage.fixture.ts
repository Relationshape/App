// tests/fixtures/v1-localstorage.fixture.ts
// Synthetic v1.0 localStorage["relationshape.v1"] blob, deterministically constructed.
// Shape source: public/legacy/js/storage.js KEY='relationshape.v1', defaults(), createProfile(), saveResult().
// Fixture seed values per .planning/phases/01-skeleton/01-CONTEXT.md <specifics>:
//   profile: name="Test Subject", emoji="🌱", color="#7c83ff", pronouns="they/them"
//   one result with 3 enabledCategories, 2 custom items, 1 __hidden item
//   scale: v1.0 DEFAULT_SCALE verbatim from public/legacy/js/data.js
// Consumed by src/lib/storage/__tests__/storage.test.ts (plan 06) to verify CORE-08.

const V1_BLOB_OBJECT = {
  profiles: [
    {
      id: 'profile-test-subject',
      name: 'Test Subject',
      pronouns: 'they/them',
      color: '#7c83ff',
      emoji: '🌱',
      notes: '',
      createdAt: 1715000000000,
    },
  ],
  results: [
    {
      id: 'result-test-fixture',
      profileId: 'profile-test-subject',
      subject: 'Test Subject',
      subjectEmoji: '🌱',
      subjectColor: '#7c83ff',
      answers: {
        connection: {
          'Daily check-ins': { scale: 'maybe', gr: 'Both', note: '' },
          'Shared humour': { scale: 'want', gr: 'G' },
          __custom: {
            'Reading bedtime stories': { scale: 'maybe', gr: 'Both', note: 'custom item 1' },
          },
          __hidden: {},
        },
        intimacy: {
          'Holding hands': { scale: 'want', gr: 'Both' },
          __custom: {
            'Surprise hugs': { scale: 'need', gr: 'R' },
          },
          __hidden: {
            'Cuddling on the couch': true,
          },
        },
        partnership: {
          'Long-term plans': { scale: 'not-really', gr: 'G' },
          __custom: {},
          __hidden: {},
        },
      },
      enabledCategories: ['connection', 'intimacy', 'partnership'],
      askedItems: {},
      version: 1,
      createdAt: 1715000100000,
      updatedAt: 1715000200000,
    },
  ],
  imports: [],
  settings: {
    theme: 'auto',
    lang: 'en',
    wizardSeen: true,
  },
  // v1.0 DEFAULT_SCALE verbatim from public/legacy/js/data.js:8-16 (authoritative).
  // Field shape { key, label, short, value, color, description } is LOCKED (D-05, plan 03 lock).
  scale: [
    { key: 'no',         label: 'No',             short: 'No',         value: 0, color: '#264653', description: 'I do not want / agree to this.' },
    { key: 'not-really', label: 'Not really',     short: 'Not really', value: 1, color: '#577590', description: 'I lean against this.' },
    { key: 'maybe',      label: 'Maybe / future', short: 'Maybe',      value: 2, color: '#43aa8b', description: 'Hopefully or maybe in the future.' },
    { key: 'open',       label: 'Open to it',     short: 'Open',       value: 3, color: '#90be6d', description: 'I am open, neutral, willing to explore.' },
    { key: 'want',       label: 'Want / like',    short: 'Want',       value: 4, color: '#f9c74f', description: 'I would like this.' },
    { key: 'hell-yes',   label: 'Hell, yes!',     short: 'Hell yes',   value: 5, color: '#f3722c', description: 'Strong yes, exciting and welcome.' },
    { key: 'need',       label: 'Need',           short: 'Need',       value: 6, color: '#e63946', description: 'Highest importance. If unmet I may reconsider the relationship.' },
  ],
} as const

export const V1_LOCALSTORAGE_BLOB: string = JSON.stringify(V1_BLOB_OBJECT)
export const V1_LOCALSTORAGE_PARSED = V1_BLOB_OBJECT
