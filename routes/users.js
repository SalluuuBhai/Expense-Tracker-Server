var express = require("express");
var router = express.Router();

// user schemas
const { UserModel } = require("../schemas/userSchemas");
const mongoose = require("mongoose");

// db config
const { dbURL } = require("../common/dbConfig");
mongoose.connect(dbURL);

// nodemailer
const nodemailer = require("nodemailer");
// jsonwebtoken
const jwt = require("jsonwebtoken");

//import from common for nodemailer email verification
const { SendVerificationEmail } = require("../common/verficationEmail.js");
const { SendResetEmail } = require("../common/passwordReset.js");

//import from common for user authentication items
const {
  hashPassword,
  hashCompare,
  createToken,
  validateToken,
  createForgetToken,
  secretKey,
} = require("../common/auth.js");

// API
// const API = "http://localhost:3000";
const API = "https://expense-tracker-money-manager.netlify.app"


// -------------------User Authentication Router --------------------------------

// Register user 
router.post("/register", async (req, res) => {
  try {
    const existingUser = await UserModel.findOne({ email: req.body.email }).collation({ locale: 'en_US' });
    console.log("Existing user" + existingUser);

    if (!existingUser) {
      const hashedPassword = await hashPassword(req.body.password);
      req.body.password = hashedPassword;
      const newUser = await UserModel.create(req.body);
      console.log(newUser)
      let verificationToken = await createToken({
        email: newUser.email,
        userName: newUser.userName,
        id: newUser._id,
      });

      // Send verification email
      const verificationUrl = `${API}/verify/${verificationToken}`;
      await SendVerificationEmail(
        newUser.email,
        verificationUrl,
        "Verify Your Account",
        newUser.userName
      );

      res
        .status(201)
        .send({
          message: "User registered successfully. Verification email sent.",
        });
    } else {
      res.status(400).send({
        message: "User Already Exists!",
      });
    }
  } catch (error) {
    console.error(error);

    res.status(500).send({
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

// Email verification After Clicking Verify Link in Email
router.post("/send-verification-email", async (req, res) => {
  try {
    if (req.headers.authorization) {
      let token = req.headers.authorization.split(" ")[1];
      let data = await jwt.decode(token);

      let updatedData = await UserModel.findOneAndUpdate(
        { _id: data.id },
        { verified: true }
      );

      await updatedData.save();

      return res.status(200).send("Verification successful");
    } else {
      res.status(401).send({ message: "Token Not Found" });
    }
  } catch (error) {
    console.error("Error sending verification email:", error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Resend email Verfication for not verifying email before login.
router.post("/resend-verification-email", async (req, res) => {
  try {
    const existingUser = await UserModel.findOne({ email: req.body.email }).collation({ locale: 'en_US' });

    if (existingUser && !existingUser.verified) {
      let verificationToken = await createToken({
        email: existingUser.email,
        userName: existingUser.userName,
        id: existingUser._id,
      });

      // Resend verification email
      const verificationUrl = `${API}/verify/${verificationToken}`;
      await SendVerificationEmail(
        existingUser.email,
        verificationUrl,
        "Verify Your Account",
        existingUser.userName
      );

      res
        .status(200)
        .send({ message: "Verification email resent successfully." });
    } else if (existingUser && existingUser.verified) {
      res.status(400).send({
        message: "User is already verified.",
      });
    } else {
      res.status(404).send({
        message: "User not found.",
      });
    }
  } catch (error) {
    console.error(error);

    res.status(500).send({
      message: "Internal Server Error",
      error: error.message,
    });
  }
});


//User Login Router
router.post("/login", async (req, res) => {
  try {
    const user = await UserModel.findOne({ email: req.body.email }).collation({ locale: 'en_US' });

    if (user) {
      //verify the password is correct
      const isPasswordValid = await hashCompare(
        req.body.password,
        user.password
      );

      if (isPasswordValid) {
        //create a new token
        let token = await createToken({
          email: user.email,
          userName: user.userName,
          id: user._id,
          verified: user.verified,
        });
        res.status(200).send({
          message: "Login Successful!",
          user: {
            email: user.email,
            userName: user.userName,
            id: user._id,
            verified: user.verified,
          },
          token,
        });
      } else {
        res.status(401).send({
          message: "Incorrect Password!",
        });
      }
    } else {
      res.status(400).send({
        message: "User does not exist! Please Register",
      });
    }
  } catch (error) {
    console.error(error); // Log the error for debugging purposes

    res.status(500).send({
      message: "Internal Server Error",
      error: error.message, // Send only the error message to the client for security reasons
    });
  }
});

//Forgot Password
router.post("/forgot-password", async (req, res) => {
  try {
    let user = await UserModel.findOne({ email: req.body.email }).collation({ locale: 'en_US' });
    if (user) {
      //create token
      let token = await createForgetToken({ id: user._id });

      //send mail
      const url = `${API}/reset-password/${token}`;
      const name = user.userName;
      const email = user.email;
      SendResetEmail(email, url, "Reset Your Password", name);

      //success
      res
        .status(200)
        .send({ message: "Link Has Been Sent To Your Email Id", token });
    } else {
      res.status(400).send({ message: "Invalid User" });
    }
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

//Reset Password into Database
router.post("/reset-password", async (req, res) => {
  console.log(req.headers.authorization);
  try {
    if (req.headers.authorization) {
      let token = req.headers.authorization.split(" ")[1];
      let data = await jwt.decode(token);
      console.log(token, data);
      let currentTime = Math.floor(+new Date() / 1000);
      console.log(currentTime);
      if (currentTime) {
        let hashedPassword = await hashPassword(req.body.password);
        let user = data;

        let updatedData = await UserModel.findOneAndUpdate(
          { _id: user.id },
          { password: hashedPassword }
        );
        updatedData.save();
        res.status(200).send({ message: "Password Changed Successfully !!!" });
      } else {
        res.status(401).send({ message: "Token Expired Try Again" });
      }
    } else {
      res.status(401).send({ message: "Token Not Found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// -------------------User Authentication Completed -------------------





// ----------------------------Getting User ---------------------------

router.get("/getuser", validateToken, async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    console.log("Token :", token);
    const decodedToken = jwt.verify(token, secretKey);
    console.log("Decoded Token:", decodedToken);
    const user = await UserModel.findOne({ _id: decodedToken.id }).collation({ locale: 'en_US' });
    console.log(user);

    if (user) {
      res.status(200).send({
        user,
        message: "User Data Successful",
      });
    } else {
      res.status(404).send({
        message: "User Data Failure",
      });
    }
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      res.status(401).send({ message: "Token Expired!" });
    } else if (error.name === "JsonWebTokenError") {
      res.status(401).send({ message: "Invalid Token!" });
    } else {
      res.status(500).send({ message: "Internal Server Error !!!", error });
    }
  }
});







/* GET users listing. */
// router.get("/", function (req, res, next) {
//   res.send("respond with a resource");
// });

// router.post("/register", async (req, res) => {
//   try {
//     // Check if user with the provided email already exists
//     // let existingUser = await UserModel.findOne({ email: req.body.email });

   
//       // If user does not exist, create a new user
//       let newUser = await UserModel.create(req.body);
//       res.status(201).send({
//         message: "User Created Successfully",
//         user: newUser, // Send the newly created user in response
//       });
   
//       // If user already exists, return a 400 Bad Request response
//       res.status(400).send({
//         message: "User Already Exists",
//       });
    
//   } catch (error) {
//     // Handle any internal server error
//     res.status(500).send({
//       message: "Internal Server Error",
//       error: error.message, // Send error message for debugging
//     });
//   }
// });


module.exports = router;
