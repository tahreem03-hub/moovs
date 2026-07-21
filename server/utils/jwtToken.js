//create token and saving that in cookies
const sendToken = (user, statusCode, res) => {
  const token = user.getJwtToken();

  //Option for cookies
  const options = {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "PRODUCTION" ? "none" : "lax",
    secure: process.env.NODE_ENV === "PRODUCTION",
  };
user.password = undefined; // don't ship the hash to the client
  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    user,
    token,
  });
};

module.exports=sendToken;