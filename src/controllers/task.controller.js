const { Task, Category } = require("../models");
const { TASK_STATUSES, TASK_PRIORITIES } = require("../utils/task-values");

exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.findAll({
      where: { user_id: req.userId }
    });

    if (tasks.length === 0) {
      return res.status(200).json({
        message: "No tasks found",
        data: []
      });
    }

    res.json({
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error"
    });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findOne({
      where: {
        id,
        user_id: req.userId
      }
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found"
      });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({
      message: "Internal server error"
    });
  }
};

exports.createTask = async (req, res) => {
  try {
    const { title, description, status, priority, due_date, category_id } = req.body;

    if (!title || !status) {
      return res.status(400).json({
        message: "title and status are required"
      });
    }

    if (!TASK_STATUSES.includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Allowed values: todo, in_progress, done"
      });
    }

    if (priority && !TASK_PRIORITIES.includes(priority)) {
      return res.status(400).json({
        message: "Invalid priority. Allowed values: low, medium, high"
      });
    }

    let category = null;

    if (category_id) {
      category = await Category.findOne({
        where: {
          id: category_id,
          user_id: req.userId
        }
      });

      if (!category) {
        return res.status(404).json({
          message: "Category not found"
        });
      }
    }

    const task = await Task.create({
      title,
      description,
      status,
      priority,
      due_date,
      created_at: new Date(),
      updated_at: null,
      user_id: req.userId,
      category_id: category ? category.id : null
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({
      message: "Internal server error"
    });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, due_date, category_id } = req.body;

    const task = await Task.findOne({
      where: {
        id,
        user_id: req.userId
      }
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found"
      });
    }

    if (status !== undefined && !TASK_STATUSES.includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Allowed values: todo, in_progress, done"
      });
    }

    if (priority !== undefined && priority !== null && !TASK_PRIORITIES.includes(priority)) {
      return res.status(400).json({
        message: "Invalid priority. Allowed values: low, medium, high"
      });
    }

    if (category_id !== undefined && category_id !== null) {
      const category = await Category.findOne({
        where: {
          id: category_id,
          user_id: req.userId
        }
      });

      if (!category) {
        return res.status(404).json({
          message: "Category not found"
        });
      }
    }

    await task.update({
      title: title ?? task.title,
      description: description ?? task.description,
      status: status ?? task.status,
      priority: priority ?? task.priority,
      due_date: due_date ?? task.due_date,
      category_id: category_id === undefined ? task.category_id : category_id,
      updated_at: new Date()
    });

    res.json({
      message: "Task updated",
      task
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error"
    });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findOne({
      where: {
        id,
        user_id: req.userId
      }
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found"
      });
    }

    await task.destroy();

    res.json({
      message: "Task deleted"
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error"
    });
  }
};