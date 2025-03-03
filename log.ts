import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { Storage } from '@google-cloud/storage';

const app = express();
const port = 3000;

// Multer buat upload filenya
const upload = multer({ dest: 'uploads/' });

// buat Google Cloud Storagenya
const storage = new Storage({ keyFilename: 'masukkin service account .json' });
const bucketName = 'masukkin bucketnya';
const bucket = storage.bucket(bucketName);

// Extend Request interface biar TypeScript tau ada file di req
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// image processing and upload 
app.post('/upload', (req: MulterRequest, res: Response, next: NextFunction) => {
  upload.single('image')(req, res, async (err: any) => {
    if (err) return res.status(500).send('File upload error');

    try {
      if (!req.file) return res.status(400).send('No file uploaded');

      const webpBuffer = await sharp(req.file.path)
        .webp({ quality: 80 }) // biar qualitynya jgn terlalu kurang
        .toBuffer();

      const fileName = `images/${Date.now()}.webp`;
      const file = bucket.file(fileName);

      await file.save(webpBuffer, {
        contentType: 'image/webp',
        metadata: { cacheControl: 'public, max-age=31536000' },
      });

      const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;

      res.json({ imageUrl: publicUrl });
    } catch (error) {
      console.error(error);
      res.status(500).send('Something went wrong'); // semisal ada error bakal ke catch
    }
  });
});

app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
