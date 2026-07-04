import bcrypt from 'bcryptjs';
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 10;
export async function hashPassword(password) {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
}
export async function verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
}
//# sourceMappingURL=password.js.map