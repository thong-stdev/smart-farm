const request = require('supertest');
const app = require('../src/server');

describe('Public API Endpoints', () => {
    describe('GET /api/v1/public/crop-types', () => {
        it('should return all crop types', async () => {
            const res = await request(app)
                .get('/api/v1/public/crop-types')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.cropTypes)).toBe(true);
        });
    });

    describe('GET /api/v1/public/activity-types', () => {
        it('should return all activity types', async () => {
            const res = await request(app)
                .get('/api/v1/public/activity-types')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.activityTypes)).toBe(true);
        });
    });
});

describe('Health Check', () => {
    it('should return health status', async () => {
        const res = await request(app)
            .get('/health')
            .expect('Content-Type', /json/)
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.message).toContain('running');
    });
});
