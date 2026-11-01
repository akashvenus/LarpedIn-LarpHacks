import { DemoData } from '../domain/types';

/**
 * Local development fixture matching the locked GET /api/demo shape
 * (docs/larpedin-build-spec.md §3). Values are placeholders until
 * Andrew's content/demo.json (I1) lands; ids follow his convention
 * (stable lowercase, "larphacks" first and featured).
 */
export const MOCK_DEMO: DemoData = {
  schemaVersion: 1,
  events: [
    {
      id: 'larphacks',
      title: 'LarpHacks',
      dateLabel: 'Today',
      venueLabel: 'Toronto',
      url: 'https://luma.com/irn5abpa',
      featured: true,
      demoExample: false,
    },
    {
      id: 'aibuilders-toronto',
      title: 'AI Builders Night',
      dateLabel: 'Tonight',
      venueLabel: 'Waterloo',
      url: 'https://luma.com/discover',
      featured: false,
      demoExample: true,
    },
    {
      id: 'open-source-social',
      title: 'Open Source Social',
      dateLabel: 'Friday',
      venueLabel: 'Remote',
      url: 'https://luma.com/discover',
      featured: false,
      demoExample: true,
    },
  ],
  composer: {
    hooks: [
      { id: 'hook-perspective', text: "I didn't expect one conversation to change my perspective on building." },
      { id: 'hook-humbled', text: 'Walking in, I thought I had it figured out. I did not.' },
      { id: 'hook-energy', text: 'The energy in that room was unmatched.' },
      { id: 'hook-notebook', text: 'My notes from this event are already 10 pages long.' },
    ],
    learnings: [
      { id: 'learn-community', text: 'community is a force multiplier' },
      { id: 'learn-ship', text: 'shipping early beats planning late' },
      { id: 'learn-feedback', text: 'specific feedback compounds' },
      { id: 'learn-curious', text: 'curiosity signals more than credentials' },
      { id: 'learn-docs', text: 'good docs are a kindness' },
      { id: 'learn-mentors', text: 'mentors open doors quietly' },
    ],
    conclusions: [
      { id: 'end-building', text: 'Excited to keep building and learning.' },
      { id: 'end-grateful', text: "Grateful for everyone who made today what it was." },
      { id: 'end-next', text: 'Already looking forward to the next one.' },
    ],
    hashtags: [
      { id: 'ai', text: '#AI' },
      { id: 'buildinpublic', text: '#BuildInPublic' },
      { id: 'techcommunity', text: '#TechCommunity' },
      { id: 'career', text: '#Career' },
      { id: 'hackathon', text: '#Hackathon' },
      { id: 'firstyear', text: '#FirstYear' },
    ],
  },
  profile: {
    id: 'demo-user',
    name: 'You',
    headline: 'First-year CS student | Building in public',
  },
  recruiter: {
    id: 'recruiter-1',
    name: 'Alex Morgan',
    headline: 'Early Careers Recruiter | Fictional',
  },
  outreachMessage:
    'Hi Alex, I recently attended a tech event and would love to connect about opportunities at the intersection of AI, community, and impact.',
};
