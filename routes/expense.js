var express = require("express");
var router = express.Router();

// user schemas
// const { UserModel } = require("../schemas/userSchemas");
const { ExpenseModel } = require("../schemas/expenseSchemas");
const mongoose = require("mongoose");

// db config
const { dbURL } = require("../common/dbConfig");
mongoose.connect(dbURL);

// API
const API = "http://localhost:3000";

// /* GET home page. */
// router.get("/", function (req, res, next) {
//   res.render("index", { title: "Express" });
// });


//post expense
router.post("/add-expense", async (req, res) => {
    try {
      console.log("Expense Data:", req.body);
  
      const { title, category, date, amount, userID } = req.body;
  
      const expense = await ExpenseModel.create({
        title,
        category,
        date,
        amount,
        userID,
      });
  
      console.log("expense created successfully:", expense);
  
      res.status(201).json({
        message: "Expense Saved Successfully.",
        expense: expense,
      });
    } catch (error) {
      console.error("Error creating Expense:", error);
  
      res.status(500).json({
        message: "Internal Server Error",
        error: error.message,
      });
    }
  });

// get all expense
  router.get("/view-all-expenses/:userId", async function (req, res) {
    try {
      const userId = req.params.userId;
      console.log("User ID: ", userId);
      let expense = await ExpenseModel.find({ userID: userId }).collation({}); // Add this line to explicitly specify an empty collation
      res.status(200).send({
        expense: expense,
        message: "Expense Data Fetch Successful!",
      });
    } catch (error) {
      console.error(error);
  
      res.status(500).send({
        message: "Internal Server Error",
        error: error.message,
      });
    }
  });


  // get one expense data
  router.get("/view-one-expense/:expenseID", async (req, res) => {
    try {
        const { expenseID } = req.params;
        console.log(expenseID);
        const expense = await ExpenseModel.findOne({ _id: expenseID }).collation({ locale: 'en_US' }); // Assuming your model is named ExpenseModel
        console.log("expense:", expense);
        if (expense) {
            res.status(200).send({
                expense,
                message: "Expense Data Successful",
            });
        } else {
            res.status(404).send({
                message: "Expense Data Not Found",
            });
        }
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error !!!", error });
    }
});

  
  //  Update one expense post route
  router.put("/expense-update/:expenseID", async (req, res) => {
    try {
        const expenseID = req.params.expenseID;
        const expenseData = req.body.expenseData;
        console.log("Check", expenseID, expenseData);
        const existingExpense = await ExpenseModel.findOne({ _id: expenseID }).collation({ locale: 'en_US' });;
        console.log("Check1", existingExpense);
  
        if (existingExpense) {
            existingExpense.title = expenseData.title || existingExpense.title;
            existingExpense.category = expenseData.category || existingExpense.category;
            existingExpense.date = expenseData.date || existingExpense.date;
            existingExpense.amount = expenseData.amount || existingExpense.amount;
  
            const updatedExpense = await existingExpense.save();
            console.log("updatedExpense", updatedExpense);
            res.status(200).send({
                message: "Expense updated successfully.",
                expense: updatedExpense,
            });
        } else {
            res.status(404).send({ message: "Expense not found." });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Internal Server Error", error: error.message });
    }
});

  
  
  // Delete one expense post by ID
router.delete("/deleteExpense/:_id", async (req, res) => {
  try {
    const { _id } = req.params;

    // Find and delete the expense by ID
    const deletedExpense = await ExpenseModel.findOneAndDelete({
      _id: _id,
    });

    if (!deletedExpense) {
      return res.status(404).json({
        message: "Expense not found",
      });
    }

    console.log("Expense deleted successfully:", deletedExpense);

    res.status(200).json({
      message: "Expense deleted successfully.",
      expense: deletedExpense,
    });
  } catch (error) {
    console.error("Error deleting Expense:", error);

    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
});


module.exports = router;
