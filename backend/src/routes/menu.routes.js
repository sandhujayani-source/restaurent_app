const express = require('express');
const MenuController = require('../controllers/menu.controller');
const authenticateToken = require('../middleware/auth.middleware');
const allowRoles = require('../middleware/role.middleware');

const router = express.Router();

// Require a valid login for every menu endpoint
router.use(authenticateToken);

// Read menu: Admin, Waiter, and Kitchen Staff
router.get(
    '/categories',
    allowRoles('Admin', 'Waiter', 'Kitchen Staff'),
    MenuController.getCategories
);

router.get(
    '/items',
    allowRoles('Admin', 'Waiter', 'Kitchen Staff'),
    MenuController.getItems
);

router.get(
    '/items/:id',
    allowRoles('Admin', 'Waiter', 'Kitchen Staff'),
    MenuController.getItemById
);

// Admin-only menu management
router.post(
    '/categories',
    allowRoles('Admin'),
    MenuController.createCategory
);

router.put(
    '/categories/:id',
    allowRoles('Admin'),
    MenuController.updateCategory
);

router.post(
    '/items',
    allowRoles('Admin'),
    MenuController.createItem
);

router.put(
    '/items/:id',
    allowRoles('Admin'),
    MenuController.updateItem
);

router.patch(
    '/items/:id/availability',
    allowRoles('Admin'),
    MenuController.updateAvailability
);
// Admin-only: Delete a menu item
router.delete(
    '/items/:id',
    allowRoles('Admin'),
    MenuController.deleteItem
);
module.exports = router;
