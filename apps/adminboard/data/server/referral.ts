'use server';
import { prisma } from '@virtality/db';
import type { ReferralCode } from '@virtality/db';

/**
 * Generate a random 6-character alphanumeric code
 */
function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Check if a code already exists in the database
 */
async function codeExists(code: string): Promise<boolean> {
  const existing = await prisma.referralCode.findFirst({
    where: { code },
  });
  return !!existing;
}

/**
 * Generate a unique referral code
 */
async function generateUniqueCode(): Promise<string> {
  let code = generateCode();
  let attempts = 0;
  const maxAttempts = 100; // Prevent infinite loop

  while (await codeExists(code)) {
    if (attempts >= maxAttempts) {
      throw new Error('Failed to generate unique code after maximum attempts');
    }
    code = generateCode();
    attempts++;
  }

  return code;
}

export const getReferralCodes = async () => {
  try {
    const codes = await prisma.referralCode.findMany({
      orderBy: { id: 'desc' },
    });
    return codes;
  } catch (error) {
    console.log('Error getting referral codes: ', error);
    throw error;
  }
};

export const createReferralCode = async () => {
  try {
    const code = await generateUniqueCode();
    const referralCode = await prisma.referralCode.create({
      data: {
        code,
        usedAt: null,
        usedBy: null,
      },
    });
    return referralCode;
  } catch (error) {
    console.log('Error creating referral code: ', error);
    throw error;
  }
};

export const deleteReferralCode = async (id: ReferralCode['id']) => {
  try {
    await prisma.referralCode.delete({
      where: { id },
    });
  } catch (error) {
    console.log('Error deleting referral code: ', error);
    throw error;
  }
};
