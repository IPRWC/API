import 'dotenv/config';

export const dbName: string = process.env.MARIADB_DB!;
export const dbUser: string = process.env.MARIADB_USER!;
export const dbPassword: string = process.env.MARIADB_PASSWORD!;
export const dbHost: string = process.env.MARIADB_HOST!;
export const dbPort: number = 3306;
export const secret: string = process.env.JWT_SECRET!;
export const expiresIn: number = Number(process.env.EXPIRES_IN!);
export const maxWrongAttemptsByIPPerDay: number = 100;
export const maxConsecutiveFailsByUsernameAndIP: number = 10;
