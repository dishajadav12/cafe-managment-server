const express = require("express");
const connection = require("../connection");
const router = express.Router();

const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
require("dotenv").config();

var auth = require("../services/authentication");
var checkRole = require("../services/checkRole");

// signup api
router.post("/signup", (req, res) => {
  let user = req.body;
  let query = "SELECT email, password, role, status FROM user WHERE email=?";
  connection.query(query, [user.email], (err, results) => {
    if (!err) {
      if (results.length <= 0) {
        query =
          "INSERT INTO user(name, contactnumber, email, password, status, role) VALUES(?, ?, ?, ?, 'false', 'user')";
        connection.query(
          query,
          [user.name, user.contactnumber, user.email, user.password],
          (err, results) => {
            if (!err) {
              return res
                .status(200)
                .json({ message: "Successfully Registered" });
            } else {
              return res.status(500).json(err);
            }
          }
        );
      } else {
        return res.status(400).json({ message: "Email already exists." });
      }
    } else {
      return res.status(500).json(err);
    }
  });
});

// login api
router.post("/login", (req, res) => {
  let user = req.body;
  let query = "SELECT email, password, role, status FROM user WHERE email=?";
  connection.query(query, [user.email], (err, results) => {
    if (!err) {
      if (results.length <= 0 || results[0].password != user.password) {
        return res
          .status(401)
          .json({ message: "Incorrect Username or password" });
      } else if (results[0].status === "false") {
        return res.status(401).json({ message: "wait for admin approval" });
      } else if (results[0].password == user.password) {
        const response = { email: results[0].email, role: results[0].role };
        const accessToken = jwt.sign(response, process.env.ACCESS_TOKEN, {
          expiresIn: "8h",
        });
        res.status(200).json({ token: accessToken });
      } else {
        return results
          .stats(400)
          .json({ message: "Something went wrong, please try again later." });
      }
    } else {
      return res.status(500).json(err);
    }
  });
});

// forgotpassword API
var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

router.post("/forgetPassword", (req, res) => {
  const user = req.body;
  query = "select email,password from user where email=?";
  connection.query(query, [user.email], (err, results) => {
    if (!err) {
      if (results.length <= 0) {
        return res.status(200).json({ message: "Password sent successfully" });
      } else {
        var mailOptions = {
          from: process.env.EMAIL,
          to: results[0].email,
          subject: "Password by cafe Management system",
          html:
            "<p><b>Your Login details for cafe management system</b><br> <b> Email: </b>" +
            results[0].email +
            "<br><b>Password: </b>" +
            results[0].password +
            '<br> <a href="http://localhost:4200/">Click here to login</a></p>',
        };
        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log("Email sent: " + info.response);
          }
        });
      }
    } else {
      return res.status(500).json(err);
    }
  });
});

// API to get all users
router.get("/get", auth.authenticateToken, checkRole.checkRole, (req, res) => {
  var query =
    "select id,name,email,contactNumber,status from user where role='user'";
  connection.query(query, (err, results) => {
    if (!err) {
      return res.status(200).json(results);
    } else {
      return res.status(500).json(err);
    }
  });
});

// API to update users
router.patch(
  "/update",
  auth.authenticateToken,
  checkRole.checkRole,
  (req, res) => {
    let user = req.body;
    var query = "update user set status=? where id=?";
    connection.query(query, [user.status, user.id], (err, results) => {
      if (!err) {
        if (results.affectedRows == 0) {
          return res.status(404).json({ message: "user id does not exist" });
        }
        return res.status(200).json({ message: "user update successfully" });
      } else {
        return res.status(500).json(err);
      }
    });
  }
);

//API to check token
router.get(
  "/checkToken",
  auth.authenticateToken,
  checkRole.checkRole,
  (req, res) => {
    return res.status(200).json({ message: "true" });
  }
);

// API to change password
router.post("/changePassword", auth.authenticateToken, (req, res) => {
  const user = req.body;
  const email = res.locals.email;
  var query = "select *from user where email=? and password=?";
  connection.query(query, [email, user.oldPassword], (err, results) => {
    if (!err) {
      if (results.length <= 0) {
        return res.status(400).json({ message: "Incorrect old password" });
      } else if (results[0].password == user.oldPassword) {
        query = "update user set password=? where email=?";
        connection.query(query, [user.newPassword, email], (err, results) => {
          if (!err) {
            return res
              .status(200)
              .json({ message: "Password updated successfully." });
          } else {
            return res.status(500).json(err);
          }
        });
      } else {
        return res
          .status(400)
          .json({ message: "Something went wrong, please try again leter" });
      }
    } else {
      return res.status(500).json(err);
    }
  });
});

module.exports = router;
