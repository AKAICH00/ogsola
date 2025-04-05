import type { NextApiRequest, NextApiResponse } from 'next';
import { getXP } from '@/lib/xp';

type ResponseData = {
  address: string;
  xp: number;
} | {
  message: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  const { address } = req.query;

  if (!address || typeof address !== 'string') {
    return res.status(400).json({ message: 'Address parameter is required and must be a string.' });
  }

  try {
    const xp = await getXP(address);
    res.status(200).json({ address, xp });
  } catch (error: unknown) {
    console.error(`API Error getting XP for ${address}:`, error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    res.status(500).json({ message });
  }
} 