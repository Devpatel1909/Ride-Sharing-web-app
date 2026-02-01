// Simple in-memory user "model" until a real DB is connected.
// Replace with proper DB logic in production.

const data = {
  users: [],
};

exports.findByEmail = (email) => {
  return data.users.find((u) => u.email === email);
};

exports.create = (user) => {
  data.users.push(user);
  return user;
};

exports._clearAll = () => {
  data.users = [];
};
