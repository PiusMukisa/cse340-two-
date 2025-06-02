const { ObjectId } = require('mongodb');
const db = require('../data/database');

class Book {
  static getDatabase() {
    // Get the database instance instead of checking connection
    return db.getDatabase();
  }

  static async findAll() {
    const database = this.getDatabase();
    return await database.collection('books').find({}).toArray();
  }

  static async findById(id) {
    const database = this.getDatabase();
    return await database.collection('books').findOne({ _id: new ObjectId(id) });
  }

  static async create(bookData) {
    const database = this.getDatabase();
    const result = await database.collection('books').insertOne({
      ...bookData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    // Return the inserted document with its ID
    return { ...bookData, _id: result.insertedId };
  }

  static async update(id, updateData) {
    const database = this.getDatabase();
    const result = await database.collection('books').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...updateData,
          updatedAt: new Date(),
        },
      }
    );
    return result;
  }

  static async delete(id) {
    const database = this.getDatabase();
    return await database.collection('books').deleteOne({ _id: new ObjectId(id) });
  }
}

module.exports = Book;