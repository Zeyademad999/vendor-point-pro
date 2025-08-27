const { db } = require("../config/database");

// Get all wallets for a client
const getWallets = async(req, res) => {
    try {
        const clientId = req.user.business_id || req.user.id;

        const wallets = await db("wallets")
            .where("client_id", clientId)
            .where("is_active", true)
            .orderBy("created_at", "desc");

        res.json({
            success: true,
            data: wallets,
        });
    } catch (error) {
        console.error("Get wallets error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get wallets",
        });
    }
};

// Get wallet by ID
const getWallet = async(req, res) => {
    try {
        const clientId = req.user.business_id || req.user.id;
        const walletId = req.params.id;

        const wallet = await db("wallets")
            .where("id", walletId)
            .where("client_id", clientId)
            .where("is_active", true)
            .first();

        if (!wallet) {
            return res.status(404).json({
                success: false,
                message: "Wallet not found",
            });
        }

        res.json({
            success: true,
            data: wallet,
        });
    } catch (error) {
        console.error("Get wallet error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get wallet",
        });
    }
};

// Create new wallet
const createWallet = async(req, res) => {
    try {
        const clientId = req.user.business_id || req.user.id;
        const { name, initial_balance, wallet_type, currency, color, description } =
        req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Wallet name is required",
            });
        }

        const walletData = {
            client_id: clientId,
            name,
            balance: initial_balance || 0,
            wallet_type: wallet_type || "custom",
            currency: currency || "EGP",
            color: color || "#10B981",
            description,
            is_active: true,
        };

        const [walletId] = await db("wallets").insert(walletData);
        const newWallet = await db("wallets").where("id", walletId).first();

        res.json({
            success: true,
            message: "Wallet created successfully",
            data: newWallet,
        });
    } catch (error) {
        console.error("Create wallet error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create wallet",
        });
    }
};

// Update wallet
const updateWallet = async(req, res) => {
    try {
        const clientId = req.user.business_id || req.user.id;
        const walletId = req.params.id;
        const { name, wallet_type, currency, color, description } = req.body;

        const wallet = await db("wallets")
            .where("id", walletId)
            .where("client_id", clientId)
            .where("is_active", true)
            .first();

        if (!wallet) {
            return res.status(404).json({
                success: false,
                message: "Wallet not found",
            });
        }

        const updateData = {
            name: name || wallet.name,
            wallet_type: wallet_type || wallet.wallet_type,
            currency: currency || wallet.currency,
            color: color || wallet.color,
            description: description !== undefined ? description : wallet.description,
            updated_at: new Date(),
        };

        await db("wallets").where("id", walletId).update(updateData);
        const updatedWallet = await db("wallets").where("id", walletId).first();

        res.json({
            success: true,
            message: "Wallet updated successfully",
            data: updatedWallet,
        });
    } catch (error) {
        console.error("Update wallet error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update wallet",
        });
    }
};

// Delete wallet (soft delete)
const deleteWallet = async(req, res) => {
    try {
        const clientId = req.user.business_id || req.user.id;
        const walletId = req.params.id;

        const wallet = await db("wallets")
            .where("id", walletId)
            .where("client_id", clientId)
            .where("is_active", true)
            .first();

        if (!wallet) {
            return res.status(404).json({
                success: false,
                message: "Wallet not found",
            });
        }

        // Check if wallet has balance
        if (wallet.balance > 0) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete wallet with remaining balance",
            });
        }

        await db("wallets").where("id", walletId).update({ is_active: false });

        res.json({
            success: true,
            message: "Wallet deleted successfully",
        });
    } catch (error) {
        console.error("Delete wallet error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete wallet",
        });
    }
};

