/**
 * MongoDB Mock Service - In-Memory Database for Development
 * Provides a working alternative when MongoDB is not available
 * Stores data in memory only (not persisted to disk)
 */

const MockDB = {};
const Collections = {};

class MockCollection {
  constructor(name) {
    this.name = name;
    this.data = [];
    this.nextId = 1;
    Collections[name] = this;
  }

  async insertOne(doc) {
    const _id = doc._id || this.nextId++;
    const newDoc = { ...doc, _id };
    this.data.push(newDoc);
    return { 
      insertedId: _id,
      acknowledged: true 
    };
  }

  async insertMany(docs) {
    const ids = [];
    docs.forEach(doc => {
      const _id = doc._id || this.nextId++;
      this.data.push({ ...doc, _id });
      ids.push(_id);
    });
    return { 
      insertedIds: ids,
      acknowledged: true 
    };
  }

  async findOne(filter) {
    return this.data.find(doc => this._matches(doc, filter)) || null;
  }

  async find(filter) {
    return {
      toArray: async () => this.data.filter(doc => this._matches(doc, filter))
    };
  }

  async updateOne(filter, update) {
    const doc = this.data.find(d => this._matches(d, filter));
    if (!doc) {
      return { 
        matchedCount: 0,
        modifiedCount: 0 
      };
    }
    
    const updateOp = update.$set || update;
    Object.assign(doc, updateOp);
    
    return { 
      matchedCount: 1,
      modifiedCount: 1,
      acknowledged: true 
    };
  }

  async deleteOne(filter) {
    const idx = this.data.findIndex(d => this._matches(d, filter));
    if (idx === -1) {
      return { 
        deletedCount: 0 
      };
    }
    
    this.data.splice(idx, 1);
    return { 
      deletedCount: 1,
      acknowledged: true 
    };
  }

  _matches(doc, filter) {
    if (!filter || Object.keys(filter).length === 0) return true;
    
    return Object.entries(filter).every(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        if (value.$eq !== undefined) return doc[key] === value.$eq;
        if (value.$gt !== undefined) return doc[key] > value.$gt;
        if (value.$gte !== undefined) return doc[key] >= value.$gte;
        if (value.$lt !== undefined) return doc[key] < value.$lt;
        if (value.$lte !== undefined) return doc[key] <= value.$lte;
        if (value.$in !== undefined) return value.$in.includes(doc[key]);
      }
      return doc[key] === value;
    });
  }
}

class MockDatabase {
  constructor(name) {
    this.name = name;
    this._collections = {};
  }

  collection(name) {
    if (!this._collections[name]) {
      this._collections[name] = new MockCollection(name);
    }
    return this._collections[name];
  }

  async dropCollection(name) {
    delete this._collections[name];
    delete Collections[name];
    return true;
  }

  async close() {
    return true;
  }
}

class MockMongoose {
  constructor() {
    this.connection = {
      db: new MockDatabase('alumni-chat'),
      readyState: 1,
      on: () => {},
      close: async () => true,
    };
    this.Schema = function(schema) {
      return schema;
    };
    this.SchemaTypes = {};
  }

  async connect(uri) {
    console.log('📚 Using MongoDB Mock Service (In-Memory Database)');
    console.log('   Data is NOT persisted - for development only!');
    this.connection.readyState = 1;
    return this;
  }

  async disconnect() {
    this.connection.readyState = 0;
  }

  model(name, schema) {
    const collection = this.connection.db.collection(name);
    
    return class {
      constructor(data) {
        this._data = data || {};
      }

      async save() {
        if (!this._data._id) {
          const result = await collection.insertOne(this._data);
          this._data._id = result.insertedId;
        } else {
          await collection.updateOne({ _id: this._data._id }, { $set: this._data });
        }
        return this._data;
      }

      static async create(data) {
        const result = await collection.insertOne(data);
        return { ...data, _id: result.insertedId };
      }

      static async findById(id) {
        return collection.findOne({ _id: id });
      }

      static async findOne(filter) {
        return collection.findOne(filter);
      }

      static async find(filter) {
        const results = await collection.find(filter);
        return results.toArray();
      }

      static async findByIdAndUpdate(id, update) {
        await collection.updateOne({ _id: id }, update);
        return collection.findOne({ _id: id });
      }

      static async deleteOne(filter) {
        return collection.deleteOne(filter);
      }

      static async deleteMany(filter) {
        const docs = this.data.filter(d => this._matches(d, filter));
        const count = docs.length;
        docs.forEach(doc => {
          const idx = this.data.indexOf(doc);
          if (idx > -1) this.data.splice(idx, 1);
        });
        return { deletedCount: count };
      }

      static async countDocuments(filter) {
        return (await this.find(filter)).length;
      }
    };
  }
}

module.exports = {
  MockMongoose,
  MockCollection,
  MockDatabase,
  createMockMongoose: () => new MockMongoose(),
};
