import { pgTable, uuid, varchar, text, integer, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password'),
  name: varchar('name', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).default('USER').notNull(),
  googleId: varchar('googleId', { length: 255 }),
  avatarUrl: text('avatarUrl'),
  authProvider: varchar('authProvider', { length: 50 }).default('email').notNull(),
  isEmailVerified: boolean('isEmailVerified').default(false).notNull(),
  githubId: varchar('githubId', { length: 255 }),
  githubUsername: varchar('githubUsername', { length: 255 }),
  githubAvatar: text('githubAvatar'),
  githubAccessToken: text('githubAccessToken'),
  githubConnectedAt: timestamp('githubConnectedAt'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull()
})

export const otps = pgTable('otps', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  otpHash: text('otpHash').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  attempts: integer('attempts').default(0).notNull(),
  verified: boolean('verified').default(false).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull()
})

export const repositories = pgTable('repositories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  fullName: varchar('fullName', { length: 255 }).notNull(),
  owner: varchar('owner', { length: 255 }).notNull(),
  url: text('url').notNull(),
  cloneUrl: text('cloneUrl'),
  language: varchar('language', { length: 100 }),
  description: text('description'),
  openIssues: integer('openIssues').default(0).notNull(),
  userId: uuid('userId').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull()
})

export const issues = pgTable('issues', {
  id: uuid('id').defaultRandom().primaryKey(),
  repositoryId: uuid('repositoryId').references(() => repositories.id, { onDelete: 'cascade' }).notNull(),
  issueNumber: integer('issueNumber').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  status: varchar('status', { length: 50 }).default('OPEN').notNull(),
  priority: varchar('priority', { length: 50 }).default('MEDIUM').notNull(),
  labels: jsonb('labels').default([]),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull()
})

export const agentRuns = pgTable('agent_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  issueId: uuid('issueId').references(() => issues.id, { onDelete: 'cascade' }).notNull(),
  status: varchar('status', { length: 50 }).default('PENDING').notNull(),
  currentAgent: varchar('currentAgent', { length: 100 }),
  progress: integer('progress').default(0).notNull(),
  confidence: varchar('confidence', { length: 20 }),
  rootCause: text('rootCause'),
  affectedFiles: jsonb('affectedFiles').default([]),
  diff: text('diff'),
  testResults: jsonb('testResults'),
  securityResults: jsonb('securityResults'),
  errorMessage: text('errorMessage'),
  startedAt: timestamp('startedAt'),
  completedAt: timestamp('completedAt'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull()
})

export const pullRequests = pgTable('pull_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  issueId: uuid('issueId').references(() => issues.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  url: text('url').notNull(),
  status: varchar('status', { length: 50 }).default('OPEN').notNull(),
  headBranch: varchar('headBranch', { length: 255 }),
  body: text('body'),
  filesChanged: integer('filesChanged').default(0).notNull(),
  linesAdded: integer('linesAdded').default(0).notNull(),
  linesRemoved: integer('linesRemoved').default(0).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull()
})

export const approvals = pgTable('approvals', {
  id: uuid('id').defaultRandom().primaryKey(),
  agentRunId: uuid('agentRunId').references(() => agentRuns.id, { onDelete: 'cascade' }).notNull(),
  status: varchar('status', { length: 50 }).default('PENDING').notNull(),
  reviewerId: uuid('reviewerId').references(() => users.id, { onDelete: 'set null' }),
  reviewedAt: timestamp('reviewedAt'),
  createdAt: timestamp('createdAt').defaultNow().notNull()
})

export const activityLogs = pgTable('activity_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  action: varchar('action', { length: 255 }).notNull(),
  entityType: varchar('entityType', { length: 100 }),
  entityId: varchar('entityId', { length: 255 }),
  details: text('details'),
  userId: uuid('userId'),
  createdAt: timestamp('createdAt').defaultNow().notNull()
})
