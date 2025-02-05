// =========== This file is used to send success or error response =========== //
function sendSuccess(res, data = [], message = '', statusCode = 200) {
    res.status(statusCode).json({
        success: true,
        data,
        message,
    });
}
function sendError(res, message, error,  statusCode = 500) {
    res.status(statusCode).json({
        status: false,
        message:message,
        error:error,
    });
}

module.exports = {
    sendSuccess,
    sendError
};
