import express from 'express';

const router = express.Router();

// 示例路由
router.get('/', (req, res) => {
  res.json({ message: 'User routes' });
});

router.post('/login', (req, res) => {
  res.json({ message: 'Login endpoint' });
});

router.post('/register', (req, res) => {
  res.json({ message: 'Register endpoint' });
});

export default router;
