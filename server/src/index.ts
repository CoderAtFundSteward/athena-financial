import { createApp } from './app';

const app = createApp();
const PORT = Number(process.env.PORT) || 3002;

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
