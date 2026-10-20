const pool = require('../config/database');

const MenuRepository = {
    // 1. Create a menu category
    async createCategory({ name, description }) {
        const [result] = await pool.execute(
            `INSERT INTO menu_categories (name, description)
             VALUES (?, ?)`,
            [name, description || null]
        );

        return result.insertId;
    },

    // 2. Get all menu categories
    async getCategories() {
        const [rows] = await pool.execute(
            `SELECT id, name, description, is_active, created_at, updated_at
             FROM menu_categories
             ORDER BY name ASC`
        );

        return rows;
    },

    // 3. Update a menu category
    async updateCategory(id, { name, description, isActive }) {
        const [result] = await pool.execute(
            `UPDATE menu_categories
             SET name = ?, description = ?, is_active = ?
             WHERE id = ?`,
            [name, description || null, isActive, id]
        );

        return result.affectedRows;
    },

    // 4. Create a menu item
    async createItem({ categoryId, name, description, price }) {
        const [result] = await pool.execute(
            `INSERT INTO menu_items
             (category_id, name, description, price)
             VALUES (?, ?, ?, ?)`,
            [categoryId, name, description || null, price]
        );

        return result.insertId;
    },

    // 5. Get all menu items with their category names
    async getItems() {
        const [rows] = await pool.execute(
            `SELECT
                mi.id,
                mi.category_id,
                mc.name AS category_name,
                mi.name,
                mi.description,
                mi.price,
                mi.is_available,
                mi.created_at,
                mi.updated_at
             FROM menu_items mi
             INNER JOIN menu_categories mc
                ON mc.id = mi.category_id
             ORDER BY mc.name ASC, mi.name ASC`
        );

        return rows;
    },

    // 6. Get one menu item by ID
    async getItemById(id) {
        const [rows] = await pool.execute(
            `SELECT
                mi.id,
                mi.category_id,
                mc.name AS category_name,
                mi.name,
                mi.description,
                mi.price,
                mi.is_available,
                mi.created_at,
                mi.updated_at
             FROM menu_items mi
             INNER JOIN menu_categories mc
                ON mc.id = mi.category_id
             WHERE mi.id = ?`,
            [id]
        );

        return rows[0] || null;
    },

    // 7. Update a menu item
   async updateItem(id, { categoryId, name, description, price }) {
    // Check whether the item exists before updating.
    const existingItem = await this.getItemById(id);

    if (!existingItem) {
        return 0;
    }

    const [result] = await pool.execute(
        `UPDATE menu_items
         SET category_id = ?, name = ?, description = ?, price = ?
         WHERE id = ?`,
        [categoryId, name, description || null, price, id]
    );

    // The item exists, so a no-change update is still successful.
    return result.affectedRows > 0 ? result.affectedRows : 1;
},
    // 8. Update item availability
    async updateAvailability(id, isAvailable) {
        const [result] = await pool.execute(
            `UPDATE menu_items
             SET is_available = ?
             WHERE id = ?`,
            [isAvailable, id]
        );

        return result.affectedRows;
    },

    // 9. Delete a menu item
    async deleteItem(id) {
        const [result] = await pool.execute(
            `DELETE FROM menu_items
             WHERE id = ?`,
            [id]
        );

        return result.affectedRows;
    }
};

module.exports = MenuRepository;