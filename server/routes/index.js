const express = require('express');
const router = express.Router();
const operationsRoutes = require('./operations');
const marketingRoutes = require('./marketing');
const inventoryRoutes = require('./inventory');
const logisticsRoutes = require('./logistics');
const analyticsRoutes = require('./analytics');
const usersRoutes = require('./users');
const userPreferencesRoutes = require('./userPreferences');
const userActivityRoutes = require('./userActivity');
const chatRoutes = require('./chat');

router.use('/operations', operationsRoutes);
router.use('/marketing', marketingRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/logistics', logisticsRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/users', usersRoutes);
router.use('/user-preferences', userPreferencesRoutes);
router.use('/user-activity', userActivityRoutes);
router.use('/chat', chatRoutes);

module.exports = router;

