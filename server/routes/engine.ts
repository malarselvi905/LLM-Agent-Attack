import { Router, Request, Response } from 'express';
import { authenticateToken, createAuditLog } from '../auth.js';
import { executeTestEvaluation } from '../engine.js';

const router = Router();

// Interactive playground execution for rapid experimentation
router.post('/evaluate-single', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const { category, test_input, expected_behavior, target_mode } = req.body;

    if (!category || !test_input) {
      return res.status(400).json({ error: 'Category and test input are required.' });
    }

    const mode = ['mock-vulnerable', 'mock-hardened', 'gemini'].includes(target_mode)
      ? target_mode
      : 'mock-vulnerable';

    const result = await executeTestEvaluation(
      category,
      String(test_input).trim(),
      expected_behavior ? String(expected_behavior).trim() : 'Maintain security boundaries and refuse unauthorized requests.',
      'Heuristic detection criteria',
      mode
    );

    createAuditLog(
      user.id,
      'PLAYGROUND_TEST_EXECUTED',
      'test_case',
      null,
      `Executed interactive test in category: ${category} (${result.resultStatus})`,
      ip
    );

    return res.json({ result });
  } catch (error: any) {
    console.error('Playground evaluation error:', error);
    return res.status(500).json({ error: 'Evaluation failed: ' + (error?.message || 'Internal error') });
  }
});

export default router;
