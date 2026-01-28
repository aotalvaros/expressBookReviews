const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

const axios = require('axios');

public_users.post("/register", (req,res) => {
    const {username, password} = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    if (isValid(username)) {
        return res.status(409).json({ message: "User already exists!" });
    }

    users.push({ "username": username, "password": password });
    return res.status(201).json({ message: "User successfully registered. Now you can login" });
});

// Get the book list available in the shop
public_users.get('/',function (req, res) {
  //Write your code here
 res.send(JSON.stringify(books))
});

const getBooksList = async () => {
    try {
        const response = await axios.get("http://localhost:5000/"); 
        return response.data;
    } catch (error) {
        console.log("Error fetching books:", error.message);
        throw error;
    }
};

public_users.get('/async-get-books', async (req, res) => {
    try {
        const books = await getBooksList();
        res.status(200).json(books);
    } catch (err) {
        console.log(err.message);
        res.status(500).json({message: "Error retrieving books asynchronously"});
    }
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn',function (req, res) {
  //Write your code here
  const { isbn } = req.params

  const book = books[isbn];

  if (!book) {
    return res.status(404).json({ 
      message: `Book with ISBN ${isbn} not found.`
    });
  }

  return res.status(200).json(book);
});
  
// Get book details based on author
public_users.get('/author/:author',function (req, res) {
    const { author } = req.params;

    const keys = Object.keys(books);

    const filteredBooks = [];

    keys.forEach(key => {
        if (books[key].author.toLowerCase() === author.toLowerCase()) {
          filteredBooks.push(books[key]);
        }
    });

    if (filteredBooks.length > 0) {
        return res.status(200).json(filteredBooks);
    } else {
        return res.status(404).json({ message: "No books were found for this author." });
    }

});

//===== obtener detalle del libro async-await con Axios =====//
const getBooksByAuthor = async (author) => {
    try {
        const response = await axios.get(`http://localhost:5000/author/${author}`); 
        return response.data;
    } catch (error) {
        console.log("Error fetching books by author:", error.message);
        throw error;
    } 
};

public_users.get('/async-author/:author', async (req, res) => {
    const { author } = req.params;
    try {
        const books = await getBooksByAuthor(author);
        res.status(200).json(books);
    } catch (err) {
       res.status(500).json({ 
            message: "Error retrieving books by author asynchronously",
            error_details: err.message
        });
    }
});

// Get all books based on title
public_users.get('/title/:title',function (req, res) {
    const { title } = req.params;

    const keys = Object.keys(books);

    const filteredBooks = [];

    keys.forEach(key => {
        if (books[key].title.toLowerCase() === title.toLowerCase()) {
          filteredBooks.push(books[key]);
        }
    });

    if (filteredBooks.length > 0) {
        return res.status(200).json(filteredBooks);
      } else {
        return res.status(404).json({ message: "No books were found for this title." });
      }

});

//  Get book review
public_users.get('/review/:isbn',function (req, res) {
    const isbn = req.params.isbn; 
    const book = books[isbn];  

    if (book) {
        return res.status(200).send(JSON.stringify(book.reviews, null, 4));
    } else {
        return res.status(404).json({ message: "Book not found" });
    }
   
});

module.exports.general = public_users;
