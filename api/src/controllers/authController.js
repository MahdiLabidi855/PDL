const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { logAudit } = require("../utils/auditLogger");

exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        const exist = await User.findOne({ email });

        if (exist) {
            return res.status(400).json({
                message: "Email already exists"
            });
        }

        const hashed = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashed,
            role: role || "user"
        });

        await logAudit({
            action: "Register",
            entityType: "User",
            entityId: user._id.toString(),
            userId: user._id,
            details: { event: "register" },
            req
        });

        res.status(201).json({
            message: "User created"
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(401).json({
                message: "Wrong password"
            });
        }

        const token = jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "2h"
            }
        );

        await logAudit({
            action: "Login",
            entityType: "User",
            entityId: user._id.toString(),
            userId: user._id,
            details: { event: "login" },
            req
        });

        res.json({
            token
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};