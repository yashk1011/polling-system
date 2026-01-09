INTERVUE.IO - SDE INTERN ROLE ASSIGNMENT - ROUND 1

Title: Live Polling System







Design Reference
Design Link: https://www.figma.com/design/uhinheFgWssbxvlI7wtf59/Intervue-Assigment--Poll-system?node-id=0-1&t=Y5
Design Preview: (Insert design image screenshot here — ideally from the Figma file for quick reference)
You are required to create a "Resilient Live Polling System" with two personas: Teacher and Student.
Unlike a basic todo-list app, this system must handle state recovery. If a teacher refreshes their browser mid-poll, the poll should not disappear. If a student joins 30 seconds late to a 60-second question, their timer must start at 30 seconds, not 60.
Technology Stack
Frontend: React.js (Hooks required; Redux/Context API optional but preferred).
Backend: Node.js with Express.
Real-time Communication: Socket.io.
Database: MongoDB or PostgreSQL (Required for persistence).
Languages: TypeScript

Functional Requirements
Teacher Persona (Admin)
Poll Creation: Ability to create a question with options and a timer duration (e.g., 60 seconds).
Live Dashboard: View real-time updates as students submit votes (e.g., "Option A: 40%, Option B: 60%").
Poll History (DB Integration): View a list of previously conducted polls and their final aggregate results, fetched from the database.
Create a new poll
View live polling results
Ask a new question only if:


No question has been asked yet, or
All students have answered the previous question


Student Persona (User)
Onboarding: Enter a name on the first visit (unique per session/tab).
Real-time Interaction: Receive the question instantly when the teacher asks it.
Timer Synchronization: The timer must remain in sync with the server.
Scenario: If the time limit is 60s and a student joins 10 seconds late, their timer must show 50s, not 60s.
Voting: Submit an answer within the time limit.
Enter name on first visit (unique to each tab)
Submit answers once a question is asked
View live polling results after submission
Maximum of 60 seconds to answer a question, after which results are shown
System Behavior (The "Resilience" Factor)
State Recovery: If the Teacher or Student refreshes the page during an active poll, the application must fetch the current state from the backend and resume the UI exactly where it left off.
Race Conditions: Ensure that a student cannot vote more than once per question, even if they spam the API or manipulate the client-side code.

Code Quality & Architecture Standards
We place a high value on clean, maintainable code. Your submission will be evaluated on the following strict criteria:
Backend Architecture (Separation of Concerns)
Do not write business logic directly inside Socket listeners or Express routes.
Use a Controller-Service pattern.
Example: PollSocketHandler.js handles the connection, while PollService.js handles the logic and DB interaction.
Frontend Architecture
Use Custom Hooks (e.g., useSocket, usePollTimer) to separate logic from UI components.
Implement Optimistic UI updates where appropriate (UI updates immediately, reverts on error).
Error Handling
The app should not crash if the database is temporarily unreachable.
Provide user feedback (toasts/alerts) for connection errors or submission failures.
 Data Integrity
Use the Database to persist Polls, Options, and Votes.
Ensure the server is the "Source of Truth" for the timer and vote counts.


Must-Have Requirements
Functional system with all core features working
Hosting for both frontend and backend
Teacher can create polls and students can answer them
Both teacher and student can view poll results
Please ensure the UI in your assignment submission follows the shared Figma design without any deviations.
Good to Have
Configurable poll time limit by teacher
Option for teacher to remove a student
Well-designed user interface
System behavior (The "Resilience" Factor)
Bonus Features (Brownie Points)
Chat popup for interaction between students and teachers
Teacher can view past poll results (not stored locally)

