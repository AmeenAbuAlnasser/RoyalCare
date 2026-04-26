import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns API health status', () => {
    const controller = new HealthController();

    expect(controller.check()).toEqual({
      service: 'royalcare-api',
      status: 'ok',
    });
  });
});
