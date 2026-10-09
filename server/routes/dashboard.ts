import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { authenticateToken } from '../auth.js';

const router = Router();

router.get('/summary', authenticateToken, (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const isAdmin = user.role === 'admin';

    // Base filters
    const userFilter = isAdmin ? '' : 'WHERE a.user_id = ?';
    const params = isAdmin ? [] : [user.id];

    // Total assessments
    const totalAssessments = (db.prepare(`
      SELECT COUNT(*) as count FROM assessments a ${userFilter}
    `).get(...params) as any)?.count || 0;

    // Test results counts
    const testStats = db.prepare(`
      SELECT 
        COUNT(*) as total_tests,
        SUM(CASE WHEN ar.result_status = 'passed' THEN 1 ELSE 0 END) as passed_tests,
        SUM(CASE WHEN ar.result_status = 'failed' THEN 1 ELSE 0 END) as failed_tests
      FROM assessment_results ar
      JOIN assessments a ON ar.assessment_id = a.id
      ${userFilter}
    `).get(...params) as any;

    // Findings count by risk level
    const riskStats = db.prepare(`
      SELECT 
        COUNT(*) as total_findings,
        SUM(CASE WHEN f.risk_level = 'Critical' THEN 1 ELSE 0 END) as critical_count,
        SUM(CASE WHEN f.risk_level = 'High' THEN 1 ELSE 0 END) as high_count,
        SUM(CASE WHEN f.risk_level = 'Medium' THEN 1 ELSE 0 END) as medium_count,
        SUM(CASE WHEN f.risk_level = 'Low' THEN 1 ELSE 0 END) as low_count
      FROM findings f
      JOIN assessments a ON f.assessment_id = a.id
      ${userFilter}
    `).get(...params) as any;

    // Category distribution
    const categoryDistribution = db.prepare(`
      SELECT f.category, COUNT(*) as count
      FROM findings f
      JOIN assessments a ON f.assessment_id = a.id
      ${userFilter}
      GROUP BY f.category
      ORDER BY count DESC
    `).all(...params);

    // Tests over time (grouped by date)
    const testTimeline = db.prepare(`
      SELECT substr(ar.created_at, 1, 10) as date,
             COUNT(*) as total,
             SUM(CASE WHEN ar.result_status = 'passed' THEN 1 ELSE 0 END) as passed,
             SUM(CASE WHEN ar.result_status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM assessment_results ar
      JOIN assessments a ON ar.assessment_id = a.id
      ${userFilter}
      GROUP BY date
      ORDER BY date ASC
      LIMIT 14
    `).all(...params);

    return res.json({
      summary: {
        total_assessments: totalAssessments,
        total_tests: testStats?.total_tests || 0,
        passed_tests: testStats?.passed_tests || 0,
        failed_tests: testStats?.failed_tests || 0,
        total_findings: riskStats?.total_findings || 0,
        critical_count: riskStats?.critical_count || 0,
        high_risk_count: (riskStats?.critical_count || 0) + (riskStats?.high_count || 0),
        medium_count: riskStats?.medium_count || 0,
        low_count: riskStats?.low_count || 0,
      },
      category_distribution: categoryDistribution,
      timeline: testTimeline,
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    return res.status(500).json({ error: 'Failed to retrieve dashboard summary.' });
  }
});

router.get('/activity', authenticateToken, (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const isAdmin = user.role === 'admin';
    const params = isAdmin ? [] : [user.id];

    // Recent assessments
    const recentAssessments = db.prepare(`
      SELECT a.id, a.title, a.target_mode, a.status, a.created_at,
             (SELECT COUNT(*) FROM assessment_results WHERE assessment_id = a.id) as total_tests,
             (SELECT COUNT(*) FROM assessment_results WHERE assessment_id = a.id AND result_status = 'passed') as passed_tests,
             (SELECT COUNT(*) FROM findings WHERE assessment_id = a.id) as findings_count
      FROM assessments a
      ${isAdmin ? '' : 'WHERE a.user_id = ?'}
      ORDER BY a.created_at DESC
      LIMIT 5
    `).all(...params);

    // Recent findings
    const recentFindings = db.prepare(`
      SELECT f.id, f.assessment_id, f.category, f.risk_level, f.description, f.status, f.created_at, a.title as assessment_title
      FROM findings f
      JOIN assessments a ON f.assessment_id = a.id
      ${isAdmin ? '' : 'WHERE a.user_id = ?'}
      ORDER BY f.created_at DESC
      LIMIT 6
    `).all(...params);

    return res.json({
      recent_assessments: recentAssessments,
      recent_findings: recentFindings,
    });
  } catch (error) {
    console.error('Dashboard activity error:', error);
    return res.status(500).json({ error: 'Failed to retrieve recent activity.' });
  }
});

export default router;
