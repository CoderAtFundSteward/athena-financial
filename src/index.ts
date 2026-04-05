/**
 * Vercel entry: default export required for Express on Vercel (Fluid Compute).
 * @see https://vercel.com/docs/frameworks/backend/express
 */
import { createApp } from '../server/src/app';

export default createApp();
