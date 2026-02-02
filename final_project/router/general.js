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
 * 
 * Estructura de entrada esperada: { username: string, password: string }
 * Respuestas posibles:
 * - 201: Usuario registrado exitosamente
 * - 400: Faltan campos requeridos o son inválidos
 * - 409: El usuario ya existe en el sistema
 */
public_users.post("/register", (req, res) => {
    try {
        const { username, password } = req.body;

        // Validación de campos requeridos y tipos de datos
        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required" });
        }

        if (typeof username !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ message: "Username and password must be strings" });
        }

        // Verificación de usuario existente
        if (isValid(username)) {
            return res.status(409).json({ message: "User already exists!" });
        }

        // Registro exitoso del nuevo usuario
        users.push({ "username": username, "password": password });
        return res.status(201).json({ message: "User successfully registered. Now you can login" });
    } catch (error) {
        // Manejo de errores inesperados del servidor
        console.error("Error in user registration:", error.message);
        return res.status(500).json({ message: "Internal server error during registration" });
    }
});

/**
 * Endpoint para obtener la lista completa de libros disponibles (método síncrono)
 * Retorna todos los libros almacenados en la base de datos local
 * 
 * Estructura de respuesta: Objeto con ISBNs como claves y detalles de libros como valores
 * Ejemplo: { "1": { "author": "...", "title": "...", "reviews": {...} } }
 * Respuestas posibles:
 * - 200: Lista de libros retornada exitosamente
 * - 500: Error interno del servidor
 */
public_users.get('/', function (req, res) {
    try {
        // Verificación de que existan libros en la base de datos
        if (!books || Object.keys(books).length === 0) {
            return res.status(200).json({ message: "No books available", data: {} });
        }
        res.status(200).send(JSON.stringify(books));
    } catch (error) {
        // Manejo de errores al acceder a la base de datos
        console.error("Error retrieving books:", error.message);
        return res.status(500).json({ message: "Error retrieving books from database" });
    }
});

/**
 * Función auxiliar para obtener la lista de libros usando async/await con Axios
 * Realiza una petición HTTP al endpoint principal de libros
 * 
 * @returns {Promise<Object>} Promesa que resuelve con los datos de libros
 * @throws {Error} Si la petición HTTP falla
 */
const getBooksList = async () => {
    try {
        const response = await axios.get("http://localhost:5000/");
        return response.data;
    } catch (error) {
        // Registro del error para debugging y propagación para manejo en el endpoint
        console.error("Error fetching books:", error.message);
        throw new Error("Failed to fetch books from server");
    }
};

/**
 * Endpoint para obtener la lista de libros usando async/await (método asíncrono)
 * Demuestra el uso de promesas y manejo de errores asíncronos
 * 
 * Estructura de respuesta: Objeto con ISBNs como claves y detalles de libros como valores
 * Respuestas posibles:
 * - 200: Lista de libros obtenida exitosamente
 * - 500: Error al obtener libros del servidor
 */
public_users.get('/async-get-books', async (req, res) => {
    try {
        const books = await getBooksList();
        res.status(200).json(books);
    } catch (err) {
        // Manejo de errores de la petición asíncrona
        console.error("Async error:", err.message);
        res.status(500).json({ message: "Error retrieving books asynchronously", error: err.message });
    }
});

/**
 * Endpoint para obtener detalles de un libro específico por ISBN (método síncrono)
 * Busca el libro en la base de datos local usando el ISBN como clave
 * 
 * Parámetro de entrada: isbn (string) - Identificador único del libro
 * Estructura de respuesta: { author: string, title: string, reviews: object }
 * Respuestas posibles:
 * - 200: Libro encontrado y retornado exitosamente
 * - 400: ISBN no proporcionado o inválido
 * - 404: Libro no encontrado con el ISBN especificado
 * - 500: Error interno del servidor
 */
public_users.get('/isbn/:isbn', function (req, res) {
    try {
        const { isbn } = req.params;

        // Validación del parámetro ISBN
        if (!isbn || isbn.trim() === '') {
            return res.status(400).json({ message: "ISBN parameter is required" });
        }

        const book = books[isbn];

        // Verificación de existencia del libro
        if (!book) {
            return res.status(404).json({
                message: `Book with ISBN ${isbn} not found.`
            });
        }

        return res.status(200).json(book);
    } catch (error) {
        // Manejo de errores inesperados
        console.error("Error retrieving book by ISBN:", error.message);
        return res.status(500).json({ message: "Error retrieving book details" });
    }
});
  
/**
 * Endpoint para obtener libros por autor (método síncrono)
 * Filtra todos los libros que coincidan con el autor especificado (case-insensitive)
 * 
 * Parámetro de entrada: author (string) - Nombre del autor a buscar
 * Estructura de respuesta: Array de objetos libro [{ author, title, reviews }]
 * Respuestas posibles:
 * - 200: Libros encontrados exitosamente (array puede estar vacío)
 * - 400: Parámetro author no proporcionado o inválido
 * - 404: No se encontraron libros para el autor especificado
 * - 500: Error interno del servidor
 */
