import { Router } from 'express';
import { writeSkillPackage, type SkillPackageWriteBody } from '../lib/skillPackageWriter.js';

export const exportRouter = Router();

exportRouter.post('/', (req, res) => {
  const body = req.body as SkillPackageWriteBody;
  if (!body.targetDir) {
    res.status(400).json({ error: 'targetDir required' });
    return;
  }

  try {
    const result = writeSkillPackage(body);
    res.json({ success: true, ...result });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    res.status(500).json({ error: msg });
  }
});
