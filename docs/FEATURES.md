# Feature Documentation

Detailed documentation for all Routine App features.

---

## Table of Contents

- [Task Management](#task-management)
- [Goal Setting](#goal-setting)
- [Smart Scheduling](#smart-scheduling)
- [Reflection & Logging](#reflection--logging)
- [Voice Control](#voice-control)
- [Learning & Research](#learning--research)
- [Content Discovery](#content-discovery)

---

## Task Management

### Daily Tasks

Create tasks for specific days. Each task has:

- **Text** - The task description
- **Completion status** - Checkbox to mark done
- **Notes** - Optional completion notes (what you did, how it went)
- **Date** - When the task is scheduled

**Creating a Task:**
1. Type in the task input field
2. Press Enter or click Add
3. Task appears in today's list

**Completing a Task:**
1. Click the checkbox
2. (Optional) Add completion notes in the modal
3. Task moves to completed section

### Everyday (Recurring) Tasks

Tasks that repeat daily, with **streak tracking**.

- Mark a task as "Everyday" when creating
- Appears every day automatically
- Completion resets each day
- Streaks count consecutive days completed

**Streak Logic:**
- Complete today after completing yesterday → Streak +1
- Complete today without completing yesterday → Streak resets to 1
- Miss a day → Streak resets to 0
- Undo today's completion → Streak reverts

**Viewing Streaks:**
Streak count displays next to everyday tasks (e.g., "🔥 5" for 5-day streak).

### Task Lock Feature

Hold yourself accountable with AI-validated locks.

**How it works:**
1. Click the lock icon on any task
2. Enter your **unlock criteria** (what "done" means)
   - Example: "Must include link to deployed PR"
   - Example: "Notes must mention all test cases passed"
3. When completing the task, provide completion notes
4. AI validates your notes against the criteria
5. Task only completes if validation passes

**If AI validation fails:**
- You'll see an explanation of why
- Revise your notes and try again

**If AI service is unavailable:**
- Override option appears
- You can bypass validation (for service outages, not cheating!)

**Note:** Once a lock is set, it cannot be removed. This is intentional for accountability.

### Date Navigation

Browse tasks from the past two weeks or schedule for the next two weeks.

- **← / →** arrows to navigate days
- **"Today" button** returns to current date
- Past dates show completed/incomplete history
- Future dates show scheduled tasks

### Incomplete Task Recovery

Tasks you didn't complete don't disappear.

- View all incomplete tasks from past dates
- Click to complete them (moves to today with completion)
- Or delete if no longer relevant

### Articles on Tasks

Attach articles to tasks for reference or reading lists.

- Search for articles via Chat
- Click "Add to Task" on any result
- Articles appear under the task
- Mark as "Read" or "Saved"

---

## Goal Setting

### Weekly Goals

Set goals for the week (Sunday to Saturday).

**Creating a Goal:**
1. Navigate to Goals section
2. Type your goal and press Enter
3. Goal appears in the list

**Tracking Progress:**
- Check the checkbox when complete
- Add notes about how you achieved it

**Weekly Reset:**
Goals persist until you delete them. Create new goals each week as needed.

**Best Practices:**
- Keep goals specific and measurable
- Limit to 3-5 goals per week
- Review at week's end in reflection

---

## Smart Scheduling

### Natural Language Task Parser

Describe tasks in plain English, get structured schedules.

**How to use:**
1. Open Task Planner Chat
2. Type naturally: "Tomorrow I need to review the PR at 3pm and Wednesday is the demo"
3. AI parses into structured tasks:
   - "Review the PR" → Tomorrow, 3:00 PM
   - "Demo" → Wednesday

**What it understands:**
- Relative dates: "tomorrow", "next Monday", "in 3 days"
- Times: "at 3pm", "in the morning", "evening"
- Multiple tasks in one message
- Task descriptions with context

**After parsing:**
- Review the parsed tasks
- Edit if needed
- Confirm to add to your schedule

### Scheduled Tasks

Tasks scheduled for future dates.

- Appear in date navigation for their scheduled day
- Auto-convert to daily tasks on the scheduled day
- Include optional time for reminders

---

## Reflection & Logging

### Daily Reflection Chat

A chat-style interface for daily journaling.

**Four Sections:**
1. **Worked On** - What you spent time on today
2. **Finished** - What you completed
3. **Reflections** - Thoughts, learnings, feedback
4. **Tomorrow** - What you plan to do next

**How it works:**
1. Type your thoughts naturally
2. AI organizes into the four sections
3. Continue adding throughout the day
4. AI merges new input with existing content

**Example Input:**
> "Spent most of the day on API docs. Finally finished the auth module! Tomorrow I need to start the frontend work."

**AI Output:**
- Worked On: API documentation
- Finished: Authentication module
- Tomorrow: Start frontend work

### OVERWRITE Command

Start fresh instead of merging:
> "OVERWRITE - Today was completely different. Only worked on bug fixes."

This clears existing content and uses only the new input.

### Weekly Wins View

See all completed tasks from the current week.

- Great for weekly reviews
- Shows what you've accomplished
- Helps with reflection and goal assessment

---

## Voice Control

### Voice Input

Speak instead of type anywhere in the app.

**How to use:**
1. Click the microphone icon
2. Speak your input
3. Wait for transcription
4. Text appears in the input field

**Works with:**
- Task creation
- Reflection chat
- Search queries
- Any text input

### On-Device Processing

Your voice never leaves your device.

- Uses Whisper model locally
- No cloud upload
- Works after initial model download
- Complete privacy

### Voice Settings

Configure voice behavior:

- **Enable/Disable** - Turn voice features on/off
- **Auto-read responses** - Have AI responses read aloud
- **Voice selection** - Choose from available system voices
- **Playback rate** - Adjust speech speed (0.5x - 2.0x)

### Text-to-Speech

Hear AI responses read aloud.

- Reflection summaries
- Search results
- Any AI-generated content

---

## Learning & Research

### Learning Path Generator

Generate structured learning paths for any topic.

**How to use:**
1. Enter a topic (e.g., "Transformer architecture")
2. Choose depth:
   - **Basic** - Quick overview with ranked articles
   - **Deep** - Includes content extraction for study
3. Click Generate

**What you get:**
- **Overview** - AI-generated introduction
- **Sources** - Top domains identified
- **Suggested Order** - Articles ranked from beginner to advanced
- **Progress Tracking** - Mark articles as complete

**Difficulty Levels:**
- 🟢 **Beginner** - Foundational, introductory
- 🟡 **Intermediate** - Builds on basics
- 🔴 **Advanced** - Deep technical content

**Progress Persistence:**
- Learning path saves automatically
- Track completed articles
- Resume where you left off
- Clear to start a new topic

### Weekly News Digest

Stay current on AI/ML topics.

**Default Topics:**
- AI Agents
- LLMs
- RAG (Retrieval-Augmented Generation)

**How it works:**
1. Open News Digest
2. Generate for current week
3. Browse articles by topic
4. Save interesting ones to reading list

**Auto-expiry:**
Digest resets each week for fresh content.

---

## Content Discovery

### Article Search

Find articles on any topic.

**How to use:**
1. Open Chat/Search
2. Enter your query
3. Browse results with:
   - Title and URL
   - Content preview
   - Relevance score

**Adding to Tasks:**
Click "Add to Task" to attach an article to a specific task.

### Reading List

Manage your saved articles.

**Two Tabs:**
- **Read** - Articles you've marked as read
- **Saved** - Articles saved for later

**Actions:**
- Move between Read/Saved
- Open in new tab
- Delete from list


---

## Feature Interactions

### Task + Articles + Reflection

A common workflow:

1. **Create task:** "Learn about RAG architecture"
2. **Search articles** on RAG
3. **Add articles** to the task
4. **Complete task** with notes on what you learned
5. **Reflect** on the day's learning

### Learning Path + Reading List

1. **Generate learning path** for a topic
2. **Start with beginner articles**
3. **Save interesting ones** to reading list
4. **Track progress** through the path
5. **Mark articles complete** as you finish

### Voice + Reflection

1. **Enable voice** in settings
2. **Speak your reflections** throughout the day
3. **AI organizes** into structured log
4. **Listen to summary** via text-to-speech

---

## Tips & Best Practices

### Daily Routine
1. Morning: Review today's tasks and goals
2. Throughout: Add reflections as you work
3. Evening: Mark tasks complete, add notes
4. End of day: Review reflection summary

### Weekly Routine
1. Sunday: Set weekly goals
2. Daily: Work toward goals
3. Friday: Review weekly wins
4. Weekend: Adjust goals for next week

### Learning Effectively
1. Generate learning path for new topics
2. Start with beginner-level articles
3. Take notes in task completion
4. Reflect on what you learned
5. Progress to intermediate/advanced

### Accountability
1. Use task locks for important commitments
2. Set specific unlock criteria
3. Write honest completion notes
4. Let AI validate your work
5. Celebrate when criteria are met
