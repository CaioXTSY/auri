const database = process.env.DATABASE_URL || '';
if (!/^mysql:\/\/[^@]*@(?:127\.0\.0\.1|localhost):\d+\/auri_tcc_[a-z0-9_]+$/.test(database)) {
  throw new Error('API tests require an explicit local DATABASE_URL named auri_tcc_*. The application .env is not a test database.');
}
process.env.QUIZ_GENERATION_ENABLED = 'false';
