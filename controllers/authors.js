const mongodb = require('../data/database');
const ObjectId = require('mongodb').ObjectId;

// Validation helper function for authors
const validateAuthorData = (authorData, isUpdate = false) => {
  const errors = [];
  
  // Required fields for creation (7+ fields as required)
  const requiredFields = ['name', 'birthDate', 'nationality', 'biography', 'genre', 'totalBooks', 'isActive'];
  
  for (const field of requiredFields) {
    if (!isUpdate && (!authorData[field] && authorData[field] !== 0 && authorData[field] !== false)) {
      errors.push(`${field} is required`);
    }
  }
  
  // Validate data types and formats
  if (authorData.name && typeof authorData.name !== 'string') {
    errors.push('Name must be a string');
  }
  
  if (authorData.nationality && typeof authorData.nationality !== 'string') {
    errors.push('Nationality must be a string');
  }
  
  if (authorData.biography && typeof authorData.biography !== 'string') {
    errors.push('Biography must be a string');
  }
  
  if (authorData.genre && typeof authorData.genre !== 'string') {
    errors.push('Genre must be a string');
  }
  
  if (authorData.totalBooks && (typeof authorData.totalBooks !== 'number' || authorData.totalBooks < 0)) {
    errors.push('Total books must be a positive number');
  }
  
  if (authorData.isActive !== undefined && typeof authorData.isActive !== 'boolean') {
    errors.push('isActive must be a boolean');
  }
  
  // Validate date format
  if (authorData.birthDate && isNaN(Date.parse(authorData.birthDate))) {
    errors.push('birthDate must be a valid date');
  }
  
  return errors;
};

// Validate ObjectId format
const isValidObjectId = (id) => {
  return ObjectId.isValid(id) && (String(new ObjectId(id)) === id);
};

//#swagger.tags=['authors']
const getAll = async (req, res) => {
  try {
    const result = await mongodb.getDatabase().db().collection('authors').find();
    const authors = await result.toArray();
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(authors);
  } catch (err) {
    console.error('Error fetching authors:', err);
    res.status(500).json({ error: 'Failed to fetch authors', details: err.message });
  }
};

// GET single author by ID
const getSingle = async (req, res) => {
  //#swagger.tags=['authors']
  try {
    // Validate ObjectId format
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid author ID format' });
    }
    
    const authorId = new ObjectId(req.params.id);
    const result = await mongodb.getDatabase().db().collection('authors').findOne({ _id: authorId });
    
    if (!result) {
      return res.status(404).json({ error: 'Author not found' });
    }
    
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(result);
  } catch (err) {
    console.error('Error fetching author:', err);
    res.status(500).json({ error: 'Failed to fetch the author', details: err.message });
  }
};

const createAuthor = async (req, res) => {
  //#swagger.tags=['authors']
  try {
    // Validate input data
    const validationErrors = validateAuthorData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: validationErrors });
    }
    
    const author = {
      name: req.body.name,
      birthDate: new Date(req.body.birthDate),
      nationality: req.body.nationality,
      biography: req.body.biography,
      genre: req.body.genre,
      totalBooks: req.body.totalBooks,
      isActive: req.body.isActive,
      createdAt: new Date()
    };
    
    const response = await mongodb.getDatabase().db().collection('authors').insertOne(author);
    
    if (response.acknowledged) {
      res.status(201).json({ 
        message: 'Author created successfully', 
        authorId: response.insertedId 
      });
    } else {
      res.status(500).json({ error: 'Failed to create author' });
    }
  } catch (err) {
    console.error('Error creating author:', err);
    res.status(500).json({ error: 'Failed to create author', details: err.message });
  }
};

const updateAuthor = async (req, res) => {
  //#swagger.tags=['authors']
  try {
    // Validate ObjectId format
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid author ID format' });
    }
    
    // Validate input data (for updates, fields are optional)
    const validationErrors = validateAuthorData(req.body, true);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: validationErrors });
    }
    
    const authorId = new ObjectId(req.params.id);
    
    // Check if author exists
    const existingAuthor = await mongodb.getDatabase().db().collection('authors').findOne({ _id: authorId });
    if (!existingAuthor) {
      return res.status(404).json({ error: 'Author not found' });
    }
    
    // Prepare update data (only include provided fields)
    const updateData = {};
    const allowedFields = ['name', 'birthDate', 'nationality', 'biography', 'genre', 'totalBooks', 'isActive'];
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = field === 'birthDate' ? new Date(req.body[field]) : req.body[field];
      }
    }
    
    updateData.updatedAt = new Date();
    
    const response = await mongodb.getDatabase().db().collection('authors').updateOne(
      { _id: authorId }, 
      { $set: updateData }
    );
    
    if (response.modifiedCount > 0) {
      res.status(200).json({ message: 'Author updated successfully' });
    } else {
      res.status(200).json({ message: 'No changes made to author' });
    }
  } catch (err) {
    console.error('Error updating author:', err);
    res.status(500).json({ error: 'Failed to update author', details: err.message });
  }
};

const deleteAuthor = async (req, res) => {
  //#swagger.tags=['authors']
  try {
    // Validate ObjectId format
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid author ID format' });
    }
    
    const authorId = new ObjectId(req.params.id);
    
    // Check if author exists
    const existingAuthor = await mongodb.getDatabase().db().collection('authors').findOne({ _id: authorId });
    if (!existingAuthor) {
      return res.status(404).json({ error: 'Author not found' });
    }
    
    const response = await mongodb.getDatabase().db().collection('authors').deleteOne({ _id: authorId });
    
    if (response.deletedCount > 0) {
      res.status(200).json({ message: 'Author deleted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to delete author' });
    }
  } catch (err) {
    console.error('Error deleting author:', err);
    res.status(500).json({ error: 'Failed to delete author', details: err.message });
  }
};

module.exports = {
  getAll,
  getSingle,
  createAuthor,
  updateAuthor,
  deleteAuthor
};