const Joi = require("joi");

const schema = Joi.object({
    room: Joi.string().min(2).max(50).required(),
    temperature: Joi.number().min(-20).max(60).required(),
    humidity: Joi.number().min(0).max(100).required(),
    light: Joi.number().min(0).required(),
    presence: Joi.boolean().required(),
    timestamp: Joi.date().required()
});

module.exports = (req, res, next) => {
    const { error } = schema.validate(req.body);

    if (error) {
        return res.status(400).json({
            success: false,
            message: error.details[0].message
        });
    }

    next();
};
