import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Borrower from '../models/Borrower.js';
import Loan from '../models/Loan.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error('MONGO_URI missing');
  process.exit(1);
}

const targetOwner = process.argv[2];
if (!targetOwner) {
  console.error('Usage: node scripts/assignOwner.js <username>');
  process.exit(1);
}

async function run() {
  await mongoose.connect(mongoUri);
  console.log('Connected to DB');

  const borrowersResult = await Borrower.updateMany(
    { $or: [{ createdBy: { $exists: false } }, { createdBy: null }] },
    { $set: { createdBy: targetOwner } }
  );
  console.log('Borrowers updated:', borrowersResult.modifiedCount);

  const loansResult = await Loan.updateMany(
    { $or: [{ createdBy: { $exists: false } }, { createdBy: null }] },
    { $set: { createdBy: targetOwner } }
  );
  console.log('Loans updated:', loansResult.modifiedCount);

  await mongoose.disconnect();
  console.log('Done');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
