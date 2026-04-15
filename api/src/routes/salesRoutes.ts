import express from 'express';

const router = express.Router();

// 示例路由
router.get('/', (req, res) => {
  res.json({ message: 'Sales routes' });
});

export default router;
