import express from 'express';
import cors from 'cors';
import { fileRouter } from './routes/files.js';
import { exportRouter } from './routes/export.js';
import { presetRouter } from './routes/presets.js';
import { projectRouter } from './routes/project.js';

const app = express();
const PORT = Number(process.env.SKILL_BUILDER_SERVER_PORT || 3848);

app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.use('/api/files', fileRouter);
app.use('/api/export', exportRouter);
app.use('/api/presets', presetRouter);
app.use('/api/project', projectRouter);

app.listen(PORT, () => {
  console.log(`Skill Builder API running on http://localhost:${PORT}`);
});
