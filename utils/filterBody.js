module.exports = (body, user) => {
  const filteredBody = {};
  Object.keys(body).forEach((key) => {
    if (user[key] || user[key] === "") filteredBody[key] = body[key];
  });

  return filteredBody;
};
