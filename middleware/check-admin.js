const jwt = require('jsonwebtoken');

function checkAdmin(req, res, next) {
    try {
        const token = req.headers.authorization.split(" ")[1]; 
        const decodedToken = jwt.verify(token, process.env.JWT_KEY);
        
        if (!decodedToken.userType || decodedToken.userType !== "admin") {
            return res.status(403).json({ 
                message: "Access denied! Admins only." 
            });
        }

        req.userData = decodedToken;
        next();
    } catch (e) {
        return res.status(401).json({
            message: "Invalid or expired admin token!",
            error: e
        });
    }
}

module.exports = {
    checkAdmin
};
