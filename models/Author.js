const { ObjectId } = require('mongodb');
const db = require('../data/database');

class Author {
  static async findAll() {
    const database = db.getDatabase();
    return await database.collection('authors').find({}).toArray();
  }

  static async findById(id) {
    const database = db.getDatabase();
    return await database.collection('authors').findOne({ _id: new ObjectId(id) });
  }

  static async create(data) {
    const database = db.getDatabase();
    return await database.collection('authors').insertOne({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static async update(id, updateData) {
    const database = db.getDatabase();
    const result = await database.collection('authors').updateOne(
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
    const database = db.getDatabase();
    return await database.collection('authors').deleteOne({ _id: new ObjectId(id) });
  }
}

module.exports = Author;