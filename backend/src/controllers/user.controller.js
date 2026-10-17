const UserService = require('../services/user.service');

const UserController = {
    // 1. Create a staff account
    async createStaff(req, res, next) {
        try {
            const staff = await UserService.createStaff(req.body);

            return res.status(201).json({
                success: true,
                message: 'Staff account created successfully.',
                data: staff
            });
        } catch (error) {
            next(error);
        }
    },

    // 2. Get all staff accounts
    async getAllStaff(req, res, next) {
        try {
            const staff = await UserService.getAllStaff();

            return res.status(200).json({
                success: true,
                message: 'Staff accounts retrieved successfully.',
                count: staff.length,
                data: staff
            });
        } catch (error) {
            next(error);
        }
    },

    // 3. Get one staff account by ID
    async getStaffById(req, res, next) {
        try {
            const staff = await UserService.getStaffById(req.params.id);

            return res.status(200).json({
                success: true,
                message: 'Staff account retrieved successfully.',
                data: staff
            });
        } catch (error) {
            next(error);
        }
    },

    // 4. Update a staff account
    async updateStaff(req, res, next) {
        try {
            const staff = await UserService.updateStaff(
                req.params.id,
                req.body
            );

            return res.status(200).json({
                success: true,
                message: 'Staff account updated successfully.',
                data: staff
            });
        } catch (error) {
            next(error);
        }
    },

    // 5. Deactivate a staff account
    async deactivateStaff(req, res, next) {
        try {
            const result = await UserService.deactivateStaff(
                req.params.id
            );

            return res.status(200).json({
                success: true,
                message: result.message,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = UserController;