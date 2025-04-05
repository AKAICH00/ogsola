import type { NextApiRequest, NextApiResponse } from 'next';
import { addXP } from '@/lib/xp';

type RequestBody = {
  address: string;
  amount: number;
  source: string;
}

type ResponseData = {
  success: boolean;
  xp: number;
} | {
  message: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  try {
    // Basic validation of request body
    const { address, amount, source } = req.body as RequestBody;
    if (!address || typeof address !== 'string') {
      return res.status(400).json({ message: 'Invalid or missing address.' });
    }
    if (amount === undefined || typeof amount !== 'number') {
      return res.status(400).json({ message: 'Invalid or missing amount.' });
    }
    if (!source || typeof source !== 'string') {
      return res.status(400).json({ message: 'Invalid or missing source.' });
    }

    const newXP = await addXP(address, amount, source);
    res.status(200).json({ success: true, xp: newXP });

  } catch (error: unknown) {
    console.error('API Error adding XP:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    // Send 500 for server errors, 400 if the addXP function threw a validation error
    const statusCode = error instanceof Error && error.message.includes('required') ? 400 : 500;
    res.status(statusCode).json({ message });
  }
} 