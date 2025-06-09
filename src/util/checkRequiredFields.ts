import AppError from './appError';

export default (object: any, ...requiredFields: string[]) => {
  requiredFields.forEach((field) => {
    if (!object[field]) throw new AppError(400, `Missing required field: ${field}`);
  });
};