public_users.get('/author/:author', function (req, res) {
    try {
        const { author } = req.params;

        // Validación del parámetro author
        if (!author || author.trim() === '') {
            return res.status(400).json({ message: "Author parameter is required" });
        }

        const filteredBooks = [];

        // Búsqueda de libros por autor (ignorando mayúsculas/minúsculas)
        Object.keys(books).forEach(key => {
            if (books[key].author && books[key].author.toLowerCase() === author.toLowerCase()) {
                filteredBooks.push(books[key]);
            }
        });

        // Retorno de resultados o mensaje de error
        if (filteredBooks.length > 0) {
            return res.status(200).json(filteredBooks);
        } else {
            return res.status(404).json({ message: "No books were found for this author." });
        }
    } catch (error) {
        // Manejo de errores inesperados durante la búsqueda
        console.error("Error searching books by author:", error.message);
        return res.status(500).json({ message: "Error retrieving books by author" });
    }
});

/**
 * Función auxiliar para obtener un libro por ISBN usando async/await con Axios
 * Realiza una petición HTTP al endpoint específico de ISBN
 * 
 * @param {string} isbn - Identificador del libro
 * @returns {Promise<Object>} Promesa que resuelve con los datos del libro
 * @throws {Error} Si la petición HTTP falla o el libro no existe
 */
const getBookByISBN = async (isbn) => {
    try {
        const response = await axios.get(`http://localhost:5000/isbn/${isbn}`);
        return response.data;
    } catch (error) {
        // Registro del error y propagación para manejo en el endpoint
        console.error("Error fetching book by ISBN:", error.message);
        throw new Error(error.response?.data?.message || "Failed to fetch book by ISBN");
    }
};

/**
 * Endpoint para obtener detalles de un libro por ISBN usando async/await (método asíncrono)
 * Demuestra el uso de promesas para consultas específicas por ISBN
 * 
 * Parámetro de entrada: isbn (string) - Identificador del libro
 * Estructura de respuesta: { author: string, title: string, reviews: object }
 * Respuestas posibles:
 * - 200: Libro obtenido exitosamente
 * - 400: ISBN no proporcionado o inválido
 * - 500: Error al obtener el libro del servidor
 */
public_users.get('/async-isbn/:isbn', async (req, res) => {
    try {
        const { isbn } = req.params;

        // Validación del parámetro ISBN
        if (!isbn || isbn.trim() === '') {
            return res.status(400).json({ message: "ISBN parameter is required" });
        }

        const book = await getBookByISBN(isbn);
        res.status(200).json(book);
    } catch (err) {
        // Manejo de errores de la petición asíncrona
        console.error("Async error retrieving book:", err.message);
        res.status(500).json({
            message: "Error retrieving book by ISBN asynchronously",
            error_details: err.message
        });
    }
});


/**
 * Función auxiliar para obtener libros por autor usando async/await con Axios
 * Realiza una petición HTTP al endpoint específico de autor
 * 
 * @param {string} author - Nombre del autor a buscar
 * @returns {Promise<Array>} Promesa que resuelve con array de libros
 * @throws {Error} Si la petición HTTP falla
 */
const getBooksByAuthor = async (author) => {
    try {
        const response = await axios.get(`http://localhost:5000/author/${author}`);
        return response.data;
    } catch (error) {
        // Registro del error y propagación para manejo en el endpoint
        console.error("Error fetching books by author:", error.message);
        throw new Error(error.response?.data?.message || "Failed to fetch books by author");
    }
};

/**
 * Endpoint para obtener libros por autor usando async/await (método asíncrono)
 * Demuestra el uso de promesas para búsquedas por autor
 * 
 * Parámetro de entrada: author (string) - Nombre del autor
 * Estructura de respuesta: Array de objetos libro [{ author, title, reviews }]
 * Respuestas posibles:
 * - 200: Libros obtenidos exitosamente
 * - 400: Parámetro author no proporcionado o inválido
 * - 500: Error al obtener libros del servidor
 */
public_users.get('/async-author/:author', async (req, res) => {
    try {
        const { author } = req.params;

        // Validación del parámetro author
        if (!author || author.trim() === '') {
            return res.status(400).json({ message: "Author parameter is required" });
        }

        const books = await getBooksByAuthor(author);
        res.status(200).json(books);
    } catch (err) {
        // Manejo de errores de la petición asíncrona
        console.error("Async error retrieving books by author:", err.message);
        res.status(500).json({
            message: "Error retrieving books by author asynchronously",
            error_details: err.message
        });
    }
});

