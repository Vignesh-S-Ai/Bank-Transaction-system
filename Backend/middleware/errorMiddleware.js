const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    // Status 200 should be 500 when it enters the error handler
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
};

module.exports = { errorHandler };
