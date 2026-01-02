import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

interface StudentPayload {
    studentId: string;
    academyId: string;
}

/**
 * Sign a new JWT token for a student
 */
export const signStudentToken = (payload: StudentPayload): string => {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });
};

/**
 * Verify and decode a student JWT token
 */
export const verifyStudentToken = (token: string): StudentPayload => {
    try {
        return jwt.verify(token, JWT_SECRET) as StudentPayload;
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
};
