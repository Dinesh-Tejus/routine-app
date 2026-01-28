const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 50
    },
    passwordHash: {
        type: String,
        required: true
    },
    salt: {
        type: String,
        required: true
    }
}, { timestamps: true });

// Method to hash password using SHA256 with salt
userSchema.methods.setPassword = function (password) {
    // Generate a random salt
    this.salt = crypto.randomBytes(16).toString('hex');
    // Hash password with salt using SHA256
    this.passwordHash = crypto
        .pbkdf2Sync(password, this.salt, 10000, 64, 'sha256')
        .toString('hex');
};

// Method to validate password
userSchema.methods.validatePassword = function (password) {
    const hash = crypto
        .pbkdf2Sync(password, this.salt, 10000, 64, 'sha256')
        .toString('hex');
    return this.passwordHash === hash;
};

module.exports = mongoose.model('User', userSchema);
