const mongoose = require('mongoose');

const validator = require('validator');

const userSchema = new mongoose.Schema(
    {
        userName: {
            type : String,
            required: true,
            unique: true,
            minLength: 3,
            maxLength: 30,
            trim: true
        },
        email: {
            type : String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            validator:{
                validator: (value) => validator.isEmail(value),
                message: 'Invalid email address'
            }
        },
        password: {
            type : String,
            required: true,
        },
        verified: {
            type : Boolean,
            default: false
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        updatedAt: {
            type: Date,
            default: Date.now
        },
    },
    {
        collation: 'user',
        versionKey: false,
    },
    {
        timestamps: true,
    }
);

let UserModel = mongoose.model('user', userSchema);
module.exports = { UserModel }
