import request from 'supertest';
import { LockedGroupController } from 'src/controllers/locked-group.controller.js';
import { LockedGroupService } from 'src/services/locked-group.service.js';
import { errorDto } from 'test/medium/responses.js';
import { factory } from 'test/small.factory.js';
import { ControllerContext, controllerSetup, mockBaseService } from 'test/utils.js';

describe(LockedGroupController.name, () => {
  let ctx: ControllerContext;
  const service = mockBaseService(LockedGroupService);

  beforeAll(async () => {
    ctx = await controllerSetup(LockedGroupController, [{ provide: LockedGroupService, useValue: service }]);
    return () => ctx.close();
  });

  beforeEach(() => {
    service.resetAllMocks();
    ctx.reset();
  });

  describe('POST /locked-groups', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).post('/locked-groups').send({ name: 'Cards' });
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should require a name', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post('/locked-groups')
        .send({ name: ' '.repeat(3) });
      expect(status).toBe(400);
      expect(body).toEqual(
        errorDto.validationError([{ path: ['name'], message: 'Too small: expected string to have >=1 characters' }]),
      );
    });
  });

  describe('PUT /locked-groups/:id/assets', () => {
    it('should require valid asset ids', async () => {
      const { status } = await request(ctx.getHttpServer())
        .put(`/locked-groups/${factory.uuid()}/assets`)
        .send({ ids: ['invalid'] });
      expect(status).toBe(400);
    });
  });
});
