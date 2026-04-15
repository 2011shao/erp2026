import express from 'express';

const router = express.Router();

// 示例路由
router.get('/', (req, res) => {
  res.json({ message: 'Financial routes' });
});

export default router;
