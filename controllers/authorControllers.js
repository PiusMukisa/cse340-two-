const Author = require('../models/Author');

const authorControllers = {
  async getAllAuthors(req, res) {
    try {
      console.log('Fetching all authors...');
      const authors = await Author.findAll();
      
      if (!authors) {
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to fetch authors' 
        });
      }
      
      return res.json({ 
        success: true, 
        count: authors.length,
        data: authors 
      });
    } catch (error) {
      console.error('Error in getAllAuthors:', error);
      return res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  },

  async getAuthorById(req, res) {
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
      
      return res.json({ 
        success: true, 
        data: author 
      });
    } catch (error) {
      console.error('Error in getAuthorById:', error);
      return res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  },

  async createAuthor(req, res) {
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

      return res.status(201).json({ 
        success: true, 
        data: newAuthor 
      });
    } catch (error) {
      console.error('Error in createAuthor:', error);
      return res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  },

  async updateAuthor(req, res) {
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
      return res.json({ 
        success: true, 
        data: updatedAuthor 
      });
    } catch (error) {
      console.error('Error in updateAuthor:', error);
      return res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  },

  async deleteAuthor(req, res) {
    try {
      const { id } = req.params;
      const result = await Author.delete(id);
      
      if (!result.deletedCount) {
        return res.status(404).json({ 
          success: false, 
          message: 'Author not found' 
        });
      }

      return res.json({ 
        success: true, 
        message: 'Author deleted successfully' 
      });
    } catch (error) {
      console.error('Error in deleteAuthor:', error);
      return res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }
};

module.exports = authorControllers;
