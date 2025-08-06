import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { app } from '../../src/server';
import { createMockUser, expectApiError, expectApiSuccess, hashPassword } from '../utils/testHelpers';

// Mock the Prisma client
const mockPrisma = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  userProfile: {
    create: jest.fn(),
  },
  session: {
    create: jest.fn(),
    delete: jest.fn(),
    deleteMany