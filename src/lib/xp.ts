import { db } from "@/db";
import { xpUsers, xpLogs } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

/**
 * Finds or creates a user based on their address.
 * @param address The user's address.
 * @returns The user object (either found or newly created).
 */
async function findOrCreateUser(address: string) {
  let user = await db.select().from(xpUsers).where(eq(xpUsers.address, address)).limit(1).then(res => res[0]);

  if (!user) {
    // User not found, create one
    const newUser = await db.insert(xpUsers).values({
      address: address,
      xp: 0, // Start with 0 XP
    }).returning();
    user = newUser[0];
    console.log(`Created new user for address: ${address}`);
  } else {
     // Update updatedAt timestamp on existing user access
     await db.update(xpUsers)
       .set({ updatedAt: new Date() })
       .where(eq(xpUsers.id, user.id));
  }
  return user;
}

/**
 * Gets the current XP for a given address.
 * Creates the user if they don't exist.
 * @param address The user's address.
 * @returns The current XP value.
 */
export async function getXP(address: string): Promise<number> {
  if (!address) throw new Error("Address is required to get XP.");

  try {
    const user = await findOrCreateUser(address);
    return user.xp;
  } catch (error) {
    console.error(`Error getting XP for address ${address}:`, error);
    // Depending on requirements, you might return 0 or re-throw
    throw new Error(`Failed to get XP for address ${address}`);
  }
}

/**
 * Adds XP to a user's account and logs the transaction.
 * Creates the user if they don't exist.
 * @param address The user's address.
 * @param amount The amount of XP to add (can be negative).
 * @param source A string indicating the source of the XP change (e.g., 'mission_1', 'sigma_hint').
 * @returns The new XP total for the user.
 */
export async function addXP(address: string, amount: number, source: string): Promise<number> {
  if (!address || amount === undefined || !source) {
    throw new Error("Address, amount, and source are required to add XP.");
  }
  if (typeof amount !== 'number') {
    throw new Error("Amount must be a number.");
  }

  console.log(`Attempting to add ${amount} XP to ${address} from source: ${source}`);

  try {
    const user = await findOrCreateUser(address);

    // Update XP using SQL increment for atomicity
    const updatedUser = await db.update(xpUsers)
      .set({ xp: sql`${xpUsers.xp} + ${amount}`, updatedAt: new Date() })
      .where(eq(xpUsers.id, user.id))
      .returning({ newXP: xpUsers.xp });

    const newXP = updatedUser[0]?.newXP;

    if (newXP === undefined) {
      throw new Error('Failed to update user XP.');
    }

    // Log the transaction
    await db.insert(xpLogs).values({
      userId: user.id,
      source: source,
      amount: amount,
    });

    console.log(`Successfully added ${amount} XP to ${address}. New total: ${newXP}`);
    return newXP;
  } catch (error) {
    console.error(`Error adding ${amount} XP for address ${address} from ${source}:`, error);
    throw new Error(`Failed to add XP for address ${address}`);
  }
} 