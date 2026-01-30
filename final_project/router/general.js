// Importación de dependencias necesarias
const express = require('express');
const axios = require('axios');

// Importación de datos y funciones de autenticación
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;

// Creación del router para rutas públicas
const public_users = express.Router();

/**
 * Endpoint para registrar nuevos usuarios
 * Valida que el usuario no exista y que se proporcionen credenciales válidas
 */
public_users.post("/register", (req, res) => {
    const { username, password } = req.body;

    // Validación de campos requeridos
    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    // Verificación de usuario existente
    if (isValid(username)) {
        return res.status(409).json({ message: "User already exists!" });
    }

    // Registro exitoso del nuevo usuario
    users.push({ "username": username, "password": password });
    return res.status(201).json({ message: "User successfully registered. Now you can login" });
});

/**
 * Endpoint para obtener la lista completa de libros disponibles (método síncrono)
 * Retorna todos los libros almacenados en la base de datos local
 */
public_users.get('/', function (req, res) {
    res.send(JSON.stringify(books));
});

/**
 * Función auxiliar para obtener la lista de libros usando async/await con Axios
 * Realiza una petición HTTP al endpoint principal de libros
 */
const getBooksList = async () => {
    try {
        const response = await axios.get("http://localhost:5000/");
        return response.data;
    } catch (error) {
        console.log("Error fetching books:", error.message);
        throw error;
    }
};

/**
 * Endpoint para obtener la lista de libros usando async/await (método asíncrono)
 * Demuestra el uso de promesas y manejo de errores asíncronos
 */
public_users.get('/async-get-books', async (req, res) => {
    try {
        const books = await getBooksList();
        res.status(200).json(books);
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ message: "Error retrieving books asynchronously" });
    }
});

/**
 * Endpoint para obtener detalles de un libro específico por ISBN (método síncrono)
 * Busca el libro en la base de datos local usando el ISBN como clave
 */
public_users.get('/isbn/:isbn', function (req, res) {
    const { isbn } = req.params;
    const book = books[isbn];

    // Verificación de existencia del libro
    if (!book) {
        return res.status(404).json({
            message: `Book with ISBN ${isbn} not found.`
        });
    }

    return res.status(200).json(book);
});
  
/**
 * Endpoint para obtener libros por autor (método síncrono)
 * Filtra todos los libros que coincidan con el autor especificado (case-insensitive)
 */
public_users.get('/author/:author', function (req, res) {
    const { author } = req.params;
    const filteredBooks = [];

    // Búsqueda de libros por autor (ignorando mayúsculas/minúsculas)
    Object.keys(books).forEach(key => {
        if (books[key].author.toLowerCase() === author.toLowerCase()) {
            filteredBooks.push(books[key]);
        }
    });

    // Retorno de resultados o mensaje de error
    if (filteredBooks.length > 0) {
        return res.status(200).json(filteredBooks);
    } else {
        return res.status(404).json({ message: "No books were found for this author." });
    }
});

/**
 * Función auxiliar para obtener un libro por ISBN usando async/await con Axios
 * Realiza una petición HTTP al endpoint específico de ISBN
 */
const getBookByISBN = async (isbn) => {
    try {
        const response = await axios.get(`http://localhost:5000/isbn/${isbn}`);
        return response.data;
    } catch (error) {
        console.log("Error fetching book by ISBN:", error.message);
        throw error;
    }
};

/**
 * Endpoint para obtener detalles de un libro por ISBN usando async/await (método asíncrono)
 * Demuestra el uso de promesas para consultas específicas por ISBN
 */
public_users.get('/async-isbn/:isbn', async (req, res) => {
    const { isbn } = req.params;
    try {
        const book = await getBookByISBN(isbn);
        res.status(200).json(book);
    } catch (err) {
        res.status(500).json({
            message: "Error retrieving book by ISBN asynchronously",
            error_details: err.message
        });
    }
});


/**
 * Función auxiliar para obtener libros por autor usando async/await con Axios
 * Realiza una petición HTTP al endpoint específico de autor
 */
const getBooksByAuthor = async (author) => {
    try {
        const response = await axios.get(`http://localhost:5000/author/${author}`);
        return response.data;
    } catch (error) {
        console.log("Error fetching books by author:", error.message);
        throw error;
    }
};

/**
 * Endpoint para obtener libros por autor usando async/await (método asíncrono)
 * Demuestra el uso de promesas para búsquedas por autor
 */
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

/**
 * Endpoint para obtener libros por título (método síncrono)
 * Filtra todos los libros que coincidan con el título especificado (case-insensitive)
 */
public_users.get('/title/:title', function (req, res) {
    const { title } = req.params;
    const filteredBooks = [];

    // Búsqueda de libros por título (ignorando mayúsculas/minúsculas)
    Object.keys(books).forEach(key => {
        if (books[key].title.toLowerCase() === title.toLowerCase()) {
            filteredBooks.push(books[key]);
        }
    });

    // Retorno de resultados o mensaje de error
    if (filteredBooks.length > 0) {
        return res.status(200).json(filteredBooks);
    } else {
        return res.status(404).json({ message: "No books were found for this title." });
    }
});

/**
 * Función auxiliar para obtener libros por título usando async/await con Axios
 * Realiza una petición HTTP al endpoint específico de título
 */
const getBooksByTitle = async (title) => {
    try {
        const response = await axios.get(`http://localhost:5000/title/${title}`);
        return response.data;
    } catch (error) {
        console.log("Error fetching books by title:", error.message);
        throw error;
    }
};

/**
 * Endpoint para obtener libros por título usando async/await (método asíncrono)
 * Demuestra el uso de promesas para búsquedas por título
 */
public_users.get('/async-title/:title', async (req, res) => {
    const { title } = req.params;
    try {
        const books = await getBooksByTitle(title);
        res.status(200).json(books);
    } catch (err) {
        res.status(500).json({
            message: "Error retrieving books by title asynchronously",
            error_details: err.message
        });
    }
});

/**
 * Endpoint para obtener las reseñas de un libro específico por ISBN
 * Retorna únicamente las reseñas del libro solicitado en formato JSON formateado
 */
public_users.get('/review/:isbn', function (req, res) {
    const isbn = req.params.isbn;
    const book = books[isbn];

    // Verificación de existencia del libro y retorno de sus reseñas
    if (book) {
        return res.status(200).send(JSON.stringify(book.reviews, null, 4));
    } else {
        return res.status(404).json({ message: "Book not found" });
    }
});

module.exports.general = public_users;
