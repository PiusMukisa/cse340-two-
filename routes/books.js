const express = require('express');
const router = express.Router();
const db = require('../data/database');
const Book = require('../models/Book');

// Simplified middleware
router.use(async (req, res, next) => {
  try {
    await db.checkConnection();
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// GET all books
router.get('/', async (req, res) => {
  try {
    console.log('Fetching all books...');
    const books = await Book.findAll();
    
    console.log(`Found ${books.length} books`);
    
    res.json({ 
      success: true, 
      count: books.length,
      data: books 
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      details: 'Failed to fetch books'
    });
  }
});

// GET single book
router.get('/:id', async (req, res) => {
  try {
    console.log('Fetching book with ID:', req.params.id);
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({ 
        success: false, 
        message: 'Book not found' 
      });
    }
    
    res.json({ 
      success: true, 
      data: book 
    });
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// POST create book
router.post('/', async (req, res) => {
  try {
    console.log('Creating book with data:', req.body);
    
    if (!req.body.title) {
      return res.status(400).json({
        success: false,
        message: 'Book title is required'
      });
    }
    
    const result = await Book.create(req.body);
    const newBook = await Book.findById(result.insertedId);
    
    res.status(201).json({ 
      success: true, 
      data: newBook,
      message: 'Book created successfully'
    });
  } catch (error) {
    console.error('Error creating book:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// PUT update book
router.put('/:id', async (req, res) => {
  try {
    const result = await Book.update(req.params.id, req.body);
    
    if (!result.matchedCount) {
      return res.status(404).json({ 
        success: false, 
        message: 'Book not found' 
      });
    }
    
    const updatedBook = await Book.findById(req.params.id);
    res.json({ 
      success: true, 
      data: updatedBook,
      message: 'Book updated successfully' 
    });
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// DELETE book
router.delete('/:id', async (req, res) => {
  try {
    const result = await Book.delete(req.params.id);
    
    if (!result.deletedCount) {
      return res.status(404).json({ 
        success: false, 
        message: 'Book not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Book deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

module.exports = router;