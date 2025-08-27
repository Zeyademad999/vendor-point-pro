const express = require("express");
const { auth } = require("../middleware/auth");
const walletController = require("../controllers/walletController");

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Wallet CRUD operations
router.get("/", walletController.getWallets);
router.get("/stats", walletController.getWalletStats);

// Transaction operations (must come before /:id routes)
router.get("/transactions", walletController.getWalletTransactions);
router.post("/transactions", walletController.addTransaction);
router.post("/transfers", walletController.transferBetweenWallets);

// Parameterized routes (must come after specific routes)
router.get("/:id", walletController.getWallet);
router.post("/", walletController.createWallet);
router.put("/:id", walletController.updateWallet);
router.delete("/:id", walletController.deleteWallet);

module.exports = router;