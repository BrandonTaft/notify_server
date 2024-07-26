const jwt = require("jsonwebtoken");

function authenticateUser(req, res, next) {
const headers = req.header('Authorization');
console.log("AUTH HEADERS", headers)
if(!headers) {
    return res.status(401).json({success: false, message: 'Unable to authenticate user'})
};
try {
    const token = headers.split(' ')[1]
    jwt.verify(token, process.env.JWT_SECRET_KEY, function(err, decoded){
        if(!err) {
            res.locals.authenticated = decoded.id
        console.log("DECODED", decoded)
        }
    });
    next();
} catch (error) {
    return res.status(401).json({success: false, message: error})
}
};

module.exports = authenticateUser;