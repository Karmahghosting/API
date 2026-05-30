/* eslint-disable @typescript-eslint/no-unused-vars */
 
import { injectable } from 'inversify';
import { Knex, knex } from 'knex';
import 'reflect-metadata';

export interface IDatabaseService {
  request(query: string, params?: unknown[]): Promise<void>;
  read<T>(query: string, params?: unknown[]): Promise<T[]>;
  getKnex(): Knex;
}

@injectable()
export class DatabaseService implements IDatabaseService {
  private db: Knex;

  constructor() {
    const dbPort = Number(process.env.DB_PORT || 3306);
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbUser = process.env.DB_USER || '';
    const dbName = process.env.DB_NAME || '';

    console.log(`[startup] Initialisation de la connexion MySQL vers ${dbHost}:${dbPort}${dbName ? ` (${dbName})` : ''}...`);

    this.db = knex({
      client: 'mysql',
      connection: {
        host: dbHost,
        user: dbUser,
        port: dbPort,
        password: process.env.DB_PASS,
        database: dbName,
      },
      useNullAsDefault: true,
    });

    this.db
      .raw('SELECT 1')
      .then(() => {
        console.log(`[startup] Connexion MySQL établie vers ${dbHost}:${dbPort}${dbName ? ` (${dbName})` : ''}.`);
      })
      .catch(err => {
        const errorCode = typeof err === 'object' && err && 'code' in err ? String((err as { code?: unknown }).code ?? 'UNKNOWN') : 'UNKNOWN';
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`[startup] Connexion MySQL impossible vers ${dbHost}:${dbPort}${dbName ? ` (${dbName})` : ''}: ${errorCode} - ${errorMessage}`);
      });
  }

  public getKnex(): Knex {
    return this.db;
  }

  public async request(query: string, params: unknown[] = []): Promise<void> {
    try {
      await this.db.raw(query, params);
    } catch (err) {
      console.error('Error executing query', err);
      throw err;
    }
  }

  public async read<T>(query: string, params: unknown[] = []): Promise<T[]> {
    try {
      const result = await this.db.raw(query, params);

      const rows = Array.isArray(result) && Array.isArray(result[0]) ? result[0] : result;

      if (!Array.isArray(rows)) {
        console.warn('Database query returned non-array result:', rows);
        return [];
      }

      return rows.map((row: { [key: string]: string }) => {
        for (const key in row) {
          if (typeof row[key] === 'string') {
            try {
              const parsed = JSON.parse(row[key]);
              row[key] = parsed;
            } catch (e: unknown) {
              // Not JSON, leave as string
            }
          }
        }
        return row as T;
      });
    } catch (err) {
      console.error('Error reading data', err);
      throw err;
    }
  }

  public async destroy(): Promise<void> {
    await this.db.destroy();
  }
}

export default DatabaseService;
