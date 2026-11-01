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
      id: 'idea-market-nov-5',
      title: 'Idea Market @ UofT Hatchery',
      dateLabel: 'Nov 5, 5:30 PM EST',
      startAt: '2026-11-05T17:30:00-05:00',
      venueLabel: 'University of Toronto',
      url: 'https://luma.com/frr7hrc2',
      featured: false,
      demoExample: false,
    },
    {
      id: 'mlops-world-north-social',
      title: 'MLOps World North Social',
      dateLabel: 'Nov 5, 5:30 PM EST',
      startAt: '2026-11-05T17:30:00-05:00',
      venueLabel: 'Toronto',
      url: 'https://luma.com/mlops-world-north',
      featured: false,
      demoExample: false,
    },
  ],
  composer: {
    hooks: [
      { id: 'hook-perspective', text: 'POV: you walked into an event with 3 contacts and left with 47.' },
      { id: 'hook-humbled', text: "Nobody should have to say 'synergy,' but here we are." },
      { id: 'hook-energy', text: '10/10 would optimize my career trajectory again.' },
      { id: 'hook-notebook', text: 'Day 1 of pretending I was born ready for the industry.' },
    ],
    learnings: [
      { id: 'learn-community', text: 'community beats credential, every time' },
      { id: 'learn-ship', text: 'shipping a rough thing beats a perfect plan' },
      { id: 'learn-feedback', text: 'one specific piece of feedback > a hundred likes' },
      { id: 'learn-curious', text: 'asking good questions is a superpower' },
      { id: 'learn-docs', text: 'read the docs before the recruiter does your bio' },
      { id: 'learn-mentors', text: 'a 5-minute chat can outperform a 50-page resume' },
    ],
    conclusions: [
      { id: 'end-building', text: 'Excited to keep building, learning, and pretending I have it all figured out.' },
      { id: 'end-grateful', text: "Grateful for everyone who made today what it was (and for the coffee)." },
      { id: 'end-next', text: 'Now if you will, I have a 6 a.m. stand-up to "own" tomorrow.' },
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
