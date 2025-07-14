import { unlink } from 'fs';
import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { uploadImage } from '../config/cloudinary';
import { AppError } from '../util/appError';
import catchAsync from '../util/catchAsync';

// const sharp = require('sharp');
// const catchAsync = require('../util/catchAsync');
// const AppError = require('../util/appError');

const photoStorage = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb) {
    cb(null, './public/temp/img');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + req.user.id + '.' + file.mimetype.split('/')[1];
    cb(null, file.fieldname + '-' + uniqueSuffix);
  },
});

// const photoStorage = multer.memoryStorage();

const photoFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (file.mimetype.startsWith('image')) cb(null, true);
  else cb(new AppError(400, 'invalid file type'));
};

const upload = multer({
  storage: photoStorage,
  fileFilter: photoFileFilter,
});

export const uploadPhoto = upload.single('photo');
export const uploadToCloud = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) return next();

  const url = await uploadImage(req.file);

  // delete file from temps
  unlink(req.file.path, (err) => {
    if (err) throw err;
  });

  req.url = url;
  next();
});

// exports.resizeUserPhoto = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
//   if (!req.file) return next();

//   req.file.filename = req.user.id + '-' + Date.now() + '.jpeg';

//   await sharp(req.file.buffer)
//     .resize(500, 500)
//     .toFormat('jpeg')
//     .jpeg({ quality: 90 })
//     .toFile(`public/img/users/${req.file.filename}`);

//   next();
// });

// exports.uploadTourImages = upload.fields([
//   { name: 'imageCover', maxCount: 1 },
//   { name: 'images', maxCount: 3 },
// ]);

// exports.resizeTourImages = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
//   if (!req.files.imageCover && !req.files.images) return next();

//   // cover image
//   const tourCoverImageFilename = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

//   await sharp(req.files.imageCover[0].buffer)
//     .resize(2000, 1333)
//     .toFormat('jpeg')
//     .jpeg({ quality: 90 })
//     .toFile(`public/img/tours/${tourCoverImageFilename}`);

//   req.body.imageCover = tourCoverImageFilename;

//   //  images
//   req.body.images = [];

//   const promises = req.files.images.map(async (image, ind) => {
//     const tourImageFilename = `tour-${req.params.id}-${Date.now()}-image-${ind + 1}.jpeg`;

//     await sharp(image.buffer)
//       .resize(2000, 1333)
//       .toFormat('jpeg')
//       .jpeg({ quality: 90 })
//       .toFile(`public/img/tours/${tourImageFilename}`);

//     req.body.images.push(tourImageFilename);
//   });

//   await Promise.all(promises);
//   // await Promise.all(
//   //   req.files.images.map((image, ind) => async (req) => {
//   //     const tourImageFilename = `tour-${req.params.id}-${Date.now()}-image-${ind + 1}.jpeg`;
//   //     console.log(image.buffer);

//   //     await sharp(image.buffer)
//   //       .resize(2000, 1333)
//   //       .toFormat('jpeg')
//   //       .jpeg({ quality: 90 })
//   //       .toFile(`public/img/tours/${tourImageFilename}`);

//   //     // req.body.images ||= [];
//   //     req.body.images.push(tourImageFilename);
//   //   }),
//   // );

//   next();
// });
