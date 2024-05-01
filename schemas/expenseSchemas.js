const mongoose = require('mongoose');
const { UserModel } = require("./userSchemas");

const expenseSchema = new mongoose.Schema(
    {
        title: {
            type : String,
            required: true,
            minLength: 3,
            maxLength: 30,
            trim: true
        },
        category: {
            type : String,
            required: true,
            
        },
        date: {
            type : Date,
            required: true,
        },
        amount: {
            type : Number,
            required: true,
        },
        userID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UserModel",
            required: true,
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
        collation: 'expense',
        versionKey: false,
    },
    {
        timestamps: true,
    }
);

let ExpenseModel = mongoose.model('expense', expenseSchema);
module.exports = { ExpenseModel }
