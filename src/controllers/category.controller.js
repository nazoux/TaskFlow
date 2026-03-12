const { Category, Task } = require("../models");

exports.getCategories = async (req, res) => {
  try {
    // Ensure "Misc" default category exists for this user
    const miscExists = await Category.findOne({ where: { user_id: req.userId, name: "Misc" } });
    if (!miscExists) {
      await Category.create({ name: "Misc", color: "#f59e0b", user_id: req.userId });
    }

    const categories = await Category.findAll({
      where: { user_id: req.userId }
    });

    res.json({
      count: categories.length,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error"
    });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findOne({
      where: {
        id,
        user_id: req.userId
      }
    });

    if (!category) {
      return res.status(404).json({
        message: "Category not found"
      });
    }

    res.json(category);
  } catch (error) {
    res.status(500).json({
      message: "Internal server error"
    });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, color } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "name is required"
      });
    }

    const existingCategory = await Category.findOne({
      where: {
        name,
        user_id: req.userId
      }
    });

    if (existingCategory) {
      return res.status(409).json({
        message: "Category already exists"
      });
    }

    const category = await Category.create({
      name,
      color,
      user_id: req.userId
    });

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({
      message: "Internal server error"
    });
  }
};


exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;

    const category = await Category.findOne({
      where: {
        id,
        user_id: req.userId
      }
    });

    if (!category) {
      return res.status(404).json({
        message: "Category not found"
      });
    }

    await category.update({
      name: name ?? category.name,
      color: color ?? category.color
    });

    res.json({
      message: "Category updated",
      category
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error"
    });
  }
};

// Si une catégorie est supprimée, les tâches associées auront leur category_id mis à null

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findOne({
      where: {
        id,
        user_id: req.userId
      }
    });

    if (!category) {
      return res.status(404).json({
        message: "Category not found"
      });
    }

    await Task.update(
      { category_id: null, updated_at: new Date() },
      {
        where: {
          category_id: id,
          user_id: req.userId
        }
      }
    );

    await category.destroy();

    res.json({
      message: "Category deleted"
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error"
    });
  }
};