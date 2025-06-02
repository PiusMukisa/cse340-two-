const express = require('express');
const router = express.Router();
const db = require('../data/database');
const Author = require('../models/Author');

// Connection check middleware
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

// GET all authors
router.get('/', async (req, res) => {
  try {
    console.log('Fetching all authors...');
    const authors = await Author.findAll();
    
    console.log(`Found ${authors.length} authors`);
    
    res.json({ 
      success: true, 
      count: authors.length,
      data: authors 
    });
  } catch (error) {
    console.error('Error in getAllAuthors:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// GET single author by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Fetching author by ID:', id);
    
    const author = await Author.findById(id);
    if (!author) {
      return res.status(404).json({ 
        success: false, 
        message: 'Author not found' 
      });
    }
    
    res.json({ 
      success: true, 
      data: author 
    });
  } catch (error) {
    console.error('Error in getAuthorById:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// POST create new author
router.post('/', async (req, res) => {
  try {
    const { name, email, bio } = req.body;
    
    if (!name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name is required' 
      });
    }

    const authorData = {
      name,
      email,
      bio,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await Author.create(authorData);
    const newAuthor = await Author.findById(result.insertedId);

    res.status(201).json({ 
      success: true, 
      data: newAuthor 
    });
  } catch (error) {
    console.error('Error in createAuthor:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// PUT update author
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updatedAt: new Date() };
    
    const result = await Author.update(id, updateData);
    
    if (!result.matchedCount) {
      return res.status(404).json({ 
        success: false, 
        message: 'Author not found' 
      });
    }

    const updatedAuthor = await Author.findById(id);
    res.json({ 
      success: true, 
      data: updatedAuthor 
    });
  } catch (error) {
    console.error('Error in updateAuthor:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// DELETE author
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Author.delete(id);
    
    if (!result.deletedCount) {
      return res.status(404).json({ 
        success: false, 
        message: 'Author not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Author deleted successfully' 
    });
  } catch (error) {
    console.error('Error in deleteAuthor:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

module.exports = router;