// Get wallet statistics
const getWalletStats = async(req, res) => {
    try {
        const clientId = req.user.business_id || req.user.id;

        // Get total balance across all wallets
        const totalBalance = await db("wallets")
            .where("client_id", clientId)
            .where("is_active", true)
            .sum("balance as total")
            .first();

        // Get total expenses (debit transactions)
        const totalExpenses = await db("wallet_transactions")
            .where("client_id", clientId)
            .where("transaction_type", "debit")
            .sum("amount as total")
            .first();

        // Get total revenue (credit transactions)
        const totalRevenue = await db("wallet_transactions")
            .where("client_id", clientId)
            .where("transaction_type", "credit")
            .sum("amount as total")
            .first();

        // Calculate net balance
        const netBalance = (totalRevenue.total || 0) - (totalExpenses.total || 0);

        res.json({
            success: true,
            data: {
                totalBalance: totalBalance.total || 0,
                totalExpenses: totalExpenses.total || 0,
                totalRevenue: totalRevenue.total || 0,
                netBalance: netBalance,
            },
        });
    } catch (error) {
        console.error("Get wallet stats error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get wallet statistics",
        });
    }
};

// Add transaction (credit/debit)
const addTransaction = async(req, res) => {
    try {
        const clientId = req.user.business_id || req.user.id;
        const { wallet_id, transaction_type, amount, category, description } =
        req.body;

        if (!wallet_id || !transaction_type || !amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid transaction data",
            });
        }

        // Verify wallet exists and belongs to client
        const wallet = await db("wallets")
            .where("id", wallet_id)
            .where("client_id", clientId)
            .where("is_active", true)
            .first();

        if (!wallet) {
            return res.status(404).json({
                success: false,
                message: "Wallet not found",
            });
        }

        // Generate reference number
        const referenceNumber = `TXN-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)
      .toUpperCase()}`;

        const transactionData = {
            client_id: clientId,
            wallet_id,
            transaction_type,
            amount,
            currency: wallet.currency,
            category: category || "general",
            description,
            reference_number: referenceNumber,
            is_confirmed: true,
        };

        // Start transaction
        await db.transaction(async(trx) => {
            // Insert transaction
            const [transactionId] = await trx("wallet_transactions").insert(
                transactionData
            );

            // Update wallet balance
            let newBalance = wallet.balance;
            if (transaction_type === "credit") {
                newBalance += parseFloat(amount);
            } else if (transaction_type === "debit") {
                if (wallet.balance < amount) {
                    throw new Error("Insufficient balance");
                }
                newBalance -= parseFloat(amount);
            }

            await trx("wallets")
                .where("id", wallet_id)
                .update({ balance: newBalance });

            // Get updated transaction
            const transaction = await trx("wallet_transactions")
                .where("id", transactionId)
                .first();
            const updatedWallet = await trx("wallets").where("id", wallet_id).first();

            return { transaction, updatedWallet };
        });

        const transaction = await db("wallet_transactions")
            .where("reference_number", referenceNumber)
            .first();

        const updatedWallet = await db("wallets").where("id", wallet_id).first();

        res.json({
            success: true,
            message: "Transaction added successfully",
            data: {
                transaction,
                updatedWallet,
            },
        });
    } catch (error) {
        console.error("Add transaction error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to add transaction",
        });
    }
};

