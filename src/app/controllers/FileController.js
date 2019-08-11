import File from '../models/File';

class FileController {
  async store(req, res) {
    const { type } = req.body;

    if (type === 'avatar' || type === 'banner') {
      const { originalname: name, filename: path } = req.file;

      const file = await File.create({
        name,
        path,
        type,
      });

      return res.json(file);
    }
    return res.status(401).json({ error: 'Type file invalid.' });
  }
}

export default new FileController();
