const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [
    {"username": "alonso", "password": "12345"}
];

const isValid = (username) => { //returns boolean
    let validusers = users.filter(( user ) => user.username === username );
   
    return validusers.length > 0
}

const authenticatedUser = (username, password) => { //returns boolean
    //write code to check if username and password match the one we have in records.
     
    const  validusers = users.filter((user) => {
        return (user.username === username && user.password === password);
    });
   
    return validusers.length > 0
}

//only registered users can login
regd_users.post("/login", (req, res) => {
    const { username, password } = req.body

    if (!username || !password) {
        return res.status(404).json({ message: "Error logging in" });
    }

    if (authenticatedUser(username, password)) {
        let accessToken = jwt.sign({
            data: password
        }, 'access', { expiresIn: 60 * 60 });
        
        req.session.authorization = {
            accessToken, username
        }
        return res.status(200).send({
            message: "Login success!"
        });
    }else {
        return res.status(401).json({ message: "Invalid Login. Check username and password" });
    }
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const review = req.query.review;
    const username = req.session.authorization?.username;

    if (!username) return res.status(401).json({message: "User not authenticated"});
    if (!books[isbn]) return res.status(404).json({message: "Book not found"});

    books[isbn].reviews[username] = review;
    return res.status(200).json({message: "Review added/updated successfully"});
});

//DELETE Review
regd_users.delete("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const username = req.session.authorization?.username;

    if (!username) {
        return res.status(401).json({ message: "User not authenticated" });
    }

    if (!books[isbn]) {
        return res.status(404).json({ message: "Book not found" });
    }

    if (books[isbn].reviews[username]) {
        delete books[isbn].reviews[username];
        
        return res.status(200).json({ 
          message: `Review for ISBN ${isbn} deleted successfully by user ${username}` 
        });
      } else {
        return res.status(404).json({ 
          message: "No review found for this user under the given ISBN" 
        });
      }

})


module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;

