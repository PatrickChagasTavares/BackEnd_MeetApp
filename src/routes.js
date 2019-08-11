import { Router } from 'express';
import User from './app/models/User';

const routes = new Router();

routes.get('/', async (req, res) => {
  const user = await User.create({
    name: 'Patrick Chagas',
    email: 'patrick@teste.com',
    password_hash: 'eyhr1918',
  });

  return res.json(user);
});

export default routes;
