import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
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

async function run() {
  await mongoose.connect(mongoUri);
  console.log('Connected to DB');

  const users = await User.find().lean();
  for (const user of users) {
    const b = await Borrower.find({ createdBy: user.username }).lean();
    const l = await Loan.find({ createdBy: user.username }).lean();
    const borrowerIds = b.map((i) => i.id);
    const loanIds = l.map((i) => i.loanId);
    await User.updateOne({ username: user.username }, { $set: { borrowers: borrowerIds, loans: loanIds } });
    console.log(`Updated user ${user.username}: ${borrowerIds.length} borrowers, ${loanIds.length} loans`);
  }

  await mongoose.disconnect();
  console.log('Done');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