/**
 * Endpoint para obtener libros por título (método síncrono)
 * Filtra todos los libros que coincidan con el título especificado (case-insensitive)
 * 
 * Parámetro de entrada: title (string) - Título del libro a buscar
 * Estructura de respuesta: Array de objetos libro [{ author, title, reviews }]
 * Respuestas posibles:
 * - 200: Libros encontrados exitosamente
 * - 400: Parámetro title no proporcionado o inválido
 * - 404: No se encontraron libros con el título especificado
 * - 500: Error interno del servidor
 */
public_users.get('/title/:title', function (req, res) {
    try {
        const { title } = req.params;

        // Validación del parámetro title
        if (!title || title.trim() === '') {
            return res.status(400).json({ message: "Title parameter is required" });
        }

        const filteredBooks = [];

        // Búsqueda de libros por título (ignorando mayúsculas/minúsculas)
        Object.keys(books).forEach(key => {
            if (books[key].title && books[key].title.toLowerCase() === title.toLowerCase()) {
                filteredBooks.push(books[key]);
            }
        });

        // Retorno de resultados o mensaje de error
        if (filteredBooks.length > 0) {
            return res.status(200).json(filteredBooks);
        } else {
            return res.status(404).json({ message: "No books were found for this title." });
        }
    } catch (error) {
        // Manejo de errores inesperados durante la búsqueda
        console.error("Error searching books by title:", error.message);
        return res.status(500).json({ message: "Error retrieving books by title" });
    }
});

/**
 * Función auxiliar para obtener libros por título usando async/await con Axios
 * Realiza una petición HTTP al endpoint específico de título
 * 
 * @param {string} title - Título del libro a buscar
 * @returns {Promise<Array>} Promesa que resuelve con array de libros
 * @throws {Error} Si la petición HTTP falla
 */
const getBooksByTitle = async (title) => {
    try {
        const response = await axios.get(`http://localhost:5000/title/${title}`);
        return response.data;
    } catch (error) {
        // Registro del error y propagación para manejo en el endpoint
        console.error("Error fetching books by title:", error.message);
        throw new Error(error.response?.data?.message || "Failed to fetch books by title");
    }
};

/**
 * Endpoint para obtener libros por título usando async/await (método asíncrono)
 * Demuestra el uso de promesas para búsquedas por título
 * 
 * Parámetro de entrada: title (string) - Título del libro
 * Estructura de respuesta: Array de objetos libro [{ author, title, reviews }]
 * Respuestas posibles:
 * - 200: Libros obtenidos exitosamente
 * - 400: Parámetro title no proporcionado o inválido
 * - 500: Error al obtener libros del servidor
 */
public_users.get('/async-title/:title', async (req, res) => {
    try {
        const { title } = req.params;

        // Validación del parámetro title
        if (!title || title.trim() === '') {
            return res.status(400).json({ message: "Title parameter is required" });
        }

        const books = await getBooksByTitle(title);
        res.status(200).json(books);
    } catch (err) {
        // Manejo de errores de la petición asíncrona
        console.error("Async error retrieving books by title:", err.message);
        res.status(500).json({
            message: "Error retrieving books by title asynchronously",
            error_details: err.message
        });
    }
});

/**
 * Endpoint para obtener las reseñas de un libro específico por ISBN
 * Retorna únicamente las reseñas del libro solicitado en formato JSON formateado
 * 
 * Parámetro de entrada: isbn (string) - Identificador del libro
 * Estructura de respuesta: Objeto con usernames como claves y reseñas como valores
 * Ejemplo: { "user1": "Great book!", "user2": "Excellent read" }
 * Respuestas posibles:
 * - 200: Reseñas obtenidas exitosamente
 * - 400: ISBN no proporcionado o inválido
 * - 404: Libro no encontrado con el ISBN especificado
 * - 500: Error interno del servidor
 */
public_users.get('/review/:isbn', function (req, res) {
    try {
        const isbn = req.params.isbn;

        // Validación del parámetro ISBN
        if (!isbn || isbn.trim() === '') {
            return res.status(400).json({ message: "ISBN parameter is required" });
        }

        const book = books[isbn];

        // Verificación de existencia del libro y retorno de sus reseñas
        if (book) {
            // Verificación de que el libro tenga reseñas
            // if (!book.reviews || Object.keys(book.reviews).length === 0) {
            //     return res.status(200).json({ message: "No reviews available for this book", reviews: {} });
            // }
            return res.status(200).send(JSON.stringify(book.reviews, null, 4));
        } else {
            return res.status(404).json({ message: "Book not found" });
        }
    } catch (error) {
        // Manejo de errores inesperados
        console.error("Error retrieving book reviews:", error.message);
        return res.status(500).json({ message: "Error retrieving book reviews" });
    }
});

module.exports.general = public_users;