// Transfer between wallets
const transferBetweenWallets = async(req, res) => {
    try {
        const clientId = req.user.business_id || req.user.id;
        const { from_wallet_id, to_wallet_id, amount, description } = req.body;

        if (!from_wallet_id || !to_wallet_id || !amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid transfer data",
            });
        }

        if (from_wallet_id === to_wallet_id) {
            return res.status(400).json({
                success: false,
                message: "Cannot transfer to the same wallet",
            });
        }

        // Verify both wallets exist and belong to client
        const fromWallet = await db("wallets")
            .where("id", from_wallet_id)
            .where("client_id", clientId)
            .where("is_active", true)
            .first();

        const toWallet = await db("wallets")
            .where("id", to_wallet_id)
            .where("client_id", clientId)
            .where("is_active", true)
            .first();

        if (!fromWallet || !toWallet) {
            return res.status(404).json({
                success: false,
                message: "One or both wallets not found",
            });
        }

        if (fromWallet.balance < amount) {
            return res.status(400).json({
                success: false,
                message: "Insufficient balance in source wallet",
            });
        }

        // Generate reference number
        const referenceNumber = `TRF-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)
      .toUpperCase()}`;

        // Start transaction
        await db.transaction(async(trx) => {
            // Create debit transaction from source wallet
            const debitTransaction = {
                client_id: clientId,
                wallet_id: from_wallet_id,
                from_wallet_id,
                to_wallet_id,
                transaction_type: "debit",
                amount,
                currency: fromWallet.currency,
                category: "transfer",
                description: `Transfer to ${toWallet.name}: ${description || ""}`,
                reference_number: `${referenceNumber}-DEBIT`,
                is_confirmed: true,
            };

            // Create credit transaction to destination wallet
            const creditTransaction = {
                client_id: clientId,
                wallet_id: to_wallet_id,
                from_wallet_id,
                to_wallet_id,
                transaction_type: "credit",
                amount,
                currency: toWallet.currency,
                category: "transfer",
                description: `Transfer from ${fromWallet.name}: ${description || ""}`,
                reference_number: `${referenceNumber}-CREDIT`,
                is_confirmed: true,
            };

            // Insert both transactions
            await trx("wallet_transactions").insert(debitTransaction);
            await trx("wallet_transactions").insert(creditTransaction);

            // Update wallet balances
            await trx("wallets")
                .where("id", from_wallet_id)
                .update({
                    balance: fromWallet.balance - parseFloat(amount),
                });

            await trx("wallets")
                .where("id", to_wallet_id)
                .update({
                    balance: toWallet.balance + parseFloat(amount),
                });
        });

        // Get updated wallets
        const updatedFromWallet = await db("wallets")
            .where("id", from_wallet_id)
            .first();
        const updatedToWallet = await db("wallets")
            .where("id", to_wallet_id)
            .first();

        res.json({
            success: true,
            message: "Transfer completed successfully",
            data: {
                fromWallet: updatedFromWallet,
                toWallet: updatedToWallet,
                referenceNumber,
            },
        });
    } catch (error) {
        console.error("Transfer error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to complete transfer",
        });
    }
};

// Get wallet transactions
const getWalletTransactions = async(req, res) => {
    try {
        const clientId = req.user.business_id || req.user.id;
        const {
            wallet_id,
            transaction_type,
            category,
            start_date,
            end_date,
            page = 1,
            limit = 20,
        } = req.query;

        let query = db("wallet_transactions")
            .where("wallet_transactions.client_id", clientId)
            .join("wallets", "wallet_transactions.wallet_id", "wallets.id")
            .select(
                "wallet_transactions.*",
                "wallets.name as wallet_name",
                "wallets.color as wallet_color"
            );

        // Apply filters
        if (wallet_id) {
            query = query.where("wallet_transactions.wallet_id", wallet_id);
        }

        if (transaction_type) {
            query = query.where(
                "wallet_transactions.transaction_type",
                transaction_type
            );
        }

        if (category) {
            query = query.where("wallet_transactions.category", category);
        }

        if (start_date) {
            query = query.where("wallet_transactions.created_at", ">=", start_date);
        }

        if (end_date) {
            query = query.where("wallet_transactions.created_at", "<=", end_date);
        }

        // Get total count
        const totalQuery = query.clone();
        const totalCount = await totalQuery.count("* as count").first();

        // Apply pagination
        const offset = (page - 1) * limit;
        const transactions = await query
            .orderBy("wallet_transactions.created_at", "desc")
            .limit(limit)
            .offset(offset);

        res.json({
            success: true,
            data: {
                transactions,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: totalCount.count,
                    pages: Math.ceil(totalCount.count / limit),
                },
            },
        });
    } catch (error) {
        console.error("Get wallet transactions error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get wallet transactions",
        });
    }
};

module.exports = {
    getWallets,
    getWallet,
    createWallet,
    updateWallet,
    deleteWallet,
    getWalletStats,
    addTransaction,
    transferBetweenWallets,
    getWalletTransactions,
};