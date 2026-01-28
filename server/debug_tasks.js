require('dotenv').config();
const mongoose = require('mongoose');
const DailyTask = require('./models/DailyTask');

const run = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            console.error("MONGODB_URI not found in env");
            // Print keys to see what we have (safely)
            console.log("Env keys:", Object.keys(process.env));
            return;
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const today = new Date().toISOString().split('T')[0];
        console.log('Server Today (UTC):', today);

        // Run the query exactly as the server does
        const logic = {
            $or: [
                { date: today },
                { isEveryday: true }
            ]
        };
        console.log('Query Logic:', JSON.stringify(logic, null, 2));

        const tasks = await DailyTask.find(logic);
        console.log('Tasks found matching query:', tasks.length);
        tasks.forEach(t => {
            console.log(`- [${t.isEveryday ? 'EVERYDAY' : 'NORMAL'}] ${t.text} (Date: ${t.date})`);
        });

        // Also check ALL everyday tasks to see if they exist at all
        const allEveryday = await DailyTask.find({ isEveryday: true });
        console.log('\nTotal "isEveryday: true" tasks in DB:', allEveryday.length);
        allEveryday.forEach(t => {
            console.log(`  > ${t.text} (Date: ${t.date})`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

run();
