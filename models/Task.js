const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  completed: { type: Boolean, default: false }, // has default value
  createdAt: { type: Date, default: Date.now }, // has default value
  updatedAt: { type: Date, default: Date.now }  // has default value
});

module.exports = mongoose.model('Task', TaskSchema);
