const MenuRepository = require('../repositories/menu.repository');

const MenuController = {
    // ==========================================
    // CREATE MENU CATEGORY
    // ==========================================
    async createCategory(req, res, next) {
        try {
            const { name, description } = req.body;

            if (!name || !name.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Category name is required.'
                });
            }

            const id = await MenuRepository.createCategory({
                name: name.trim(),
                description
            });

            return res.status(201).json({
                success: true,
                message: 'Category created successfully.',
                data: {
                    id,
                    name: name.trim(),
                    description: description || null
                }
            });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({
                    success: false,
                    message: 'Category name already exists.'
                });
            }

            next(error);
        }
    },

    // ==========================================
    // GET ALL MENU CATEGORIES
    // ==========================================
    async getCategories(req, res, next) {
        try {
            const data = await MenuRepository.getCategories();

            return res.status(200).json({
                success: true,
                count: data.length,
                data
            });
        } catch (error) {
            next(error);
        }
    },

    // ==========================================
    // UPDATE MENU CATEGORY
    // ==========================================
    async updateCategory(req, res, next) {
        try {
            const id = Number(req.params.id);
            const { name, description, isActive } = req.body;

            if (
                !Number.isInteger(id) ||
                id < 1 ||
                typeof name !== 'string' ||
                !name.trim() ||
                typeof isActive !== 'boolean'
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid ID, name and isActive are required.'
                });
            }

            const affected = await MenuRepository.updateCategory(id, {
                name: name.trim(),
                description,
                isActive
            });

            if (!affected) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found or no changes made.'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Category updated successfully.'
            });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({
                    success: false,
                    message: 'Category name already exists.'
                });
            }

            next(error);
        }
    },

    // ==========================================
    // CREATE MENU ITEM
    // ==========================================
    async createItem(req, res, next) {
        try {
            const { categoryId, name, description, price } = req.body;

            if (
                !Number.isInteger(categoryId) ||
                categoryId < 1 ||
                typeof name !== 'string' ||
                !name.trim() ||
                typeof price !== 'number' ||
                !Number.isFinite(price) ||
                price < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid categoryId, name and non-negative price are required.'
                });
            }

            const id = await MenuRepository.createItem({
                categoryId,
                name: name.trim(),
                description,
                price
            });

            return res.status(201).json({
                success: true,
                message: 'Menu item created successfully.',
                data: { id }
            });
        } catch (error) {
            if (
                error.code === 'ER_NO_REFERENCED_ROW_2' ||
                error.code === 'ER_NO_REFERENCED_ROW'
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'The selected category does not exist.'
                });
            }

            next(error);
        }
    },

    // ==========================================
    // GET ALL MENU ITEMS
    // ==========================================
    async getItems(req, res, next) {
        try {
            const data = await MenuRepository.getItems();

            return res.status(200).json({
                success: true,
                count: data.length,
                data
            });
        } catch (error) {
            next(error);
        }
    },

    // ==========================================
    // GET MENU ITEM BY ID
    // ==========================================
    async getItemById(req, res, next) {
        try {
            const id = Number(req.params.id);

            if (!Number.isInteger(id) || id < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid menu item ID.'
                });
            }

            const data = await MenuRepository.getItemById(id);

            if (!data) {
                return res.status(404).json({
                    success: false,
                    message: 'Menu item not found.'
                });
            }

            return res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            next(error);
        }
    },

    // ==========================================
    // UPDATE MENU ITEM
    // ==========================================
    async updateItem(req, res, next) {
        try {
            const id = Number(req.params.id);
            const { categoryId, name, description, price } = req.body;

            if (
                !Number.isInteger(id) ||
                id < 1 ||
                !Number.isInteger(categoryId) ||
                categoryId < 1 ||
                typeof name !== 'string' ||
                !name.trim() ||
                typeof price !== 'number' ||
                !Number.isFinite(price) ||
                price < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid ID, categoryId, name and non-negative price are required.'
                });
            }

            const affected = await MenuRepository.updateItem(id, {
                categoryId,
                name: name.trim(),
                description,
                price
            });

            if (!affected) {
                return res.status(404).json({
                    success: false,
                    message: 'Menu item not found or no changes made.'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Menu item updated successfully.'
            });
        } catch (error) {
            if (
                error.code === 'ER_NO_REFERENCED_ROW_2' ||
                error.code === 'ER_NO_REFERENCED_ROW'
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'The selected category does not exist.'
                });
            }

            next(error);
        }
    },

    // ==========================================
    // UPDATE MENU ITEM AVAILABILITY
    // ==========================================
    async updateAvailability(req, res, next) {
        try {
            const id = Number(req.params.id);
            const { isAvailable } = req.body;

            if (
                !Number.isInteger(id) ||
                id < 1 ||
                typeof isAvailable !== 'boolean'
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid ID and boolean isAvailable are required.'
                });
            }

            const affected = await MenuRepository.updateAvailability(
                id,
                isAvailable
            );

            if (!affected) {
                return res.status(404).json({
                    success: false,
                    message: 'Menu item not found or no changes made.'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Menu item availability updated successfully.'
            });
        } catch (error) {
            next(error);
        }
    },

    // ==========================================
    // DELETE MENU ITEM
    // ==========================================
    async deleteItem(req, res, next) {
        try {
            const id = Number(req.params.id);

            if (!Number.isInteger(id) || id < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid menu item ID.'
                });
            }

            if (typeof MenuRepository.deleteItem !== 'function') {
                return res.status(501).json({
                    success: false,
                    message: 'Menu item deletion is not implemented in the repository yet.'
                });
            }

            const affected = await MenuRepository.deleteItem(id);

            if (!affected) {
                return res.status(404).json({
                    success: false,
                    message: 'Menu item not found.'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Menu item deleted successfully.'
            });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = MenuController;