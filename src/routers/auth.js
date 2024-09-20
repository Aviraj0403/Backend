import express from 'express';

const router = express.Router();

const users = [
  { username: "superadmin@12", password: "superadmin", role: "superAdmin" },
  { username: "owner@12", password: "owner", role: "restaurantOwner" },
];

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    return res.json({ role: user.role });
  }

  return res.status(401).json({ message: "Invalid username or password." });
});

export default router; // Use export default for ES Modules
