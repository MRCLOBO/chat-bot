import { Router } from 'express';

export const createBaseRouter = (controller) => {
     const router = Router();

     router.post('/create', controller.create);
     router.post('/getBy', controller.getBy);
     router.post('/update', controller.update);
     router.post('/delete', controller.delete);

     return router;
};
