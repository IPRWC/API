interface ResponseInterface {
  success: boolean,
  status: number,
  error: string,
  data: any,
  timestamp: number
}

export default ResponseInterface;
