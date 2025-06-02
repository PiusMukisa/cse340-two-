const mongodb = require('../data/database');
const ObjectId = require('mongodb').ObjectId;

// Validation helper function
const validateBookData = (bookData, isUpdate = false) => {
  const errors = [];
  
  // Required fields for creation
  const requiredFields = ['title', 'author', 'genre', 'publishedDate', 'price', 'inStock', 'rating'];
  
  for (const field of requiredFields) {
    if (!isUpdate && (!bookData[field] && bookData[field] !== 0 && bookData[field] !== false)) {
      errors.push(`${field} is required`);
    }
  }
  
  // Validate data types and formats
  if (bookData.title && typeof bookData.title !== 'string') {
    errors.push('Title must be a string');
  }
  
  if (bookData.author && typeof bookData.author !== 'string') {
    errors.push('Author must be a string');
  }
  
  if (bookData.genre && typeof bookData.genre !== 'string') {
    errors.push('Genre must be a string');
  }
  
  if (bookData.price && (typeof bookData.price !== 'number' || bookData.price < 0)) {
    errors.push('Price must be a positive number');
  }
  
  if (bookData.rating && (typeof bookData.rating !== 'number' || bookData.rating < 0 || bookData.rating > 5)) {
    errors.push('Rating must be a number between 0 and 5');
  }
  
  if (bookData.inStock !== undefined && typeof bookData.inStock !== 'boolean') {
    errors.push('inStock must be a boolean');
  }
  
  // Validate date format
  if (bookData.publishedDate && isNaN(Date.parse(bookData.publishedDate))) {
    errors.push('publishedDate must be a valid date');
  }
  
  return errors;
};

// Validate ObjectId format
const isValidObjectId = (id) => {
  return ObjectId.isValid(id) && (String(new ObjectId(id)) === id);
};

//#swagger.tags=['books']
const getAll = async (req, res) => {
  try {
    const result = await mongodb.getDatabase().db().collection('books').find();
    const books = await result.toArray();
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(books);
  } catch (err) {
    console.error('Error fetching books:', err);
    res.status(500).json({ error: 'Failed to fetch books', details: err.message });
  }
};

// GET single book by ID
const getSingle = async (req, res) => {
  //#swagger.tags=['books']
  try {
    // Validate ObjectId format
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid book ID format' });
    }
    
    const bookId = new ObjectId(req.params.id);
    const result = await mongodb.getDatabase().db().collection('books').findOne({ _id: bookId });
    
    if (!result) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(result);
  } catch (err) {
    console.error('Error fetching book:', err);
    res.status(500).json({ error: 'Failed to fetch the book', details: err.message });
  }
};

const createBook = async (req, res) => {
  //#swagger.tags=['books']
  try {
    // Validate input data
    const validationErrors = validateBookData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: validationErrors });
    }
    
    const book = {
      title: req.body.title,
      author: req.body.author,
      genre: req.body.genre,
      publishedDate: new Date(req.body.publishedDate),
      price: req.body.price,
      inStock: req.body.inStock,
      rating: req.body.rating,
      createdAt: new Date()
    };
    
    const response = await mongodb.getDatabase().db().collection('books').insertOne(book);
    
    if (response.acknowledged) {
      res.status(201).json({ 
        message: 'Book created successfully', 
        bookId: response.insertedId 
      });
    } else {
      res.status(500).json({ error: 'Failed to create book' });
    }
  } catch (err) {
    console.error('Error creating book:', err);
    res.status(500).json({ error: 'Failed to create book', details: err.message });
  }
};

const updateBook = async (req, res) => {
  //#swagger.tags=['books']
  try {
    // Validate ObjectId format
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid book ID format' });
    }
    
    // Validate input data (for updates, fields are optional)
    const validationErrors = validateBookData(req.body, true);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: validationErrors });
    }
    
    const bookId = new ObjectId(req.params.id);
    
    // Check if book exists
    const existingBook = await mongodb.getDatabase().db().collection('books').findOne({ _id: bookId });
    if (!existingBook) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    // Prepare update data (only include provided fields)
    const updateData = {};
    const allowedFields = ['title', 'author', 'genre', 'publishedDate', 'price', 'inStock', 'rating'];
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = field === 'publishedDate' ? new Date(req.body[field]) : req.body[field];
      }
    }
    
    updateData.updatedAt = new Date();
    
    const response = await mongodb.getDatabase().db().collection('books').updateOne(
      { _id: bookId }, 
      { $set: updateData }
    );
    
    if (response.modifiedCount > 0) {
      res.status(200).json({ message: 'Book updated successfully' });
    } else {
      res.status(200).json({ message: 'No changes made to book' });
    }
  } catch (err) {
    console.error('Error updating book:', err);
    res.status(500).json({ error: 'Failed to update book', details: err.message });
  }
};

const deleteBook = async (req, res) => {
  //#swagger.tags=['books']
  try {
    // Validate ObjectId format
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid book ID format' });
    }
    
    const bookId = new ObjectId(req.params.id);
    
    // Check if book exists
    const existingBook = await mongodb.getDatabase().db().collection('books').findOne({ _id: bookId });
    if (!existingBook) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    const response = await mongodb.getDatabase().db().collection('books').deleteOne({ _id: bookId });
    
    if (response.deletedCount > 0) {
      res.status(200).json({ message: 'Book deleted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to delete book' });
    }
  } catch (err) {
    console.error('Error deleting book:', err);
    res.status(500).json({ error: 'Failed to delete book', details: err.message });
  }
};

module.exports = {
  getAll,
  getSingle,
  createBook,
  updateBook,
  deleteBook
};