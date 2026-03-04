const healthCheck = (req, res) => {
    res.status(200).json({ status: "server running" });
};

module.exports = { healthCheck };
