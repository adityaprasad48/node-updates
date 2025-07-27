const express = require('express');
const router = express.Router();
const Task = require('../models/Task');

// GET all tasks
// sample payload: { "title": "New Task", "description": "Task description" }
router.get('/', async (req, res) => {
  const redisKey = 'node-updates:tasks';
  const cached = await req.redis.get(redisKey);

  console.log('Redis Cache:', cached);
  if (cached) {
    return res.json({ source: 'cache', data: JSON.parse(cached) });
  }

  const tasks = await Task.find();
  const data = { source: 'db', data: tasks };

  // Cache it for 60 seconds
  await req.redis.setEx(redisKey, 60, JSON.stringify(tasks));
  res.json(data);
});

// POST create task
router.post('/', async (req, res) => {
  const { title, description } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required' });
  }

  const newTask = new Task({ title, description });
  const savedTask = await newTask.save();
  res.status(201).json(savedTask);
});

// PUT update task
router.put('/:id', async (req, res) => {
  const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updatedTask);
});

// DELETE task
router.delete('/:id', async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  res.json({ message: 'Task deleted' });
});

module.exports = router;