import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';


const { JWT_SECRET } = process.env;

// Generate hashed password
const genPassword = async (password) => {
    const rounds = 10;
    const salt = await bcrypt.genSalt(rounds);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
};

// Compare password
const comparePassword = async (password, storedPassword) => {
    return await bcrypt.compare(password, storedPassword);
};

// Generate JWT token
const generateToken = (userData) => {
    return jwt.sign(userData, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// Decode and verify JWT token
const decodeToken = (token) => {
    try {
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded;
    } catch (error) {
        console.error("Error decoding token:", error);
        throw new Error("Invalid token");
    }
};

export {
    genPassword,
    comparePassword,
    generateToken,
    decodeToken
};