const jwt = require('jsonwebtoken');

function checkAuth(req, res, next){
    try{
        const token = req.headers.authorization.split(" ")[1]; 
        const decodedToken = jwt.verify(token, process.env.JWT_KEY);
        req.userData = decodedToken;
        if (req.userData.userType === 'admin') {
            return res.status(403).json({
                message: "Access denied! Admin is not allowed."
            });
        }
        next();
    }catch(e){
        return res.status(401).json({
            'message': "Invalid or expired token provided!",
            'error':e
        });
    }
}

module.exports = {
    checkAuth: checkAuth
}