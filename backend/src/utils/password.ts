import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hash a plain text password
 */
export const hashPassword = async (password: string): Promise<string> => {
    return await bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Verify a plain text password against a hash
 */
export const verifyPassword = async (plainPassword: string, hash: string): Promise<boolean> => {
    return await bcrypt.compare(plainPassword, hash);
};
