import { Response } from 'express';

// eslint-disable-next-line max-len
const response = (res: Response, success: boolean, data: any, message: string, statusCode = 200) => {
  res.status(statusCode).json({
    success,
    dateTime: +new Date(),
    data,
    message,
  });
};

export default response;
